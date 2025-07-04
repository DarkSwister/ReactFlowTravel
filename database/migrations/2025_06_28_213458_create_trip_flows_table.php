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
        Schema::create('trip_flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('trip_id')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('nodes');
            $table->json('edges');
            $table->json('enabled_flags')->default('[]');
            $table->string('share_token')->nullable()->unique();
            $table->enum('share_type', ['public', 'private'])->nullable();
            $table->boolean('allow_editing')->default(false);
            $table->timestamp('share_expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'created_at']);
            $table->index(['share_token', 'share_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_flows');
    }
};
