<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tesda_qualifications', function (Blueprint $table) {
            $table->string('registry_source', 32)->nullable();
            $table->string('registry_reference', 500)->nullable();
            $table->date('registry_checked_on')->nullable();
            $table->string('registry_result', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tesda_qualifications', function (Blueprint $table) {
            $table->dropColumn(['registry_source', 'registry_reference', 'registry_checked_on', 'registry_result']);
        });
    }
};
