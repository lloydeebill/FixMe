<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // The Access Token (Short-lived, used for immediate requests)
            $table->text('google_calendar_token')->nullable();

            // The Refresh Token (Long-lived, used to get new access tokens without asking the user to login again)
            $table->text('google_refresh_token')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_calendar_token', 'google_refresh_token']);
        });
    }
};
