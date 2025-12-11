<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Load Relationship for "Switch to Work Mode"
        $user->load('repairerProfile');

        // 2. Fetch Real Repairers
        $topServices = RepairerProfile::with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($profile) {
                return [
                    'id' => $profile->repairer_id,
                    'name' => $profile->user->name ?? 'Unknown',
                    'role' => $profile->focus_area,
                    'rating' => $profile->rating,
                    'image' => 'https://ui-avatars.com/api/?background=random&color=fff&name=' . urlencode($profile->user->name ?? 'U'),
                ];
            });

        // 3. Static Data
        $quickAccess = [
            ['name' => 'Repairer', 'iconType' => 'repairer'],
            ['name' => 'Cleaning', 'iconType' => 'cleaning'],
            ['name' => 'Plumbing', 'iconType' => 'plumbing'],
            ['name' => 'Electrical', 'iconType' => 'electrical'],
        ];
        $history = ['lastJob' => 'Welcome!', 'count' => 0];

        // 4. Return to React
        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'isRepairer' => $user->isRepairer ?? false,
            'profile' => $user->repairerProfile,
            'appointment' => null,
            'quickAccess' => $quickAccess,
            'history' => $history,
            'topServices' => $topServices,
        ]);
    }
}
