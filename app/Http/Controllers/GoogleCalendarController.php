<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class GoogleCalendarController extends Controller
{
    public function connect()
    {
        return Socialite::driver('google')
            ->scopes(['https://www.googleapis.com/auth/calendar.events'])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirectUrl(route('calendar.callback'))
            ->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('calendar.callback'))
                ->user();

            $user = Auth::user();

            $user->update([
                'google_calendar_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);

            return redirect()->route('dashboard')
                ->with('success', 'Google Calendar successfully connected!');
        } catch (\Exception $e) {
            // Error handling
            return redirect()->route('dashboard')
                ->with('error', 'Failed to connect: ' . $e->getMessage());
        }
    }
}
