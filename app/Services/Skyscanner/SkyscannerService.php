<?php
namespace App\Services\Skyscanner;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SkyscannerService
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.skyscanner.key');
        $this->baseUrl = config('services.skyscanner.url', 'https://skyscanner80.p.rapidapi.com');
    }

    public function searchMultiCity(array $legs): array
    {
        if (!$this->apiKey) {
            throw new \RuntimeException('Skyscanner API key not configured');
        }

        $response = Http::withHeaders([
            'X-RapidAPI-Key' => $this->apiKey,
            'X-RapidAPI-Host' => 'skyscanner80.p.rapidapi.com'
        ])->timeout(30)->post($this->baseUrl . '/api/v1/flights/multi-city', [
            'legs' => $legs,
            'currency' => 'USD',
            'market' => 'US',
            'locale' => 'en-US'
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Skyscanner API request failed: ' . $response->body());
        }

        $data = $response->json();

        // Cache the result for 24 hours
        $itineraryId = Str::uuid();
        Cache::put("skyscanner:itinerary:{$itineraryId}", $data, now()->addHours(24));

        return [
            'itineraryId' => $itineraryId,
            'totalPrice' => $data['totalPrice'] ?? 0,
            'currency' => $data['currency'] ?? 'USD',
            'segments' => $data['segments'] ?? [],
            'validUntil' => now()->addHours(24)->toISOString()
        ];
    }

    public function getItinerary(string $itineraryId): array
    {
        $data = Cache::get("skyscanner:itinerary:{$itineraryId}");

        if (!$data) {
            throw new \Exception('Itinerary not found or expired');
        }

        return $data;
    }

    /**
     * @throws \Exception
     */
    public function refreshPrices(string $itineraryId): array
    {
        $cachedData = $this->getItinerary($itineraryId);

        if (!isset($cachedData['legs'])) {
            throw new \RuntimeException('Invalid itinerary data');
        }

        // Re-search with the same legs
        return $this->searchMultiCity($cachedData['legs']);
    }
}
