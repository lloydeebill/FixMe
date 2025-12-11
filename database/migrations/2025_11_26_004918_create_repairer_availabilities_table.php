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

            // Foreign Key
            $table->unsignedBigInteger('repairer_profile_id');
            $table->foreign('repairer_profile_id')
                ->references('repairer_id') // Make sure this column exists in repairer_profiles!
                ->on('repairer_profiles')
                ->onDelete('cascade');

            // 0 = Sunday, 1 = Monday, ... 6 = Saturday
            $table->unsignedTinyInteger('day_of_week');

            // Working Hours
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // 3NF BEST PRACTICE: 
            // A repairer can only have ONE entry per day of the week.
            $table->unique(['repairer_profile_id', 'day_of_week'], 'repairer_day_unique');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('repairer_availabilities');
    }
};
