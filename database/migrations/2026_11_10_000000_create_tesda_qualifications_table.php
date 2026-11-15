<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tesda_qualifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repairer_profile_id')->constrained('repairer_profiles')->cascadeOnDelete();
            $table->string('image_path');
            $table->string('image_mime', 16);
            $table->string('processing_status', 32)->default('uploaded');
            $table->string('verification_status', 16)->default('pending');
            $table->json('extracted_details')->nullable();
            $table->json('issues')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamps();
            $table->index(['repairer_profile_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tesda_qualifications');
    }
};
