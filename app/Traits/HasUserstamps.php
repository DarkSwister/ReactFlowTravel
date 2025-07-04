<?php

namespace App\Traits;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasUserstamps
{
    /**
     * Indicates if the model should be userstamped.
     */
    public bool $userstamps = false;

    /**
     * Boot the has userstamps trait for a model.
     */
    public static function bootHasUserstamps(): void
    {
        static::saving(function (Model $model): void {
            $model->updateUserstamps();
        });

        static::deleting(function (Model $model): void {
            $model->updateUserstamps();
        });
    }

    /**
     * Get user that created instance.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, $this->getCreatedByColumn());
    }

    /**
     * Get user that updated instance.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, $this->getUpdatedByColumn());
    }

    /**
     * Update the creation and update userstamps.
     */
    public function updateUserstamps(): void
    {
        if (false === $this->usesUserstamps()) {
            return;
        }

        $userId = auth()->id();

        $updatedByColumn = $this->getUpdatedByColumn();
        if (null !== $updatedByColumn && ! $this->isDirty($updatedByColumn)) {
            $this->setUpdatedBy($userId);
        }

        $createdByColumn = $this->getCreatedByColumn();
        if (! $this->exists && null !== $createdByColumn && ! $this->isDirty($createdByColumn)) {
            $this->setCreatedBy($userId);
        }
    }

    /**
     * Determine if the model uses userstamps.
     */
    public function usesUserstamps(): bool
    {
        return $this->userstamps;
    }

    /**
     * Set the value of the "created by" attribute.
     */
    public function setCreatedBy(?int $value): self
    {
        $this->{$this->getCreatedByColumn()} = $value;

        return $this;
    }

    /**
     * Set the value of the "updated by" attribute.
     */
    public function setUpdatedBy(?int $value): self
    {
        $this->{$this->getUpdatedByColumn()} = $value;

        return $this;
    }

    /**
     * Get the name of the "created by" column.
     */
    public function getCreatedByColumn(): ?string
    {
        return static::CREATED_BY;
    }

    /**
     * Get the name of the "updated by" column.
     */
    public function getUpdatedByColumn(): ?string
    {
        return static::UPDATED_BY;
    }

    /**
     * Get the fully qualified "created at" column.
     */
    public function getQualifiedCreatedByColumn(): ?string
    {
        return $this->qualifyColumn($this->getCreatedByColumn());
    }

    /**
     * Get the fully qualified "updated at" column.
     */
    public function getQualifiedUpdatedByColumn(): ?string
    {
        return $this->qualifyColumn($this->getUpdatedByColumn());
    }
}
