<?php

namespace App\Enums;

enum Months: int
{
    case JANUARY      = 1;
    case FEBRUARY     = 2;
    case MARCH        = 3;
    case APRIL        = 4;
    case MAY          = 5;
    case JUNE         = 6;
    case JULY         = 7;
    case AUGUST       = 8;
    case SEPTEMBER    = 9;
    case OCTOBER      = 10;
    case NOVEMBER     = 11;
    case DECEMBER     = 12;

    public static function caseByValue(int $value): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }

        return null;
    }

    public function name(): string
    {
        return ucfirst(mb_strtolower($this->name));
    }

    public static function active(): array
    {
        $currentMonth = now()->month;

        return array_filter(self::cases(), fn ($item) => $currentMonth >= $item->value);
    }
}
