<?php

namespace App\Models\Core;

use App\Enums\ConfirmationOptions;
use App\Enums\Status;
use App\Enums\Zone;
use App\Models\Deposits\Deposit;
use App\Models\Players\PlayerAccount;
use App\Models\Users\User;
use App\Models\Withdrawals\WithdrawalRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Spatie\Translatable\HasTranslations;

/**
 * @property int                 $id
 * @property int|null            $language_id
 * @property int|null            $currency_id
 * @property Zone                $zone
 * @property string              $name
 * @property string              $iso_code
 * @property int|null            $call_prefix
 * @property Status              $is_active
 * @property bool                $has_states
 * @property bool                $has_zipcode
 * @property string|null         $zipcode_format
 * @property string|null         $timezone
 * @property array|null          $placeholders
 * @property ConfirmationOptions $is_billing_data_required
 * @property Carbon|null         $created_at
 * @property Carbon|null         $updated_at
 * @property Carbon|null         $deleted_at
 *
 * @property Language|null         $language
 * @property User[]|Collection     $users
 * @property Currency|null         $currency
 * @property Currency[]|Collection $currencies
 *
 * @mixin Builder
 */
class Country extends Model
{
    use HasFactory;
    use HasTranslations;
    use SoftDeletes;

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
        'deleted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'zone'                      => Zone::class,
        'is_active'                 => Status::class,
        'has_states'                => 'boolean',
        'has_zipcode'               => 'boolean',
        'placeholders'              => 'array',
        'is_billing_data_required'  => ConfirmationOptions::class,
        'created_at'                => 'datetime',
        'updated_at'                => 'datetime',
        'deleted_at'                => 'datetime',

        // Eloquent
        'completed_deposit_requests_sum_converted_amount' => 'float',
    ];

    /***********************
     * Relations
     ***********************/

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function playerAccounts(): HasMany
    {
        return $this->hasMany(PlayerAccount::class);
    }


    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function currencies(): BelongsToMany
    {
        return $this->belongsToMany(Currency::class, 'country_currency');
    }

    /***********************
     * Scopes
     ***********************/

    /**
     * Scope a query to order by name.
     */
    public function scopeOrderByName(Builder $query): void
    {
        $query->orderBy('name->en', 'asc');
    }

    /**
     * Scope a query to search a country based on the iso code.
     */
    public function scopeByCountryCode(Builder $query, string $iso_code): Builder
    {
        return $query->where('countries.iso_code', $iso_code);
    }

    /**
     * Scope a query to search a country based on the status.
     */
    public function scopeByStatus(Builder $query, int $status): Builder
    {
        return $query->where('countries.is_active', $status);
    }

    /**
     * Scope a query to only include countries with provided name.
     */
    public function scopeByName(Builder $query, string $status): Builder
    {
        return $query->whereRaw('LOWER(JSON_UNQUOTE(JSON_EXTRACT(name, "$.en"))) LIKE ?', ["%" . strtolower($status) . "%"]);
    }

    /***********************
     * Repository
     ***********************/

    /**
     * Get country by iso code.
     */
    public static function getByIsoCode(string $isoCode): null | Model | self
    {
        return self::query()->where('iso_code', $isoCode)->first();
    }
}
