<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. The Conversations Table
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')->constrained()->onDelete('cascade');

            // FIX: Point specifically to 'user_id'
            $table->foreignId('sender_id')->constrained('users', 'user_id');
            $table->foreignId('receiver_id')->constrained('users', 'user_id');

            $table->timestamps();
        });

        // 2. The Messages Table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');

            // FIX: Point specifically to 'user_id'
            $table->foreignId('sender_id')->constrained('users', 'user_id');

            $table->text('content');
            $table->boolean('is_read')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
