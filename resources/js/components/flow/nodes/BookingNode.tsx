import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Hotel, MapPin, Car, Activity, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TripNode, BookingType } from '@/utils/tripUtils.ts';
import { useNodeSettings } from '@/hooks/useNodeSettings.ts';
import NodeSettings from '../NodeSettings';

interface BookingNodeProps {
    data: TripNode['data'] & {
        subgroupColor?: string;
        bookingType?: BookingType;
        isLocked?: boolean;
    };
    selected?: boolean;
    onUpdatePricing?: (priceRange: { min: number; max: number; currency: string }, estimatedPrice: number) => void;
    onUpdateDateRange?: (dateRange: { start: Date; end: Date }) => void;
    onUpdateBookingType?: (bookingType: BookingType) => void;
    onLockToggle?: (locked: boolean) => void;
}

const BookingNode: React.FC<BookingNodeProps> = ({
                                                     data,
                                                     selected,
                                                     onUpdatePricing,
                                                     onUpdateDateRange,
                                                     onUpdateBookingType,
                                                     onLockToggle
                                                 }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [bookingType, setBookingType] = useState<BookingType>(data.bookingType || 'hotel');
    const [isLocked, setIsLocked] = useState(data.isLocked || false);

    const borderColor = data.subgroupColor || 'hsl(var(--primary))';

    const getIcon = () => {
        switch (bookingType) {
            case 'hotel': return <Hotel className="w-5 h-5" />;
            case 'activity': return <Activity className="w-5 h-5" />;
            case 'transport': return <Car className="w-5 h-5" />;
            default: return <MapPin className="w-5 h-5" />;
        }
    };

    const getMaxPrice = () => {
        switch (bookingType) {
            case 'hotel': return 1000;
            case 'activity': return 300;
            case 'transport': return 200;
            default: return 500;
        }
    };

    const getDateLabels = () => {
        switch (bookingType) {
            case 'hotel':
                return { start: 'Check-in', end: 'Check-out' };
            case 'activity':
                return { start: 'Start Date', end: 'End Date' };
            case 'transport':
                return { start: 'Departure', end: 'Return' };
            default:
                return { start: 'Start Date', end: 'End Date' };
        }
    };

    const {
        priceRange,
        estimatedPrice,
        startDate,
        endDate,
        handlePriceRangeChange,
        handleEstimatedPriceChange,
        handleDateChange,
        updatePriceRange
    } = useNodeSettings({
        initialPriceRange: data.priceRange || { min: 50, max: 500, currency: 'USD' },
        initialEstimatedPrice: data.estimatedPrice || 150,
        initialDateRange: data.dateRange || { start: new Date(), end: new Date() },
        onUpdatePricing,
        onUpdateDateRange
    });

    const handleBookingTypeChange = (type: string) => {
        const bookingTypeValue = type as BookingType;
        setBookingType(bookingTypeValue);
        onUpdateBookingType?.(bookingTypeValue);

        const maxPrice = getMaxPrice();
        const newRange: [number, number] = [
            Math.min(priceRange[0], maxPrice * 0.2),
            Math.min(priceRange[1], maxPrice)
        ];
        updatePriceRange(newRange);
    };

    const handleLockToggle = () => {
        const newLockState = !isLocked;
        setIsLocked(newLockState);
        onLockToggle?.(newLockState);
    };

    // Lock node when settings are open
    useEffect(() => {
        onLockToggle?.(showSettings);
    }, [showSettings, onLockToggle]);

    const dateLabels = getDateLabels();

    return (
        <div className="relative">
            {/* Much larger, highly visible top handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-6 h-6 border-4 border-white shadow-xl rounded-full hover:scale-110 transition-transform"
                style={{
                    backgroundColor: '#10B981', // Green for input
                    top: '-12px'
                }}
            />

            <Card
                className={cn(
                    "min-w-[200px] transition-all duration-200",
                    selected && "ring-2 ring-primary ring-offset-2",
                    isLocked && "shadow-lg ring-1 ring-orange-300"
                )}
                style={{ borderColor }}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2" style={{ color: borderColor }}>
                            {getIcon()}
                            <span className="font-semibold text-sm capitalize">
                {bookingType}
              </span>
                        </div>

                        <div className="flex items-center gap-1">
                            {isLocked && (
                                <Lock className="w-3 h-3 text-orange-500" />
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                                className="h-6 w-6 p-0"
                            >
                                <Settings className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">{data.label}</div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Est. Price:</span>
                            <Badge variant="secondary" className="text-xs">
                                ${estimatedPrice} {data.priceRange?.currency || 'USD'}
                            </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {data.timestamp}
                        </div>
                    </div>

                    {showSettings && (
                        <div className="relative">
                            <div className="absolute -top-2 -right-2 z-10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLockToggle}
                                    className="h-6 w-6 p-0 bg-background"
                                >
                                    {isLocked ? (
                                        <Lock className="w-3 h-3 text-orange-500" />
                                    ) : (
                                        <Unlock className="w-3 h-3" />
                                    )}
                                </Button>
                            </div>

                            <NodeSettings
                                priceRange={priceRange}
                                estimatedPrice={estimatedPrice}
                                maxPrice={getMaxPrice()}
                                minPrice={10}
                                currency={data.priceRange?.currency || 'USD'}
                                onPriceRangeChange={handlePriceRangeChange}
                                onEstimatedPriceChange={handleEstimatedPriceChange}
                                startDate={startDate}
                                endDate={endDate}
                                onDateChange={handleDateChange}
                                startDateLabel={dateLabels.start}
                                endDateLabel={dateLabels.end}
                                bookingType={bookingType}
                                onBookingTypeChange={handleBookingTypeChange}
                                showBookingType={true}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Much larger, highly visible bottom handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-6 h-6 border-4 border-white shadow-xl rounded-full hover:scale-110 transition-transform"
                style={{
                    backgroundColor: '#EF4444', // Red for output
                    bottom: '-12px'
                }}
            />
        </div>
    );
};

export default BookingNode;
