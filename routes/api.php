<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OnboardingController; // ⬅️ Add this import!
use App\Http\Controllers\ChatController;

// This test route is safe to keep!
Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Hello from Laravel Backend 👋'
    ]);
});

// ---------------------------------------------------------------------
// Authenticated Routes Group
// ---------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // 1. Get the authenticated user (Existing route)
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 2. 🚀 ONBOARDING PROFILE SUBMISSION ROUTE 🚀
    // The React frontend will POST the form data to this endpoint.
    Route::post('/onboarding/profile', [OnboardingController::class, 'store'])
        ->name('onboarding.store');

    // You can also add a route to check if the profile exists:
    Route::get('/onboarding/status', [OnboardingController::class, 'status'])
        ->name('onboarding.status');

    Route::post('/onboarding/repairer-details', [OnboardingController::class, 'saveRepairerDetails'])
        ->name('onboarding.repairer-details.store');

    Route::get('/bookings/{id}/messages', [ChatController::class, 'fetchMessages']);

    // Send a message for a job
    Route::post('/bookings/{id}/messages', [ChatController::class, 'sendMessage']);
});
