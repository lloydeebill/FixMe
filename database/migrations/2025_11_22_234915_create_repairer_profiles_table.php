<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairer_profiles', function (Blueprint $table) {
            // 1. Primary key for this table (This is the ONE auto column)
            $table->id('repairer_id');

            // 2. Define user_id as a simple unsigned big integer (matches users.user_id type)
            // We use 'unsignedBigInteger' instead of 'foreignId' to prevent the auto-increment error.
            $table->unsignedBigInteger('user_id');

            // 3. Set the Foreign Key Constraint
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');

            $table->string('focus_area', 100);
            $table->text('bio')->nullable();

            $table->decimal('rating', 2, 1)->default(0.0);
            $table->unsignedInteger('clients_helped')->default(0);

            // Constraint: Ensure one user can only have one profile
            $table->unique('user_id');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairer_profiles');
    }
};
