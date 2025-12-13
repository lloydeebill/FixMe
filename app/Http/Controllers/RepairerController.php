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
            'address_text'  => ['nullable', 'string', 'max:255'],
            'latitude'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'     => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. Check if the user already has a profile (Prevention)
        if ($user->repairerProfile()->exists()) {
            return redirect()->route('dashboard')->with('error', 'You already have a repairer profile.');
        }

        DB::transaction(function () use ($request, $user) {

            // A. Create Location First
            $location = Location::create([
                'address'   => $request->address_text,
                'latitude'  => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            // B. Create Profile Linked to Location
            RepairerProfile::create([
                'user_id'       => $user->user_id,
                'location_id'   => $location->id, // 🔗 The Link
                'focus_area'    => $request->focus_area,
                'business_name' => $request->business_name,
                'bio'           => $request->bio,
                'rating'        => 0,
                'clients_helped' => 0,
            ]);
        });


        return redirect()->route('dashboard')->with('success', 'Congratulations! Your Repairer Profile is now active.');
    }
}
