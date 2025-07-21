<?php
// app/Models/PlannerEdge.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlannerEdge extends Model
{
    protected $fillable = [
        'planner_id', 'edge_id', 'source_node_id', 'target_node_id',
        'source_handle', 'target_handle', 'type', 'data', 'style', 'animated'
    ];

    protected $casts = [
        'data' => 'array',
        'style' => 'array',
        'animated' => 'boolean',
    ];

    public function planner(): BelongsTo
    {
        return $this->belongsTo(Planner::class);
    }

    // Get source node
    public function sourceNode(): BelongsTo
    {
        return $this->belongsTo(PlannerNode::class, 'source_node_id', 'node_id')
            ->where('planner_id', $this->planner_id);
    }

    // Get target node
    public function targetNode(): BelongsTo
    {
        return $this->belongsTo(PlannerNode::class, 'target_node_id', 'node_id')
            ->where('planner_id', $this->planner_id);
    }

    // Convert to React Flow edge format
    public function toFlowEdge(): array
    {
        return [
            'id' => $this->edge_id,
            'source' => $this->source_node_id,
            'target' => $this->target_node_id,
            'sourceHandle' => $this->source_handle,
            'targetHandle' => $this->target_handle,
            'type' => $this->type,
            'data' => $this->data,
            'style' => $this->style,
            'animated' => $this->animated,
        ];
    }

    // Create from React Flow edge
    public static function fromFlowEdge(string $plannerId, array $edge): self
    {
        return new self([
            'planner_id' => $plannerId,
            'edge_id' => $edge['id'],
            'source_node_id' => $edge['source'],
            'target_node_id' => $edge['target'],
            'source_handle' => $edge['sourceHandle'] ?? null,
            'target_handle' => $edge['targetHandle'] ?? null,
            'type' => $edge['type'] ?? 'default',
            'data' => $edge['data'] ?? [],
            'style' => $edge['style'] ?? null,
            'animated' => $edge['animated'] ?? false,
        ]);
    }

    // Update from React Flow edge
    public function updateFromFlowEdge(array $edge): self
    {
        $this->update([
            'source_node_id' => $edge['source'] ?? $this->source_node_id,
            'target_node_id' => $edge['target'] ?? $this->target_node_id,
            'source_handle' => $edge['sourceHandle'] ?? $this->source_handle,
            'target_handle' => $edge['targetHandle'] ?? $this->target_handle,
            'type' => $edge['type'] ?? $this->type,
            'data' => $edge['data'] ?? $this->data,
            'style' => $edge['style'] ?? $this->style,
            'animated' => $edge['animated'] ?? $this->animated,
        ]);

        return $this;
    }

    // Scope for edges of specific type
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Scope for edges connected to a specific node
    public function scopeConnectedTo($query, string $nodeId)
    {
        return $query->where('source_node_id', $nodeId)
            ->orWhere('target_node_id', $nodeId);
    }

    // Scope for outgoing edges from a node
    public function scopeFromNode($query, string $nodeId)
    {
        return $query->where('source_node_id', $nodeId);
    }

    // Scope for incoming edges to a node
    public function scopeToNode($query, string $nodeId)
    {
        return $query->where('target_node_id', $nodeId);
    }

    // Check if edge creates a cycle (basic check)
    public function createsCycle(): bool
    {
        // Simple cycle detection - check if target connects back to source
        return self::where('planner_id', $this->planner_id)
            ->where('source_node_id', $this->target_node_id)
            ->where('target_node_id', $this->source_node_id)
            ->exists();
    }

    // Get all edges in the same planner
    public function siblings()
    {
        return self::where('planner_id', $this->planner_id)
            ->where('id', '!=', $this->id);
    }
}
