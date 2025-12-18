<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth; // Keep Auth for user check

class LandingController extends Controller
{
    public function index(Request $request)
    {

        $isMobile = preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|samsung|scp|tizen|up\.browser|up\.link|vodafone|wap|webos|windows phone|iemobile|wii|xbox)/i", $request->header('User-Agent'));

        // If it's mobile, render the MobileLogin page immediately.
        if ($isMobile) {
            return Inertia::render('MobileLanding', [
                // Only pass required auth data to the functional page
                'auth' => ['user' => Auth::user()],
            ]);
        }

        // If it's desktop, render the heavy Visual Story page.
        //pass Auth data, but the page itself will handle API fetching internally.
        return Inertia::render('DesktopLanding', [
            'auth' => ['user' => Auth::user()],
        ]);
    }

    public function indexRegister(Request $request)
    {
        $isMobile = preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|samsung|scp|tizen|up\.browser|up\.link|vodafone|wap|webos|windows phone|iemobile|wii|xbox)/i", $request->header('User-Agent'));

        // If mobile, render the lightweight Register page.
        if ($isMobile) {
            return Inertia::render('MobileRegister');
        }

        // If desktop, render the full split-screen Register page.
        return Inertia::render('Register');
    }
}
