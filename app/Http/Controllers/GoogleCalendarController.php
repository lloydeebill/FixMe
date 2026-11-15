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

            $tokens = ['google_calendar_token' => $googleUser->token];
            if ($googleUser->refreshToken) {
                $tokens['google_refresh_token'] = $googleUser->refreshToken;
            }
            $user->update($tokens);

            return redirect()->route('dashboard')
                ->with($user->google_refresh_token ? 'message' : 'error', $user->google_refresh_token
                    ? 'Google Calendar connected. Accepted bookings can be added from Booking Details.'
                    : 'Google did not provide offline Calendar access. Please try connecting again.');
        } catch (\Throwable $e) {
            return redirect()->route('dashboard')
                ->with('error', 'Could not connect Google Calendar. Please try again.');
        }
    }
}
