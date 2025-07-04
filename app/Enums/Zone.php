<?php

namespace App\Enums;

enum Zone: int
{
    case AFRICA                  = 1;
    case ASIA                    = 2;
    case CENTRAL_AMERICA_ANTILLA = 3;
    case EUROPE                  = 4;
    case EUROPE_NON_EU           = 5;
    case NORTH_AMERICA           = 6;
    case OCEANIA                 = 7;
    case SOUTH_AMERICA           = 8;

    public function name(): string
    {
        return match ($this) {
            self::EUROPE                  => 'Europe',
            self::NORTH_AMERICA           => 'North America',
            self::ASIA                    => 'Asia',
            self::AFRICA                  => 'Africa',
            self::OCEANIA                 => 'Oceania',
            self::SOUTH_AMERICA           => 'South America',
            self::EUROPE_NON_EU           => 'Europe (non-EU)',
            self::CENTRAL_AMERICA_ANTILLA => 'Central America/Antilla',
        };
    }
}
