<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // 1. Identity & Auth
            $table->id('user_id'); // Primary Key
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');

            // 2. Personal Profile (Consolidated)
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();

            // 3. Location (3NF Foreign Key)
            // ⚠️ IMPORTANT: 'locations' migration file must have an earlier date/timestamp than this file!
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('locations')
                ->nullOnDelete();

            // 4. Google Integrations (Consolidated)
            $table->text('google_calendar_token')->nullable(); // Access Token
            $table->text('google_refresh_token')->nullable();  // Refresh Token

            // 5. System
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
