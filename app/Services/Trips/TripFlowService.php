<?php
// app/Services/TripFlowService.php
namespace App\Services\Trips;

use App\DTO\Trips\TripFlowDTO;
use App\Models\Trips\Trip;
use App\Models\Trips\TripFlow;
use Illuminate\Support\Str;

class TripFlowService
{
    public function load(string $tripId, ?int $userId = null): TripFlowDTO
    {
        $trip = Trip::with('flow')->findOrFail($tripId);

        // Check ownership for non-anonymous trips
        if ($trip->user_id && $trip->user_id !== $userId) {
            throw new \Exception('Unauthorized access to trip');
        }

        $flowData = $trip->flow?->flow_data ?? $this->getDefaultFlow($tripId);
        $enabledFlags = $this->getEnabledFlags($userId);

        return new TripFlowDTO(
            tripId: $tripId,
            nodes: $flowData['nodes'] ?? [],
            edges: $flowData['edges'] ?? [],
            enabledFlags: $enabledFlags,
            userId: $userId ? (string)$userId : null
        );
    }

    public function store(string $tripId, array $flowData, ?int $userId = null): void
    {
        $trip = Trip::findOrFail($tripId);

        // Check ownership
        if ($trip->user_id && $trip->user_id !== $userId) {
            throw new \Exception('Unauthorized access to trip');
        }

        TripFlow::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'flow_data' => $flowData,
                'last_saved_at' => now()
            ]
        );
    }

    public function createAnonymousTrip(string $name = 'Untitled Trip'): Trip
    {
        return Trip::create([
            'name' => $name,
            'user_id' => null,
            'status' => 'draft'
        ]);
    }

    private function getDefaultFlow(string $tripId): array
    {
        return [
            'nodes' => [
                [
                    'id' => 'SF-' . Str::random(8),
                    'type' => 'startFlight',
                    'position' => ['x' => 0, 'y' => 100],
                    'data' => ['label' => 'Start Journey', 'cost' => 0],
                    'draggable' => false
                ],
                [
                    'id' => 'EF-' . Str::random(8),
                    'type' => 'endFlight',
                    'position' => ['x' => 800, 'y' => 100],
                    'data' => ['label' => 'End Journey', 'cost' => 0],
                    'draggable' => false
                ]
            ],
            'edges' => [
                [
                    'id' => 'e-default',
                    'source' => 'SF-' . Str::random(8),
                    'target' => 'EF-' . Str::random(8)
                ]
            ]
        ];
    }

    private function getEnabledFlags(?int $userId): array
    {
        $baseFlags = ['basic', 'flight', 'hotel', 'activity'];

        if (!$userId) {
            // Anonymous users get limited features
            return [...$baseFlags, 'anonymous'];
        }

        // Authenticated users get full features
        return [...$baseFlags, 'skyscanner', 'realtime_pricing', 'multi_city'];
    }
}
