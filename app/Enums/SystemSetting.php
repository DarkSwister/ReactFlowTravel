<?php

namespace App\Enums;

enum SystemSetting: string
{
    case APP_NAME      = 'app:name';
    case APP_FAVICON   = 'app:favicon';
    case APP_LOGO      = 'app:logo';

    public function label(): string
    {
        return match ($this) {
            self::APP_NAME      => 'App name',
            self::APP_FAVICON   => 'App favicon',
            self::APP_LOGO      => 'App logo',
        };
    }
}
