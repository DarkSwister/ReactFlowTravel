<?php

namespace App\Enums;

enum CountryRestriction: int
{
    case NO_RESTRICTION = 0;
    case AVAILABLE      = 1;
    case RESTRICTED     = 2;

    public function name(): string
    {
        return match($this) {
            self::NO_RESTRICTION => 'Available for every country',
            self::AVAILABLE      => 'Available for the specified countries',
            self::RESTRICTED     => 'Restricted for the specified countries'
        };
    }
}
