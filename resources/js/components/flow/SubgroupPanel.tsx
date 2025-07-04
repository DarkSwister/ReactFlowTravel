import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
    ChevronDown,
    ChevronRight,
    Edit2,
    DollarSign,
    Calendar,
    MapPin,
    Plane,
    Hotel,
    Activity,
    Car
} from 'lucide-react';
import { format } from 'date-fns';
import { Subgroup } from '@/utils/tripUtils';

interface SubgroupPanelProps {
    subgroup: Subgroup;
    onNameChange: (subgroupId: string, newName: string) => void;
    onToggle: (subgroupId: string) => void;
}

const SubgroupPanel: React.FC<SubgroupPanelProps> = ({
                                                         subgroup,
                                                         onNameChange,
                                                         onToggle
                                                     }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(subgroup.name);

    const handleNameSubmit = () => {
        onNameChange(subgroup.id, editName);
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setEditName(subgroup.name);
            setIsEditing(false);
        }
    };

    const getNodeIcon = (nodeType: string, bookingType?: string) => {
        switch (nodeType) {
            case 'flight':
                return <Plane className="w-3 h-3 text-blue-500" />;
            case 'booking':
                switch (bookingType) {
                    case 'hotel':
                        return <Hotel className="w-3 h-3 text-green-500" />;
                    case 'activity':
                        return <Activity className="w-3 h-3 text-purple-500" />;
                    case 'transport':
                        return <Car className="w-3 h-3 text-orange-500" />;
                    default:
                        return <MapPin className="w-3 h-3 text-gray-500" />;
                }
            default:
                return <MapPin className="w-3 h-3 text-gray-500" />;
        }
    };

    const getDateRange = () => {
        if (subgroup.nodes.length === 0) return null;

        const dates = subgroup.nodes
            .filter(node => node.data.dateRange)
            .map(node => ({
                start: new Date(node.data.dateRange.start),
                end: new Date(node.data.dateRange.end)
            }));

        if (dates.length === 0) return null;

        const earliestStart = new Date(Math.min(...dates.map(d => d.start.getTime())));
        const latestEnd = new Date(Math.max(...dates.map(d => d.end.getTime())));

        return { start: earliestStart, end: latestEnd };
    };

    const dateRange = getDateRange();

    return (
        <Card className="mb-3 transition-all duration-200 hover:shadow-md" style={{ borderColor: subgroup.color }}>
            <Collapsible open={!subgroup.isCollapsed} onOpenChange={() => onToggle(subgroup.id)}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            {isEditing ? (
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={handleNameSubmit}
                                    onKeyDown={handleKeyPress}
                                    className="h-7 text-sm font-semibold border-0 px-0 focus-visible:ring-0"
                                    style={{ color: subgroup.color }}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center gap-2 flex-1">
                                    <h4
                                        className="font-semibold text-sm cursor-pointer flex-1 hover:opacity-80 transition-opacity"
                                        style={{ color: subgroup.color }}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {subgroup.name}
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {subgroup.nodes.length} item{subgroup.nodes.length !== 1 ? 's' : ''}
                            </Badge>

                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {subgroup.isCollapsed ? (
                                        <ChevronRight className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>

                    {/* Summary Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Est: ${subgroup.totalEstimatedCost || 0}</span>
                            </div>

                            {dateRange && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                    {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {subgroup.nodes.length === 0 ? (
                                <div className="text-xs text-muted-foreground italic text-center py-4">
                                    No items in this group yet
                                </div>
                            ) : (
                                subgroup.nodes.map((node, index) => (
                                    <div key={node.id}>
                                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2 flex-1">
                                                {getNodeIcon(node.type, node.data.bookingType)}
                                                <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                        {node.data.label}
                                                    </div>
                                                    {node.data.from && node.data.to && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {node.data.from} → {node.data.to}
                                                        </div>
                                                    )}
                                                    {node.data.dateRange && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(node.data.dateRange.start), 'MMM dd')} - {format(new Date(node.data.dateRange.end), 'MMM dd')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {node.data.estimatedPrice && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        ${node.data.estimatedPrice}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {index < subgroup.nodes.length - 1 && (
                                            <Separator className="my-1" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

export default SubgroupPanel;
