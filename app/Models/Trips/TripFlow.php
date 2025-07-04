<?php

namespace App\Models\Trips;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TripFlow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'trip_id',
        'name',
        'description',
        'nodes',
        'edges',
        'enabled_flags',
        'share_token',
        'share_type',
        'allow_editing',
        'share_expires_at',
    ];

    protected $casts = [
        'nodes' => 'array',
        'edges' => 'array',
        'enabled_flags' => 'array',
        'allow_editing' => 'boolean',
        'share_expires_at' => 'datetime',
    ];

    protected $hidden = [
        'share_token',
    ];

    protected $appends = [
        'total_cost',
        'node_count',
        'edge_count',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTotalCostAttribute(): float
    {
        $total = 0;

        foreach ($this->nodes as $node) {
            if (isset($node['data']['cost'])) {
                $total += (float) $node['data']['cost'];
            }
            if (isset($node['data']['realCost'])) {
                $total += (float) $node['data']['realCost'];
            }
            if (isset($node['data']['approxCost']) && !isset($node['data']['realCost'])) {
                $total += (float) $node['data']['approxCost'];
            }
        }

        return $total;
    }

    public function getNodeCountAttribute(): int
    {
        return count($this->nodes);
    }

    public function getEdgeCountAttribute(): int
    {
        return count($this->edges);
    }

    public function getRouteKeyName(): string
    {
        return 'trip_id';
    }

    public function scopeShared($query)
    {
        return $query->whereNotNull('share_token')
            ->where(function ($q) {
                $q->whereNull('share_expires_at')
                    ->orWhere('share_expires_at', '>', now());
            });
    }

    public function scopePublic($query)
    {
        return $query->where('share_type', 'public');
    }

    public function isExpired(): bool
    {
        return $this->share_expires_at && $this->share_expires_at->isPast();
    }

    public function canBeShared(): bool
    {
        return !empty($this->share_token) && !$this->isExpired();
    }
}
