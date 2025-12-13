<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairer_profiles', function (Blueprint $table) {
            // 1. PRIMARY KEY: Standard 'id' (BigInt, Auto Increment)
            // This allows other tables to link to it easily.
            $table->id();

            // 2. FOREIGN KEY: Location
            // Links to the 'locations' table
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('locations')
                ->nullOnDelete();

            // 3. FOREIGN KEY: User
            // Links to 'users' table (explicitly using 'user_id' since your User model uses that)
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');

            // 4. DATA COLUMNS
            $table->string('business_name')->nullable();
            $table->text('bio')->nullable();
            $table->decimal('rating', 2, 1)->default(0.0);
            $table->unsignedInteger('clients_helped')->default(0);

            // Constraint: One user can only have one repairer profile
            $table->unique('user_id');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairer_profiles');
    }
};
