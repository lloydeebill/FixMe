<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('repairer_profiles', function (Blueprint $table) {
            $table->json('service_areas')->nullable();
        });
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('service_area')->nullable();
            $table->decimal('job_latitude', 10, 8)->nullable();
            $table->decimal('job_longitude', 11, 8)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn(['service_area', 'job_latitude', 'job_longitude']));
        Schema::table('repairer_profiles', fn (Blueprint $table) => $table->dropColumn('service_areas'));
    }
};
