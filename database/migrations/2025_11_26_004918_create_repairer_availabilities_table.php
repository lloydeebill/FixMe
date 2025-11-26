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
        Schema::create('repairer_availabilities', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('repairer_profile_id');

            $table->foreign('repairer_profile_id')
                ->references('repairer_id')
                ->on('repairer_profiles')
                ->onDelete('cascade');

            // 0 = Sunday, 1 = Monday, ... 6 = Saturday
            $table->unsignedTinyInteger('day_of_week');

            // Working Hours (e.g., 08:00:00 to 17:00:00)
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('repairer_availabilities');
    }
};
