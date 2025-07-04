<?php

namespace App\Models;

use App\Traits\HasUserstamps;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model as BaseModel;

/**
 * @mixin Builder
 */
class Model extends BaseModel
{
    use HasUserstamps;

    /**
     * The name of the "created by" column.
     *
     * @var string|null
     */
    public const CREATED_BY = 'created_by';

    /**
     * The name of the "updated by" column.
     *
     * @var string|null
     */
    public const UPDATED_BY = 'updated_by';
}
