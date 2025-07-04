import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Plane, MapPin, Lock, Unlock, RotateCcw, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TripNode } from '@/utils/tripUtils';
import { useNodeSettings } from '@/hooks/useNodeSettings';
import NodeSettings from '../NodeSettings';

interface FlightNodeProps {
    data: TripNode['data'] & {
        subgroupColor?: string;
        tripColor?: string;
        isLocked?: boolean;
        from?: string;
        to?: string;
        destination?: string;
        flightType?: 'outbound' | 'inbound' | 'single';
        isRoundTrip?: boolean;
        onCreateRoundTrip?: (destination: string, from: string, to: string) => void;
        onCreateMultiCity?: () => void;
        onUpdatePricing?: (priceRange: { min: number; max: number; currency: string }, estimatedPrice: number) => void;
        onUpdateDateRange?: (dateRange: { start: Date; end: Date }) => void;
        onUpdateDestination?: (destination: string, from?: string, to?: string) => void;
        onLockToggle?: (locked: boolean) => void;
        onSettingsToggle?: (isOpen: boolean) => void;
    };
    selected?: boolean;
}

const FlightNode: React.FC<FlightNodeProps> = ({
                                                   data,
                                                   selected,
                                               }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [isLocked, setIsLocked] = useState(data.isLocked || false);
    const [isEditingDestination, setIsEditingDestination] = useState(!data.destination);
    const [destination, setDestination] = useState(data.destination || '');
    const [from, setFrom] = useState(data.from || '');
    const [to, setTo] = useState(data.to || '');

    const {
        priceRange,
        estimatedPrice,
        startDate,
        endDate,
        handlePriceRangeChange,
        handleEstimatedPriceChange,
        handleDateChange,
    } = useNodeSettings({
        initialPriceRange: data.priceRange || { min: 200, max: 1000, currency: 'USD' },
        initialEstimatedPrice: data.estimatedPrice || 500,
        initialDateRange: data.dateRange || { start: new Date(), end: new Date() },
        onUpdatePricing: data.onUpdatePricing,
        onUpdateDateRange: data.onUpdateDateRange
    });

    const handleDestinationSubmit = () => {
        if (destination.trim()) {
            data.onUpdateDestination?.(destination.trim(), from.trim(), to.trim());
            setIsEditingDestination(false);
        }
    };

    const handleDestinationKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleDestinationSubmit();
        } else if (e.key === 'Escape') {
            setDestination(data.destination || '');
            setFrom(data.from || '');
            setTo(data.to || '');
            setIsEditingDestination(false);
        }
    };

    const handleLockToggle = () => {
        const newLockState = !isLocked;
        setIsLocked(newLockState);
        data.onLockToggle?.(newLockState);
    };

    const handleCreateRoundTrip = () => {
        if (destination.trim() && from.trim() && to.trim() && data.onCreateRoundTrip) {
            data.onCreateRoundTrip(destination.trim(), from.trim(), to.trim());
        }
    };

    const handleCreateMultiCity = () => {
        if (data.onCreateMultiCity) {
            data.onCreateMultiCity();
        }
    };

    const handleSettingsToggle = () => {
        const newSettingsState = !showSettings;
        setShowSettings(newSettingsState);
        // Notify parent about settings state change
        data.onSettingsToggle?.(newSettingsState);
        // Auto-lock when settings are open
        if (newSettingsState && !isLocked) {
            setIsLocked(true);
            data.onLockToggle?.(true);
        }
    };

    const getFlightTypeLabel = () => {
        if (data.flightType === 'outbound') return 'Outbound Flight';
        if (data.flightType === 'inbound') return 'Return Flight';
        return 'Flight';
    };

    const getFlightTypeColor = () => {
        if (data.flightType === 'outbound') return '#10B981'; // Green
        if (data.flightType === 'inbound') return '#EF4444'; // Red
        return data.tripColor || data.subgroupColor || '#3B82F6'; // Use trip color or default blue
    };

    const getRouteDisplay = () => {
        if (data.flightType === 'inbound') {
            return `${to} → ${from}`; // Return flight: destination back to origin
        }
        return `${from} → ${to}`; // Outbound: origin to destination
    };

    const getFlightIcon = () => {
        if (data.flightType === 'outbound') return '✈️';
        if (data.flightType === 'inbound') return '🔄';
        return '✈️';
    };

    return (
        <div className="relative">
            <Handle
                type="target"
                position={Position.Top}
                className="w-6 h-6 border-4 border-white shadow-xl rounded-full hover:scale-110 transition-transform"
                style={{
                    backgroundColor: getFlightTypeColor(),
                    top: '-12px'
                }}
            />

            <Card
                className={cn(
                    "min-w-[260px] transition-all duration-200",
                    selected && "ring-2 ring-primary ring-offset-2",
                    isLocked && "shadow-lg ring-1 ring-orange-300"
                )}
                style={{
                    borderColor: getFlightTypeColor(),
                    borderWidth: '2px',
                    boxShadow: `0 4px 12px ${getFlightTypeColor()}20`
                }}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2" style={{ color: getFlightTypeColor() }}>
                            <Plane className="w-5 h-5" />
                            <span className="font-semibold text-sm">{getFlightTypeLabel()}</span>
                            <span className="text-xs">{getFlightIcon()}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Round trip button - only show for single flights */}
                            {data.flightType === 'single' && destination && from && to && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCreateRoundTrip}
                                    className="h-6 w-6 p-0"
                                    title="Create round trip"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </Button>
                            )}

                            {/* Multi-city button */}
                            {data.flightType === 'single' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCreateMultiCity}
                                    className="h-6 w-6 p-0"
                                    title="Add multi-city leg"
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                            )}

                            {isLocked && (
                                <Lock className="w-3 h-3 text-orange-500" />
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSettingsToggle}
                                className="h-6 w-6 p-0"
                            >
                                <Settings className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="space-y-2">
                        {/* Trip indicator for first flight */}
                        {data.isRoundTrip && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getFlightTypeColor() }}
                                />
                                <span>
                                    {data.flightType === 'outbound' ? 'Trip Start' : 'Trip End'}
                                </span>
                            </div>
                        )}

                        {/* Destination Input */}
                        {isEditingDestination ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Destination:</span>
                                </div>
                                <Input
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    onBlur={handleDestinationSubmit}
                                    onKeyDown={handleDestinationKeyDown}
                                    placeholder="Enter destination (e.g., Paris, France)"
                                    className="h-7 text-xs"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-1">
                                    <Input
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        onKeyDown={handleDestinationKeyDown}
                                        placeholder="From (e.g., NYC)"
                                        className="h-6 text-xs"
                                    />
                                    <Input
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        onKeyDown={handleDestinationKeyDown}
                                        placeholder="To (e.g., CDG)"
                                        className="h-6 text-xs"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Press Enter to save, Escape to cancel
                                </div>
                            </div>
                        ) : (
                            <div
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                onClick={() => setIsEditingDestination(true)}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-medium">{destination || 'Click to add destination'}</span>
                                </div>
                                {(from || to) && (
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {getRouteDisplay()}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Est. Price:</span>
                            <Badge variant="secondary" className="text-xs">
                                ${estimatedPrice} {data.priceRange?.currency || 'USD'}
                            </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {data.flightType === 'inbound' ? 'Return: ' : 'Departure: '}
                            {format(startDate, 'MMM dd, yyyy')}
                        </div>

                        {data.timestamp && (
                            <div className="text-xs text-muted-foreground opacity-60">
                                {data.timestamp}
                            </div>
                        )}
                    </div>

                    {showSettings && (
                        <div className="relative mt-3">
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
                                maxPrice={2000}
                                minPrice={100}
                                currency={data.priceRange?.currency || 'USD'}
                                onPriceRangeChange={handlePriceRangeChange}
                                onEstimatedPriceChange={handleEstimatedPriceChange}
                                startDate={startDate}
                                endDate={endDate}
                                onDateChange={handleDateChange}
                                startDateLabel={data.flightType === 'inbound' ? 'Return Date' : 'Departure Date'}
                                endDateLabel="Flexible Range"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-6 h-6 border-4 border-white shadow-xl rounded-full hover:scale-110 transition-transform"
                style={{
                    backgroundColor: getFlightTypeColor(),
                    bottom: '-12px'
                }}
            />
        </div>
    );
};

export default FlightNode;
