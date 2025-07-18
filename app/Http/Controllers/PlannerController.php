<?php
// app/Http/Controllers/PlannerController.php

namespace App\Http\Controllers;

use App\Models\Planner;
use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PlannerController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $user = Auth::user();

        $query = Planner::with(['user', 'acceptedCollaborators.user'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('acceptedCollaborators', function ($collab) use ($user) {
                        $collab->where('user_id', $user->id);
                    });
            });

        // Apply filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $planners = $query->paginate(12);

        // Transform planners for frontend
        $planners->getCollection()->transform(function ($planner) use ($user) {
            return [
                'id' => $planner->id,
                'title' => $planner->title,
                'description' => $planner->description,
                'type' => $planner->type,
                'status' => $planner->status,
                'is_public' => $planner->is_public,
                'created_at' => $planner->created_at,
                'updated_at' => $planner->updated_at,
                'owner' => $planner->user->only(['id', 'name', 'email']),
                'is_owner' => $planner->user_id === $user->id,
                'permission' => $planner->getUserPermission($user),
                'collaborators_count' => $planner->acceptedCollaborators->count(),
                'nodes_count' => $planner->nodes()->count(),
                'forks_count' => $planner->originalForks()->count(),
                'is_fork' => $planner->isFork(),
            ];
        });

        return Inertia::render('Planners/Index', [
            'planners' => $planners,
            'filters' => $request->only(['type', 'status', 'search', 'sort_by', 'sort_order']),
            'types' => ['travel', 'event', 'project', 'general'],
            'statuses' => ['draft', 'active', 'completed', 'archived'],
        ]);
    }

    public function create()
    {
        return Inertia::render('Planners/Create', [
            'types' => [
                'travel' => 'Travel Planning',
                'event' => 'Event Planning',
                'project' => 'Project Management',
                'general' => 'General Planning',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:travel,event,project,general',
            'is_public' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ]);

        $planner = Planner::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'is_public' => $validated['is_public'] ?? false,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
            'status' => 'draft',
        ]);

        return redirect()->route('planners.show', $planner)
            ->with('success', 'Planner created successfully!');
    }

    public function show(Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            abort(403, 'You do not have permission to view this planner.');
        }

        return Inertia::render('Planners/Show', [
            'planner' => $planner->toFlowData($user),
            'collaborators' => $planner->acceptedCollaborators()
                ->with(['user', 'invitedBy'])
                ->get()
                ->map->toArray(),
        ]);
    }

    public function edit(Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            abort(403, 'You do not have permission to edit this planner.');
        }

        return Inertia::render('Planners/Edit', [
            'planner' => $planner->only([
                'id', 'title', 'description', 'type', 'is_public',
                'starts_at', 'ends_at', 'status'
            ]),
            'types' => [
                'travel' => 'Travel Planning',
                'event' => 'Event Planning',
                'project' => 'Project Management',
                'general' => 'General Planning',
            ],
            'statuses' => ['draft', 'active', 'completed', 'archived'],
        ]);
    }

    public function update(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            abort(403, 'You do not have permission to edit this planner.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:travel,event,project,general',
            'is_public' => 'boolean',
            'status' => 'required|string|in:draft,active,completed,archived',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ]);

        $planner->update($validated);

        return redirect()->route('planners.show', $planner)
            ->with('success', 'Planner updated successfully!');
    }

    public function destroy(Planner $planner)
    {
        $user = Auth::user();

        // Only owner can delete
        if ($planner->user_id !== $user->id) {
            abort(403, 'Only the owner can delete this planner.');
        }

        $planner->delete();

        return redirect()->route('planners.index')
            ->with('success', 'Planner deleted successfully!');
    }

    // API endpoint for saving flow data
    public function saveFlow(Request $request, Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canEdit($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nodes' => 'array',
            'edges' => 'array',
            'viewport' => 'array',
        ]);

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

        return response()->json([
            'success' => true,
            'message' => 'Flow saved successfully',
            'planner' => $planner->toFlowData($user),
        ]);
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
}
