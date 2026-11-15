<?php

namespace App\Services;

final class GeoDistance
{
    /** Approximate straight-line distance between two saved WGS84 pins, in km. */
    public static function between(?float $lat1, ?float $lng1, ?float $lat2, ?float $lng2): ?float
    {
        if ($lat1 === null || $lng1 === null || $lat2 === null || $lng2 === null) return null;

        $lat = deg2rad($lat2 - $lat1);
        $lng = deg2rad($lng2 - $lng1);
        $arc = sin($lat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lng / 2) ** 2;
        return 6371 * 2 * asin(min(1, sqrt($arc)));
    }
}
