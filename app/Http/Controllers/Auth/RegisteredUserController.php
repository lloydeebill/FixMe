<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Auth\Events\Registered;

class RegisteredUserController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'isRepairer' => false,
        ]);

        // 1. Send the verification email using the Registered event
        event(new Registered($user));

        // 2. Redirect to the login page with a success message
        return redirect()->route('login')->with('message', 'Registration complete! Please check your inbox and click the verification link to activate your account.');
    }
}
