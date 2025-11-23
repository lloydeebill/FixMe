<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\RepairerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class RepairerController extends Controller
{
    /**
     * Handle the request to become a repairer (POST /repairer/apply).
     */
    public function store(Request $request): RedirectResponse
    {
        // 1. Validation for the repairer form
        $request->validate([
            'focus_area' => ['required', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:500'],
        ]);
        /** @var \App\Models\User $user */ // 👈 ADD THIS LINE HERE

        $user = Auth::user();

        // 2. Check if the user already has a profile (prevents duplicate entries)
        if ($user->profile()->exists()) {
            return redirect()->route('dashboard')->with('error', 'You already have a repairer profile.');
        }

        // 3. Create the Repairer Profile in the specialized table
        RepairerProfile::create([
            'user_id' => $user->user_id,
            'focus_area' => $request->focus_area,

            'bio' => $request->bio,
            // rating and clients_helped will use the database defaults (0.0 and 0)
        ]);

        // 4. Update the User status (main table)
        // This is necessary so the dashboard prop 'isRepairer' is true
        $user->isRepairer = true;
        $user->save();

        // 5. Redirect back to the dashboard with a success message for Inertia
        return redirect()->route('dashboard')->with('success', 'Congratulations! Your Repairer Profile is now active.');
    }
}
