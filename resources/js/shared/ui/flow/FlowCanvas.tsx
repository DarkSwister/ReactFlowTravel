import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ReactFlow } from '@xyflow/react';
import { usePage } from '@inertiajs/react';

import { getSliceConfig } from '@/shared/config/sliceConfigs';
import { STABLE_NODE_TYPES } from '@/shared/lib/react-flow/nodeTypes';
import { FlowConfig } from '@/shared/types/flowConfig';
import { UniversalModal } from '@/shared/ui/UniversalModal';
import { type SharedData } from '@/types';
import { useFlowStore } from '@/app/store/flowStore';
import { FlowBackground } from './FlowBackground';
import { FlowControls } from './FlowControls';
import { FlowEmptyState } from './FlowEmptyState';
import { FlowMiniMap } from './FlowMiniMap';
import { FlowToolbar } from './FlowToolbar';
import { shallow } from 'zustand/vanilla/shallow';

interface FlowCanvasProps {
    slice?: string;
    configOverrides?: Partial<FlowConfig>;
    children?: React.ReactNode;
    initialNodes?: any[];
    initialEdges?: any[];
    plannerId?: number;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
                                                          slice = 'travel',
                                                          configOverrides = {},
                                                          children,
                                                          initialNodes = [],
                                                          initialEdges = [],
                                                          plannerId
                                                      }) => {
    const { auth } = usePage<SharedData>().props;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Store selectors - use shallow comparison to prevent re-renders
    const nodes = useFlowStore(state => state.nodes, shallow);
    const edges = useFlowStore(state => state.edges, shallow);
    const modalState = useFlowStore(state => state.modalState, shallow);
    const canUndo = useFlowStore(state => state.canUndo());
    const canRedo = useFlowStore(state => state.canRedo());

    // Store operations - get them once and memoize
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

    // Initialize store ONLY in effect, not during render
    useEffect(() => {
        if (plannerId && !isInitialized) {
            console.log('🔧 Initializing FlowCanvas for planner:', plannerId);

            // Get store state once
            const store = useFlowStore.getState();

            // Set planner ID
            store.setPlannerId(plannerId);

            // Initialize with data if available
            if (initialNodes.length > 0 || initialEdges.length > 0) {
                console.log('🔄 Initializing flow with server data (no save triggered)');
                store.initializeFlow(initialNodes, initialEdges);
            } else {
                console.log('ℹ️ No initial data to load');
            }

            setIsInitialized(true);
        }
    }, [plannerId, initialNodes.length, initialEdges.length, isInitialized, initialNodes, initialEdges]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('🧹 FlowCanvas cleanup');
            const store = useFlowStore.getState();

            // Force save any pending changes
            if (store.pendingChanges) {
                console.log('💾 Force saving before unmount');
                store.forceSave().catch(console.error);
            }

            store.cleanup();
        };
    }, []);

    const isAuthorized = useMemo(() => !!auth.user, [auth.user]);

    const config = useMemo(() => {
        const sliceConfig = getSliceConfig(slice, isAuthorized);
        return { ...sliceConfig, ...configOverrides };
    }, [slice, isAuthorized, configOverrides]);

    // Memoize handlers to prevent re-creation
    const handleAddNode = useCallback((nodeType: string, defaultData: any = {}, position?: { x: number; y: number }) => {
        if (!config.allowNodeCreation) return;

        const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNode = {
            id,
            type: nodeType,
            position: position || {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            },
            data: {
                label: `New ${nodeType.split(':')[1] || 'Node'}`,
                timestamp: new Date().toLocaleString(),
                ...defaultData,
            },
        };

        flowOps.addNode(newNode);
    }, [config.allowNodeCreation, flowOps]);

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
                const nodeConfig = config.availableNodes?.find((node) => node.type === nodeType);
                handleAddNode(nodeType, nodeConfig?.defaultData || {}, position);
            }
        }
    }, [config?.enableDragAndDrop, config?.availableNodes, handleAddNode]);

    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    // Memoize handlers object
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
        }
    }), [
        flowOps, onDrop, onDragOver, onDragStart, handleNodeClick,
        handleAddNode, autoSaveOps.forceSave, nodes, edges,
        undo, redo, canUndo, canRedo
    ]);

    // Don't render until initialized
    if (!isInitialized) {
        return (
            <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }}>
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading flow...</div>
                </div>
            </div>
        );
    }

    console.log('🎯 FlowCanvas: Rendering with', nodes.length, 'nodes');

    return (
        <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={STABLE_NODE_TYPES}
                onNodesChange={flowOps.onNodesChange}
                onEdgesChange={flowOps.onEdgesChange}
                onConnect={flowOps.onConnect}
                onNodeClick={handleNodeClick}
                onPaneClick={config.onCanvasClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView={config.fitView}
                defaultViewport={config.defaultViewport}
                minZoom={config.minZoom}
                maxZoom={config.maxZoom}
                nodesDraggable={config.allowNodeEditing}
                nodesConnectable={config.allowNodeEditing}
                elementsSelectable={config.allowNodeEditing}
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
            <UniversalModal {...modalState} onClose={modalOps.closeModal} />
        </div>
    );
};
