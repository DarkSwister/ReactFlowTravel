import React, { useState } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, DollarSign, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/app/store/flowStore';

interface GroupNodeProps {
    id: string;
    data: {
        label: string;
        totalCost?: number;
        itemCount?: number;
        destination?: string;
    };
    selected?: boolean;
}

const GroupNode: React.FC<GroupNodeProps> = ({ id, data, selected }) => {
    const { updateNodeData } = useFlowStore();
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label);

    const handleSubmit = () => {
        updateNodeData(id, { label });
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
                minWidth: '400px',
                minHeight: '300px',
                position: 'relative'
            }}
        >
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={400}
                minHeight={300}
                handleStyle={{
                    backgroundColor: '#3b82f6',
                    width: '12px',
                    height: '12px',
                    border: '3px solid white',
                    borderRadius: '3px',
                }}
                lineStyle={{
                    borderColor: '#3b82f6',
                    borderWidth: '2px',
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
                <CardHeader className="pb-3 px-4 py-3">
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
                                <Plane className="w-5 h-5 text-blue-500" />
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

                <CardContent className="pt-0 px-4 pb-4 h-full relative">
                    <div className="text-lg text-muted-foreground text-center opacity-60 mt-16">
                        {data.itemCount === 0 || data.itemCount === undefined
                            ? "Drop flights, hotels & activities here"
                            : `${data.itemCount} items in this trip`
                        }
                    </div>

                    {/* Drop zone indicator */}
                    <div className="absolute bottom-4 right-4 text-sm text-muted-foreground opacity-50">
                        Drag & drop zone • Resize from corners
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GroupNode;
