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
            ->redirectUrl(route('calendar.callback')) // IMPORTANT: Points to the specific calendar route
            ->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('calendar.callback')) // Must match the connect URL
                ->user();

            $user = Auth::user();

            $user->update([
                'google_calendar_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);

            return redirect()->route('availability.edit')
                ->with('success', 'Google Calendar successfully connected!');
        } catch (\Exception $e) {
            return redirect()->route('availability.edit')
                ->with('error', 'Failed to connect: ' . $e->getMessage());
        }
    }
}
