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

            // If the Booking is deleted, delete the Chat
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');

            // 👇 FIX: If Sender/Receiver is deleted, delete the Chat automatically
            $table->foreignId('sender_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade');

            $table->foreignId('receiver_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade');

            $table->timestamps();
        });

        // 2. The Messages Table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // If the Conversation is deleted, delete the Messages
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');

            // 👇 FIX: If the Sender user is deleted, delete their messages
            $table->foreignId('sender_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade');

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
