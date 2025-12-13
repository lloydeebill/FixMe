<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\RepairerProfile;
use App\Models\Location; // 👈 Don't forget this!
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function showForm(): Response
    {
        return Inertia::render('onboarding/OnboardingProfile', [
            'user' => Auth::user(),
        ]);
    }

    public function store(Request $request)
    {
        // 1. UPDATE VALIDATION RULES
        $rules = [
            'name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|string|in:Male,Female,Other',
            // We expect address text + coords now
            'location' => 'required|string|max:255', // This is the address text
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_repairer' => 'boolean',
        ];

        if ($request->boolean('is_repairer')) {
            $rules['business_name'] = 'nullable|string|max:255';
            $rules['focus_area'] = 'required|string|max:100';
            $rules['bio'] = 'nullable|string|max:500';
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($request, $validated) {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 2. CREATE THE LOCATION ENTRY
            $location = Location::create([
                'address'   => $validated['location'], // The text address
                'latitude'  => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            // 3. UPDATE USER (Link the location)
            $user->update([
                'name' => $validated['name'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'location_id' => $location->id, // 👈 KEY CHANGE: Link ID, not string
            ]);

            // 4. HANDLE REPAIRER PROFILE
            if ($request->boolean('is_repairer')) {
                RepairerProfile::updateOrCreate(
                    ['user_id' => $user->user_id],
                    [
                        // We share the same location ID for now since they are onboarding together
                        'location_id'   => $location->id,
                        'business_name' => $validated['business_name'] ?? $user->name . ' Repairs',
                        'focus_area'    => $validated['focus_area'],
                        'bio'           => $validated['bio'] ?? 'New Repairer',
                        // Ensure defaults are set if creating new
                        'rating'        => 0,
                        'clients_helped' => 0,
                    ]
                );
            } else {
                // Strict 3NF maintenance: remove if they unchecked it
                $user->repairerProfile()->delete();
            }
        });

        return redirect()->route('dashboard')->with('success', 'Profile Setup Complete!');
    }
}
