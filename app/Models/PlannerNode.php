<?php
// app/Models/PlannerNode.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlannerNode extends Model
{
    protected $fillable = [
        'planner_id', 'node_id', 'type', 'label',
        'position_x', 'position_y', 'width', 'height',
        'data', 'style', 'z_index', 'draggable', 'selectable', 'parent_id'
    ];

    protected $casts = [
        'data' => 'array',
        'style' => 'array',
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'z_index' => 'integer',
        'draggable' => 'boolean',
        'selectable' => 'boolean',
    ];

    protected $appends = ['position'];

    public function planner(): BelongsTo
    {
        return $this->belongsTo(Planner::class);
    }

    // Check if this node type is resizable
    public function isResizable(): bool
    {
        return in_array($this->type, ['group', 'groupNode']); // Add your group node types
    }

    // Virtual position attribute for React Flow compatibility
    public function getPositionAttribute(): array
    {
        return [
            'x' => (float) $this->position_x,
            'y' => (float) $this->position_y
        ];
    }

    // Set position from array
    public function setPositionAttribute($value): void
    {
        if (is_array($value)) {
            $this->position_x = $value['x'] ?? 0;
            $this->position_y = $value['y'] ?? 0;
        }
    }

    // Convert to React Flow node format
    public function toFlowNode(): array
    {
        $node = [
            'id' => $this->node_id,
            'type' => $this->type,
            'position' => $this->position,
            'data' => array_merge($this->data ?? [], [
                'label' => $this->label,
            ]),
            'style' => $this->style,
            'zIndex' => $this->z_index,
            'draggable' => $this->draggable,
            'selectable' => $this->selectable,
            'parentNode' => $this->parent_id,
        ];

        // Only add dimensions for resizable nodes (groups)
        if ($this->isResizable() && $this->width !== null && $this->height !== null) {
            $node['width'] = (float) $this->width;
            $node['height'] = (float) $this->height;
        }

        return $node;
    }

    // Create from React Flow node
    public static function fromFlowNode(string $plannerId, array $node): self
    {
        $nodeData = [
            'planner_id' => $plannerId,
            'node_id' => $node['id'],
            'type' => $node['type'] ?? 'default',
            'label' => $node['data']['label'] ?? 'Untitled',
            'position_x' => $node['position']['x'] ?? 0,
            'position_y' => $node['position']['y'] ?? 0,
            'data' => $node['data'] ?? [],
            'style' => $node['style'] ?? null,
            'z_index' => $node['zIndex'] ?? 0,
            'draggable' => $node['draggable'] ?? true,
            'selectable' => $node['selectable'] ?? true,
            'parent_id' => $node['parentNode'] ?? null,
        ];

        // Only store dimensions for group nodes
        $nodeType = $node['type'] ?? 'default';
        if (in_array($nodeType, ['group', 'groupNode'])) {
            $nodeData['width'] = $node['width'] ?? null;
            $nodeData['height'] = $node['height'] ?? null;
        }

        return new self($nodeData);
    }

    // Update from React Flow node
    public function updateFromFlowNode(array $node): self
    {
        $updateData = [
            'type' => $node['type'] ?? $this->type,
            'label' => $node['data']['label'] ?? $this->label,
            'position_x' => $node['position']['x'] ?? $this->position_x,
            'position_y' => $node['position']['y'] ?? $this->position_y,
            'data' => $node['data'] ?? $this->data,
            'style' => $node['style'] ?? $this->style,
            'z_index' => $node['zIndex'] ?? $this->z_index,
            'draggable' => $node['draggable'] ?? $this->draggable,
            'selectable' => $node['selectable'] ?? $this->selectable,
            'parent_id' => $node['parentNode'] ?? $this->parent_id,
        ];

        // Only update dimensions for resizable nodes
        if ($this->isResizable()) {
            $updateData['width'] = $node['width'] ?? $this->width;
            $updateData['height'] = $node['height'] ?? $this->height;
        }

        $this->update($updateData);

        return $this;
    }

    // Scope for resizable nodes only
    public function scopeResizable($query)
    {
        return $query->whereIn('type', ['group', 'groupNode']);
    }

    // Rest of your existing methods...
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeInArea($query, float $minX, float $minY, float $maxX, float $maxY)
    {
        return $query->where('position_x', '>=', $minX)
            ->where('position_x', '<=', $maxX)
            ->where('position_y', '>=', $minY)
            ->where('position_y', '<=', $maxY);
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id', 'node_id')
            ->where('planner_id', $this->planner_id);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id', 'node_id')
            ->where('planner_id', $this->planner_id);
    }
}
