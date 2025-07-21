<?php

namespace App\Http\Middleware;

use App\Models\Planner;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlannerAccess
{
    public function handle(Request $request, Closure $next, string $permission = 'view'): Response
    {
        $planner = $request->route('planner');

        if (!$planner instanceof Planner) {
            return response()->json(['error' => 'Planner not found'], 404);
        }

        $user = $request->user();

        if (!$user) {
            // Check if planner is public for view access
            if ($permission === 'view' && $planner->is_public) {
                return $next($request);
            }
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $canAccess = match($permission) {
            'view' => $planner->canView($user),
            'edit' => $planner->canEdit($user),
            default => false,
        };

        if (!$canAccess) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
