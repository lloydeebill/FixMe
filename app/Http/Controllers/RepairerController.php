<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\RepairerProfile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RepairerController extends Controller
{
    /**
     * Show the form when you click "Become a Pro"
     */
    public function create(): Response
    {
        return Inertia::render('RepairerRegister');
    }

    /**
     * Handle the request to become a repairer (POST /become-repairer).
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

        // 2. Check if the user already has a profile (Prevention)
        if ($user->repairerProfile()->exists()) {
            return redirect()->route('dashboard')->with('error', 'You already have a repairer profile.');
        }

        // 3. Create the Repairer Profile
        // This is the ONLY step needed. The existence of this row makes them a repairer.
        RepairerProfile::create([
            'user_id' => $user->user_id, // Uses your custom primary key
            'focus_area' => $request->focus_area,
            'business_name' => $request->business_name,
            'bio' => $request->bio,
            // Default values for new profiles
            'rating' => 0,
            'clients_helped' => 0,
        ]);

        // ❌ DELETED: $user->isRepairer = true; 
        // ❌ DELETED: $user->save(); 
        // We do not update the User model anymore.

        // 4. Redirect back to dashboard
        return redirect()->route('dashboard')->with('success', 'Congratulations! Your Repairer Profile is now active.');
    }
}
