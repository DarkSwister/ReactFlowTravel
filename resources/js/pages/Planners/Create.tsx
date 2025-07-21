import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Props {
    types: Record<string, string>;
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
    {
        title: 'Create',
        href: '/planners/create',
    },
];

export default function Create({ types }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        type: 'travel',
        is_public: false,
        starts_at: '',
        ends_at: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('planners.store'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Planner" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('planners.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Planner</h1>
                        <p className="text-muted-foreground">
                            Set up a new planner to organize your project
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planner Details</CardTitle>
                            <CardDescription>
                                Provide basic information about your planner to get started.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g., Summer Europe Adventure"
                                        className={errors.title ? 'border-red-500' : ''}
                                        disabled={processing}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe your planner..."
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                        disabled={processing}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) => setData('type', value)}
                                        disabled={processing}
                                    >
                                        <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select planner type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-600">{errors.type}</p>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="starts_at">Start Date</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="starts_at"
                                                type="date"
                                                value={data.starts_at}
                                                onChange={(e) => setData('starts_at', e.target.value)}
                                                className={`pl-10 ${errors.starts_at ? 'border-red-500' : ''}`}
                                                disabled={processing}
                                            />
                                        </div>
                                        {errors.starts_at && (
                                            <p className="text-sm text-red-600">{errors.starts_at}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ends_at">End Date</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="ends_at"
                                                type="date"
                                                value={data.ends_at}
                                                onChange={(e) => setData('ends_at', e.target.value)}
                                                className={`pl-10 ${errors.ends_at ? 'border-red-500' : ''}`}
                                                disabled={processing}
                                                min={data.starts_at || undefined}
                                            />
                                        </div>
                                        {errors.ends_at && (
                                            <p className="text-sm text-red-600">{errors.ends_at}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Public checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_public"
                                        checked={data.is_public}
                                        onCheckedChange={(checked) => setData('is_public', !!checked)}
                                        disabled={processing}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor="is_public"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Make this planner public
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Public planners can be viewed by anyone with the link
                                        </p>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        disabled={processing}
                                    >
                                        <Link href={route('planners.index')}>
                                            Cancel
                                        </Link>
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Create Planner
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
