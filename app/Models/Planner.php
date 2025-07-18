<?php
// app/Models/Planner.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class Planner extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id', 'title', 'description', 'type', 'config',
        'viewport', 'status', 'is_public', 'starts_at', 'ends_at', 'metadata'
    ];

    protected $casts = [
        'config' => 'array',
        'viewport' => 'array',
        'metadata' => 'array',
        'is_public' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($planner) {
            if ($planner->is_public && !$planner->share_token) {
                $planner->share_token = Str::random(32);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(PlannerNode::class);
    }

    public function edges(): HasMany
    {
        return $this->hasMany(PlannerEdge::class);
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(PlannerCollaborator::class);
    }

    public function acceptedCollaborators(): HasMany
    {
        return $this->hasMany(PlannerCollaborator::class)->where('status', 'accepted');
    }

    public function originalForks(): HasMany
    {
        return $this->hasMany(PlannerFork::class, 'original_planner_id');
    }

    public function forkSource(): HasMany
    {
        return $this->hasMany(PlannerFork::class, 'forked_planner_id');
    }

    public function getSliceAttribute(): string
    {
        return $this->type === 'travel' ? 'travel' : 'general';
    }

    public function getRouteKeyName()
    {
        return 'id'; // UUID will be used in routes
    }

    // Check if user can view this planner
    public function canView($user): bool
    {
        if (!$user) return $this->is_public;

        return $this->user_id === $user->id ||
            $this->is_public ||
            $this->collaborators()
                ->where('user_id', $user->id)
                ->where('status', 'accepted')
                ->exists();
    }

    // Check if user can edit this planner
    public function canEdit($user): bool
    {
        if (!$user) return false;

        return $this->user_id === $user->id ||
            $this->collaborators()
                ->where('user_id', $user->id)
                ->where('status', 'accepted')
                ->where('permission', 'edit')
                ->exists();
    }

    // Get user's permission level
    public function getUserPermission($user): string
    {
        if (!$user) {
            return $this->is_public ? 'view' : 'none';
        }

        if ($this->user_id === $user->id) {
            return 'owner';
        }

        $collaborator = $this->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        return $collaborator ? $collaborator->permission : ($this->is_public ? 'view' : 'none');
    }

    // Check if this planner is a fork
    public function isFork(): bool
    {
        return PlannerFork::where('forked_planner_id', $this->id)->exists();
    }

    // Get the original planner if this is a fork
    public function getOriginalPlanner(): ?self
    {
        $forkRelation = PlannerFork::where('forked_planner_id', $this->id)->first();
        return $forkRelation ? $forkRelation->originalPlanner : null;
    }

    public function toFlowData($user = null): array
    {
        $permission = $user ? $this->getUserPermission($user) : 'none';
        $originalPlanner = $this->getOriginalPlanner();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'slice' => $this->slice,
            'config' => $this->config ?? [],
            'viewport' => $this->viewport,
            'status' => $this->status,
            'nodes' => $this->nodes->map->toFlowNode(),
            'edges' => $this->edges->map->toFlowEdge(),
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'owner' => $this->user->only(['id', 'name', 'email']),
            'permission' => $permission,
            'is_owner' => $user && $this->user_id === $user->id,
            'can_edit' => $permission === 'owner' || $permission === 'edit',
            'can_view' => in_array($permission, ['owner', 'edit', 'view']),
            'collaborators_count' => $this->acceptedCollaborators()->count(),
            'forks_count' => $this->originalForks()->count(),
            'is_fork' => $this->isFork(),
            'original_planner' => $originalPlanner ? [
                'id' => $originalPlanner->id,
                'title' => $originalPlanner->title,
                'owner' => $originalPlanner->user->only(['id', 'name', 'email']),
            ] : null,
        ];
    }

    // Scope for user's planners
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Scope for public planners (for sharing)
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
