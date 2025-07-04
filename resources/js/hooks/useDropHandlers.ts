import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

let id = 0;
const getId = () => `dndnode_${id++}`;

// Generate a random color for trip grouping
const generateTripColor = () => {
    const colors = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
        '#EC4899', // Pink
        '#6366F1', // Indigo
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

const createRegularNode = (type: string, position: any, nodeId: string) => {
    return {
        id: nodeId,
        type,
        position,
        zIndex: 100, // Higher z-index for regular nodes
        data: {
            id: nodeId,
            label: `${type} node`,
            estimatedPrice: type === 'booking' ? 150 : 50,
            priceRange: { min: 50, max: 300, currency: 'USD' },
            dateRange: { start: new Date(), end: new Date() },
            timestamp: `Created ${new Date().toLocaleTimeString()}`,
            showSettingsModal: false,
        },
    };
};

export const useDropHandlers = (setNodes: any) => {
    const { screenToFlowPosition } = useReactFlow();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent, type: string) => {
            event.preventDefault();

            if (!type) return;

            const dropPosition = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            if (type === 'flight') {
                setNodes((currentNodes: any[]) => {
                    const existingFlights = currentNodes.filter(node => node.type === 'flight');
                    const isFirstFlight = existingFlights.length === 0;

                    if (isFirstFlight) {
                        // Create round-trip for first flight (outbound + return)
                        const tripColor = generateTripColor();
                        const outboundId = getId();
                        const returnId = getId();

                        // Calculate positions with proper spacing
                        const FLIGHT_NODE_WIDTH = 280;
                        const SPACING = 50;

                        const outboundFlight = {
                            id: outboundId,
                            type: 'flight',
                            position: {
                                x: dropPosition.x - (FLIGHT_NODE_WIDTH + SPACING) / 2,
                                y: dropPosition.y
                            },
                            zIndex: 100, // High z-index for flights
                            data: {
                                id: outboundId,
                                flightType: 'outbound',
                                isRoundTrip: true,
                                tripColor: tripColor,
                                subgroupColor: tripColor,
                                destination: '',
                                from: '',
                                to: '',
                                priceRange: { min: 200, max: 1000, currency: 'USD' },
                                estimatedPrice: 500,
                                dateRange: {
                                    start: new Date(),
                                    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                },
                                timestamp: `Created ${new Date().toLocaleTimeString()}`,
                                showSettingsModal: false,
                            },
                        };

                        const returnFlight = {
                            id: returnId,
                            type: 'flight',
                            position: {
                                x: dropPosition.x + (FLIGHT_NODE_WIDTH + SPACING) / 2,
                                y: dropPosition.y
                            },
                            zIndex: 100, // High z-index for flights
                            data: {
                                id: returnId,
                                flightType: 'inbound',
                                isRoundTrip: true,
                                tripColor: tripColor,
                                subgroupColor: tripColor,
                                destination: '',
                                from: '',
                                to: '',
                                priceRange: { min: 200, max: 1000, currency: 'USD' },
                                estimatedPrice: 500,
                                dateRange: {
                                    start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                                    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                                },
                                timestamp: `Created ${new Date().toLocaleTimeString()}`,
                                showSettingsModal: false,
                            },
                        };

                        return [...currentNodes, outboundFlight, returnFlight];
                    } else {
                        // Create single flight for subsequent drops
                        const singleFlightId = getId();
                        const tripColor = generateTripColor();

                        const singleFlight = {
                            id: singleFlightId,
                            type: 'flight',
                            position: dropPosition,
                            zIndex: 100, // High z-index for flights
                            data: {
                                id: singleFlightId,
                                flightType: 'single',
                                isRoundTrip: false,
                                tripColor: tripColor,
                                subgroupColor: tripColor,
                                destination: '',
                                from: '',
                                to: '',
                                priceRange: { min: 200, max: 1000, currency: 'USD' },
                                estimatedPrice: 500,
                                dateRange: {
                                    start: new Date(),
                                    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                },
                                timestamp: `Created ${new Date().toLocaleTimeString()}`,
                                onCreateRoundTrip: true,
                                showSettingsModal: false,
                            },
                        };

                        return [...currentNodes, singleFlight];
                    }
                });
            } else if (type === 'group') {
                const groupId = getId();
                const newGroupNode = {
                    id: groupId,
                    type: 'group',
                    position: dropPosition,
                    zIndex: -1, // Very low z-index for groups
                    data: {
                        id: groupId,
                        label: 'New Trip Group',
                        totalCost: 0,
                        itemCount: 0,
                        destination: '',
                    },
                    style: {
                        width: 1000,
                        height: 800,
                    }
                };
                setNodes((nds: any[]) => nds.concat(newGroupNode));
            } else {
                const nodeId = getId();
                const newNode = createRegularNode(type, dropPosition, nodeId);
                setNodes((nds: any[]) => nds.concat(newNode));
            }
        },
        [setNodes, screenToFlowPosition],
    );

    return { onDragOver, onDrop };
};
