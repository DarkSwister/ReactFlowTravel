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
        Schema::create('planner_collaborators', function (Blueprint $table) {
            $table->id();
            $table->uuid('planner_id');
            $table->foreignUuId('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuId('invited_by')->constrained('users')->onDelete('cascade');
            $table->enum('permission', ['view', 'edit'])->default('view');
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->string('invitation_token')->unique();
            $table->timestamp('invited_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->foreign('planner_id')->references('id')->on('planners')->onDelete('cascade');
            $table->unique(['planner_id', 'user_id']);
            $table->index(['user_id', 'status']);
            $table->index('invitation_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planner_collaborators');
    }
};
