<?php

namespace App\Http\Controllers;

use App\Models\RepairerProfile;
use App\Models\TesdaQualification;
use App\Services\TesdaCertificateScreening;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;

class TesdaQualificationController extends Controller
{
    private function profile(Request $request): RepairerProfile
    {
        return RepairerProfile::where('user_id', $request->user()->user_id)->firstOrFail();
    }

    private function owned(Request $request, TesdaQualification $qualification): TesdaQualification
    {
        return $this->profile($request)->tesdaQualifications()->findOrFail($qualification->id);
    }

    public function index(Request $request)
    {
        $profile = $this->profile($request);
        return Inertia::render('TesdaQualifications', [
            'qualifications' => $profile->tesdaQualifications()->latest()->get(),
        ]);
    }

    public function store(Request $request, TesdaCertificateScreening $screening)
    {
        $profile = $this->profile($request);
        $request->validate(['certificate' => ['required', File::types(['jpg', 'jpeg', 'png'])->max(5120)], 'consent' => 'accepted']);
        $file = $request->file('certificate');
        $mime = $file->getMimeType();
        if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
            return back()->withErrors(['certificate' => 'Choose a JPEG or PNG image.']);
        }
        $path = $file->store('tesda-certificates/'.$profile->id, 'local');
        $qualification = $profile->tesdaQualifications()->create(['image_path' => $path, 'image_mime' => $mime]);
        $screening->screen($qualification);
        return redirect()->route('tesda.index');
    }

    public function image(Request $request, TesdaQualification $qualification)
    {
        $qualification = $this->owned($request, $qualification);
        abort_unless(Storage::disk('local')->exists($qualification->image_path), 404);
        return Storage::disk('local')->response($qualification->image_path, null, [
            'Content-Type' => $qualification->image_mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'",
        ]);
    }

    public function retry(Request $request, TesdaQualification $qualification, TesdaCertificateScreening $screening)
    {
        $qualification = $this->owned($request, $qualification);
        abort_unless($qualification->processing_status === 'processing_failed', 409);
        $screening->screen($qualification);
        return redirect()->route('tesda.index');
    }

    public function destroy(Request $request, TesdaQualification $qualification)
    {
        $qualification = $this->owned($request, $qualification);
        abort_if($qualification->processing_status === 'processing', 409);
        $path = $qualification->image_path;
        $qualification->delete();
        Storage::disk('local')->delete($path);
        return redirect()->route('tesda.index');
    }
}
