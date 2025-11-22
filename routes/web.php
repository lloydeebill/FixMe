<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
// Assuming you have controllers for Auth, adjust namespace/paths as needed
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;

// --- Inertia Page Routes (GET requests) ---
// These routes return the corresponding React page component.

Route::get('/', function () {
  // This will render the resources/js/Pages/Login.jsx component
  return Inertia::render('Login');
});

Route::get('/login', function () {
  // Renders the Login page
  return Inertia::render('Login');
})->name('login');

Route::get('/signup', function () {
  // Renders the Register page
  return Inertia::render('Register');
})->name('register');


// --- Form Submission Routes (POST requests) ---
// These routes handle the Inertia form submissions and should return redirects or errors.

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);


// Example: Dashboard/Protected Route (Once a user is logged in)
Route::middleware(['auth'])->group(function () {
  Route::get('/dashboard', function () {
    return Inertia::render('Dashboard'); // You would create this page next
  })->name('dashboard');
});
