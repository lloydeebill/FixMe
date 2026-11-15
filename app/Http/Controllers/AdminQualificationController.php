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

        $qualifications = TesdaQualification::with(['repairerProfile.user', 'reviewHistory'])
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(20)->withQueryString()
            ->through(fn (TesdaQualification $item) => [
                'id' => $item->id,
                'provider_name' => $item->repairerProfile?->user?->name,
                'processing_status' => $item->processing_status,
                'verification_status' => $item->verification_status,
                'extracted_details' => $item->extracted_details,
                'issues' => $item->issues,
                'failure_reason' => $item->failure_reason,
                'reviewed_at' => $item->reviewed_at,
                'review_note' => $item->review_note,
                'registry_source' => $item->registry_source,
                'registry_reference' => $item->registry_reference,
                'registry_checked_on' => $item->registry_checked_on,
                'registry_result' => $item->registry_result,
                'review_history' => $item->reviewHistory->map(fn ($review) => [
                    'id' => $review->id,
                    'reviewer_id' => $review->reviewer_id,
                    'outcome' => $review->outcome,
                    'registry_source' => $review->registry_source,
                    'registry_reference' => $review->registry_reference,
                    'registry_checked_on' => $review->registry_checked_on,
                    'registry_result' => $review->registry_result,
                    'review_note' => $review->review_note,
                    'reviewed_at' => $review->reviewed_at,
                ]),
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
            'registry_source' => ['required', Rule::in(['2017_onward', '2016_earlier'])],
            'registry_reference' => ['required', 'url', 'max:500', function ($attribute, $value, $fail) {
                $parts = parse_url($value);
                if (! is_array($parts) || strtolower($parts['scheme'] ?? '') !== 'https'
                    || ! in_array(strtolower($parts['host'] ?? ''), ['tesda.gov.ph', 'www.tesda.gov.ph'], true)
                    || ! (str_starts_with(strtolower($parts['path'] ?? ''), '/rwac')
                        || strtolower($parts['path'] ?? '') === '/about/tesda/31')
                    || isset($parts['user']) || isset($parts['pass'])) {
                    $fail('Use an official HTTPS tesda.gov.ph registry page reference.');
                }
            }],
            'registry_checked_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'registry_result' => ['required', Rule::in(['match_found', 'no_match', 'unavailable', 'expired', 'needs_follow_up'])],
        ]);

        $compatible = [
            'registry_match' => ['match_found'],
            'unconfirmed' => ['no_match', 'unavailable'],
            'follow_up' => ['expired', 'needs_follow_up'],
        ];
        if (! in_array($validated['registry_result'], $compatible[$validated['status']], true)) {
            throw ValidationException::withMessages(['registry_result' => 'Choose a registry result consistent with the review outcome.']);
        }

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
            $reviewedAt = now();
            $item->update([
                'verification_status' => $validated['status'],
                'review_note' => $validated['note'],
                'reviewed_by' => $request->user()->user_id,
                'reviewed_at' => $reviewedAt,
                'registry_source' => $validated['registry_source'],
                'registry_reference' => $validated['registry_reference'],
                'registry_checked_on' => $validated['registry_checked_on'],
                'registry_result' => $validated['registry_result'],
            ]);
            DB::table('tesda_qualification_reviews')->insert([
                'tesda_qualification_id' => $item->id,
                'reviewer_id' => $request->user()->user_id,
                'outcome' => $validated['status'],
                'registry_source' => $validated['registry_source'],
                'registry_reference' => $validated['registry_reference'],
                'registry_checked_on' => $validated['registry_checked_on'],
                'registry_result' => $validated['registry_result'],
                'review_note' => $validated['note'],
                'reviewed_at' => $reviewedAt,
            ]);
        });

        return back()->with('message', 'SkillLink review outcome recorded.');
    }
}
