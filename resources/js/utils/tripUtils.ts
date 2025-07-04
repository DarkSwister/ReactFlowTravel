export type BookingType = 'hotel' | 'activity' | 'transport' | 'other';
export type NodeType = 'flight' | 'booking' | 'activity' | 'accommodation';

export interface TripNode {
    id: string;
    type: NodeType;
    country: string;
    position: { x: number; y: number };
    data: {
        label: string;
        timestamp: string;
        from?: string;
        to?: string;
        bookingType?: BookingType;
        isRoundTrip?: boolean;
        roundTripColor?: string;
        subgroupColor?: string;
        // Pricing and date fields
        priceRange?: {
            min: number;
            max: number;
            currency: string;
        };
        dateRange?: {
            start: Date;
            end: Date;
        };
        estimatedPrice?: number;
        [key: string]: any;
    };
    groupId?: string;
    subgroupId?: string;
}

export interface Subgroup {
    id: string;
    name: string;
    country?: string; // Make this optional
    color: string;
    nodes: TripNode[];
    isCollapsed: boolean;
    isManual?: boolean;
    totalEstimatedCost: number;
}

export interface TripGroup {
    id: string;
    subgroups: Subgroup[];
    roundTripPairs: Array<{
        outbound: string;
        return: string;
        color: string;
    }>;
}

/**
 * Calculate total estimated cost for a subgroup
 */
export const calculateSubgroupCost = (nodes: TripNode[]): number => {
    return nodes.reduce((total, node) => {
        return total + (node.data.estimatedPrice || 0);
    }, 0);
};

/**
 * Update subgroup with recalculated total cost
 */
export const updateSubgroupCost = (subgroup: Subgroup): Subgroup => {
    return {
        ...subgroup,
        totalEstimatedCost: calculateSubgroupCost(subgroup.nodes)
    };
};

/**
 * Update node pricing
 */
export const updateNodePricing = (
    nodes: TripNode[],
    nodeId: string,
    priceRange: { min: number; max: number; currency: string },
    estimatedPrice: number
): TripNode[] => {
    return nodes.map(node =>
        node.id === nodeId
            ? {
                ...node,
                data: {
                    ...node.data,
                    priceRange,
                    estimatedPrice
                }
            }
            : node
    );
};

/**
 * Update node date range
 */
export const updateNodeDateRange = (
    nodes: TripNode[],
    nodeId: string,
    dateRange: { start: Date; end: Date }
): TripNode[] => {
    return nodes.map(node =>
        node.id === nodeId
            ? {
                ...node,
                data: {
                    ...node.data,
                    dateRange
                }
            }
            : node
    );
};

/**
 * Update node booking type
 */
export const updateNodeBookingType = (
    nodes: TripNode[],
    nodeId: string,
    bookingType: BookingType
): TripNode[] => {
    return nodes.map(node =>
        node.id === nodeId
            ? {
                ...node,
                data: {
                    ...node.data,
                    bookingType
                }
            }
            : node
    );
};

/**
 * Group nodes by country automatically
 */
export const groupNodesByCountry = (nodes: TripNode[]): Subgroup[] => {
    const countryGroups = new Map<string, TripNode[]>();

    nodes.forEach(node => {
        const country = node.country || 'Unknown';
        if (!countryGroups.has(country)) {
            countryGroups.set(country, []);
        }
        countryGroups.get(country)!.push(node);
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    let colorIndex = 0;

    return Array.from(countryGroups.entries()).map(([country, countryNodes]) => {
        const subgroup: Subgroup = {
            id: `subgroup-${country.toLowerCase().replace(/\s+/g, '-')}`,
            name: country,
            country,
            nodes: countryNodes,
            color: colors[colorIndex % colors.length],
            isCollapsed: false,
            totalEstimatedCost: calculateSubgroupCost(countryNodes)
        };
        colorIndex++;
        return subgroup;
    });
};

/**
 * Detect round trip flights
 */
export const detectRoundTripFlights = (nodes: TripNode[]): Array<{
    outbound: string;
    return: string;
    color: string;
}> => {
    const flightNodes = nodes.filter(node => node.type === 'flight');
    const roundTrips: Array<{ outbound: string; return: string; color: string }> = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    for (let i = 0; i < flightNodes.length; i++) {
        for (let j = i + 1; j < flightNodes.length; j++) {
            const flight1 = flightNodes[i];
            const flight2 = flightNodes[j];

            if (flight1.data.from === flight2.data.to &&
                flight1.data.to === flight2.data.from) {
                const color = colors[roundTrips.length % colors.length];
                roundTrips.push({
                    outbound: flight1.id,
                    return: flight2.id,
                    color
                });
                break;
            }
        }
    }

    return roundTrips;
};

/**
 * Apply round trip colors to nodes
 */
export const applyRoundTripColors = (
    nodes: TripNode[],
    roundTripPairs: Array<{ outbound: string; return: string; color: string }>
): TripNode[] => {
    return nodes.map(node => {
        const roundTrip = roundTripPairs.find(rt =>
            rt.outbound === node.id || rt.return === node.id
        );

        if (roundTrip) {
            return {
                ...node,
                data: {
                    ...node.data,
                    isRoundTrip: true,
                    roundTripColor: roundTrip.color
                }
            };
        }

        return node;
    });
};

/**
 * Update subgroups with new nodes
 */
export const updateSubgroupsWithNodes = (
    subgroups: Subgroup[],
    nodes: TripNode[]
): Subgroup[] => {
    return subgroups.map(subgroup => {
        const updatedNodes = nodes.filter(node =>
            subgroup.nodes.some(sgNode => sgNode.id === node.id)
        );

        return updateSubgroupCost({
            ...subgroup,
            nodes: updatedNodes
        });
    });
};
