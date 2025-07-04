import { TripNode } from '@/utils/tripUtils';

export const createFlightGroup = (dropPosition: { x: number; y: number }, getId: () => string) => {
    const flightId = getId();
    const groupId = `group_${flightId}`;

    const groupNode = {
        id: groupId,
        type: 'group',
        position: dropPosition,
        data: {
            label: 'Flight Group',
            itemCount: 1,
            totalCost: 500,
            flightNodeId: flightId,
            destination: '',
        },
        style: {
            width: 600,
            height: 400,
            zIndex: 0,
        },
        draggable: true,
        selectable: true,
    };

    const flightNode: TripNode = {
        id: flightId,
        type: 'flight',
        country: 'Unassigned',
        position: {
            x: dropPosition.x + 30,
            y: dropPosition.y + 70,
        },
        data: {
            label: 'Flight node',
            timestamp: new Date().toLocaleTimeString(),
            estimatedPrice: 500,
            priceRange: {
                min: 200,
                max: 1000,
                currency: 'USD'
            },
            dateRange: {
                start: new Date(),
                end: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            destination: '',
            from: '',
            to: '',
            groupId: groupId,
        },
    };

    return { groupNode, flightNode };
};

export const createRegularNode = (type: string, dropPosition: { x: number; y: number }, getId: () => string): TripNode => {
    return {
        id: getId(),
        type: type as any,
        country: 'Unassigned',
        position: dropPosition,
        data: {
            label: `${type} node`,
            timestamp: new Date().toLocaleTimeString(),
            estimatedPrice: type === 'booking' ? 150 : 500,
            priceRange: {
                min: type === 'booking' ? 50 : 200,
                max: type === 'booking' ? 500 : 1000,
                currency: 'USD'
            },
            dateRange: {
                start: new Date(),
                end: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            bookingType: type === 'booking' ? 'hotel' : undefined,
            destination: '',
        },
    };
};
