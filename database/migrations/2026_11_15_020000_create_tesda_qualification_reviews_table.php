<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tesda_qualification_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tesda_qualification_id')->constrained('tesda_qualifications')->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users', 'user_id')->restrictOnDelete();
            $table->string('outcome', 16);
            $table->string('registry_source', 32);
            $table->string('registry_reference', 500);
            $table->date('registry_checked_on');
            $table->string('registry_result', 32);
            $table->text('review_note');
            $table->timestamp('reviewed_at');
            $table->index(['tesda_qualification_id', 'reviewed_at', 'id'], 'qualification_review_history_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tesda_qualification_reviews');
    }
};
