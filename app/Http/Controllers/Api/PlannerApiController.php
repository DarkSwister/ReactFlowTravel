<?php
// app/Http/Controllers/Api/PlannerApiController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Planner;
use App\Models\PlannerNode;
use App\Models\PlannerEdge;
use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlannerApiController extends Controller
{
    public function show(Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $planner->toFlowData($user),
        ]);
    }

    public function saveFlow(Request $request, Planner $planner): ?\Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        dd($user);
        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'nodes' => 'array',
                'nodes.*.id' => 'required|string',
                'nodes.*.type' => 'required|string',
                'nodes.*.position' => 'required|array',
                'nodes.*.position.x' => 'required|numeric',
                'nodes.*.position.y' => 'required|numeric',
                'nodes.*.data' => 'array',
                'edges' => 'array',
                'edges.*.id' => 'required|string',
                'edges.*.source' => 'required|string',
                'edges.*.target' => 'required|string',
                'viewport' => 'array',
                'viewport.x' => 'numeric',
                'viewport.y' => 'numeric',
                'viewport.zoom' => 'numeric',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update viewport if provided
            if (isset($validated['viewport'])) {
                $planner->update(['viewport' => $validated['viewport']]);
            }

            // Sync nodes
            if (isset($validated['nodes'])) {
                $this->syncNodes($planner, $validated['nodes']);
            }

            // Sync edges
            if (isset($validated['edges'])) {
                $this->syncEdges($planner, $validated['edges']);
            }

            // Update planner's updated_at timestamp
            $planner->touch();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Flow saved successfully',
                'data' => $planner->fresh()->toFlowData($user),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to save flow',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function addNode(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'id' => 'required|string',
                'type' => 'required|string',
                'position' => 'required|array',
                'position.x' => 'required|numeric',
                'position.y' => 'required|numeric',
                'data' => 'array',
                'style' => 'array',
            ]);

            // Check if node already exists
            if ($planner->nodes()->where('node_id', $validated['id'])->exists()) {
                return response()->json([
                    'error' => 'Node already exists',
                ], 409);
            }

            $node = $planner->nodes()->create([
                'node_id' => $validated['id'],
                'type' => $validated['type'],
                'label' => $validated['data']['label'] ?? 'New Node',
                'position_x' => $validated['position']['x'],
                'position_y' => $validated['position']['y'],
                'data' => $validated['data'] ?? [],
                'style' => $validated['style'] ?? null,
                'z_index' => $validated['zIndex'] ?? 0,
                'draggable' => $validated['draggable'] ?? true,
                'selectable' => $validated['selectable'] ?? true,
                'parent_id' => $validated['parentNode'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Node added successfully',
                'data' => $node->toFlowNode(),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to add node',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateNode(Request $request, Planner $planner, $nodeId)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $node = $planner->nodes()->where('node_id', $nodeId)->first();

        if (!$node) {
            return response()->json(['error' => 'Node not found'], 404);
        }

        try {
            $validated = $request->validate([
                'type' => 'string',
                'position' => 'array',
                'position.x' => 'numeric',
                'position.y' => 'numeric',
                'data' => 'array',
                'style' => 'array',
            ]);

            $updateData = [];

            if (isset($validated['type'])) {
                $updateData['type'] = $validated['type'];
            }

            if (isset($validated['position'])) {
                $updateData['position_x'] = $validated['position']['x'];
                $updateData['position_y'] = $validated['position']['y'];
            }

            if (isset($validated['data'])) {
                $updateData['data'] = $validated['data'];
                $updateData['label'] = $validated['data']['label'] ?? $node->label;
            }

            if (isset($validated['style'])) {
                $updateData['style'] = $validated['style'];
            }

            $node->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Node updated successfully',
                'data' => $node->fresh()->toFlowNode(),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update node',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteNode(Planner $planner, $nodeId)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $node = $planner->nodes()->where('node_id', $nodeId)->first();

        if (!$node) {
            return response()->json(['error' => 'Node not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Delete connected edges
            $planner->edges()->where('source_node_id', $nodeId)
                ->orWhere('target_node_id', $nodeId)
                ->delete();

            // Delete the node
            $node->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Node deleted successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to delete node',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function addEdge(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'id' => 'required|string',
                'source' => 'required|string',
                'target' => 'required|string',
                'sourceHandle' => 'nullable|string',
                'targetHandle' => 'nullable|string',
                'type' => 'string',
                'data' => 'array',
                'style' => 'array',
                'animated' => 'boolean',
            ]);

            // Check if edge already exists
            if ($planner->edges()->where('edge_id', $validated['id'])->exists()) {
                return response()->json([
                    'error' => 'Edge already exists',
                ], 409);
            }

            // Verify source and target nodes exist
            if (!$planner->nodes()->where('node_id', $validated['source'])->exists()) {
                return response()->json([
                    'error' => 'Source node not found',
                ], 404);
            }

            if (!$planner->nodes()->where('node_id', $validated['target'])->exists()) {
                return response()->json([
                    'error' => 'Target node not found',
                ], 404);
            }

            $edge = $planner->edges()->create([
                'edge_id' => $validated['id'],
                'source_node_id' => $validated['source'],
                'target_node_id' => $validated['target'],
                'source_handle' => $validated['sourceHandle'] ?? null,
                'target_handle' => $validated['targetHandle'] ?? null,
                'type' => $validated['type'] ?? 'default',
                'data' => $validated['data'] ?? [],
                'style' => $validated['style'] ?? null,
                'animated' => $validated['animated'] ?? false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Edge added successfully',
                'data' => $edge->toFlowEdge(),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to add edge',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteEdge(Planner $planner, $edgeId)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $edge = $planner->edges()->where('edge_id', $edgeId)->first();

        if (!$edge) {
            return response()->json(['error' => 'Edge not found'], 404);
        }

        try {
            $edge->delete();

            return response()->json([
                'success' => true,
                'message' => 'Edge deleted successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete edge',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateViewport(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'x' => 'required|numeric',
                'y' => 'required|numeric',
                'zoom' => 'required|numeric|min:0.1|max:4',
            ]);

            $planner->update(['viewport' => $validated]);

            return response()->json([
                'success' => true,
                'message' => 'Viewport updated successfully',
                'data' => $validated,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update viewport',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function syncNodes(Planner $planner, array $nodes)
    {
        $nodeIds = collect($nodes)->pluck('id');

        // Delete nodes that are no longer present
        $planner->nodes()->whereNotIn('node_id', $nodeIds)->delete();

        // Update or create nodes
        foreach ($nodes as $nodeData) {
            $planner->nodes()->updateOrCreate(
                ['node_id' => $nodeData['id']],
                [
                    'type' => $nodeData['type'] ?? 'default',
                    'label' => $nodeData['data']['label'] ?? 'Untitled',
                    'position_x' => $nodeData['position']['x'] ?? 0,
                    'position_y' => $nodeData['position']['y'] ?? 0,
                    'data' => $nodeData['data'] ?? [],
                    'style' => $nodeData['style'] ?? null,
                    'z_index' => $nodeData['zIndex'] ?? 0,
                    'draggable' => $nodeData['draggable'] ?? true,
                    'selectable' => $nodeData['selectable'] ?? true,
                    'parent_id' => $nodeData['parentNode'] ?? null,
                ]
            );
        }
    }

    private function syncEdges(Planner $planner, array $edges)
    {
        $edgeIds = collect($edges)->pluck('id');

        // Delete edges that are no longer present
        $planner->edges()->whereNotIn('edge_id', $edgeIds)->delete();

        // Update or create edges
        foreach ($edges as $edgeData) {
            $planner->edges()->updateOrCreate(
                ['edge_id' => $edgeData['id']],
                [
                    'source_node_id' => $edgeData['source'],
                    'target_node_id' => $edgeData['target'],
                    'source_handle' => $edgeData['sourceHandle'] ?? null,
                    'target_handle' => $edgeData['targetHandle'] ?? null,
                    'type' => $edgeData['type'] ?? 'default',
                    'data' => $edgeData['data'] ?? [],
                    'style' => $edgeData['style'] ?? null,
                    'animated' => $edgeData['animated'] ?? false,
                ]
            );
        }
    }

    public function getStatistics(Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $stats = [
            'nodes_count' => $planner->nodes()->count(),
            'edges_count' => $planner->edges()->count(),
            'node_types' => $planner->nodes()
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type'),
            'collaborators_count' => $planner->acceptedCollaborators()->count(),
            'forks_count' => $planner->originalForks()->count(),
            'last_updated' => $planner->updated_at,
            'created_at' => $planner->created_at,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function duplicate(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
            ]);

            DB::beginTransaction();

            // Create duplicate planner
            $duplicate = Planner::create([
                'user_id' => $user->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $planner->type,
                'config' => $planner->config,
                'viewport' => $planner->viewport,
                'status' => 'draft',
                'is_public' => false,
                'starts_at' => $planner->starts_at,
                'ends_at' => $planner->ends_at,
                'metadata' => $planner->metadata,
            ]);

            // Copy nodes
            foreach ($planner->nodes as $originalNode) {
                $duplicate->nodes()->create([
                    'node_id' => $originalNode->node_id,
                    'type' => $originalNode->type,
                    'label' => $originalNode->label,
                    'position_x' => $originalNode->position_x,
                    'position_y' => $originalNode->position_y,
                    'data' => $originalNode->data,
                    'style' => $originalNode->style,
                    'z_index' => $originalNode->z_index,
                    'draggable' => $originalNode->draggable,
                    'selectable' => $originalNode->selectable,
                    'parent_id' => $originalNode->parent_id,
                ]);
            }

            // Copy edges
            foreach ($planner->edges as $originalEdge) {
                $duplicate->edges()->create([
                    'edge_id' => $originalEdge->edge_id,
                    'source_node_id' => $originalEdge->source_node_id,
                    'target_node_id' => $originalEdge->target_node_id,
                    'source_handle' => $originalEdge->source_handle,
                    'target_handle' => $originalEdge->target_handle,
                    'type' => $originalEdge->type,
                    'data' => $originalEdge->data,
                    'style' => $originalEdge->style,
                    'animated' => $originalEdge->animated,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Planner duplicated successfully',
                'data' => $duplicate->toFlowData($user),
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to duplicate planner',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function export(Planner $planner): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $exportData = [
            'planner' => $planner->only([
                'title', 'description', 'type', 'config', 'viewport',
                'starts_at', 'ends_at', 'metadata'
            ]),
            'nodes' => $planner->nodes->map->toFlowNode(),
            'edges' => $planner->edges->map->toFlowEdge(),
            'exported_at' => now(),
            'exported_by' => $user->only(['id', 'name', 'email']),
            'version' => '1.0',
        ];

        return response()->json([
            'success' => true,
            'data' => $exportData,
        ]);
    }

    public function import(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = Auth::user();

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'data' => 'required|array',
                'data.planner' => 'required|array',
                'data.nodes' => 'required|array',
                'data.edges' => 'required|array',
            ]);

            DB::beginTransaction();

            $plannerData = $validated['data']['planner'];

            // Create new planner
            $planner = Planner::create([
                'user_id' => $user->id,
                'title' => $validated['title'],
                'description' => $plannerData['description'] ?? null,
                'type' => $plannerData['type'] ?? 'general',
                'config' => $plannerData['config'] ?? [],
                'viewport' => $plannerData['viewport'] ?? null,
                'status' => 'draft',
                'is_public' => false,
                'starts_at' => $plannerData['starts_at'] ?? null,
                'ends_at' => $plannerData['ends_at'] ?? null,
                'metadata' => $plannerData['metadata'] ?? [],
            ]);

            // Import nodes
            foreach ($validated['data']['nodes'] as $nodeData) {
                $planner->nodes()->create([
                    'node_id' => $nodeData['id'],
                    'type' => $nodeData['type'] ?? 'default',
                    'label' => $nodeData['data']['label'] ?? 'Imported Node',
                    'position_x' => $nodeData['position']['x'] ?? 0,
                    'position_y' => $nodeData['position']['y'] ?? 0,
                    'data' => $nodeData['data'] ?? [],
                    'style' => $nodeData['style'] ?? null,
                    'z_index' => $nodeData['zIndex'] ?? 0,
                    'draggable' => $nodeData['draggable'] ?? true,
                    'selectable' => $nodeData['selectable'] ?? true,
                    'parent_id' => $nodeData['parentNode'] ?? null,
                ]);
            }

            // Import edges
            foreach ($validated['data']['edges'] as $edgeData) {
                $planner->edges()->create([
                    'edge_id' => $edgeData['id'],
                    'source_node_id' => $edgeData['source'],
                    'target_node_id' => $edgeData['target'],
                    'source_handle' => $edgeData['sourceHandle'] ?? null,
                    'target_handle' => $edgeData['targetHandle'] ?? null,
                    'type' => $edgeData['type'] ?? 'default',
                    'data' => $edgeData['data'] ?? [],
                    'style' => $edgeData['style'] ?? null,
                    'animated' => $edgeData['animated'] ?? false,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Planner imported successfully',
                'data' => $planner->toFlowData($user),
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to import planner',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
