<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\RedirectResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request (POST /login).
     */
    public function store(Request $request): RedirectResponse
    {
        // 1. Validate email and password exist
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. Try to log the user in
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {

            // If login fails, send an error back to the React Login page
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // ⚠️ CRITICAL STEP: Check if the user has verified their email
        if (! $request->user()->hasVerifiedEmail()) {
            Auth::logout(); // Log out the user immediately

            // Block login and throw a message for the user
            throw ValidationException::withMessages([
                'email' => 'Account unverified. Please check your email for the activation link.',
            ]);
        }

        // 3. If verified, proceed with session
        $request->session()->regenerate();

        // 4. Redirect to Dashboard
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session (Logout).
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
