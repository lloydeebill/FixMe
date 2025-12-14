<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // 1. The Conversations Table (The Room)
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            // This links the chat to a specific Job/Transaction
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');

            // Bringing these in makes querying "My Chats" super easy
            $table->foreignId('sender_id')->constrained('users'); // The Customer
            $table->foreignId('receiver_id')->constrained('users'); // The Fixer

            $table->timestamps();
        });

        // 2. The Messages Table (The Text)
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // Link to the conversation above
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');

            // Who typed this specific message?
            $table->foreignId('sender_id')->constrained('users');

            $table->text('content');
            $table->boolean('is_read')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the "Child" table first (Messages depend on Conversations)
        Schema::dropIfExists('messages');
        // Drop the "Parent" table second
        Schema::dropIfExists('conversations');
    }
};
