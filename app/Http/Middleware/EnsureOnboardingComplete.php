<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // LOGIC: If the user is missing BASIC info (Location/Gender) OR 
        // they are a Repairer missing BUSINESS info...
        // ...send them to the MAIN onboarding page.

        // 1. Check if "Complete" (This covers both Customers and Repairers based on your User Model logic)
        // We combine profileIsComplete, roleIsSelected, and repairerDetailsAreComplete into one check effectively.
        // If ANY part is missing, we consider them "Incomplete".
        $isComplete = $user->profileIsComplete() && $user->repairerDetailsAreComplete();

        if (!$isComplete) {
            // Redirect to the ONE main onboarding route
            // Make sure this route name matches your web.php (usually 'onboarding.profile' or just 'onboarding')
            if (!$request->routeIs('onboarding.*')) {
                return redirect()->route('onboarding.profile');
            }
        }

        return $next($request);
    }
}
