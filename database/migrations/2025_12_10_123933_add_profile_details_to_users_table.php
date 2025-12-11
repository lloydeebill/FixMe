<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // database/migrations/xxxx_xx_xx_add_profile_details_to_users_table.php

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Shared Fields (MANDATORY FOR BOTH)
            $table->date('date_of_birth')->nullable()->after('name');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('location')->nullable()->after('gender');

            // REMOVE 'business_name' from here to satisfy 3NF!
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('date_of_birth');
            $table->dropColumn('gender');
            $table->dropColumn('location');
            // $table->dropColumn('business_name'); // REMOVED
        });
    }
};
