import React, { useState } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, MapPin, DollarSign, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupNodeProps {
    data: {
        label: string;
        totalCost?: number;
        itemCount?: number;
        flightNodeId?: string;
        destination?: string;
    };
    selected?: boolean;
}

const GroupNode: React.FC<GroupNodeProps> = ({ data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label);

    const handleSubmit = () => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setLabel(data.label);
            setIsEditing(false);
        }
    };

    return (
        <div
            className="group-node w-full h-full"
            style={{
                minWidth: '1000px',
                minHeight: '800px',
                position: 'relative'
            }}
        >
            {/* ReactFlow's built-in resizer */}
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={1000}
                minHeight={800}
                handleStyle={{
                    backgroundColor: '#3b82f6',
                    width: '16px',
                    height: '16px',
                    border: '4px solid white',
                    borderRadius: '4px',
                }}
                lineStyle={{
                    borderColor: '#3b82f6',
                    borderWidth: '3px',
                }}
            />

            <Card
                className={cn(
                    "w-full h-full bg-background/70 backdrop-blur-sm border-2 border-dashed transition-colors shadow-lg",
                    selected
                        ? "border-blue-500/80 bg-background/80"
                        : "border-blue-400/60 hover:border-blue-400/80"
                )}
            >
                <CardHeader className="pb-3 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {isEditing ? (
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onBlur={handleSubmit}
                                onKeyDown={handleKeyDown}
                                className="h-8 text-lg font-semibold border-0 px-2 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-3 flex-1">
                                <Plane className="w-6 h-6 text-blue-500" />
                                <h3
                                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => setIsEditing(true)}
                                >
                                    {data.destination ? `Trip to ${data.destination}` : data.label}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {data.itemCount !== undefined && data.itemCount > 0 && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {data.itemCount} items
                                </Badge>
                            )}
                            {data.totalCost !== undefined && data.totalCost > 0 && (
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    ${data.totalCost}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 px-6 pb-6 h-full relative">
                    <div className="text-lg text-muted-foreground text-center opacity-60 mt-20">
                        {data.itemCount === 0 || data.itemCount === undefined
                            ? "Drop hotels, activities & transport here"
                            : `${data.itemCount} items in this trip`
                        }
                    </div>

                    {/* Drop zone indicator */}
                    <div className="absolute bottom-6 right-6 text-sm text-muted-foreground opacity-50">
                        Drag & drop zone • Resize from corners
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GroupNode;
