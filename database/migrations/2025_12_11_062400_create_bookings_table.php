<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id(); // Booking ID

            // 1. LINK TO CUSTOMER (The User)
            // We refer to the 'users' table using 'user_id'
            $table->unsignedBigInteger('customer_id');
            $table->foreign('customer_id')
                ->references('user_id') // referencing your custom PK on users table
                ->on('users')
                ->onDelete('cascade');

            // 2. LINK TO REPAIRER (The Profile)
            // We refer to 'repairer_profiles' so we know exactly which business
            $table->unsignedBigInteger('repairer_id');
            $table->foreign('repairer_id')
                ->references('repairer_id') // referencing your custom PK
                ->on('repairer_profiles')
                ->onDelete('cascade');

            // 3. BOOKING DETAILS
            $table->string('service_type'); // e.g. "Aircon Repair", "Cleaning"
            $table->dateTime('scheduled_at'); // Date and Time of job
            $table->string('status')->default('pending'); // pending, confirmed, completed, cancelled

            // Optional: Notes or Address snapshot
            $table->text('problem_description')->nullable();
            $table->string('location_snapshot')->nullable(); // Save location in case user moves later

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
