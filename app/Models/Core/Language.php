4<?php

namespace App\Models\Core;

use App\Enums\Status;
use DateTime;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Spatie\Translatable\HasTranslations;

/**
 * @property int      $id
 * @property string   $name
 * @property string   $default_name
 * @property string   $iso_code
 * @property string   $date_format
 * @property string   $date_format_full
 * @property bool     $is_rtl
 * @property Status   $is_active
 * @property DateTime $created_at
 * @property DateTime $updated_at
 */
class Language extends Model
{
    use HasFactory;
    use HasTranslations;

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
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_rtl'     => 'boolean',
        'is_active'  => Status::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /***********************
     * Relations
     ***********************/

    /**
     * Get the countries related to the language.
     */
    public function countries(): HasMany
    {
        return $this->hasMany(Country::class);
    }

    /***********************
     * Scopes
     ***********************/

    public function scopeByStatus(Builder $query, int $status): Builder
    {
        return $query->where('is_active', $status);
    }

    /**
     * Scope a query to only include the active currency.
     */
    public function scopeActive(Builder $query, bool $value = true): void
    {
        $query->where('is_active', $value);
    }

    /**
     * Scope a query to only include languages with provided name.
     */
    public function scopeByName(Builder $query, string $status): Builder
    {
        return $query->whereRaw('LOWER(JSON_UNQUOTE(JSON_EXTRACT(name, "$.en"))) LIKE ?', ["%" . strtolower($status) . "%"]);
    }

    /***********************
     * Repository
     ***********************/

    /**
     * Get the cached languages.
     */
    public static function getCached(array $supportedLanguages): Collection
    {
        $cacheKey = sprintf('languages:%s', implode(',', $supportedLanguages));

        return Cache::rememberForever($cacheKey, fn () => Language::query()
            ->when(
                ! empty($supportedLanguages),
                fn (Builder $q) => $q->whereIn('iso_code', $supportedLanguages)
            )
            ->get());
    }

    /**
     * Get language by iso code.
     */
    public static function getByIsoCode(string $isoCode): null | Model | self
    {
        return self::query()->where('iso_code', $isoCode)->first();
    }

    public static function getFallback(): self | Model
    {
        return self::getByIsoCode(app()->getFallbackLocale());
    }
}
