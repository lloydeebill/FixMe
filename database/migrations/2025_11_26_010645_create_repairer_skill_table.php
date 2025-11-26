<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('repairer_skill', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('repairer_profile_id');

            $table->foreign('repairer_profile_id')
                ->references('repairer_id')
                ->on('repairer_profiles')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repairer_skill');
    }
};
