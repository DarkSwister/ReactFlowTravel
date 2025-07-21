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
        Schema::create('planner_edges', function (Blueprint $table) {
            $table->id();
            $table->uuid('planner_id');
            $table->string('edge_id'); // frontend edge ID
            $table->string('source_node_id');
            $table->string('target_node_id');
            $table->string('source_handle')->nullable();
            $table->string('target_handle')->nullable();
            $table->string('type')->default('default');
            $table->json('data')->nullable();
            $table->json('style')->nullable();
            $table->boolean('animated')->default(false);
            $table->timestamps();

            $table->foreign('planner_id')->references('id')->on('planners')->onDelete('cascade');
            $table->unique(['planner_id', 'edge_id']);
            $table->index(['planner_id']);
            $table->index(['planner_id', 'source_node_id']);
            $table->index(['planner_id', 'target_node_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planner_edges');
    }
};
