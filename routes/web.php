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
use App\Http\Controllers\OnboardingController;
use App\Http\Middleware\EnsureOnboardingComplete;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;

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
// 3. PROTECTED APPLICATION ROUTESfunction
// -----------------------------------------------------------

Route::middleware(['auth'])->group(function () {

  // --- A. ONBOARDING ROUTES ---
  Route::prefix('onboarding')
    ->middleware(['verified', 'throttle:6,1'])
    ->group(function () {
      // 1. The Single Form (GET)
      Route::get('/', [OnboardingController::class, 'showForm'])
        ->name('onboarding.profile');

      // 2. The Save Action (POST)
      Route::post('/complete', [OnboardingController::class, 'store'])
        ->name('onboarding.complete.store');
    });

  // 1b. LOGOUT
  Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

  // ----------------------------------------------------------------------
  // 2. DASHBOARD & FUNCTIONAL ROUTES (Requires Onboarding to be Done)
  // ----------------------------------------------------------------------
  Route::middleware([EnsureOnboardingComplete::class])->group(function () {

    /**
     * DASHBOARD
     * ✅ FIX: Moved inside this group and pointing to the Controller
     */
    Route::get('/app', [DashboardController::class, 'index'])->name('dashboard');
    /**
     * BOOKINGS
     * ✅ FIX: Added inside this group so only onboarded users can book
     */
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');

    /**
     * SETTINGS
     */
    Route::get('/settings', function () {
      return Inertia::render('Settings');
    })->name('settings');

    /**
     * REPAIRER REGISTRATION
     */
    Route::get('/become-repairer', [RepairerController::class, 'create'])->name('repairer.create');
    Route::post('/repairer/apply', [RepairerController::class, 'store'])->name('repairer.store');
  }); // End OnboardingComplete Group

}); // End Auth Group