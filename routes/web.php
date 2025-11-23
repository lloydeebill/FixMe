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
use Illuminate\Database\Eloquent\Relations\HasOne;

// -----------------------------------------------------------
// 1. PUBLIC FACING PAGES (LANDING, LOGIN, REGISTER)
// -----------------------------------------------------------

// Root URL: Still uses LandingController to decide Mobile vs Desktop Landing
Route::get('/', [LandingController::class, 'index'])->name('home');

Route::get('/login', function () {
  return Inertia::render('Login', [
    'auth' => ['user' => Auth::user()],
  ]);
})->name('login');

// /signup URL hits a different method to decide: MobileRegister or Desktop Register.
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
   * @param \App\Models\User $user
   * @return \Inertia\Response
   */
  Route::get('/dashboard', function () {
    $user = Auth::user();
    return Inertia::render('Dashboard', [
      'isRepairer' => (bool) $user->isRepairer,
      'profileExists' => $user->profile()->exists(),
      'profile' => $user->profile,
    ]);
  })->name('dashboard');

  Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

  // Repairer Application POST Route
  Route::post('/repairer/apply', [RepairerController::class, 'store'])->name('repairer.apply');
});
