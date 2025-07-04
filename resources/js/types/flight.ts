// === Backend DTO returned by Laravel ===
export interface FlightSegmentDTO {
    id: string;            // UL1734-1
    from: string;          // FRA
    to: string;            // JFK
    depIso: string;        // 2025-05-10T09:10:00Z
    arrIso: string;        // 2025-05-10T11:45:00Z
    airline: string;       // LH
    flightNumber?: string; // LH441
    aircraft?: string;     // A350-900
    duration?: number;     // minutes
}

export interface FlightItineraryDTO {
    id: string;                       // RT-0001
    type: 'ONE_WAY' | 'RETURN' | 'MULTI_CITY';
    totalPrice: number;               // 712.30
    currency: string;                 // EUR
    segments: FlightSegmentDTO[];     // 1-N
    fareBreakdown?: {
        baseFare: number;
        taxes: number;
        fees: number;
    };
    bookingClass?: string;            // Economy, Business, etc.
    validatingCarrier?: string;       // Main airline
}

// === Front-end nodes sent to React Flow ===
export interface ItineraryNodeData {
    itinerary: FlightItineraryDTO;
    expanded: boolean;
    subgroupColor?: string;
    tripColor?: string;
    isLocked?: boolean;
    timestamp?: string;
    // Callbacks
    onUpdatePricing?: (priceRange: { min: number; max: number; currency: string }, estimatedPrice: number) => void;
    onUpdateDateRange?: (dateRange: { start: Date; end: Date }) => void;
    onLockToggle?: (locked: boolean) => void;
    onSettingsToggle?: (isOpen: boolean) => void;
    onExpandToggle?: (expanded: boolean) => void;
    onCreateMultiCity?: () => void;
}
