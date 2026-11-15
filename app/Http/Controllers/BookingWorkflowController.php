<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\NotificationRecorder;
use App\Services\GeoDistance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BookingWorkflowController extends Controller
{
    private function participant(Request $request, Booking $booking): string
    {
        if ($request->user()->user_id === $booking->customer_id) return 'client';
        if ($request->user()->user_id === $booking->repairerProfile?->user_id) return 'provider';
        abort(403);
    }

    private function locked(Request $request, int $id, string $role): Booking
    {
        $booking = Booking::with('repairerProfile')->lockForUpdate()->findOrFail($id);
        abort_unless($this->participant($request, $booking) === $role, 403);
        return $booking;
    }

    private function accepted(Booking $booking): void
    {
        if ($booking->status !== 'completed' || !$booking->client_accepted_at) {
            throw ValidationException::withMessages(['message' => 'The client must accept completed work first.']);
        }
    }

    public function show(Request $request, int $id)
    {
        $booking = Booking::with(['repairerProfile.skills', 'repairerProfile.location', 'review'])->findOrFail($id);
        $role = $this->participant($request, $booking);

        $locationVisible = in_array($booking->status, ['pending', 'confirmed', 'in_progress', 'completion_requested', 'completion_disputed', 'completed'], true);
        $providerLocation = $booking->repairerProfile?->location;
        $serviceLocation = $locationVisible ? [
            'address' => $booking->location_snapshot,
            'latitude' => $booking->job_latitude,
            'longitude' => $booking->job_longitude,
        ] : null;
        $distanceKm = $locationVisible ? GeoDistance::between(
            $booking->job_latitude === null ? null : (float) $booking->job_latitude,
            $booking->job_longitude === null ? null : (float) $booking->job_longitude,
            $providerLocation?->latitude === null ? null : (float) $providerLocation->latitude,
            $providerLocation?->longitude === null ? null : (float) $providerLocation->longitude,
        ) : null;

        // Exact location is a separate prop only for the two participants in valid states.
        $booking->unsetRelation('customer');
        $booking->location_snapshot = null;
        $booking->job_latitude = null;
        $booking->job_longitude = null;

        return Inertia::render('BookingDetails', [
            'booking' => $booking,
            'participantRole' => $role,
            'hasGcashQr' => (bool) $booking->repairerProfile?->gcash_qr_path,
            'serviceLocation' => $serviceLocation,
            'distanceKm' => $distanceKm === null ? null : round($distanceKm, 1),
            'providerLocation' => [
                'address' => $providerLocation?->address,
                'latitude' => $providerLocation?->latitude,
                'longitude' => $providerLocation?->longitude,
            ],
        ]);
    }

    public function accept(Request $request, int $id, NotificationRecorder $notifier)
    {
        DB::transaction(function () use ($request, $id, $notifier) {
            $booking = $this->locked($request, $id, 'client');
            if ($booking->status === 'completed' && $booking->client_accepted_at) return;
            // Historical completed rows remain unaccepted until their client acts explicitly.
            if (!in_array($booking->status, ['completion_requested', 'completed'], true)) {
                throw ValidationException::withMessages(['message' => 'Completion is not awaiting your acceptance.']);
            }
            $booking->update([
                'status' => 'completed',
                'client_accepted_at' => now(),
                'completion_issue_reason' => null,
            ]);
            $notifier->record($booking, $booking->repairerProfile->user_id, $request->user()->user_id, 'completion_accepted', "completion_accepted:{$booking->id}");
        });
        return back()->with('message', 'Work completion accepted. Choose how you paid.');
    }

    public function dispute(Request $request, int $id, NotificationRecorder $notifier)
    {
        $reason = $request->validate(['reason' => 'required|string|min:5|max:300'])['reason'];
        DB::transaction(function () use ($request, $id, $reason, $notifier) {
            $booking = $this->locked($request, $id, 'client');
            if ($booking->status === 'completion_disputed' && $booking->completion_issue_reason === $reason) return;
            if ($booking->status !== 'completion_requested') {
                throw ValidationException::withMessages(['message' => 'Only work awaiting confirmation can be disputed.']);
            }
            $booking->update(['status' => 'completion_disputed', 'completion_issue_reason' => $reason]);
            $notifier->record($booking, $booking->repairerProfile->user_id, $request->user()->user_id, 'completion_disputed', 'completion_disputed:'.Str::uuid());
        });
        return back()->with('message', 'Issue reported to the provider. Payment remains closed.');
    }

    public function choosePayment(Request $request, int $id)
    {
        $method = $request->validate(['payment_method' => 'required|in:cash,gcash_qr'])['payment_method'];
        DB::transaction(function () use ($request, $id, $method) {
            $booking = $this->locked($request, $id, 'client');
            $this->accepted($booking);
            if ($method === 'gcash_qr' && !$booking->repairerProfile->gcash_qr_path) {
                throw ValidationException::withMessages(['payment_method' => 'This provider has no GCash QR. Choose cash instead.']);
            }
            if ($booking->payment_method === $method) return;
            if ($booking->client_payment_reported_at) {
                throw ValidationException::withMessages(['payment_method' => 'Payment method cannot change after reporting payment.']);
            }
            $booking->update(['payment_method' => $method]);
        });
        return back()->with('message', 'Payment method selected.');
    }

    public function reportPayment(Request $request, int $id, NotificationRecorder $notifier)
    {
        DB::transaction(function () use ($request, $id, $notifier) {
            $booking = $this->locked($request, $id, 'client');
            $this->accepted($booking);
            if ($booking->client_payment_reported_at) return;
            if (!$booking->payment_method) {
                throw ValidationException::withMessages(['message' => 'Choose cash or GCash QR first.']);
            }
            if ($booking->payment_method === 'gcash_qr' && !$booking->repairerProfile->gcash_qr_path) {
                throw ValidationException::withMessages(['message' => 'The provider no longer has a GCash QR. Choose cash instead.']);
            }
            $booking->update(['client_payment_reported_at' => now()]);
            $notifier->record($booking, $booking->repairerProfile->user_id, $request->user()->user_id, 'payment_declared', "payment_declared:{$booking->id}");
        });
        return back()->with('message', 'Awaiting provider confirmation of receipt.');
    }

    public function confirmPayment(Request $request, int $id, NotificationRecorder $notifier)
    {
        DB::transaction(function () use ($request, $id, $notifier) {
            $booking = $this->locked($request, $id, 'provider');
            $this->accepted($booking);
            if ($booking->provider_payment_confirmed_at) return;
            if (!$booking->client_payment_reported_at) {
                throw ValidationException::withMessages(['message' => 'The client has not reported payment yet.']);
            }
            $booking->update(['provider_payment_confirmed_at' => now()]);
            $notifier->record($booking, $booking->customer_id, $request->user()->user_id, 'payment_confirmed', "payment_confirmed:{$booking->id}");
        });
        return back()->with('message', 'Payment receipt confirmed.');
    }

    public function qrImage(Request $request, int $id)
    {
        $booking = Booking::with('repairerProfile')->findOrFail($id);
        $this->participant($request, $booking);
        abort_unless($booking->status === 'completed' && $booking->client_accepted_at
            && $booking->payment_method === 'gcash_qr', 403);
        $path = $booking->repairerProfile?->gcash_qr_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, null, [
            'Content-Type' => Storage::disk('local')->mimeType($path),
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'",
        ]);
    }
}
