import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface NodePriceSliderProps {
    price: number;
    priceRange: { min: number; max: number; currency: string };
    onPriceChange: (values: number[]) => void;
    step?: number;
    label?: string;
}

export const NodePriceSlider: React.FC<NodePriceSliderProps> = ({
                                                                    price,
                                                                    priceRange,
                                                                    onPriceChange,
                                                                    step = 25,
                                                                    label = "Price:"
                                                                }) => {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                    ${price}
                </Badge>
            </div>
            <Slider
                value={[price]}
                onValueChange={onPriceChange}
                max={priceRange.max}
                min={priceRange.min}
                step={step}
                className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>${priceRange.min}</span>
                <span>${priceRange.max}</span>
            </div>
        </div>
    );
};
