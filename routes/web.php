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
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RepairerAvailabilityController;
use App\Http\Controllers\GoogleCalendarController;

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

// --- Auth Logic ---
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

// --- Google OAuth ---
Route::get('/auth/google', [GoogleLoginController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleLoginController::class, 'handleGoogleCallback'])->name('google.callback');

// -----------------------------------------------------------
// 2. AUTHENTICATED ROUTES
// -----------------------------------------------------------
Route::middleware(['auth'])->group(function () {

  // --- Email Verification ---
  Route::get('/email/verify', function () {
    return Inertia::render('Auth/VerifyEmail');
  })->name('verification.notice');

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

  // --- Google Calendar ---
  Route::get('/auth/calendar/connect', [GoogleCalendarController::class, 'connect'])->name('calendar.connect');
  Route::get('/auth/calendar/callback', [GoogleCalendarController::class, 'callback'])->name('calendar.callback');

  // -----------------------------------------------------------
  // 3. ONBOARDING (Scenario A: New User)
  // -----------------------------------------------------------
  // This uses your OnboardingController exactly as you wrote it.
  Route::prefix('onboarding')
    ->middleware(['verified', 'throttle:6,1'])
    ->group(function () {
      Route::get('/', [OnboardingController::class, 'showForm'])->name('onboarding.profile');
      Route::post('/complete', [OnboardingController::class, 'store'])->name('onboarding.complete.store');
    });

  // -----------------------------------------------------------
  // 4. MAIN APP (Scenario B: Existing User)
  // -----------------------------------------------------------
  Route::middleware([EnsureOnboardingComplete::class])->group(function () {

    // --- DASHBOARD ---
    Route::get('/app', [DashboardController::class, 'index'])->name('dashboard');

    // --- BOOKINGS ---
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::post('/bookings/{id}/approve', [BookingController::class, 'approve'])->name('bookings.approve');
    Route::post('/bookings/{id}/reject', [BookingController::class, 'reject'])->name('bookings.reject');

    // --- SETTINGS ---
    Route::get('/settings', function () {
      return Inertia::render('Settings');
    })->name('settings');

    // --- REPAIRER UPGRADE (For existing customers) ---
    // This is the "Become a Repairer" button for someone who is ALREADY a customer.
    // It uses RepairerController, NOT OnboardingController.
    Route::get('/become-repairer', [RepairerController::class, 'create'])->name('repairer.create');
    Route::post('/become-repairer', [RepairerController::class, 'store'])->name('repairer.store');

    // --- REPAIRER MANAGEMENT ---
    Route::get('/repairer/availability', [RepairerAvailabilityController::class, 'edit'])->name('availability.edit');
    Route::put('/repairer/availability', [RepairerAvailabilityController::class, 'update'])->name('availability.update');
  });
});
