<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Check for Profile Setup (Step 1)
        // Assumption: You have a field/method on the User model to check this.
        if (!$user->profileIsComplete()) {
            // Redirect to Step 1 unless the user is already trying to access it
            if (!$request->routeIs('onboarding.profile')) {
                return redirect()->route('onboarding.profile');
            }
        }

        // 2. Check for Role Selection (Step 2)
        // Assumption: You have a field/method on the User model to check this.
        if (!$user->roleIsSelected()) {
            // Redirect to Step 2 unless the user is already trying to access it
            if (!$request->routeIs('onboarding.role')) {
                return redirect()->route('onboarding.role');
            }
        }

        // 3. Check for Repairer Details (Step 3) - Only needed if they chose 'repairer'
        if ($user->isRepairer && !$user->repairerDetailsAreComplete()) {
            // Redirect to Step 3 unless the user is already trying to access it
            if (!$request->routeIs('onboarding.repairer-details')) {
                return redirect()->route('onboarding.repairer-details');
            }
        }

        // If the user is complete, or if they are on a required onboarding step,
        // proceed to the next request (e.g., show the dashboard or the current form).
        return $next($request);
    }
}
