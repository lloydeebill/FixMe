<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('completion_requested_at')->nullable();
            $table->timestamp('client_accepted_at')->nullable();
            $table->text('completion_issue_reason')->nullable();
            $table->string('payment_method', 16)->nullable();
            $table->timestamp('client_payment_reported_at')->nullable();
            $table->timestamp('provider_payment_confirmed_at')->nullable();
        });

        Schema::table('repairer_profiles', function (Blueprint $table) {
            $table->string('gcash_qr_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('repairer_profiles', fn (Blueprint $table) => $table->dropColumn('gcash_qr_path'));
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn([
            'completion_requested_at', 'client_accepted_at', 'completion_issue_reason',
            'payment_method', 'client_payment_reported_at', 'provider_payment_confirmed_at',
        ]));
    }
};
