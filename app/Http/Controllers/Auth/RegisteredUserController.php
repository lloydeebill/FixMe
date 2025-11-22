<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Http\RedirectResponse;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     * This replaces the 'store' method of your old UserController.
     */
    public function store(Request $request): RedirectResponse
    {
        // 1. Validate the form data sent from React
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // 2. Create the new User in the database
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // 3. Log the user in immediately (Session based)
        Auth::login($user);

        // 4. Redirect to the dashboard (Inertia handles this redirect)
        return redirect()->route('dashboard');
    }
}
