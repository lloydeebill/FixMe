<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate
        $validated = $request->validate([
            'repairer_id' => 'required|exists:repairer_profiles,repairer_id',
            'service_type' => 'required|string',
            'scheduled_at' => 'required|date',
            'problem_description' => 'nullable|string', // Ensure this is nullable
        ]);

        // 2. Create the Booking
        Booking::create([
            'customer_id' => Auth::id(),
            'repairer_id' => $validated['repairer_id'],
            'service_type' => $validated['service_type'],
            'scheduled_at' => $validated['scheduled_at'],

            // FIX: Use the null coalescing operator ?? to prevent "Undefined index"
            'problem_description' => $validated['problem_description'] ?? null,

            'status' => 'pending',
        ]);

        return redirect()->back()->with('message', 'Booking request sent successfully!');
    }
}
