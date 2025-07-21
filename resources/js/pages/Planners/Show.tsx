import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share, Users, Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Flow } from '@/shared/ui/flow/Flow';

interface PlannerData {
    id: number;
    title: string;
    description?: string;
    type: 'travel' | 'event' | 'project' | 'general';
    status: 'draft' | 'active' | 'completed' | 'archived';
    is_public: boolean;
    starts_at?: string;
    ends_at?: string;
    created_at: string;
    updated_at: string;
    owner: {
        id: number;
        name: string;
        email: string;
    };
    is_owner: boolean;
    permission: 'none' | 'view' | 'edit' | 'owner'; // Updated to match your PHP model
    nodes: any[];
    edges: any[];
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
}

interface Collaborator {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    permission: 'view' | 'edit' | 'admin';
    invited_by: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props {
    planner: PlannerData;
    collaborators: Collaborator[];
}

const statusColors = {
    draft: 'secondary',
    active: 'default',
    completed: 'outline',
    archived: 'destructive',
} as const;

export default function Show({ planner, collaborators }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Planners',
            href: '/planners',
        },
        {
            title: planner.title,
            href: `/planners/${planner.id}`,
        },
    ];

    // Flow configuration based on planner type and permissions
    const flowConfig = useMemo(() => ({
        showMiniMap: false,
        showControls: true,
        showBackground: true,
        showToolbar: true,
        height: 'calc(100vh - 200px)',
        // Flow editing permissions - owner and edit permission can edit
        allowNodeCreation: planner.permission === 'owner' || planner.permission === 'edit',
        allowNodeEditing: planner.permission === 'owner' || planner.permission === 'edit',
        allowUndo: planner.permission === 'owner' || planner.permission === 'edit',
        enableDragAndDrop: true,
        fitView: true,
        defaultViewport: planner.viewport || { x: 0, y: 0, zoom: 1 },
    }), [planner.permission, planner.viewport]);

    // Permission checks
    const canEditFlow = planner.permission === 'owner' || planner.permission === 'edit';
    const canEditPlannerSettings = planner.permission === 'owner'; // Only owner can change planner settings
    const canShare = planner.is_public || planner.permission === 'owner';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={planner.title} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('planners.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight truncate">
                                    {planner.title}
                                </h1>
                                <Badge variant={statusColors[planner.status]}>
                                    {planner.status}
                                </Badge>
                                {planner.is_public && (
                                    <Badge variant="outline">Public</Badge>
                                )}
                                {planner.permission === 'owner' && (
                                    <Badge variant="default">Owner</Badge>
                                )}
                            </div>
                            {planner.description && (
                                <p className="text-muted-foreground text-sm line-clamp-1">
                                    {planner.description}
                                </p>
                            )}
                            {planner.permission !== 'owner' && (
                                <p className="text-xs text-muted-foreground">
                                    by {planner.owner.name} • {planner.permission} access
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {collaborators.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{collaborators.length}</span>
                            </div>
                        )}

                        {canShare && (
                            <Button variant="outline" size="sm">
                                <Share className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        )}

                        {/* Only owner can access planner settings */}
                        {canEditPlannerSettings && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('planners.edit', planner.id)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Flow Canvas */}
                <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-lg shadow-sm border overflow-hidden">
                    <Flow
                        slice={planner.type}
                        configOverrides={flowConfig}
                        initialNodes={planner.nodes}
                        initialEdges={planner.edges}
                        plannerId={planner.id}
                    />
                </div>

                {/* Permission notices */}
                {!canEditFlow && (
                    <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            You have {planner.permission} access to this planner.
                            {planner.permission === 'view' && ' Contact the owner for edit permissions.'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
