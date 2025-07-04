import { useCallback } from 'react';
import { TripNode } from '@/utils/tripUtils';

// Helper function to check if a node is inside a group
const isNodeInsideGroup = (node: any, groupNode: any) => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.width || 220;
    const nodeHeight = node.height || 140;

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;
    const groupWidth = groupNode.width || 1000;
    const groupHeight = groupNode.height || 800;

    // Check if node is completely inside the group
    return (
        nodeX >= groupX &&
        nodeY >= groupY &&
        nodeX + nodeWidth <= groupX + groupWidth &&
        nodeY + nodeHeight <= groupY + groupHeight
    );
};

export const useNodeHandlers = (nodes: any[], setNodes: any) => {
    // Update group statistics in real-time
    const updateGroupStats = useCallback(() => {
        setNodes((prevNodes: any[]) => {
            return prevNodes.map(node => {
                if (node.type === 'group') {
                    // Find all nodes inside this group
                    const nodesInside = prevNodes.filter(n =>
                        n.type !== 'group' &&
                        n.id !== node.id &&
                        isNodeInsideGroup(n, node)
                    );

                    // Find the associated flight node for this group
                    const flightNode = prevNodes.find(n => n.data.groupId === node.id);

                    // Calculate totals
                    const allNodes = flightNode ? [flightNode, ...nodesInside] : nodesInside;
                    const totalItems = allNodes.length;
                    const totalCost = allNodes.reduce((sum, n) => sum + (n.data.estimatedPrice || 0), 0);

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            itemCount: totalItems,
                            totalCost: totalCost
                        }
                    };
                }
                return node;
            });
        });
    }, [setNodes]);

    // Handle destination updates
    const handleDestinationUpdate = useCallback((nodeId: string, destination: string, from?: string, to?: string) => {
        setNodes((prevNodes: any[]) => prevNodes.map(node => {
            if (node.id === nodeId) {
                const location = destination.split(',').pop()?.trim() || destination;
                return {
                    ...node,
                    country: location,
                    data: {
                        ...node.data,
                        destination,
                        from,
                        to,
                        label: `Flight to ${destination}`
                    }
                };
            }

            // Update associated group node
            if (node.type === 'group' && node.data.flightNodeId === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: `Trip to ${destination}`,
                        destination
                    }
                };
            }

            return node;
        }));
    }, [setNodes]);

    // Handle node settings open/close with collision avoidance
    const handleNodeSettingsToggle = useCallback((nodeId: string, isOpen: boolean) => {
        if (!isOpen) return;

        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode) return;

        // Check for overlapping nodes and push them away
        const SETTINGS_WIDTH = 300;
        const SETTINGS_HEIGHT = 400;
        const BUFFER = 50;

        const settingsArea = {
            x: targetNode.position.x + 260, // Node width + gap
            y: targetNode.position.y,
            width: SETTINGS_WIDTH,
            height: SETTINGS_HEIGHT
        };

        setNodes((prevNodes: any[]) => {
            return prevNodes.map(node => {
                if (node.id === nodeId) return node;

                const nodeArea = {
                    x: node.position.x,
                    y: node.position.y,
                    width: node.width || 260,
                    height: node.height || 140
                };

                // Check if node overlaps with settings area
                const overlaps = !(
                    nodeArea.x > settingsArea.x + settingsArea.width ||
                    nodeArea.x + nodeArea.width < settingsArea.x ||
                    nodeArea.y > settingsArea.y + settingsArea.height ||
                    nodeArea.y + nodeArea.height < settingsArea.y
                );

                if (overlaps) {
                    // Push node to the right of settings area
                    return {
                        ...node,
                        position: {
                            ...node.position,
                            x: settingsArea.x + settingsArea.width + BUFFER
                        }
                    };
                }

                return node;
            });
        });
    }, [nodes, setNodes]);

    return {
        updateGroupStats,
        handleDestinationUpdate,
        handleNodeSettingsToggle,
    };
};
