<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// This test route is safe to keep!
Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Hello from Laravel Backend 👋'
    ]);
});

// ---------------------------------------------------------------------
// DELETED: The old UserController routes were causing the crash.
// Since we are using Inertia for everything now, we don't need these!
// ---------------------------------------------------------------------

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
