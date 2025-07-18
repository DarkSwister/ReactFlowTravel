import { usePage } from '@inertiajs/react';
import { addEdge, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

import { getSliceConfig } from '@/shared/config/sliceConfigs';
import { STABLE_NODE_TYPES } from '@/shared/lib/react-flow/nodeTypes';
import { FlowConfig } from '@/shared/types/flowConfig';
import { UniversalModal } from '@/shared/ui/UniversalModal';
import { type SharedData } from '@/types';
import { FlowBackground } from './FlowBackground';
import { FlowControls } from './FlowControls';
import { FlowEmptyState } from './FlowEmptyState';
import { FlowMiniMap } from './FlowMiniMap';
import { FlowToolbar } from './FlowToolbar';

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

    // ✅ Simple local state - no store complexity
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalNodeId, setModalNodeId] = useState<string | null>(null);
    const [modalNodeType, setModalNodeType] = useState<string | null>(null);

    const isAuthorized = useMemo(() => !!auth.user, [auth.user]);

    const config = useMemo(() => {
        const sliceConfig = getSliceConfig(slice, isAuthorized);
        return { ...sliceConfig, ...configOverrides };
    }, [slice, isAuthorized, configOverrides]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // ✅ Simple save function - direct to backend
    const saveFlow = useCallback(async () => {
        if (!plannerId || !config.onSave) {
            console.log('No plannerId or onSave function available');
            return;
        }

        try {
            await config.onSave({
                nodes,
                edges,
                viewport: { x: 0, y: 0, zoom: 1 }
            });
            console.log('✅ Flow saved successfully');
        } catch (error) {
            console.error('❌ Failed to save flow:', error);
        }
    }, [nodes, edges, plannerId, config.onSave]);

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

        setNodes((nds) => [...nds, newNode]);
    }, [config.allowNodeCreation, setNodes]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        if (config?.onNodeClick) {
            config.onNodeClick(node.id, node.type);
        } else if (config?.allowNodeEditing) {
            setModalNodeId(node.id);
            setModalNodeType(node.type);
            setIsModalOpen(true);
        }
    }, [config]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalNodeId(null);
        setModalNodeType(null);
    }, []);

    const resetFlow = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, [setNodes, setEdges]);

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

    // ✅ Simple handlers object
    const handlers = useMemo(() => ({
        onNodesChange,
        onEdgesChange,
        onConnect,
        onDrop,
        onDragOver,
        onDragStart,
        onNodeClick: handleNodeClick,
        addNode: handleAddNode,
        resetFlow,
        save: saveFlow,
        nodes,
        edges,
        // TODO: Add undo/redo from store later
        actions: {
            undo: () => console.log('Undo not implemented yet'),
            redo: () => console.log('Redo not implemented yet'),
            canUndo: false,
            canRedo: false,
        }
    }), [
        onNodesChange, onEdgesChange, onConnect, onDrop, onDragOver, onDragStart,
        handleNodeClick, handleAddNode, resetFlow, saveFlow, nodes, edges
    ]);

    const modal = useMemo(() => ({
        isOpen: isModalOpen,
        nodeId: modalNodeId,
        nodeType: modalNodeType,
        onClose: closeModal,
    }), [isModalOpen, modalNodeId, modalNodeType, closeModal]);

    return (
        <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={STABLE_NODE_TYPES}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
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
            <UniversalModal {...modal} />
        </div>
    );
};
