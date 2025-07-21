import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Plane, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNodeCommonLogic } from '@/shared/hooks/flow/useNodeCommonLogic.ts';
import { NodePriceSlider } from '@/shared/components/NodePriceSlider';

interface FlightNodeProps {
    id: string;
    data: {
        label: string;
        priceRange: { min: number; max: number; currency: string };
        price?: number;
        departure?: string;
        arrival?: string;
        departureDate?: string;
        timestamp?: string;
    };
    selected?: boolean;
}

const FlightNode: React.FC<FlightNodeProps> = ({ id, data, selected }) => {
    const {
        isEditingLabel,
        label,
        price,
        handleSettingsClick,
        handleLabelSubmit,
        handleLabelKeyDown,
        handleLabelClick,
        handlePriceChange,
        handleNodeClick,
        setLabel
    } = useNodeCommonLogic({
        id,
        initialLabel: data.label,
        priceRange: data.priceRange,
        initialPrice: data.price,
        modalType: 'travel:flight'
    });

    return (
        <div className="relative" style={{ width: '200px', height: '150px' }} onClick={handleNodeClick}>
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 border-2 border-white shadow-lg rounded-full"
                style={{ backgroundColor: '#3B82F6' }}
            />

            <Card
                className={cn(
                    "w-full h-full transition-all duration-200 border-blue-200",
                    selected && "ring-2 ring-blue-500 ring-offset-1"
                )}
            >
                <CardHeader className="pb-1 px-3 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-blue-600">
                            <Plane className="w-3 h-3" />
                            <span className="font-medium text-xs">Flight</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSettingsClick}
                            className="h-5 w-5 p-0"
                        >
                            <Settings className="w-2.5 h-2.5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="px-3 py-1 space-y-2">
                    {/* Label */}
                    <div className="flex items-center gap-1">
                        {isEditingLabel ? (
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onBlur={handleLabelSubmit}
                                onKeyDown={handleLabelKeyDown}
                                className="h-5 text-xs border-0 px-1 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <div
                                className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 px-1 rounded"
                                onClick={handleLabelClick}
                            >
                                <span className="text-xs font-medium truncate">{data.label}</span>
                                <Edit2 className="w-2 h-2 opacity-50" />
                            </div>
                        )}
                    </div>

                    {/* Route */}
                    {data.departure && data.arrival && (
                        <div className="text-xs text-muted-foreground truncate">
                            {data.departure} → {data.arrival}
                        </div>
                    )}

                    {/* Price Slider */}
                    <NodePriceSlider
                        price={price}
                        priceRange={data.priceRange}
                        onPriceChange={handlePriceChange}
                        step={50}
                        label="Price:"
                    />

                    {/* Date */}
                    {data.departureDate && (
                        <div className="text-xs text-muted-foreground">
                            {data.departureDate}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 border-2 border-white shadow-lg rounded-full"
                style={{ backgroundColor: '#3B82F6' }}
            />
        </div>
    );
};

export default FlightNode;
