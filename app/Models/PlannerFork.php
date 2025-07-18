<?php
// app/Models/PlannerFork.php

namespace App\Models;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlannerFork extends Model
{
    protected $fillable = [
        'original_planner_id', 'forked_planner_id', 'forked_by',
        'forked_at', 'fork_metadata'
    ];

    protected $casts = [
        'forked_at' => 'datetime',
        'fork_metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($fork) {
            if (!$fork->forked_at) {
                $fork->forked_at = now();
            }
        });
    }

    public function originalPlanner(): BelongsTo
    {
        return $this->belongsTo(Planner::class, 'original_planner_id');
    }

    public function forkedPlanner(): BelongsTo
    {
        return $this->belongsTo(Planner::class, 'forked_planner_id');
    }

    public function forkedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'forked_by');
    }

    // Get fork reason from metadata
    public function getReason(): ?string
    {
        return $this->fork_metadata['reason'] ?? null;
    }

    // Set fork reason in metadata
    public function setReason(string $reason): void
    {
        $metadata = $this->fork_metadata ?? [];
        $metadata['reason'] = $reason;
        $this->update(['fork_metadata' => $metadata]);
    }

    // Get fork notes from metadata
    public function getNotes(): ?string
    {
        return $this->fork_metadata['notes'] ?? null;
    }

    // Set fork notes in metadata
    public function setNotes(string $notes): void
    {
        $metadata = $this->fork_metadata ?? [];
        $metadata['notes'] = $notes;
        $this->update(['fork_metadata' => $metadata]);
    }

    // Check if fork is still active (forked planner exists and is not deleted)
    public function isActive(): bool
    {
        return $this->forkedPlanner()->exists() && $this->originalPlanner()->exists();
    }

    // Get fork age in days
    public function getAgeInDays(): int
    {
        return $this->forked_at->diffInDays(now());
    }

    // Check if fork has been modified since creation
    public function hasBeenModified(): bool
    {
        if (!$this->forkedPlanner) {
            return false;
        }

        return $this->forkedPlanner->updated_at > $this->forked_at;
    }

    // Get modification summary
    public function getModificationSummary(): array
    {
        if (!$this->forkedPlanner || !$this->originalPlanner) {
            return [];
        }

        $forked = $this->forkedPlanner;
        $original = $this->originalPlanner;

        return [
            'nodes_added' => $forked->nodes()->count() - $original->nodes()->count(),
            'edges_added' => $forked->edges()->count() - $original->edges()->count(),
            'last_modified' => $forked->updated_at,
            'days_since_fork' => $this->getAgeInDays(),
            'has_changes' => $this->hasBeenModified(),
        ];
    }

    // Scope for forks by specific user
    public function scopeByUser($query, $userId)
    {
        return $query->where('forked_by', $userId);
    }

    // Scope for forks of specific planner
    public function scopeOfPlanner($query, $plannerId)
    {
        return $query->where('original_planner_id', $plannerId);
    }

    // Scope for active forks (both planners still exist)
    public function scopeActive($query)
    {
        return $query->whereHas('originalPlanner')
            ->whereHas('forkedPlanner');
    }

    // Scope for recent forks
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('forked_at', '>=', now()->subDays($days));
    }

    // Scope for modified forks
    public function scopeModified($query)
    {
        return $query->whereHas('forkedPlanner', function ($q) {
            $q->whereColumn('updated_at', '>', 'planner_forks.forked_at');
        });
    }

    // Convert to array for API responses
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'original_planner' => $this->originalPlanner ? [
                'id' => $this->originalPlanner->id,
                'title' => $this->originalPlanner->title,
                'owner' => $this->originalPlanner->user->only(['id', 'name', 'email']),
            ] : null,
            'forked_planner' => $this->forkedPlanner ? [
                'id' => $this->forkedPlanner->id,
                'title' => $this->forkedPlanner->title,
                'status' => $this->forkedPlanner->status,
                'updated_at' => $this->forkedPlanner->updated_at,
            ] : null,
            'forked_by' => $this->forkedBy->only(['id', 'name', 'email']),
            'forked_at' => $this->forked_at,
            'reason' => $this->getReason(),
            'notes' => $this->getNotes(),
            'is_active' => $this->isActive(),
            'age_in_days' => $this->getAgeInDays(),
            'has_been_modified' => $this->hasBeenModified(),
            'modification_summary' => $this->getModificationSummary(),
        ];
    }
}
