<?php

namespace App\Enums;

enum Weekday: int
{
    case MONDAY    = 0;
    case TUESDAY   = 1;
    case WEDNESDAY = 2;
    case THURSDAY  = 3;
    case FRIDAY    = 4;
    case SATURDAY  = 5;
    case SUNDAY    = 6;

    public static function caseByValue(int $value): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }

        return null;
    }

    public static function values(): array
    {
        $values = [];
        foreach (self::cases() as $case) {
            $values[] = $case->value;
        }

        return $values;
    }

    public function name(): string
    {
        return match ($this) {
            self::MONDAY    => 'Monday',
            self::TUESDAY   => 'Tuesday',
            self::WEDNESDAY => 'Wednesday',
            self::THURSDAY  => 'Thursday',
            self::FRIDAY    => 'Friday',
            self::SATURDAY  => 'Saturday',
            self::SUNDAY    => 'Sunday',
        };
    }
}
