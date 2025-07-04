<?php

namespace Database\Factories\Core;

use App\Enums\Status;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Core\Language>
 */
class LanguageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => [
                'en' => fake()->word(),
                'da' => fake()->word(),
                'de' => fake()->word(),
                'es' => fake()->word(),
                'fi' => fake()->word(),
                'fr' => fake()->word(),
                'it' => fake()->word(),
                'nl' => fake()->word(),
                'no' => fake()->word(),
                'pl' => fake()->word(),
                'pt' => fake()->word(),
                'sv' => fake()->word(),
            ],
            'name_default'     => fake()->word(),
            'iso_code'         => fake()->unique()->languageCode(),
            'date_format'      => fake()->randomElement(['M d, Y', 'd M, Y']),
            'date_format_full' => fake()->randomElement(['M d, Y h:i:s A', 'd M, Y h:i:s A']),
            'is_rtl'           => fake()->boolean(),
            'is_active'        => fake()->randomElement(Status::cases()),
        ];
    }
}
