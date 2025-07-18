import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Plus, Search, Users, Eye, Edit, Trash2, GitFork } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { format } from 'date-fns';

interface Planner {
    id: number;
    title: string;
    description?: string;
    type: 'travel' | 'event' | 'project' | 'general';
    status: 'draft' | 'active' | 'completed' | 'archived';
    is_public: boolean;
    created_at: string;
    updated_at: string;
    owner: {
        id: number;
        name: string;
        email: string;
    };
    is_owner: boolean;
    permission: 'view' | 'edit' | 'admin';
    collaborators_count: number;
    nodes_count: number;
    forks_count: number;
    is_fork: boolean;
}

interface Props {
    planners: {
        data: Planner[];
        links: any[];
        meta: any;
    };
    filters: {
        type?: string;
        status?: string;
        search?: string;
        sort_by?: string;
        sort_order?: string;
    };
    types: string[];
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Planners',
        href: '/planners',
    },
];

const statusColors = {
    draft: 'secondary',
    active: 'default',
    completed: 'outline',
    archived: 'destructive',
} as const;

const typeIcons = {
    travel: MapPin,
    event: Calendar,
    project: Users,
    general: MapPin,
};

export default function Index({ planners, filters, types, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleFilter = () => {
        router.get(route('planners.index'), {
            search: search || undefined,
            type: type === 'all' ? undefined : type,
            status: status === 'all' ? undefined : status,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, { preserveState: true, replace: true });
    };

    const handleDelete = (planner: Planner) => {
        if (confirm(`Are you sure you want to delete "${planner.title}"?`)) {
            router.delete(route('planners.destroy', planner.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Planners" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Planners</h1>
                        <p className="text-muted-foreground">
                            Manage your travel plans and projects
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('planners.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Planner
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search planners..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            className="pl-10"
                        />
                    </div>

                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                        const [newSortBy, newSortOrder] = value.split('-');
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                    }}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                            <SelectItem value="created_at-desc">Recently Created</SelectItem>
                            <SelectItem value="title-asc">Title A-Z</SelectItem>
                            <SelectItem value="title-desc">Title Z-A</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={handleFilter} variant="outline">
                        Filter
                    </Button>
                </div>

                {/* Planners Grid */}
                {planners.data.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {planners.data.map((planner) => {
                            const TypeIcon = typeIcons[planner.type];
                            return (
                                <Card key={planner.id} className="group hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="outline" className="text-xs">
                                                        {planner.type}
                                                    </Badge>
                                                    {planner.is_fork && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <GitFork className="h-3 w-3 mr-1" />
                                                            Fork
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-lg truncate">
                                                    {planner.title}
                                                </CardTitle>
                                                {planner.description && (
                                                    <CardDescription className="mt-1 line-clamp-2">
                                                        {planner.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge variant={statusColors[planner.status]}>
                                                {planner.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Owner info (if not owner) */}
                                        {!planner.is_owner && (
                                            <div className="text-sm text-muted-foreground">
                                                by {planner.owner.name}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                <span>{planner.nodes_count} nodes</span>
                                            </div>
                                            {planner.collaborators_count > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    <span>{planner.collaborators_count}</span>
                                                </div>
                                            )}
                                            {planner.forks_count > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <GitFork className="h-4 w-4" />
                                                    <span>{planner.forks_count}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Updated date */}
                                        <div className="text-xs text-muted-foreground">
                                            Updated {format(new Date(planner.updated_at), 'MMM d, yyyy')}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <Button size="sm" variant="outline" asChild className="flex-1">
                                                <Link href={route('planners.show', planner.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>

                                            {(planner.permission === 'edit' || planner.permission === 'admin') && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={route('planners.edit', planner.id)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}

                                            {planner.is_owner && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(planner)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">
                            No planners found
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            {filters.search || (filters.status && filters.status !== 'all') || (filters.type && filters.type !== 'all')
                                ? 'Try adjusting your filters or search terms.'
                                : 'Get started by creating your first planner.'
                            }
                        </p>
                        {!filters.search && (!filters.status || filters.status === 'all') && (!filters.type || filters.type === 'all') && (
                            <Button asChild className="mt-4">
                                <Link href={route('planners.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Planner
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
