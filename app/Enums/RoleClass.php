<?php

namespace App\Enums;

enum RoleClass: int
{
    case PRIMARY   = 0;
    case SECONDARY = 1;
    case SUCCESS   = 2;
    case INFO      = 3;
    case WARNING   = 4;
    case DANGER    = 5;
    case LIGHT     = 6;
    case DARK      = 7;

    public function name(): string
    {
        return match ($this) {
            self::PRIMARY   => 'Primary',
            self::SECONDARY => 'Secondary',
            self::SUCCESS   => 'Green',
            self::INFO      => 'Blue',
            self::WARNING   => 'Yellow',
            self::DANGER    => 'Red',
            self::LIGHT     => 'Light',
            self::DARK      => 'Dark',
        };
    }

    public function class(): string
    {
        return match ($this) {
            self::PRIMARY   => 'primary',
            self::SECONDARY => 'secondary',
            self::SUCCESS   => 'success',
            self::INFO      => 'info',
            self::WARNING   => 'warning',
            self::DANGER    => 'danger',
            self::LIGHT     => 'light',
            self::DARK      => 'dark',
        };
    }
}
