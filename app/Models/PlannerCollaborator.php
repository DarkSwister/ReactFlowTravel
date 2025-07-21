<?php
// app/Models/PlannerCollaborator.php

namespace App\Models;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PlannerCollaborator extends Model
{
    protected $fillable = [
        'planner_id', 'user_id', 'invited_by', 'permission',
        'status', 'invitation_token', 'invited_at', 'responded_at'
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($collaborator) {
            if (!$collaborator->invitation_token) {
                $collaborator->invitation_token = Str::random(32);
            }
            if (!$collaborator->invited_at) {
                $collaborator->invited_at = now();
            }
        });
    }

    public function planner(): BelongsTo
    {
        return $this->belongsTo(Planner::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    // Accept the invitation
    public function accept(): void
    {
        $this->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);
    }

    // Decline the invitation
    public function decline(): void
    {
        $this->update([
            'status' => 'declined',
            'responded_at' => now(),
        ]);
    }

    // Check if invitation is still valid (not expired)
    public function isValid(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        // Check if invitation is older than 30 days
        return $this->invited_at->diffInDays(now()) <= 30;
    }

    // Check if user can edit
    public function canEdit(): bool
    {
        return $this->status === 'accepted' && $this->permission === 'edit';
    }

    // Check if user can view
    public function canView(): bool
    {
        return $this->status === 'accepted';
    }

    // Get invitation URL
    public function getInvitationUrl(): string
    {
        return route('invitations.accept', $this->invitation_token);
    }

    // Get decline URL
    public function getDeclineUrl(): string
    {
        return route('invitations.decline', $this->invitation_token);
    }

    // Scope for pending invitations
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Scope for accepted collaborators
    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    // Scope for declined invitations
    public function scopeDeclined($query)
    {
        return $query->where('status', 'declined');
    }

    // Scope for edit permissions
    public function scopeWithEditPermission($query)
    {
        return $query->where('permission', 'edit');
    }

    // Scope for view permissions
    public function scopeWithViewPermission($query)
    {
        return $query->where('permission', 'view');
    }

    // Scope for valid invitations (not expired)
    public function scopeValid($query)
    {
        return $query->where('status', 'pending')
            ->where('invited_at', '>=', now()->subDays(30));
    }

    // Scope for expired invitations
    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
            ->where('invited_at', '<', now()->subDays(30));
    }

    // Convert to array for API responses
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user' => $this->user->only(['id', 'name', 'email']),
            'invited_by' => $this->invitedBy->only(['id', 'name', 'email']),
            'permission' => $this->permission,
            'status' => $this->status,
            'invited_at' => $this->invited_at,
            'responded_at' => $this->responded_at,
            'is_valid' => $this->isValid(),
            'can_edit' => $this->canEdit(),
            'can_view' => $this->canView(),
        ];
    }
}
