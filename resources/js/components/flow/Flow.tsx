import React, { useRef, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { DnDProvider, useDnD } from './DnDContext';
import BookingNode from './nodes/BookingNode';
import FlightNode from './nodes/FlightNode';
import GroupNode from './nodes/GroupNode';
import Sidebar from './Sidebar';
import SubgroupPanel from './SubgroupPanel';
import { useFlowLogic } from '@/hooks/useFlowLogic';
import { useNodeHandlers } from '@/hooks/useNodeHandlers';
import { useDropHandlers } from '@/hooks/useDropHandlers';

const nodeTypes = {
    flight: FlightNode,
    booking: BookingNode,
    group: GroupNode,
};


const DnDFlow = () => {
    const reactFlowWrapper = useRef(null);
    const [type] = useDnD();

    const {
        nodes,
        setNodes,
        onNodesChange,
        edges,
        onEdgesChange,
        onConnect,
        subgroups,
        manualSubgroups,
        setManualSubgroups,
    } = useFlowLogic();

    const {
        updateGroupStats,
        handleDestinationUpdate,
        handleNodeSettingsToggle,
    } = useNodeHandlers(nodes, setNodes);

    const { onDragOver, onDrop } = useDropHandlers(setNodes);

    // Generate unique ID for nodes
    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle round trip creation
    const handleCreateRoundTrip = useCallback((originalNodeId: string, destination: string, from: string, to: string) => {
        const originalNode = nodes.find(node => node.id === originalNodeId);
        if (!originalNode) return;

        const returnFlightId = generateId();

        // Update original node to be outbound
        const outboundNode = {
            ...originalNode,
            data: {
                ...originalNode.data,
                flightType: 'outbound',
                isRoundTrip: true,
            }
        };

        // Create return flight node
        const returnNode = {
            id: returnFlightId,
            type: 'flight',
            position: {
                x: originalNode.position.x + 300,
                y: originalNode.position.y
            },
            data: {
                ...originalNode.data,
                id: returnFlightId,
                flightType: 'inbound',
                isRoundTrip: true,
                from: to, // Swap from/to for return flight
                to: from,
                tripColor: originalNode.data.tripColor, // Keep same trip color
                // Adjust dates for return flight (add a week as example)
                dateRange: {
                    start: new Date(originalNode.data.dateRange?.start || new Date()),
                    end: new Date((originalNode.data.dateRange?.end || new Date()).getTime() + 7 * 24 * 60 * 60 * 1000)
                },
                timestamp: `Created ${new Date().toLocaleTimeString()}`,
            }
        };

        setNodes(prevNodes => {
            // Replace original node with outbound and add return node
            const filteredNodes = prevNodes.filter(node => node.id !== originalNodeId);
            return [...filteredNodes, outboundNode, returnNode];
        });

        // Update group stats after a short delay
        setTimeout(updateGroupStats, 100);
    }, [nodes, setNodes, updateGroupStats]);

    // Custom nodes change handler that updates group stats
    const handleNodesChange = useCallback((changes) => {
        onNodesChange(changes);
        const hasPositionChanges = changes.some(change => change.type === 'position');
        if (hasPositionChanges) {
            setTimeout(updateGroupStats, 100);
        }
    }, [onNodesChange, updateGroupStats]);

    // Handle drop with type
    const handleDrop = useCallback((event: React.DragEvent) => {
        onDrop(event, type);
    }, [onDrop, type]);

    // Subgroup handlers
    const handleSubgroupNameChange = useCallback((subgroupId: string, newName: string) => {
        setManualSubgroups(prev => prev.map(sg =>
            sg.id === subgroupId ? { ...sg, name: newName } : sg
        ));
    }, [setManualSubgroups]);

    const handleSubgroupToggle = useCallback((subgroupId: string) => {
        setManualSubgroups(prev => prev.map(sg =>
            sg.id === subgroupId ? { ...sg, isCollapsed: !sg.isCollapsed } : sg
        ));
    }, [setManualSubgroups]);

    // Enhanced nodes with handlers
    const enhancedNodes = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onUpdateDestination: node.type === 'flight'
                    ? (dest: string, from?: string, to?: string) => handleDestinationUpdate(node.id, dest, from, to)
                    : undefined,
                onSettingsToggle: (isOpen: boolean) => handleNodeSettingsToggle(node.id, isOpen),
                onCreateRoundTrip: node.type === 'flight' && node.data.flightType === 'single'
                    ? (nodeId: string, destination: string, from: string, to: string) =>
                        handleCreateRoundTrip(nodeId, destination, from, to)
                    : undefined,
            }
        }));
    }, [nodes, handleDestinationUpdate, handleNodeSettingsToggle, handleCreateRoundTrip]);

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Header with Sidebar */}
                <Sidebar />

            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
                {/* Main Flow Area */}
                <div style={{ flexGrow: 1, position: 'relative' }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={enhancedNodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={handleDrop}
                        onDragOver={onDragOver}
                        snapToGrid={true}
                        snapGrid={[25, 25]}
                        fitView={false}
                        defaultViewport={{ x: 100, y: 100, zoom: 0.8 }}
                        nodesDraggable={true}
                        nodesConnectable={true}
                        elementsSelectable={true}
                        minZoom={0.2}
                        maxZoom={2}
                    >
                        <Controls />
                        <Background gap={20} size={1} />
                    </ReactFlow>
                </div>

                {/* Right Panel with Trip Groups */}
                <div className="w-80 bg-background border-l border-border overflow-y-auto p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Trip Groups</h3>
                        <p className="text-sm text-muted-foreground">
                            Visual groups created by flights
                        </p>
                    </div>

                    {subgroups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No trip groups yet</p>
                            <p className="text-xs mt-1">Drop a flight to create a group</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subgroups.map((subgroup) => (
                                <SubgroupPanel
                                    key={subgroup.id}
                                    subgroup={subgroup}
                                    onNameChange={handleSubgroupNameChange}
                                    onToggle={handleSubgroupToggle}
                                />
                            ))}
                        </div>
                    )}

                    {/* Total Trip Cost */}
                    {subgroups.length > 0 && (
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Total Trip Cost:</span>
                                <span className="text-lg font-bold text-primary">
                  ${subgroups.reduce((total, sg) => total + sg.totalEstimatedCost, 0)}
                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default () => (
    <ReactFlowProvider>
        <DnDProvider>
            <DnDFlow />
        </DnDProvider>
    </ReactFlowProvider>
);
