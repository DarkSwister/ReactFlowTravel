<?php

namespace Database\Factories\Core;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Core\Currency>
 */
class CurrencyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'            => ['en' => fake()->word()],
            'conversion_rate' => fake()->randomFloat(6, 1, 10),
            'iso_code'        => fake()->unique()->currencyCode(),
            'symbol'          => fake()->randomElement(['$', '€', '£', '¥']),
        ];
    }
}
