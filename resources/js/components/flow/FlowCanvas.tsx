import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ReactFlow } from '@xyflow/react';
import { usePage } from '@inertiajs/react';

import { getDefaultFlowConfig } from '@/config/flowConfig';
import { getNodeTypes, getAvailableNodesList } from '@/nodes';
import { FlowConfig } from '@/types/flowConfig';
import { UniversalModal } from '@/shared/ui/UniversalModal.tsx';
import { type SharedData } from '@/types';
import { useFlowStore, useNodes, useEdges, useModalState } from '@/app/store/flowStore.ts';
import { FlowBackground } from './FlowBackground.tsx';
import { FlowControls } from './FlowControls.tsx';
import { FlowEmptyState } from './FlowEmptyState.tsx';
import { FlowMiniMap } from './FlowMiniMap.tsx';
import { FlowToolbar } from './FlowToolbar.tsx';
import { FlowAnalyticsSidebar } from './FlowAnalyticsSidebar.tsx';

interface FlowCanvasProps {
    children?: React.ReactNode;
    initialNodes?: any[];
    initialEdges?: any[];
    initialViewport?: { x: number; y: number; zoom: number };
    plannerId?: number;
    configOverrides?: Partial<FlowConfig>;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
    children,
    initialNodes = [],
    initialEdges = [],
    initialViewport,
    plannerId,
    configOverrides = {}
}) => {
    const { auth } = usePage<SharedData>().props;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Store selectors
    const nodes = useNodes();
    const edges = useEdges();
    const modalState = useModalState();
    const canUndo = useFlowStore(state => state.canUndo());
    const canRedo = useFlowStore(state => state.canRedo());

    // Store operations
    const flowOps = useMemo(() => ({
        onNodesChange: useFlowStore.getState().onNodesChange,
        onEdgesChange: useFlowStore.getState().onEdgesChange,
        onConnect: useFlowStore.getState().onConnect,
        addNode: useFlowStore.getState().addNode,
        resetFlow: useFlowStore.getState().resetFlow,
    }), []);

    const modalOps = useMemo(() => ({
        openNodeModal: useFlowStore.getState().openNodeModal,
        closeModal: useFlowStore.getState().closeModal,
    }), []);

    const autoSaveOps = useMemo(() => ({
        forceSave: useFlowStore.getState().forceSave,
    }), []);

    const undo = useMemo(() => useFlowStore.getState().undo, []);
    const redo = useMemo(() => useFlowStore.getState().redo, []);


    const handleViewportChange = useCallback((newViewport: { x: number; y: number; zoom: number }) => {
        const store = useFlowStore.getState();

        // Use setTimeout to avoid blocking the UI during pan/zoom
        setTimeout(() => {
            store.setViewport(newViewport);

        }, 0);
    }, []);
    // Simple initialization
    useEffect(() => {
        if (!isInitialized) {
            console.log('🔧 Initializing FlowCanvas:', {
                plannerId,
                isGuest: !auth.user,
                hasInitialData: initialNodes.length > 0 || initialEdges.length > 0,
                hasInitialViewport: !!initialViewport
            });

            const store = useFlowStore.getState();

            // Set planner ID (this will clear flow if switching planners)
            const previousPlannerId = store.plannerId;
            store.setPlannerId(plannerId || null);

            // Only initialize with server data if:
            // 1. We're switching to a different planner, OR
            // 2. We have no persisted data at all
            const hasPersistedData = store.nodes.length > 0 || store.edges.length > 0;
            const hasServerData = initialNodes.length > 0 || initialEdges.length > 0;
            const switchedPlanner = previousPlannerId !== (plannerId || null);

            console.log('🤔 Data decision:', {
                hasPersistedData,
                hasServerData,
                switchedPlanner,
                previousPlannerId,
                currentPlannerId: plannerId || null,
                initialViewport
            });

            if (switchedPlanner && hasServerData) {
                console.log('🔄 Switched planner - initializing with server data');
                store.initializeFlow(initialNodes, initialEdges, initialViewport);
            } else if (!hasPersistedData && hasServerData) {
                console.log('🔄 No persisted data - initializing with server data');
                store.initializeFlow(initialNodes, initialEdges, initialViewport);
            } else if (!hasPersistedData && !hasServerData) {
                console.log('ℹ️ No data found - initializing empty flow');
                store.initializeFlow([], [], initialViewport);
            } else {
                console.log('✅ Using existing persisted data');
            }

            setIsInitialized(true);
        }
    }, [plannerId, initialNodes, initialEdges, isInitialized, auth.user, initialViewport]);

    useEffect(() => {
        return () => {
            const store = useFlowStore.getState();
            if (store.pendingChanges && store.plannerId) {
                store.forceSave().catch(console.error);
            }
        };
    }, []);

    const isAuthorized = useMemo(() => !!auth.user, [auth.user]);

    // Get node types for ReactFlow
    const nodeTypes = useMemo(() => getNodeTypes(), []);

    // Build config: defaults + overrides + available nodes
    const config = useMemo(() => {
        const defaultConfig = getDefaultFlowConfig(isAuthorized);
        const availableNodes = getAvailableNodesList();

        return {
            ...defaultConfig,
            ...configOverrides,
            availableNodes,
        };
    }, [isAuthorized, configOverrides]);

    // Handlers
    const handleAddNode = useCallback((nodeType: string, defaultData: any = {}, position?: { x: number; y: number }, parentId?: string) => {
        if (!config.allowNodeCreation) return;

        // Get default data from node registration if available
        const configNode = config.availableNodes?.find(node => node.type === nodeType);
        const registeredDefaultData = configNode?.defaultData || {};

        console.log(`Creating node ${nodeType}:`, {
            passedDefaultData: defaultData,
            registeredDefaultData,
            configAvailableNodes: config.availableNodes?.map(n => ({type: n.type, hasDefaultData: !!n.defaultData}))
        });

        const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nodeConfig: any = {
            id,
            type: nodeType,
            position: position || {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            },
            data: {
                label: `New ${nodeType.split(':')[1] || 'Node'}`,
                timestamp: new Date().toLocaleString(),
                ...registeredDefaultData, // Apply registered default data first
                ...defaultData, // Then apply any passed defaultData (overrides)
            },
        };

        // Handle React Flow sub-flows for group nodes
        if (nodeType === 'group') {
            nodeConfig.style = {
                width: 400,
                height: 300,
            };
        } else if (parentId) {
            // This node is being added to a group
            nodeConfig.parentId = parentId;
            nodeConfig.extent = 'parent';
            nodeConfig.expandParent = true;
        }

        flowOps.addNode(nodeConfig);
    }, [config.allowNodeCreation, config.availableNodes, flowOps]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        if (config?.onNodeClick) {
            config.onNodeClick(node.id, node.type);
        } else if (config?.allowNodeEditing) {
            modalOps.openNodeModal(node.id, node.type);
        }
    }, [config, modalOps]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        if (!config?.enableDragAndDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, [config?.enableDragAndDrop]);

    const onDrop = useCallback((event: React.DragEvent) => {
        if (!config?.enableDragAndDrop) return;
        event.preventDefault();

        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (reactFlowBounds) {
            const position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            };

            const nodeType = event.dataTransfer.getData('application/reactflow');
            if (nodeType) {
                const nodeConfig = config.availableNodes?.find(node => node.type === nodeType);
                handleAddNode(nodeType, nodeConfig?.defaultData || {}, position);
            }
        }
    }, [config?.enableDragAndDrop, config?.availableNodes, handleAddNode]);

    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onNodeDragStop = useCallback((event: any, node: any) => {
        // Find if the node was dropped inside any group
        const groupNodes = nodes.filter(n => n.type === 'group');

        for (const groupNode of groupNodes) {
            if (!groupNode.position || !groupNode.width || !groupNode.height) continue;

            const groupBounds = {
                x: groupNode.position.x,
                y: groupNode.position.y,
                width: groupNode.width,
                height: groupNode.height,
            };

            const nodeCenterX = node.position.x + 100; // Assuming node width ~200, center is +100
            const nodeCenterY = node.position.y + 75;  // Assuming node height ~150, center is +75

            // Check if node center is within group bounds
            if (nodeCenterX >= groupBounds.x &&
                nodeCenterX <= groupBounds.x + groupBounds.width &&
                nodeCenterY >= groupBounds.y + 80 && // Account for header
                nodeCenterY <= groupBounds.y + groupBounds.height) {

                // Node is inside this group - set parent relationship
                console.log(`Auto-assigning node ${node.id} to group ${groupNode.id}`);
                const store = useFlowStore.getState();
                store.onNodesChange([{
                    id: node.id,
                    type: 'replace',
                    item: {
                        ...node,
                        parentId: groupNode.id,
                        extent: 'parent',
                        expandParent: true,
                        data: { ...node.data, groupId: groupNode.id }
                    }
                }]);
                return; // Only assign to one group
            }
        }

        // If not in any group, remove parent relationship if it exists
        if (node.parentId) {
            console.log(`Removing node ${node.id} from group ${node.parentId}`);
            const store = useFlowStore.getState();
            const { parentId, extent, expandParent, ...nodeWithoutParent } = node;
            const { groupId, ...dataWithoutGroupId } = node.data || {};

            store.onNodesChange([{
                id: node.id,
                type: 'replace',
                item: {
                    ...nodeWithoutParent,
                    data: dataWithoutGroupId
                }
            }]);
        }
    }, [nodes]);

    const handlers = useMemo(() => ({
        onNodesChange: flowOps.onNodesChange,
        onEdgesChange: flowOps.onEdgesChange,
        onConnect: flowOps.onConnect,
        onDrop,
        onDragOver,
        onDragStart,
        onNodeClick: handleNodeClick,
        addNode: handleAddNode,
        resetFlow: flowOps.resetFlow,
        save: autoSaveOps.forceSave,
        nodes,
        edges,
        actions: {
            undo,
            redo,
            canUndo,
            canRedo,
        },
        showAnalytics: () => setShowAnalytics(true)
    }), [
        flowOps, onDrop, onDragOver, onDragStart, handleNodeClick,
        handleAddNode, autoSaveOps.forceSave, nodes, edges,
        undo, redo, canUndo, canRedo
    ]);

    if (!isInitialized) {
        return (
            <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }}>
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${config.className || ''} flow-canvas-container`} style={{ height: config.height || '100%' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={flowOps.onNodesChange}
                onEdgesChange={flowOps.onEdgesChange}
                onConnect={flowOps.onConnect}
                onNodeClick={handleNodeClick}
                onNodeDragStop={onNodeDragStop}
                onPaneClick={config.onCanvasClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView={config.fitView}
                onViewportChange={handleViewportChange}
                defaultViewport={config.defaultViewport}
                minZoom={config.minZoom}
                maxZoom={config.maxZoom}
                nodesDraggable={config.allowNodeEditing}
                nodesConnectable={config.allowNodeEditing}
                elementsSelectable={config.allowNodeEditing}
                onlyRenderVisibleElements={false}
                snapToGrid={true}
                snapGrid={[25, 25]}
            >
                <FlowBackground show={config.showBackground} />
                <FlowControls show={config.showControls} />
                <FlowMiniMap show={config.showMiniMap} />
                <FlowToolbar config={config} handlers={handlers} />
                {children}
            </ReactFlow>

            {nodes.length === 0 && <FlowEmptyState show={true} config={config} />}
            <UniversalModal
                isOpen={modalState.isOpen}
                nodeId={modalState.nodeId}
                nodeType={modalState.nodeType}
                nodeData={modalState.nodeData}
                onClose={modalOps.closeModal}
            />
            {/* Analytics Sidebar */}
            <FlowAnalyticsSidebar
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
                onSave={autoSaveOps.forceSave}
            />
        </div>
    );
};
