<?php
// app/Http/Controllers/PlannerForkController.php

namespace App\Http\Controllers;

use App\Models\Planner;
use App\Models\PlannerFork;
use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PlannerForkController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $user = Auth::user();

        $query = PlannerFork::with(['originalPlanner.user', 'forkedPlanner', 'forkedBy'])
            ->where('forked_by', $user->id);

        // Apply filters
        if ($request->filled('type')) {
            $query->whereHas('originalPlanner', function ($q) use ($request) {
                $q->where('type', $request->type);
            });
        }

        if ($request->filled('modified')) {
            if ($request->modified === 'yes') {
                $query->modified();
            } elseif ($request->modified === 'no') {
                $query->whereDoesntHave('forkedPlanner', function ($q) {
                    $q->whereColumn('updated_at', '>', 'planner_forks.forked_at');
                });
            }
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'forked_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $forks = $query->paginate(12);

        // Transform forks for frontend
        $forks->getCollection()->transform(function ($fork) {
            return $fork->toArray();
        });

        return Inertia::render('Planners/Forks/Index', [
            'forks' => $forks,
            'filters' => $request->only(['type', 'modified', 'sort_by', 'sort_order']),
            'types' => ['travel', 'event', 'project', 'general'],
        ]);
    }

    public function show(PlannerFork $fork): \Inertia\Response
    {
        $user = Auth::user();

        // Check if user can view this fork
        if ($fork->forked_by !== $user->id &&
            !$fork->originalPlanner->canView($user) &&
            !$fork->forkedPlanner->canView($user)) {
            abort(403, 'You do not have permission to view this fork.');
        }

        $fork->load(['originalPlanner.user', 'forkedPlanner.user', 'forkedBy']);

        return Inertia::render('Planners/Forks/Show', [
            'fork' => $fork->toArray(),
            'can_edit_original' => $fork->originalPlanner->canEdit($user),
            'can_edit_forked' => $fork->forkedPlanner->canEdit($user),
        ]);
    }

    public function create(Request $request, Planner $planner)
    {
        $user = $request->user();

        // Check if user can view the original planner
        if (!$planner->canView($user)) {
            abort(403, 'You do not have permission to fork this planner.');
        }

        // Check if user is trying to fork their own planner
        if ($planner->user_id === $user->id) {
            return back()->withErrors(['error' => 'You cannot fork your own planner.']);
        }

        return Inertia::render('Planners/Forks/Create', [
            'original_planner' => [
                'id' => $planner->id,
                'title' => $planner->title,
                'description' => $planner->description,
                'type' => $planner->type,
                'owner' => $planner->user->only(['id', 'name', 'email']),
                'nodes_count' => $planner->nodes()->count(),
                'edges_count' => $planner->edges()->count(),
                'created_at' => $planner->created_at,
                'updated_at' => $planner->updated_at,
            ],
        ]);
    }

    public function store(Request $request, Planner $originalPlanner): ?\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        // Check if user can view the original planner
        if (!$originalPlanner->canView($user)) {
            abort(403, 'You do not have permission to fork this planner.');
        }

        // Check if user is trying to fork their own planner
        if ($originalPlanner->user_id === $user->id) {
            return back()->withErrors(['error' => 'You cannot fork your own planner.']);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            // Create the forked planner
            $forkedPlanner = Planner::create([
                'user_id' => $user->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'type' => $originalPlanner->type,
                'config' => $originalPlanner->config,
                'viewport' => $originalPlanner->viewport,
                'status' => 'draft',
                'is_public' => $validated['is_public'] ?? false,
                'starts_at' => $originalPlanner->starts_at,
                'ends_at' => $originalPlanner->ends_at,
                'metadata' => $originalPlanner->metadata,
            ]);

            // Copy nodes
            foreach ($originalPlanner->nodes as $originalNode) {
                $forkedPlanner->nodes()->create([
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
            foreach ($originalPlanner->edges as $originalEdge) {
                $forkedPlanner->edges()->create([
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

            // Create fork relationship
            $fork = PlannerFork::create([
                'original_planner_id' => $originalPlanner->id,
                'forked_planner_id' => $forkedPlanner->id,
                'forked_by' => $user->id,
                'fork_metadata' => [
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'],
                    'original_nodes_count' => $originalPlanner->nodes()->count(),
                    'original_edges_count' => $originalPlanner->edges()->count(),
                ],
            ]);

            DB::commit();

            return redirect()->route('planners.show', $forkedPlanner)
                ->with('success', 'Planner forked successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to fork planner. Please try again.']);
        }
    }

    public function update(Request $request, PlannerFork $fork): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        // Only the person who created the fork can update it
        if ($fork->forked_by !== $user->id) {
            abort(403, 'You do not have permission to update this fork.');
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $metadata = $fork->fork_metadata ?? [];
        $metadata['reason'] = $validated['reason'];
        $metadata['notes'] = $validated['notes'];

        $fork->update(['fork_metadata' => $metadata]);

        return back()->with('success', 'Fork details updated successfully!');
    }

    public function destroy(Request $request, PlannerFork $fork)
    {
        $user = $request->user();

        // Only the person who created the fork can delete it
        if ($fork->forked_by !== $user->id) {
            abort(403, 'You do not have permission to delete this fork.');
        }

        // Note: This only deletes the fork relationship, not the forked planner
        $fork->delete();

        return redirect()->route('forks.index')
            ->with('success', 'Fork relationship removed successfully!');
    }

    public function compare(PlannerFork $fork): \Inertia\Response
    {
        $user = Auth::user();

        // Check if user can view this fork
        if ($fork->forked_by !== $user->id &&
            !$fork->originalPlanner->canView($user) &&
            !$fork->forkedPlanner->canView($user)) {
            abort(403, 'You do not have permission to view this comparison.');
        }

        $original = $fork->originalPlanner;
        $forked = $fork->forkedPlanner;

        return Inertia::render('Planners/Forks/Compare', [
            'fork' => $fork->toArray(),
            'original' => $original->toFlowData($user),
            'forked' => $forked->toFlowData($user),
            'comparison' => [
                'nodes_diff' => $forked->nodes()->count() - $original->nodes()->count(),
                'edges_diff' => $forked->edges()->count() - $original->edges()->count(),
                'last_modified' => $forked->updated_at,
                'days_since_fork' => $fork->getAgeInDays(),
                'has_changes' => $fork->hasBeenModified(),
            ],
        ]);
    }

    // Get forks of a specific planner
    public function plannerForks(Planner $planner)
    {
        $user = Auth::user();

        // Check if user can view the planner
        if (!$planner->canView($user)) {
            abort(403, 'You do not have permission to view this planner\'s forks.');
        }

        $forks = PlannerFork::where('original_planner_id', $planner->id)
            ->with(['forkedPlanner.user', 'forkedBy'])
            ->active()
            ->orderBy('forked_at', 'desc')
            ->paginate(12);

        return Inertia::render('Planners/Forks/PlannerForks', [
            'planner' => $planner->only(['id', 'title', 'description', 'type']),
            'forks' => $forks->getCollection()->map->toArray(),
            'pagination' => $forks->toArray(),
            'is_owner' => $planner->user_id === $user->id,
        ]);
    }

    // API endpoint to get fork statistics
    public function statistics(Planner $planner)
    {
        $user = Auth::user();

        if (!$planner->canView($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $forks = PlannerFork::where('original_planner_id', $planner->id)->active();

        return response()->json([
            'total_forks' => $forks->count(),
            'recent_forks' => $forks->recent(30)->count(),
            'modified_forks' => $forks->modified()->count(),
            'active_forks' => $forks->count(),
        ]);
    }
}
