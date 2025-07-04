<?php

namespace Database\Factories\Core;

use App\Models\Core\Currency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Core\CurrencyRate>
 */
class CurrencyRateFactory extends Factory
{
    public function currencyId(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'currency_id' => Currency::factory()->create()->id
        ]);
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversion_rate' => fake()->randomFloat(6, 1, 10),
            'date'            => fake()->date()
        ];
    }
}
