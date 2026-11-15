<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class ProviderGcashQrController extends Controller
{
    private function profile(Request $request)
    {
        $profile = $request->user()->repairerProfile;
        abort_unless($profile, 403);
        return $profile;
    }

    public function store(Request $request)
    {
        $profile = $this->profile($request);
        $file = $request->validate(['qr_image' => ['required', File::types(['jpg', 'jpeg', 'png'])->max(2048)]])['qr_image'];
        $oldPath = $profile->gcash_qr_path;
        $path = $file->store('gcash-qr/'.$profile->id, 'local');
        $profile->update(['gcash_qr_path' => $path]);
        if ($oldPath) Storage::disk('local')->delete($oldPath);
        return back()->with('message', 'GCash QR saved.');
    }

    public function destroy(Request $request)
    {
        $profile = $this->profile($request);
        $path = $profile->gcash_qr_path;
        $profile->update(['gcash_qr_path' => null]);
        if ($path) Storage::disk('local')->delete($path);
        return back()->with('message', 'GCash QR removed.');
    }

    public function image(Request $request)
    {
        $path = $this->profile($request)->gcash_qr_path;
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
