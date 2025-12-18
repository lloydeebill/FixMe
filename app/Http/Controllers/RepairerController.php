<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\RepairerProfile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Location;
use App\Models\Skill; // 👈 Import Skill model

class RepairerController extends Controller
{
    /**
     * Show the form when you click "Become a Pro"
     */
    public function create(): Response
    {
        // 1. Fetch skills to populate the "Select Your Skills" list
        $skills = Skill::all(['id', 'name', 'slug']);

        return Inertia::render('RepairerRegister', [
            'availableSkills' => $skills // 👈 Pass to React
        ]);
    }

    /**
     * Handle the request to become a repairer (POST /become-repairer).
     */
    public function store(Request $request): RedirectResponse
    {
        // 1. Validation
        $request->validate([
            'business_name' => 'required|string|max:255',
            'bio'           => 'nullable|string|max:500',

            // Skills Validation
            'skills'        => 'required|array|min:1',
            'skills.*'      => 'exists:skills,id',

            // Location Validation (Matches your React form names)
            'location'      => 'required|string|max:255', // Address text
            'latitude'      => 'required|numeric|between:-90,90',
            'longitude'     => 'required|numeric|between:-180,180',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. Check if the user already has a profile
        if ($user->repairerProfile()->exists()) {
            return redirect()->route('dashboard')->with('error', 'You already have a repairer profile.');
        }

        DB::transaction(function () use ($request, $user) {

            // A. Create Location First
            $location = Location::create([
                'address'   => $request->location, // Mapped from 'location' input
                'latitude'  => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            // B. Create Profile (Linked to Location)
            $profile = RepairerProfile::create([
                'user_id'       => $user->user_id,
                'location_id'   => $location->id,
                'business_name' => $request->business_name,
                'bio'           => $request->bio,
                'rating'        => 0,
                'clients_helped' => 0,
            ]);

            // C. Sync Skills (The Pivot Table)
            // This fills the 'repairer_skill' table
            $profile->skills()->sync($request->skills);
        });

        // Refresh user to ensure the session knows they are now a repairer
        Auth::user()->refresh();

        return redirect()->route('dashboard')->with('success', 'Congratulations! Your Repairer Profile is now active.');
    }
}
