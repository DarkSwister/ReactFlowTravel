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
        Schema::create('planner_forks', function (Blueprint $table) {
            $table->id();
            $table->uuid('original_planner_id');
            $table->uuid('forked_planner_id');
            $table->foreignUuId('forked_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('forked_at');
            $table->json('fork_metadata')->nullable(); // reason, notes, etc.
            $table->timestamps();

            $table->foreign('original_planner_id')->references('id')->on('planners')->onDelete('cascade');
            $table->foreign('forked_planner_id')->references('id')->on('planners')->onDelete('cascade');
            $table->index(['original_planner_id']);
            $table->index(['forked_by']);
            $table->unique(['forked_planner_id']); //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planner_forks');
    }
};
