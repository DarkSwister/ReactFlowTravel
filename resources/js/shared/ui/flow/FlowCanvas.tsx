import { usePage } from '@inertiajs/react';
import { addEdge, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { getSliceConfig } from '@/shared/config/sliceConfigs';
import { useFlowCanvas } from '@/shared/hooks/flow/useFlowCanvas';
import { STABLE_NODE_TYPES } from '@/shared/lib/react-flow/nodeTypes'; // Import stable nodeTypes
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
    useStore?: boolean;
}

// ✅ Store-based implementation
const FlowCanvasWithStore: React.FC<Omit<FlowCanvasProps, 'useStore'>> = ({ slice = 'travel', configOverrides = {}, children }) => {
    const { auth } = usePage<SharedData>().props;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const isAuthorized = useMemo(() => !!auth.user, [auth.user]);

    const { config, nodes, edges, handlers, modal, isEmpty } = useFlowCanvas({
        slice,
        configOverrides,
        isAuthorized,
        reactFlowWrapper,
    });

    return (
        <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={STABLE_NODE_TYPES} // ✅ Use completely stable nodeTypes
                onNodesChange={handlers.onNodesChange}
                onEdgesChange={handlers.onEdgesChange}
                onConnect={handlers.onConnect}
                onNodeClick={handlers.onNodeClick}
                onPaneClick={config.onCanvasClick}
                onDrop={handlers.onDrop}
                onDragOver={handlers.onDragOver}
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

            <FlowEmptyState show={isEmpty} config={config} />
            <UniversalModal {...modal} />
        </div>
    );
};

// ✅ Store-free implementation
const FlowCanvasWithoutStore: React.FC<Omit<FlowCanvasProps, 'useStore'>> = ({ slice = 'travel', configOverrides = {}, children }) => {
    const { auth } = usePage<SharedData>().props;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalNodeId, setModalNodeId] = useState<string | null>(null);
    const [modalNodeType, setModalNodeType] = useState<string | null>(null);

    const isAuthorized = useMemo(() => !!auth.user, [auth.user]);

    const config = useMemo(() => {
        const sliceConfig = getSliceConfig(slice, isAuthorized);
        return { ...sliceConfig, ...configOverrides };
    }, [slice, isAuthorized, configOverrides]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const handleAddNode = useCallback(
        (
            nodeType: string,
            defaultData: any = {},
            position?: { x: number; y: number },
        ) => {
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
        },
        [config.allowNodeCreation, setNodes],
    );

    const handleNodeClick = useCallback(
        (event: React.MouseEvent, node: any) => {
            if (config?.onNodeClick) {
                config.onNodeClick(node.id, node.type);
            } else if (config?.allowNodeEditing) {
                setModalNodeId(node.id);
                setModalNodeType(node.type);
                setIsModalOpen(true);
            }
        },
        [config],
    );

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalNodeId(null);
        setModalNodeType(null);
    }, []);

    const resetFlow = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, [setNodes, setEdges]);

    const onDragOver = useCallback(
        (event: React.DragEvent) => {
            if (!config?.enableDragAndDrop) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        [config?.enableDragAndDrop],
    );

    const onDrop = useCallback(
        (event: React.DragEvent) => {
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
        },
        [config?.enableDragAndDrop, config?.availableNodes, handleAddNode],
    );

    const handlers = useMemo(
        () => ({
            onNodesChange,
            onEdgesChange,
            onConnect,
            onDrop,
            onDragOver,
            onNodeClick: handleNodeClick,
            addNode: handleAddNode,
            resetFlow,
        }),
        [onNodesChange, onEdgesChange, onConnect, onDrop, onDragOver, handleNodeClick, handleAddNode, resetFlow],
    );

    const modal = useMemo(
        () => ({
            isOpen: isModalOpen,
            nodeId: modalNodeId,
            nodeType: modalNodeType,
            onClose: closeModal,
        }),
        [isModalOpen, modalNodeId, modalNodeType, closeModal],
    );

    return (
        <div className={`relative ${config.className || ''}`} style={{ height: config.height || '100%' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={STABLE_NODE_TYPES} // ✅ Use completely stable nodeTypes
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

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ slice = 'travel', configOverrides = {}, children, useStore = true }) => {
    return useStore ? (
        <FlowCanvasWithStore slice={slice} configOverrides={configOverrides}>
            {children}
        </FlowCanvasWithStore>
    ) : (
        <FlowCanvasWithoutStore slice={slice} configOverrides={configOverrides}>
            {children}
        </FlowCanvasWithoutStore>
    );
};
