<?php

namespace App\Models\Trips;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'user_id',
        'status',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flow(): HasOne
    {
        return $this->hasOne(TripFlow::class);
    }

    public function isOwnedBy(?User $user): bool
    {
        if (!$user) {
            return $this->user_id === null; // Anonymous trips
        }

        return $this->user_id === $user->id;
    }
}
