import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import {
    BarChart3,
    DollarSign,
    Users,
    MapPin,
    X,
    TrendingUp,
    Package,
    Save
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useFlowAnalytics, getCategoryIcon, getCategoryColor } from '@/shared/hooks/flow/useFlowAnalytics.ts';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

interface FlowAnalyticsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export const FlowAnalyticsSidebar: React.FC<FlowAnalyticsSidebarProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState('overview');
    const analytics = useFlowAnalytics();

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-xl z-40 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Analytics</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-4 mx-4 space-y-4 h-full">
                        <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
                            <div className="space-y-4 pr-4 pb-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="bg-primary/5">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-primary" />
                                                <span className="text-xs text-muted-foreground">Total</span>
                                            </div>
                                            <p className="text-xl font-bold text-primary">
                                                ${analytics.totalCost.toFixed(0)}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">Items</span>
                                            </div>
                                            <p className="text-xl font-bold">
                                                {analytics.totalNodes}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Card>
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">Groups</span>
                                            </div>
                                            <p className="text-xl font-bold">
                                                {analytics.totalGroups}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">Avg/Item</span>
                                            </div>
                                            <p className="text-xl font-bold">
                                                ${analytics.totalNodes > 0 ? (analytics.totalCost / analytics.totalNodes).toFixed(0) : '0'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Categories Breakdown */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" />
                                            By Category
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {Object.entries(analytics.categories).map(([category, stats]) => (
                                            <div key={category} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{getCategoryIcon(category)}</span>
                                                        <span className="text-sm font-medium">{category}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {stats.count}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-sm font-semibold">
                                                        ${stats.total.toFixed(0)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className={cn("h-2 rounded-full", getCategoryColor(category).split(' ')[1])}
                                                        style={{
                                                            width: `${analytics.totalCost > 0 ? (stats.total / analytics.totalCost) * 100 : 0}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Ungrouped Items */}
                                {analytics.ungroupedNodes.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Ungrouped Items ({analytics.ungroupedNodes.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {analytics.ungroupedNodes.map(node => (
                                                <div key={node.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{getCategoryIcon(node.category)}</span>
                                                        <span className="truncate">{node.label}</span>
                                                    </div>
                                                    <span className="font-medium">${node.price.toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Groups Tab */}
                    <TabsContent value="groups" className="mt-4 mx-4 space-y-4 h-full">
                        <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
                            <div className="space-y-4 pr-4 pb-4">
                                {analytics.groups.length === 0 ? (
                                    <Card>
                                        <CardContent className="p-6 text-center">
                                            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No groups found</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Create a group to organize your travel items
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    analytics.groups.map(group => (
                                        <Card key={group.id}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        {group.label}
                                                    </CardTitle>
                                                    <Badge variant="secondary" className="text-xs">
                                                        ${group.totalCost.toFixed(0)}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {/* Group Summary */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Items:</span>
                                                    <span className="font-medium">{group.nodeCount}</span>
                                                </div>

                                                {/* Group Categories */}
                                                {Object.entries(group.categories).map(([category, stats]) => (
                                                    <div key={category} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>{getCategoryIcon(category)}</span>
                                                            <span>{category}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {stats.count}
                                                            </Badge>
                                                        </div>
                                                        <span className="font-medium">${stats.total.toFixed(0)}</span>
                                                    </div>
                                                ))}

                                                <Separator />

                                                {/* Group Items */}
                                                <div className="space-y-1">
                                                    {group.nodes.map(node => (
                                                        <div key={node.id} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span>{getCategoryIcon(node.category)}</span>
                                                                <span className="truncate">{node.label}</span>
                                                            </div>
                                                            <span className="font-medium">${node.price.toFixed(0)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Save Button */}
            {onSave && auth.user && (
                <div className="p-4 border-t border-border">
                    <Button
                        onClick={onSave}
                        className="w-full"
                        size="sm"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
};
