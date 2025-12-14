<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create Skills Table (Master List)
        Schema::create('skills', function (Blueprint $table) {
            $table->id(); // Creates 'id'
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        // 2. Create the Link (Pivot Table)
        Schema::create('repairer_skill', function (Blueprint $table) {
            $table->id();

            // Link to Repairer
            $table->foreignId('repairer_profile_id')
                ->constrained('repairer_profiles')
                ->cascadeOnDelete();

            // Link to Skill
            $table->foreignId('skill_id')
                ->constrained('skills')
                ->cascadeOnDelete();

            // Prevent duplicates (John can't have "Plumbing" twice)
            $table->unique(['repairer_profile_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairer_skill');
        Schema::dropIfExists('skills');
    }
};
