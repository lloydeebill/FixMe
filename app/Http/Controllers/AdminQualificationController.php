<?php

namespace App\Http\Controllers;

use App\Models\TesdaQualification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminQualificationController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->is_admin, 403);
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $qualifications = TesdaQualification::with('repairerProfile.user')->latest()->limit(50)->get()
            ->map(fn (TesdaQualification $item) => [
                'id' => $item->id,
                'provider_name' => $item->repairerProfile?->user?->name,
                'processing_status' => $item->processing_status,
                'verification_status' => $item->verification_status,
                'extracted_details' => $item->extracted_details,
                'issues' => $item->issues,
                'failure_reason' => $item->failure_reason,
                'reviewed_at' => $item->reviewed_at,
                'review_note' => $item->review_note,
            ]);

        return Inertia::render('AdminQualifications', ['qualifications' => $qualifications]);
    }

    public function image(Request $request, TesdaQualification $qualification)
    {
        $this->authorizeAdmin($request);
        abort_unless(Storage::disk('local')->exists($qualification->image_path), 404);

        return Storage::disk('local')->response($qualification->image_path, null, [
            'Content-Type' => $qualification->image_mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'",
        ]);
    }

    public function review(Request $request, TesdaQualification $qualification)
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'status' => ['required', Rule::in(['registry_match', 'unconfirmed', 'follow_up'])],
            'note' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        DB::transaction(function () use ($qualification, $request, $validated) {
            $item = TesdaQualification::whereKey($qualification->id)->lockForUpdate()->firstOrFail();
            $allowed = match ($item->verification_status) {
                'pending' => ['registry_match', 'unconfirmed', 'follow_up'],
                'follow_up' => ['registry_match', 'unconfirmed'],
                default => [],
            };
            if (! in_array($validated['status'], $allowed, true) || $item->processing_status === 'processing') {
                throw ValidationException::withMessages(['status' => 'This qualification cannot move to that review outcome.']);
            }
            $item->update([
                'verification_status' => $validated['status'],
                'review_note' => $validated['note'],
                'reviewed_by' => $request->user()->user_id,
                'reviewed_at' => now(),
            ]);
        });

        return redirect()->route('admin.qualifications.index')->with('message', 'SkillLink review outcome recorded.');
    }
}
