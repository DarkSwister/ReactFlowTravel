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
        Schema::create('planner_nodes', function (Blueprint $table) {
            $table->id();
            $table->uuid('planner_id');
            $table->string('node_id'); // frontend node ID
            $table->string('type'); // travel:flight, travel:booking, event:venue, etc.
            $table->string('label');
            $table->decimal('position_x', 10, 2);
            $table->decimal('position_y', 10, 2);
            $table->decimal('width', 8, 2)->nullable()->after('position_y')->comment('Width for resizable nodes (groups)');
            $table->decimal('height', 8, 2)->nullable()->after('width')->comment('Height for resizable nodes (groups)');
            $table->json('data'); // all node-specific data (flexible)
            $table->json('style')->nullable(); // node styling
            $table->integer('z_index')->default(0);
            $table->boolean('draggable')->default(true);
            $table->boolean('selectable')->default(true);
            $table->string('parent_id')->nullable(); // for grouped nodes
            $table->timestamps();

            $table->foreign('planner_id')->references('id')->on('planners')->onDelete('cascade');
            $table->unique(['planner_id', 'node_id']);
            $table->index(['planner_id', 'type']);
            $table->index(['planner_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planner_nodes');
    }
};
