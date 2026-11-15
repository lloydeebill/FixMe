<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Location;

class AccountProfileController extends Controller
{
    public function updateClient(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
        ]);

        DB::transaction(function () use ($request, $data) {
            $user = $request->user();
            $location = $user->location;
            if (! $location || $location->id === $user->repairerProfile?->location_id) {
                $location = Location::create(['address' => $data['location']]);
            }
            $location->update([
                'address' => $data['location'],
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
            ]);
            $user->update(['name' => $data['name'], 'location_id' => $location->id]);
        });

        return back()->with('success', 'Profile updated.');
    }

    public function updateProvider(Request $request): RedirectResponse
    {
        $profile = $request->user()->repairerProfile;
        abort_unless($profile, 403);

        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:500'],
            'skills' => ['required', 'array', 'min:1'],
            'skills.*' => [Rule::exists('skills', 'id')->where(fn ($query) => $query
                ->where('is_active', true)
                ->orWhereIn('id', $profile->skills()->pluck('skills.id')))],
            'service_areas' => ['required', 'array', 'min:1'],
            'service_areas.*' => ['distinct', Rule::in(array_keys(config('pilot_areas.areas')))],
            'location' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        DB::transaction(function () use ($profile, $data) {
            $location = $profile->location;
            if (! $location || $location->id === $profile->user->location_id) {
                $location = Location::create(['address' => $data['location']]);
            }
            $location->update([
                'address' => $data['location'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
            ]);
            $profile->update([
                'business_name' => $data['business_name'],
                'bio' => $data['bio'] ?? null,
                'location_id' => $location->id,
                'service_areas' => $data['service_areas'],
            ]);
            $profile->skills()->sync($data['skills']);
        });

        return back()->with('success', 'Service profile updated.');
    }
}
