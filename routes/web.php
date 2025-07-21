<?php

use App\Http\Controllers\PlannerCollaborationController;
use App\Http\Controllers\PlannerController;
use App\Http\Controllers\PlannerForkController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


Route::middleware(['auth', 'verified'])->group(function () {

    // Main planner CRUD routes
    Route::resource('planners', PlannerController::class);

    // Additional planner routes
    Route::post('planners/{planner}/save-flow', [PlannerController::class, 'saveFlow'])
        ->name('planners.save-flow');

    /*
    |--------------------------------------------------------------------------
    | Collaboration Routes
    |--------------------------------------------------------------------------
    */

    // Planner collaboration management
    Route::prefix('planners/{planner}/collaborators')->name('planners.collaborators.')->group(function () {
        Route::get('/', [PlannerCollaborationController::class, 'index'])->name('index');
        Route::post('invite', [PlannerCollaborationController::class, 'invite'])->name('invite');
        Route::patch('{collaborator}/permission', [PlannerCollaborationController::class, 'updatePermission'])->name('update-permission');
        Route::delete('{collaborator}', [PlannerCollaborationController::class, 'remove'])->name('remove');
    });

    // User's invitations
    Route::get('my-invitations', [PlannerCollaborationController::class, 'myInvitations'])
        ->name('invitations.my');

    /*
    |--------------------------------------------------------------------------
    | Fork Routes
    |--------------------------------------------------------------------------
    */

    // Fork management
    Route::prefix('forks')->name('forks.')->group(function () {
        Route::get('/', [PlannerForkController::class, 'index'])->name('index');
        Route::get('{fork}', [PlannerForkController::class, 'show'])->name('show');
        Route::patch('{fork}', [PlannerForkController::class, 'update'])->name('update');
        Route::delete('{fork}', [PlannerForkController::class, 'destroy'])->name('destroy');
        Route::get('{fork}/compare', [PlannerForkController::class, 'compare'])->name('compare');
    });

    // Fork creation
    Route::prefix('planners/{planner}/fork')->name('planners.fork.')->group(function () {
        Route::get('/', [PlannerForkController::class, 'create'])->name('create');
        Route::post('/', [PlannerForkController::class, 'store'])->name('store');
    });

    // Planner's forks
    Route::get('planners/{planner}/forks', [PlannerForkController::class, 'plannerForks'])
        ->name('planners.forks');

    // Fork statistics API
    Route::get('planners/{planner}/fork-statistics', [PlannerForkController::class, 'statistics'])
        ->name('planners.fork-statistics');
});

/*
|--------------------------------------------------------------------------
| Public Invitation Routes (no auth required)
|--------------------------------------------------------------------------
*/

// Invitation acceptance routes (accessible without login for email links)
Route::prefix('invitations')->name('invitations.')->group(function () {
    Route::get('{token}', [PlannerCollaborationController::class, 'acceptInvitation'])
        ->name('accept');
    Route::post('{token}', [PlannerCollaborationController::class, 'processAcceptance'])
        ->name('process');
    Route::post('{token}/decline', [PlannerCollaborationController::class, 'declineInvitation'])
        ->name('decline');
});

/*
|--------------------------------------------------------------------------
| Public Planner Routes
|--------------------------------------------------------------------------
*/

// Public planner viewing (no auth required)
Route::get('public/planners/{planner}', [PlannerController::class, 'show'])
    ->name('public.planners.show')
    ->middleware('throttle:60,1');


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
