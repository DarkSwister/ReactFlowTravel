<?php

namespace App\Services;

class NumberConverter
{
    public static function round(float | int $value, int $base = 5): int | float
    {
        // Determine the magnitude of the number
        $magnitude = $base ** floor(log10(abs($value)));

        // Divide the number by the magnitude
        $result = $value / $magnitude;

        // Round the result to the nearest integer
        $roundedResult = round($result);

        // Multiply the rounded result by the magnitude
        return round($roundedResult * $magnitude);
    }

    public static function roundToClosestLimit(array $limits, int | float $number): int | float
    {
        $limits = array_map(fn ($item) => is_float($item) ? (float) $item : (int) $item, $limits);
        sort($limits);

        $closest = null;
        foreach ($limits as $item) {
            if (null === $closest || abs($number - $closest) > abs($item - $number)) {
                $closest = $item;
            }
        }

        return $closest;
    }
}
