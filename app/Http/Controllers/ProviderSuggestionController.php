<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Services\BookingSlot;
use App\Services\ProviderRanking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProviderSuggestionController extends Controller
{
    public function index(Request $request, ProviderRanking $ranking, BookingSlot $slots): JsonResponse
    {
        $data = $request->validate([
            'category' => ['required', 'string', Rule::exists('skills', 'slug')->where('is_active', true)],
            'area' => ['required', Rule::in(array_keys(config('pilot_areas.areas')))],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'scheduled_at' => ['nullable', 'date_format:Y-m-d H:i'],
        ]);
        $requestedAt = isset($data['scheduled_at']) ? $slots->fromInput($data['scheduled_at']) : null;
        if ($requestedAt?->isPast()) {
            throw ValidationException::withMessages(['scheduled_at' => 'Choose a future date and time.']);
        }
        $category = Skill::catalog()->where('slug', $data['category'])->firstOrFail();

        return response()->json([
            'providers' => $ranking->rank(
                $category, $data['area'], isset($data['latitude']) ? (float) $data['latitude'] : null,
                isset($data['longitude']) ? (float) $data['longitude'] : null, $requestedAt, $request->user()->user_id
            ),
            'distance_range_km' => config('pilot_areas.distance_range_km'),
        ]);
    }
}
