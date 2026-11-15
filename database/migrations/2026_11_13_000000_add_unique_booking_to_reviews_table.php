<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::table('reviews')->select('booking_id')->groupBy('booking_id')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Duplicate booking reviews must be resolved before adding the unique constraint. No records were changed.');
        }

        Schema::table('reviews', function (Blueprint $table) {
            $table->unique('booking_id', 'reviews_booking_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique('reviews_booking_id_unique');
        });
    }
};
