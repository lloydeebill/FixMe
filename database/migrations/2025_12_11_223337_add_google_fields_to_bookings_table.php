<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Only add end_time if it doesn't exist yet
            if (!Schema::hasColumn('bookings', 'end_time')) {
                $table->dateTime('end_time')->nullable();
            }

            // Only add google_event_id if it doesn't exist yet
            if (!Schema::hasColumn('bookings', 'google_event_id')) {
                $table->string('google_event_id')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['end_time', 'google_event_id']);
        });
    }
};
