<?php

namespace Database\Factories\Users;

use App\Models\Core\Country;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Users\UserLogin>
 */
class UserLoginFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'country_id' => Country::factory(),
            'ip_address' => rand(0, 1) ? fake()->ipv4() : fake()->ipv6(),
            'user_agent' => fake()->userAgent(),
            'created_at' => fake()->dateTimeBetween('-1 month'),
        ];
    }
}
