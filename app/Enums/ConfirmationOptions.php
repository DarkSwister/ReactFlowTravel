<?php

namespace App\Enums;

enum ConfirmationOptions: int
{
    case NO  = 0;
    case YES = 1;

    public function name(): string
    {
        return match ($this) {
            self::YES => 'Yes',
            self::NO  => 'No',
        };
    }
}
