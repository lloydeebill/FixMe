<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\RepairerProfile;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Skill; // 👈 Import Skill model

class OnboardingController extends Controller
{
    /**
     * Renders the Onboarding form and passes the necessary data.
     */
    public function showForm(): Response
    {
        // 1. FETCH SKILLS: Get the list of skills from the database
        $skills = Skill::all(['id', 'name', 'slug']);

        return Inertia::render('onboarding/OnboardingProfile', [
            'auth' => [
                'user' => Auth::user(),
            ],
            // 2. PASS SKILLS: Send the skills list to the component
            'availableSkills' => $skills,
        ]);
    }

    /**
     * Handles the submission of the Onboarding form.
     */
    public function store(Request $request)
    {
        // 1. BASIC VALIDATION
        $rules = [
            'name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|string|in:Male,Female,Other',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_repairer' => 'boolean',
        ];

        // 2. REPAIRER VALIDATION (Skills instead of Focus Area)
        if ($request->boolean('is_repairer')) {
            $rules['business_name'] = 'required|string|max:255';
            $rules['bio'] = 'nullable|string|max:500';

            // 👇 New Skills Validation
            $rules['skills'] = 'required|array|min:1';
            $rules['skills.*'] = 'exists:skills,id';
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($request, $validated) {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 3. CREATE LOCATION
            $location = Location::create([
                'address'   => $validated['location'],
                'latitude'  => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            // 4. UPDATE USER
            $user->update([
                'name' => $validated['name'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'location_id' => $location->id,
            ]);

            // 5. HANDLE REPAIRER PROFILE
            if ($request->boolean('is_repairer')) {
                // Update or create the profile
                $profile = RepairerProfile::updateOrCreate(
                    ['user_id' => $user->user_id],
                    [
                        'location_id'   => $location->id,
                        'business_name' => $validated['business_name'],
                        'bio'           => $validated['bio'] ?? 'New Repairer',
                        'rating'        => 0,
                        'clients_helped' => 0,
                        // ❌ Removed focus_area
                    ]
                );

                // 6. SAVE SKILLS (The crucial step)
                $profile->skills()->sync($validated['skills']);
            } else {
                // Cleanup if user unchecks "is_repairer"
                $user->repairerProfile()->delete();
            }
        });

        // 🛑 CRITICAL FIX: Reload the user so the session knows they are now a repairer
        Auth::user()->refresh();

        return Inertia::location(route('dashboard'));
    }
}
