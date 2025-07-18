<?php
// app/Http/Controllers/PlannerCollaborationController.php

namespace App\Http\Controllers;

use App\Models\Planner;
use App\Models\PlannerCollaborator;
use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlannerCollaborationController extends Controller
{
    public function index(Request $request, Planner $planner): \Inertia\Response
    {
        $user = $request->user();

        if (!$planner->canEdit($user)) {
            abort(403, 'You do not have permission to manage collaborators.');
        }

        $collaborators = $planner->collaborators()
            ->with(['user', 'invitedBy'])
            ->orderBy('status')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Planners/Collaborators/Index', [
            'planner' => $planner->only(['id', 'title', 'description']),
            'collaborators' => $collaborators->map->toArray(),
            'can_invite' => $planner->user_id === $user->id, // Only owner can invite
        ]);
    }

    public function invite(Request $request, Planner $planner): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        // Only owner can invite collaborators
        if ($planner->user_id !== $user->id) {
            abort(403, 'Only the owner can invite collaborators.');
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'permission' => 'required|in:view,edit',
            'message' => 'nullable|string|max:500',
        ]);

        $invitedUser = User::where('email', $validated['email'])->first();

        // Check if user is trying to invite themselves
        if ($invitedUser->id === $user->id) {
            return back()->withErrors(['email' => 'You cannot invite yourself.']);
        }

        // Check if user is already a collaborator
        $existingCollaborator = $planner->collaborators()
            ->where('user_id', $invitedUser->id)
            ->first();

        if ($existingCollaborator) {
            if ($existingCollaborator->status === 'accepted') {
                return back()->withErrors(['email' => 'This user is already a collaborator.']);
            }

            if ($existingCollaborator->status === 'pending') {
                return back()->withErrors(['email' => 'An invitation is already pending for this user.']);
            }

// If declined, we can resend
            $existingCollaborator->update([
                'status' => 'pending',
                'permission' => $validated['permission'],
                'invited_at' => now(),
                'responded_at' => null,
            ]);

            // Send invitation email
            $this->sendInvitationEmail($existingCollaborator, $validated['message'] ?? null);

            return back()->with('success', 'Invitation resent successfully!');
        }

        // Create new invitation
        $collaborator = PlannerCollaborator::create([
            'planner_id' => $planner->id,
            'user_id' => $invitedUser->id,
            'invited_by' => $user->id,
            'permission' => $validated['permission'],
            'status' => 'pending',
        ]);

        // Send invitation email
        $this->sendInvitationEmail($collaborator, $validated['message'] ?? null);

        return back()->with('success', 'Invitation sent successfully!');
    }

    public function updatePermission(Request $request, Planner $planner, PlannerCollaborator $collaborator)
    {
        $user = Auth::user();

        // Only owner can update permissions
        if ($planner->user_id !== $user->id) {
            abort(403, 'Only the owner can update permissions.');
        }

        // Verify collaborator belongs to this planner
        if ($collaborator->planner_id !== $planner->id) {
            abort(404);
        }

        $validated = $request->validate([
            'permission' => 'required|in:view,edit',
        ]);

        $collaborator->update(['permission' => $validated['permission']]);

        return back()->with('success', 'Permission updated successfully!');
    }

    public function remove(Planner $planner, PlannerCollaborator $collaborator)
    {
        $user = Auth::user();

        // Owner can remove anyone, collaborators can remove themselves
        if ($planner->user_id !== $user->id && $collaborator->user_id !== $user->id) {
            abort(403, 'You do not have permission to remove this collaborator.');
        }

        // Verify collaborator belongs to this planner
        if ($collaborator->planner_id !== $planner->id) {
            abort(404);
        }

        $collaborator->delete();

        $message = $collaborator->user_id === $user->id
            ? 'You have left the planner successfully.'
            : 'Collaborator removed successfully!';

        return back()->with('success', $message);
    }

    public function acceptInvitation($token)
    {
        $collaborator = PlannerCollaborator::where('invitation_token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$collaborator || !$collaborator->isValid()) {
            return Inertia::render('Invitations/Invalid', [
                'message' => 'This invitation is invalid or has expired.',
            ]);
        }

        $user = Auth::user();

        // Check if the logged-in user is the invited user
        if (!$user || $user->id !== $collaborator->user_id) {
            return Inertia::render('Invitations/Unauthorized', [
                'message' => 'You are not authorized to accept this invitation.',
                'invited_email' => $collaborator->user->email,
            ]);
        }

        return Inertia::render('Invitations/Accept', [
            'collaborator' => [
                'id' => $collaborator->id,
                'planner' => $collaborator->planner->only(['id', 'title', 'description', 'type']),
                'invited_by' => $collaborator->invitedBy->only(['id', 'name', 'email']),
                'permission' => $collaborator->permission,
                'invited_at' => $collaborator->invited_at,
            ],
        ]);
    }

    public function processAcceptance(Request $request, $token)
    {
        $collaborator = PlannerCollaborator::where('invitation_token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$collaborator || !$collaborator->isValid()) {
            return redirect()->route('planners.index')
                ->withErrors(['error' => 'This invitation is invalid or has expired.']);
        }

        $user = Auth::user();

        if (!$user || $user->id !== $collaborator->user_id) {
            return redirect()->route('planners.index')
                ->withErrors(['error' => 'You are not authorized to accept this invitation.']);
        }

        $action = $request->input('action');

        if ($action === 'accept') {
            $collaborator->accept();

            return redirect()->route('planners.show', $collaborator->planner)
                ->with('success', 'Invitation accepted! You can now collaborate on this planner.');
        }

        if ($action === 'decline') {
            $collaborator->decline();

            return redirect()->route('planners.index')
                ->with('info', 'Invitation declined.');
        }

        return redirect()->route('planners.index')
            ->withErrors(['error' => 'Invalid action.']);
    }

    public function declineInvitation($token)
    {
        $collaborator = PlannerCollaborator::where('invitation_token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$collaborator) {
            return redirect()->route('planners.index')
                ->withErrors(['error' => 'This invitation is invalid.']);
        }

        $collaborator->decline();

        return redirect()->route('planners.index')
            ->with('info', 'Invitation declined.');
    }

    public function myInvitations()
    {
        $user = Auth::user();

        $invitations = PlannerCollaborator::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with(['planner.user', 'invitedBy'])
            ->orderBy('invited_at', 'desc')
            ->get();

        return Inertia::render('Invitations/MyInvitations', [
            'invitations' => $invitations->map(function ($collaborator) {
                return [
                    'id' => $collaborator->id,
                    'token' => $collaborator->invitation_token,
                    'planner' => $collaborator->planner->only(['id', 'title', 'description', 'type']),
                    'owner' => $collaborator->planner->user->only(['id', 'name', 'email']),
                    'invited_by' => $collaborator->invitedBy->only(['id', 'name', 'email']),
                    'permission' => $collaborator->permission,
                    'invited_at' => $collaborator->invited_at,
                    'is_valid' => $collaborator->isValid(),
                ];
            }),
        ]);
    }

    private function sendInvitationEmail(PlannerCollaborator $collaborator, ?string $message = null): void
    {
        // TODO: Implement email sending
        // Mail::to($collaborator->user->email)->send(new PlannerInvitation($collaborator, $message));
    }
}
