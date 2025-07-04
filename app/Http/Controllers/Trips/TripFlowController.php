// app/Http/Controllers/Api/TripFlowController.php (continued)
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripFlow;
use App\Models\Trips\TripFlow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TripFlowController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tripFlows = $request->user()
            ->tripFlows()
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $tripFlows
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tripId' => 'required|string|max:255',
            'nodes' => 'required|array',
            'edges' => 'required|array',
            'enabledFlags' => 'array',
            'name' => 'string|max:255',
            'description' => 'string|max:1000'
        ]);

        $tripFlow = $request->user()->tripFlows()->create([
            'trip_id' => $validated['tripId'],
            'name' => $validated['name'] ?? 'Untitled Trip',
            'description' => $validated['description'] ?? null,
            'nodes' => $validated['nodes'],
            'edges' => $validated['edges'],
            'enabled_flags' => $validated['enabledFlags'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'data' => $tripFlow,
            'message' => 'Trip flow created successfully'
        ], 201);
    }

    public function show(TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('view', $tripFlow);

        return response()->json([
            'success' => true,
            'data' => $tripFlow
        ]);
    }

    public function update(Request $request, TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('update', $tripFlow);

        $validated = $request->validate([
            'nodes' => 'required|array',
            'edges' => 'required|array',
            'enabledFlags' => 'array'
        ]);

        $tripFlow->update([
            'nodes' => $validated['nodes'],
            'edges' => $validated['edges'],
            'enabled_flags' => $validated['enabledFlags'] ?? $tripFlow->enabled_flags,
        ]);

        return response()->json([
            'success' => true,
            'data' => $tripFlow,
            'message' => 'Trip flow updated successfully'
        ]);
    }

    public function updateMeta(Request $request, TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('update', $tripFlow);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'string|max:1000',
            'enabledFlags' => 'array'
        ]);

        $updateData = array_filter([
            'name' => $validated['name'] ?? null,
            'description' => $validated['description'] ?? null,
            'enabled_flags' => $validated['enabledFlags'] ?? null,
        ], fn($value) => $value !== null);

        $tripFlow->update($updateData);

        return response()->json([
            'success' => true,
            'data' => $tripFlow,
            'message' => 'Trip metadata updated successfully'
        ]);
    }

    public function destroy(TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('delete', $tripFlow);

        $tripFlow->delete();

        return response()->json([
            'success' => true,
            'message' => 'Trip flow deleted successfully'
        ]);
    }

    public function duplicate(Request $request, TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('view', $tripFlow);

        $validated = $request->validate([
            'name' => 'string|max:255'
        ]);

        $newTripFlow = $request->user()->tripFlows()->create([
            'trip_id' => 'trip-' . Str::random(10),
            'name' => $validated['name'] ?? $tripFlow->name . ' (Copy)',
            'description' => $tripFlow->description,
            'nodes' => $tripFlow->nodes,
            'edges' => $tripFlow->edges,
            'enabled_flags' => $tripFlow->enabled_flags,
        ]);

        return response()->json([
            'success' => true,
            'data' => $newTripFlow,
            'message' => 'Trip flow duplicated successfully'
        ], 201);
    }

    public function export(Request $request, TripFlow $tripFlow)
    {
        $this->authorize('view', $tripFlow);

        $format = $request->query('format', 'json');

        switch ($format) {
            case 'json':
                return response()->json($tripFlow->toArray());

            case 'pdf':
                return $this->exportToPdf($tripFlow);

            case 'ical':
                return $this->exportToIcal($tripFlow);

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported export format'
                ], 400);
        }
    }

    public function share(Request $request, TripFlow $tripFlow): JsonResponse
    {
        $this->authorize('update', $tripFlow);

        $validated = $request->validate([
            'shareType' => 'required|in:public,private',
            'allowEditing' => 'boolean',
            'expiresAt' => 'nullable|date|after:now'
        ]);

        $shareToken = Str::random(32);
        $expiresAt = $validated['expiresAt'] ? Carbon::parse($validated['expiresAt']) : null;

        $tripFlow->update([
            'share_token' => $shareToken,
            'share_type' => $validated['shareType'],
            'allow_editing' => $validated['allowEditing'] ?? false,
            'share_expires_at' => $expiresAt,
        ]);

        $shareUrl = url("/trip-planner/shared/{$shareToken}");

        return response()->json([
            'success' => true,
            'data' => [
                'shareUrl' => $shareUrl,
                'shareToken' => $shareToken,
                'expiresAt' => $expiresAt?->toISOString()
            ],
            'message' => 'Trip flow shared successfully'
        ]);
    }

    public function showShared(string $token): JsonResponse
    {
        $tripFlow = TripFlow::where('share_token', $token)
            ->where(function ($query) {
                $query->whereNull('share_expires_at')
                    ->orWhere('share_expires_at', '>', now());
            })
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $tripFlow,
            'isShared' => true,
            'allowEditing' => $tripFlow->allow_editing
        ]);
    }

    public function demo(): JsonResponse
    {
        $demoData = [
            'id' => 'demo-trip',
            'tripId' => 'demo-trip',
            'name' => 'Europe Adventure Demo',
            'description' => 'A sample trip showing TripFlow features',
            'nodes' => [
                [
                    'id' => 'start-1',
                    'type' => 'startFlight',
                    'position' => ['x' => 50, 'y' => 200],
                    'data' => [
                        'label' => 'Start Journey',
                        'totalTripCost' => 2450,
                        'isSystemNode' => true
                    ]
                ],
                [
                    'id' => 'flight-1',
                    'type' => 'genericFlight',
                    'position' => ['x' => 250, 'y' => 150],
                    'data' => [
                        'label' => 'NYC → London',
                        'from' => 'JFK',
                        'to' => 'LHR',
                        'date' => '2024-07-15',
                        'priceMode' => 'approx',
                        'approxCost' => 650,
                        'airline' => 'British Airways'
                    ]
                ],
                [
                    'id' => 'hotel-1',
                    'type' => 'hotel',
                    'position' => ['x' => 450, 'y' => 100],
                    'data' => [
                        'label' => 'London Hotel',
                        'hotelName' => 'Premier Inn London',
                        'rating' => 4,
                        'nights' => 3,
                        'checkIn' => '2024-07-15',
                        'checkOut' => '2024-07-18',
                        'cost' => 450
                    ]
                ],
                [
                    'id' => 'activity-1',
                    'type' => 'activity',
                    'position' => ['x' => 450, 'y' => 250],
                    'data' => [
                        'label' => 'Tower Bridge Tour',
                        'activityType' => 'sightseeing',
                        'duration' => '3 hours',
                        'cost' => 35
                    ]
                ],
                [
                    'id' => 'taxi-1',
                    'type' => 'taxi',
                    'position' => ['x' => 600, 'y' => 200],
                    'data' => [
                        'label' => 'Airport Transfer',
                        'from' => 'Hotel',
                        'to' => 'Heathrow',
                        'transportType' => 'taxi',
                        'duration' => '45 min',
                        'cost' => 65
                    ]
                ],
                [
                    'id' => 'flight-2',
                    'type' => 'genericFlight',
                    'position' => ['x' => 750, 'y' => 150],
                    'data' => [
                        'label' => 'London → Paris',
                        'from' => 'LHR',
                        'to' => 'CDG',
                        'date' => '2024-07-18',
                        'priceMode' => 'approx',
                        'approxCost' => 180,
                        'airline' => 'Air France'
                    ]
                ],
                [
                    'id' => 'note-1',
                    'type' => 'note',
                    'position' => ['x' => 900, 'y' => 100],
                    'data' => [
                        'label' => 'Travel Tips',
                        'content' => 'Remember to check passport expiry and get travel insurance!',
                        'noteType' => 'important',
                        'isImportant' => true
                    ]
                ],
                [
                    'id' => 'end-1',
                    'type' => 'endFlight',
                    'position' => ['x' => 1050, 'y' => 200],
                    'data' => [
                        'label' => 'End Journey',
                        'isSystemNode' => true
                    ]
                ]
            ],
            'edges' => [
                [
                    'id' => 'e-start-flight1',
                    'source' => 'start-1',
                    'target' => 'flight-1',
                    'animated' => true
                ],
                [
                    'id' => 'e-flight1-hotel1',
                    'source' => 'flight-1',
                    'target' => 'hotel-1',
                    'animated' => true
                ],
                [
                    'id' => 'e-hotel1-activity1',
                    'source' => 'hotel-1',
                    'target' => 'activity-1',
                    'animated' => true
                ],
                [
                    'id' => 'e-activity1-taxi1',
                    'source' => 'activity-1',
                    'target' => 'taxi-1',
                    'animated' => true
                ],
                [
                    'id' => 'e-taxi1-flight2',
                    'source' => 'taxi-1',
                    'target' => 'flight-2',
                    'animated' => true
                ],
                [
                    'id' => 'e-flight2-note1',
                    'source' => 'flight-2',
                    'target' => 'note-1',
                    'animated' => true
                ],
                [
                    'id' => 'e-note1-end',
                    'source' => 'note-1',
                    'target' => 'end-1',
                    'animated' => true
                ]
            ],
            'enabledFlags' => [],
            'createdAt' => now()->toISOString(),
            'updatedAt' => now()->toISOString()
        ];

        return response()->json([
            'success' => true,
            'data' => $demoData
        ]);
    }

    private function exportToPdf(TripFlow $tripFlow)
    {
        // This would require a PDF library like DomPDF or Snappy
        // For now, return a simple text response
        $content = "Trip: {$tripFlow->name}\n";
        $content .= "Description: {$tripFlow->description}\n\n";
        $content .= "Nodes: " . count($tripFlow->nodes) . "\n";
        $content .= "Connections: " . count($tripFlow->edges) . "\n";

        return response($content)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', 'attachment; filename="trip-' . $tripFlow->trip_id . '.txt"');
    }

    private function exportToIcal(TripFlow $tripFlow)
    {
        $ical = "BEGIN:VCALENDAR\r\n";
        $ical .= "VERSION:2.0\r\n";
        $ical .= "PRODID:-//TripFlow//Trip Planner//EN\r\n";
        $ical .= "CALSCALE:GREGORIAN\r\n";

        // Extract events from nodes
        foreach ($tripFlow->nodes as $node) {
            if (isset($node['data']['date']) && $node['data']['date']) {
                $ical .= "BEGIN:VEVENT\r\n";
                $ical .= "UID:" . $node['id'] . "@tripflow.com\r\n";
                $ical .= "DTSTART:" . date('Ymd\THis\Z', strtotime($node['data']['date'])) . "\r\n";
                $ical .= "SUMMARY:" . ($node['data']['label'] ?? 'Trip Event') . "\r\n";

                if (isset($node['data']['from'], $node['data']['to'])) {
                    $ical .= "DESCRIPTION:From: " . $node['data']['from'] . " To: " . $node['data']['to'] . "\r\n";
                }

                if (isset($node['data']['cost'])) {
                    $ical .= "DESCRIPTION:Cost: $" . $node['data']['cost'] . "\r\n";
                }

                $ical .= "END:VEVENT\r\n";
            }
        }

        $ical .= "END:VCALENDAR\r\n";

        return response($ical)
            ->header('Content-Type', 'text/calendar')
            ->header('Content-Disposition', 'attachment; filename="trip-' . $tripFlow->trip_id . '.ics"');
    }
}
