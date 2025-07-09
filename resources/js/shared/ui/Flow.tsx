import React, { useCallback, useMemo, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    MiniMap,
    Panel,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    useFlowStore,
    useNodes,
    useEdges,
    useIsModalOpen,
    useModalNodeId,
    useModalNodeType,
    useCanUndo,
    useCanRedo,
    useRedo,
    useUndo
} from '@/app/store/flowStore';

import { getNodeTypes } from '@/shared/lib/react-flow/nodeRegistry';
import { UniversalModal } from '@/shared/ui/UniversalModal';
import { Button } from '@/components/ui/button';
import { Plane, Hotel, Users, Undo, Redo } from 'lucide-react';
import { DnDProvider, useDnD } from './DnDContext';
import { useFlowPersistence } from '@/shared/hooks/useFlowPersistence';

const iconMap = {
    Plane,
    Hotel,
    Users,
};

interface FlowConfig {
    showToolbar?: boolean;
    showControls?: boolean;
    showMiniMap?: boolean;
    showBackground?: boolean;
    allowNodeCreation?: boolean;
    allowNodeEditing?: boolean;
    allowNodeDeletion?: boolean;
    allowUndo?: boolean;
    fitView?: boolean;
    defaultViewport?: { x: number; y: number; zoom: number };
    minZoom?: number;
    maxZoom?: number;
    availableNodes?: Array<{
        type: string;
        label: string;
        icon: string;
        defaultData?: any;
    }>;
    className?: string;
    height?: string;
    onNodeClick?: (nodeId: string, nodeType: string) => void;
    onCanvasClick?: () => void;
    enableDragAndDrop?: boolean;
}

interface FlowProps {
    config: FlowConfig;
    children?: React.ReactNode;
}

const FlowInner: React.FC<FlowProps> = ({ config, children }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const [dragType, setDragType] = useDnD();

    // Initialize persistence (this handles everything automatically)
    useFlowPersistence({
        onDataExpired: () => {
            console.log('Flow diagram data has expired and been cleared');
            // Could show a toast notification here if you have a toast system
        },
    });

    // Use individual selectors for better performance
    const nodes = useNodes();
    const edges = useEdges();
    const isModalOpen = useIsModalOpen();
    const modalNodeId = useModalNodeId();
    const modalNodeType = useModalNodeType();

    // Get actions from store
    const onNodesChange = useFlowStore((state) => state.onNodesChange);
    const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
    const onConnect = useFlowStore((state) => state.onConnect);
    const addNode = useFlowStore((state) => state.addNode);
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const undo = useUndo();
    const redo = useRedo();
    const openNodeModal = useFlowStore((state) => state.openNodeModal);
    const closeModal = useFlowStore((state) => state.closeModal);

    const nodeTypes = useMemo(() => getNodeTypes(), []);

    const generateNodeId = useCallback(() => {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const handleAddNode = useCallback((nodeType: string, defaultData: any = {}, position?: { x: number; y: number }, openModal = false) => {
        if (!config.allowNodeCreation) return;

        const id = generateNodeId();
        const newNode = {
            id,
            type: nodeType,
            position: position || {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            },
            data: {
                label: `New ${nodeType.split(':')[1] || 'Node'}`,
                timestamp: new Date().toLocaleString(),
                priceRange: { min: 100, max: 500, currency: 'USD' },
                ...defaultData,
            },
        };

        addNode(newNode);

        if (openModal && config.allowNodeEditing) {
            openNodeModal(id, nodeType);
        }
    }, [addNode, generateNodeId, openNodeModal, config.allowNodeCreation, config.allowNodeEditing]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        if (config.onNodeClick) {
            config.onNodeClick(node.id, node.type);
        } else if (config.allowNodeEditing) {
            openNodeModal(node.id, node.type);
        }
    }, [config, openNodeModal]);

    // Drag and drop handlers
    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        if (!config.enableDragAndDrop) return;

        setDragType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, [setDragType, config.enableDragAndDrop]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        if (!config.enableDragAndDrop) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, [config.enableDragAndDrop]);

    const onDrop = useCallback((event: React.DragEvent) => {
        if (!config.enableDragAndDrop || !dragType) return;

        event.preventDefault();

        if (reactFlowWrapper.current) {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Find the node config for default data
            const nodeConfig = config.availableNodes?.find(node => node.type === dragType);

            handleAddNode(dragType, nodeConfig?.defaultData || {}, position);
        }

        setDragType(null);
    }, [dragType, screenToFlowPosition, handleAddNode, setDragType, config.enableDragAndDrop, config.availableNodes]);

    return (
        <div
            className={`relative ${config.className || ''}`}
            style={{ height: config.height || '100%' }}
            ref={reactFlowWrapper}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
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
                {config.showBackground && (
                    <Background color="#aaa" gap={16} className="dark:opacity-20" />
                )}

                {config.showControls && (
                    <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                )}

                {config.showMiniMap && (
                    <MiniMap
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        maskColor="rgba(0, 0, 0, 0.1)"
                    />
                )}

                {config.showToolbar && (
                    <Panel position="top-left" className="m-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border">
                            {config.allowNodeCreation && config.availableNodes && (
                                <>
                                    {config.availableNodes.map(({ type, label, icon, defaultData }) => {
                                        const IconComponent = iconMap[icon as keyof typeof iconMap];
                                        return (
                                            <Button
                                                key={type}
                                                onClick={() => handleAddNode(type, defaultData, undefined, true)} // Pass true to open modal
                                                onDragStart={(e) => onDragStart(e, type)}
                                                draggable={config.enableDragAndDrop}
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
                                            >
                                                {IconComponent && <IconComponent className="w-4 h-4" />}
                                                {label}
                                            </Button>

                                        );
                                    })}
                                    <div className="w-px h-6 bg-gray-300 mx-1" />
                                </>
                            )}

                            {config.allowUndo && (
                                <>
                                    <Button
                                        onClick={undo}
                                        size="sm"
                                        variant="ghost"
                                        title="Undo"
                                        disabled={!canUndo}
                                    >
                                        <Undo className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={redo}
                                        size="sm"
                                        variant="ghost"
                                        title="Redo"
                                        disabled={!canRedo}
                                    >
                                        <Redo className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </Panel>
                )}

                {children}
            </ReactFlow>

            {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Start Planning</h3>
                        <p className="text-sm">
                            {config.allowNodeCreation
                                ? config.enableDragAndDrop
                                    ? "Click or drag items from the toolbar above"
                                    : "Add items using the toolbar above"
                                : "No items to display"
                            }
                        </p>
                    </div>
                </div>
            )}

            <UniversalModal
                isOpen={isModalOpen}
                nodeId={modalNodeId}
                nodeType={modalNodeType}
                onClose={closeModal}
            />
        </div>
    );
};

const FlowWithDnD: React.FC<FlowProps> = (props) => {
    return (
        <DnDProvider>
            <FlowInner {...props} />
        </DnDProvider>
    );
};

export const Flow: React.FC<FlowProps> = (props) => {
    return (
        <ReactFlowProvider>
            <FlowWithDnD {...props} />
        </ReactFlowProvider>
    );
};
