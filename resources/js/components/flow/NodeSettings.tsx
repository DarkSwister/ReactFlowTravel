import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface NodeSettingsProps {
    // Price settings
    priceRange: number[];
    estimatedPrice: number;
    maxPrice: number;
    minPrice?: number;
    currency?: string;
    onPriceRangeChange: (values: number[]) => void;
    onEstimatedPriceChange: (value: string) => void;

    // Date settings
    startDate: Date;
    endDate: Date;
    onDateChange: (start: Date, end: Date) => void;
    startDateLabel?: string;
    endDateLabel?: string;

    // Optional booking type (for booking nodes)
    bookingType?: string;
    onBookingTypeChange?: (type: string) => void;
    showBookingType?: boolean;
}

const NodeSettings: React.FC<NodeSettingsProps> = ({
                                                       priceRange,
                                                       estimatedPrice,
                                                       maxPrice,
                                                       minPrice = 10,
                                                       currency = 'USD',
                                                       onPriceRangeChange,
                                                       onEstimatedPriceChange,
                                                       startDate,
                                                       endDate,
                                                       onDateChange,
                                                       startDateLabel = 'Start Date',
                                                       endDateLabel = 'End Date',
                                                       bookingType,
                                                       onBookingTypeChange,
                                                       showBookingType = false
                                                   }) => {
    return (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-4">
            {/* Booking Type Selector (if applicable) */}
            {showBookingType && bookingType && onBookingTypeChange && (
                <div className="space-y-2">
                    <Label className="text-xs">Booking Type</Label>
                    <Select value={bookingType} onValueChange={onBookingTypeChange}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hotel">Hotel</SelectItem>
                            <SelectItem value="activity">Activity</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Price Range Slider */}
            <div className="space-y-2">
                <Label className="text-xs">Price Range</Label>
                <Slider
                    value={priceRange}
                    onValueChange={onPriceRangeChange}
                    max={maxPrice}
                    min={minPrice}
                    step={Math.max(1, Math.floor(maxPrice / 100))}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0]} {currency}</span>
                    <span>${priceRange[1]} {currency}</span>
                </div>
            </div>

            {/* Estimated Price Input */}
            <div className="space-y-2">
                <Label htmlFor="estimated-price" className="text-xs">
                    Estimated Price
                </Label>
                <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
                    <Input
                        id="estimated-price"
                        type="number"
                        value={estimatedPrice}
                        onChange={(e) => onEstimatedPriceChange(e.target.value)}
                        className="h-8 text-xs pl-6"
                        min={priceRange[0]}
                        max={priceRange[1]}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
            {currency}
          </span>
                </div>
            </div>

            {/* Date Range Pickers */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs">{startDateLabel}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-8 text-xs justify-start font-normal w-full"
                            >
                                <CalendarIcon className="mr-1 h-3 w-3" />
                                {format(startDate, 'MMM dd')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => date && onDateChange(date, endDate)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">{endDateLabel}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-8 text-xs justify-start font-normal w-full"
                            >
                                <CalendarIcon className="mr-1 h-3 w-3" />
                                {format(endDate, 'MMM dd')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) => date && onDateChange(startDate, date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
};

export default NodeSettings;
