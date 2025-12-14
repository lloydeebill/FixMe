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
            // Since users table uses 'user_id', we must be specific.
            $table->unsignedBigInteger('customer_id');
            $table->foreign('customer_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade');

            // 2. LINK TO REPAIRER (The Profile)
            // 👇 THE FIX: Use foreignId to match your other tables.
            // This automatically links 'repairer_profile_id' -> 'repairer_profiles.id'
            $table->foreignId('repairer_profile_id')
                ->constrained('repairer_profiles')
                ->cascadeOnDelete();

            // 3. BOOKING DETAILS
            $table->string('service_type'); // e.g. "Aircon Repair"
            $table->dateTime('scheduled_at'); // Start Time

            // 👇 Consolidated Google Fields
            $table->dateTime('end_time')->nullable();
            $table->string('google_event_id')->nullable();

            $table->string('status')->default('pending'); // pending, confirmed, completed, cancelled
            $table->text('problem_description')->nullable();
            $table->string('location_snapshot')->nullable(); // Saved address

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
