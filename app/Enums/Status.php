<?php

namespace App\Enums;

enum Status: int
{
    case INACTIVE = 0;
    case ACTIVE   = 1;

    public function name(): string
    {
        return match ($this) {
            self::INACTIVE => 'Inactive',
            self::ACTIVE   => 'Active',
        };
    }

    public function class(): string
    {
        return match ($this) {
            self::INACTIVE => 'danger',
            self::ACTIVE   => 'success',
        };
    }
}
