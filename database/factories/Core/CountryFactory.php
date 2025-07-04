<?php

namespace Database\Factories\Core;

use App\Enums\Status;
use App\Enums\Zone;
use App\Models\Core\Language;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Core\Country>
 */
class CountryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $has_zipcode = fake()->boolean();

        return [
            'language_id' => Language::factory(),

            'zone' => fake()->randomElement(Zone::cases()),
            'name' => [
                'en' => fake()->word(),
                'sv' => fake()->word(),
                'no' => fake()->word(),
                'de' => fake()->word(),
                'es' => fake()->word(),
                'fr' => fake()->word(),
                'it' => fake()->word(),
                'pl' => fake()->word(),
                'nl' => fake()->word(),
                'fi' => fake()->word(),
                'da' => fake()->word(),
                'pt' => fake()->word(),
            ],
            'iso_code'       => fake()->unique()->countryCode(),
            'call_prefix'    => fake()->randomNumber(3, false),
            'is_active'      => fake()->randomElement(Status::cases()),
            'has_states'     => fake()->boolean(),
            'has_zipcode'    => $has_zipcode,
            'zipcode_format' => $has_zipcode ? fake()->randomElement([
                'NNNN',
                'NNNNN',
                'NNNN LL',
                'NNN NN',
            ]) : null,
        ];
    }
}
