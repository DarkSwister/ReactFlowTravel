<?php

namespace App\Models\Core;

use App\Enums\Status;
use App\Models\Casino\CasinoAggregator;
use App\Models\Casino\CasinoProvider;
use App\Models\Gateways\Gateway;
use App\Services\NumberConverter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Spatie\Translatable\HasTranslations;

/**
 * @property int         $id
 * @property string      $name
 * @property float       $conversion_rate
 * @property int|float   $rounded_conversion_rate
 * @property string      $iso_code
 * @property string      $symbol
 * @property bool        $is_default
 * @property Status      $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property Collection        $gateways
 * @property Collection        $countries
 * @property Collection        $rates
 * @property CurrencyRate|null $rate
 * @property Collection        $casinoAggregator
 * @property Collection        $casinoProviders
 *
 * @mixin Builder
 */
class Currency extends Model
{
    use HasFactory;
    use HasTranslations;
    use SoftDeletes;

    public const string DEFAULT_CURRENCY_ISO_CODE = 'EUR';

    /**
     * The attributes that should be translatable.
     *
     * @var array
     */
    public array $translatable = [
        'name',
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [
        'id',
        'is_default',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'conversion_rate' => 'float',
        'is_default'      => 'boolean',
        'is_active'       => Status::class,
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
        'deleted_at'      => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $currency): void {
            $currency->fill(['rounded_conversion_rate' => NumberConverter::round($currency->conversion_rate ?? 1)]);
        });
    }

    public static function getCachedDefaultCurrency(): Currency
    {
        return Cache::driver('array')
            ->rememberForever('currencies:default', fn () => Currency::default()->first());
    }

    public function hasOptions(): bool
    {
        return ! empty($this->pivot?->options);
    }

    /***********************
     * Attributes
     ***********************/

    protected function conversionRate(): Attribute
    {
        return Attribute::get(fn ($value) => $this->is_default ? 1 : $value);
    }

    /***********************
     * Relations
     ***********************/

    public function gateways(): BelongsToMany
    {
        return $this
            ->belongsToMany(Gateway::class, 'gateway_currency')
            ->withPivot(['min_limit', 'max_limit']);
    }

    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class, 'country_currency');
    }

    public function rates(): HasMany
    {
        return $this->hasMany(CurrencyRate::class);
    }

    public function rate(): HasOne
    {
        return $this->hasOne(CurrencyRate::class)
            ->latest('date')
            ->take(1);
    }

    public function casinoAggregator(): BelongsToMany
    {
        return $this->belongsToMany(CasinoAggregator::class)
            ->withPivot(['options', 'status'])
            ->withTimestamps();
    }

    public function casinoProviders(): BelongsToMany
    {
        return $this->belongsToMany(CasinoProvider::class, 'casino_provider_currency');
    }

    /***********************
     * Scopes
     ***********************/

    /**
     * Scope a query to only include the default currency.
     */
    public function scopeDefault(Builder $query, bool $value = true): void
    {
        $query->where('is_default', $value);
    }

    /**
     * Scope a query to only include the active currency.
     */
    public function scopeActive(Builder $query, bool $value = true): void
    {
        $query->where('is_active', $value);
    }

    /**
     * Scope a query to only include currencies with provided status.
     */
    public function scopeByStatus(Builder $query, int $status): Builder
    {
        return $query->where('is_active', $status);
    }

    /**
     * Scope a query to only include currencies with provided name.
     */
    public function scopeByName(Builder $query, string $status): Builder
    {
        return $query->whereRaw('LOWER(JSON_UNQUOTE(JSON_EXTRACT(name, "$.en"))) LIKE ?', ["%" . strtolower($status) . "%"]);
    }
}
