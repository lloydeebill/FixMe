<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\GoogleLoginController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Auth; // Ensure Auth is imported

// --- Public Routes ---

// Root URL shows Home
Route::get('/', function () {
  return Inertia::render('Home');
})->name('home');

// DELETE THE OLD LOGIN ROUTE AND REPLACE WITH THIS:
// Now /login also renders 'Home' because that's where your form is.
Route::get('/login', function () {
  return Inertia::render('Home');
})->name('login');

Route::get('/signup', function () {
  return Inertia::render('Register');
})->name('register');

// --- Auth Logic ---
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// --- Google OAuth ---
Route::get('/auth/google', [GoogleLoginController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleLoginController::class, 'handleGoogleCallback'])->name('google.callback');

// --- 3. VERIFICATION ROUTES (Exposed so the email link can be generated/clicked) ---
// Note: We use 'auth' middleware on the notice route because a logged-in user who ISN'T verified needs to see this.
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

  // Log the user in after they verify, then send to dashboard
  Auth::login($user);
  return redirect()->intended(route('dashboard'));
})->middleware(['signed'])->name('verification.verify'); // 👈 Laravel needs this exact name

// --- Protected Routes ---
Route::middleware(['auth'])->group(function () {
  Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
  })->name('dashboard');

  Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
