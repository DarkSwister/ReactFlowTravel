<?php
// routes/api.php (optimized for Laravel 12)

use App\Http\Controllers\Api\PlannerApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| Planner API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'throttle:planner-operations'])
    ->prefix('planners')
    ->name('api.planners.')
    ->group(function () {

        // View access routes
        Route::middleware('planner.access:view')->group(function () {
            Route::get('{planner}', [PlannerApiController::class, 'show'])->name('show');
            Route::get('{planner}/statistics', [PlannerApiController::class, 'getStatistics'])->name('statistics');
            Route::get('{planner}/export', [PlannerApiController::class, 'export'])->name('export');
            Route::post('{planner}/duplicate', [PlannerApiController::class, 'duplicate'])->name('duplicate');
        });

        // Edit access routes
        Route::middleware('planner.access:edit')->group(function () {
            Route::post('{planner}/save-flow', [PlannerApiController::class, 'saveFlow'])->name('save-flow');
            Route::patch('{planner}/viewport', [PlannerApiController::class, 'updateViewport'])->name('viewport.update');

            // Node operations
            Route::controller(PlannerApiController::class)
                ->prefix('{planner}/nodes')
                ->name('nodes.')
                ->group(function () {
                    Route::post('/', 'addNode')->name('store');
                    Route::patch('{nodeId}', 'updateNode')->name('update');
                    Route::delete('{nodeId}', 'deleteNode')->name('destroy');
                });

            // Edge operations
            Route::controller(PlannerApiController::class)
                ->prefix('{planner}/edges')
                ->name('edges.')
                ->group(function () {
                    Route::post('/', 'addEdge')->name('store');
                    Route::delete('{edgeId}', 'deleteEdge')->name('destroy');
                });
        });

        // Import (no planner access needed)
        Route::post('import', [PlannerApiController::class, 'import'])->name('import');
    });

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('throttle:public-planners')
    ->prefix('public/planners')
    ->name('api.public.planners.')
    ->controller(PlannerApiController::class)
    ->group(function () {
        Route::get('{planner}', 'show')->name('show');
        Route::get('{planner}/statistics', 'getStatistics')->name('statistics');
    });
