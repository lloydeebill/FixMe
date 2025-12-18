<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id(); // This creates 'id' for the reviews table itself (that's fine)

            // 1. Link to Bookings (Assuming bookings table uses standard 'id')
            // If bookings also uses 'booking_id', change this to follow the pattern below.
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');

            // 2. Link to Customers (The Fix)
            // We create the column first...
            $table->unsignedBigInteger('customer_id');
            // ...then manually define the foreign key pointing to 'user_id'
            $table->foreign('customer_id')
                ->references('user_id') //
                ->on('users')
                ->onDelete('cascade');

            // 3. Link to Repairers (The Fix)
            $table->unsignedBigInteger('repairer_id');
            $table->foreign('repairer_id')
                ->references('user_id') //
                ->on('users')
                ->onDelete('cascade');

            $table->integer('rating'); // 1 to 5
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
