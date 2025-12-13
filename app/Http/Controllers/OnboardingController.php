<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\RepairerProfile;
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
        $rules = [
            'name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|string|in:Male,Female,Other',
            'location' => 'required|string|max:255',
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

            $user->update([
                'name' => $validated['name'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'location' => $validated['location'],
            ]);

            if ($request->boolean('is_repairer')) {
                RepairerProfile::updateOrCreate(
                    ['user_id' => $user->user_id],
                    [
                        'business_name' => $validated['business_name'] ?? $user->name . ' Repairs',
                        'focus_area' => $validated['focus_area'],
                        'bio' => $validated['bio'] ?? 'New Repairer',
                    ]
                );
            }else {
                // OPTIONAL: If they uncheck the box, ensure no partial profile exists
                // strict 3NF maintenance
                $user->repairerProfile()->delete();
            }
        });

        return redirect()->route('dashboard')->with('success', 'Profile Setup Complete!');
    }
}
