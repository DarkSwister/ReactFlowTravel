<?php

namespace App\Models\Core;

use App\Enums\SystemSetting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int    $id
 * @property string $key
 * @property mixed  $value
 * @property int    $expires_at
 *
 * @method   self   notExpired
 * @method   self   byKey(string $key)
 *
 * @mixin Builder
 */
class Setting extends Model
{
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [
        'id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'key'   => SystemSetting::class,
        'value' => 'json',
    ];

    protected function hasExpired(): Attribute
    {
        return Attribute::get(
            fn (array $attributes) => ! empty($attributes['expires_at']) && now()->timestamp > $attributes['expires_at']
        );
    }

    protected function value(): Attribute
    {
        return Attribute::get(fn ($value) => json_decode($value, true)['data'] ?? null);
    }

    /***********************
     * Scopes
     ***********************/

    public function scopeByKey(Builder $query, string $key): void
    {
        $query->where('key', $key);
    }

    public function scopeNotExpired(Builder $query): void
    {
        $query->where(function (Builder $query): void {
            $query->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()->timestamp);
        });
    }

    /***********************
     * Repository
     ***********************/
    public static function getValueByKey(string $key): mixed
    {
        return self::byKey($key)->first('value')?->value;
    }

    public static function getAppName(): string
    {
        static $data = null;
        if (null === $data) {
            $data = self::getValueByKey(SystemSetting::APP_NAME->value) ?? config('app.name');
        }

        return $data;
    }

    public static function getAppFavicon(): string
    {
        static $data = null;
        if (null === $data) {
            $data = self::getValueByKey(SystemSetting::APP_FAVICON->value)['path'] ?? 'favicon.ico';
        }

        return $data;
    }

    public static function getAppLogo(): string
    {
        static $data = null;
        if (null === $data) {
            $data = self::getValueByKey(SystemSetting::APP_LOGO->value)['path'] ?? 'assets/media/logos/default-dark.svg';
        }

        return $data;
    }
}
