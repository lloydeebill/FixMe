<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. THE NEW MASTER LOCATION TABLE
        Schema::create('locations', function (Blueprint $table) {
            $table->id(); // Standard ID

            $table->string('address')->nullable(); // "Matina, Davao City"

            // Coordinates (X, Y)
            // Precision (10, 8) is accurate to millimeters (standard for GPS)
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        // 2. ADD LINK TO USERS (Home Address)
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('locations')
                ->nullOnDelete(); // If location is deleted, user stays but has no address
        });

        // 3. ADD LINK TO REPAIRERS (Business Address)
        Schema::table('repairer_profiles', function (Blueprint $table) {
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('locations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Drop keys first, then tables
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn('location_id');
        });

        Schema::table('repairer_profiles', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn('location_id');
        });

        Schema::dropIfExists('locations');
    }
};
