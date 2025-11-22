<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\GoogleLoginController;

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

// --- Protected Routes ---
Route::middleware(['auth'])->group(function () {
  Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
  })->name('dashboard');

  Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
