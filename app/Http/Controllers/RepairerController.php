<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\RepairerProfile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia; // 👈 Make sure this is imported
use Inertia\Response; // 👈 And this

class RepairerController extends Controller
{
    /**
     * ✅ MISSING PART: This shows the form when you click "Become a Pro"
     */
    public function create(): Response
    {
        // This tells Laravel to load resources/js/Pages/RepairerRegister.jsx
        return Inertia::render('RepairerRegister');
    }

    /**
     * Handle the request to become a repairer (POST /repairer/apply).
     */
    public function store(Request $request): RedirectResponse
    {
        // 1. Validation for the repairer form
        $request->validate([
            'focus_area' => ['required', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:500'],
            'business_name' => ['required', 'string', 'max:30'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. Check if the user already has a profile
        if ($user->repairerProfile()->exists()) {
            return redirect()->route('dashboard')->with('error', 'You already have a repairer profile.');
        }

        // 3. Create the Repairer Profile
        RepairerProfile::create([
            'user_id' => $user->user_id,
            'focus_area' => $request->focus_area,
            'business_name' => $request->business_name,
            'bio' => $request->bio,
        ]);

        // 4. Update the User status
        $user->isRepairer = true;
        $user->save();

        // 5. Redirect back to dashboard
        return redirect()->route('dashboard')->with('success', 'Congratulations! Your Repairer Profile is now active.');
    }
}
