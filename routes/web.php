<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\GoogleLoginController;
use App\Http\Controllers\RepairerController;
use App\Http\Controllers\LandingController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Auth;

// -----------------------------------------------------------
// 1. PUBLIC FACING PAGES
// -----------------------------------------------------------

Route::get('/', [LandingController::class, 'index'])->name('home');

Route::get('/login', function () {
  return Inertia::render('Login', [
    'auth' => ['user' => Auth::user()],
  ]);
})->name('login');

Route::get('/signup', [LandingController::class, 'indexRegister'])->name('register');

// --- Auth Logic (POST) ---
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// --- Google OAuth ---
Route::get('/auth/google', [GoogleLoginController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleLoginController::class, 'handleGoogleCallback'])->name('google.callback');

// -----------------------------------------------------------
// 2. EMAIL VERIFICATION PAGES
// -----------------------------------------------------------

Route::middleware(['auth'])->group(function () {
  Route::get('/email/verify', function () {
    return Inertia::render('Auth/VerifyEmail');
  })->name('verification.notice');
});

Route::get('/email/verify/{id}/{hash}', function (Request $request) {
  $user = User::find($request->route('id'));

  if (! hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
    abort(403);
  }

  if (! $user->hasVerifiedEmail()) {
    if ($user->markEmailAsVerified()) {
      event(new Verified($user));
    }
  }

  Auth::login($user);
  return redirect()->intended(route('dashboard'));
})->middleware(['signed'])->name('verification.verify');

// -----------------------------------------------------------
// 3. PROTECTED APPLICATION ROUTES (FUNCTIONAL HUB)
// -----------------------------------------------------------

Route::middleware(['auth'])->group(function () {

  /**
   * DASHBOARD
   */
  Route::get('/dashboard', function () {
    /** @var \App\Models\User $user */
    $user = Auth::user();

    $user->load('repairerProfile');

    return Inertia::render('Dashboard', [
      'isRepairer' => (bool) $user->isRepairer,

      // 🚨 FIX: Changed 'profile' to 'repairerProfile' to match User.php
      'profileExists' => $user->repairerProfile()->exists(),
      'profile' => $user->repairerProfile,
    ]);
  })->name('dashboard');

  /**
   * SETTINGS (We added this earlier)
   */
  Route::get('/settings', function () {
    return Inertia::render('Settings');
  })->name('settings');

  Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

  /**
   * REPAIRER REGISTRATION
   */
  // 1. GET: Show the Registration Form (We missed this earlier!)
  Route::get('/become-repairer', [RepairerController::class, 'create'])->name('repairer.create');

  // 2. POST: Submit the form (I removed the duplicate line you had)
  Route::post('/repairer/apply', [RepairerController::class, 'store'])->name('repairer.store');
});
