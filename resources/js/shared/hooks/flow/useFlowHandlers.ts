import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useDnD } from '@/shared/ui/DnDContext';
import { FlowConfig } from '@/shared/types/flowConfig';

export const useFlowHandlers = (
    config: FlowConfig,
    actions: any,
    reactFlowWrapper: React.RefObject<HTMLDivElement>
) => {
    const { screenToFlowPosition } = useReactFlow();
    const [dragType, setDragType] = useDnD();

    const generateNodeId = useCallback(() =>
        `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []
    );

    const handleAddNode = useCallback((
        nodeType: string,
        defaultData: any = {},
        position?: { x: number; y: number }
    ) => {
        if (!config.allowNodeCreation) return;

        const newNode = {
            id: generateNodeId(),
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

        actions.addNode(newNode);
    }, [config.allowNodeCreation, generateNodeId, actions]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        if (config?.onNodeClick) {
            config.onNodeClick(node.id, node.type);
        } else if (config?.allowNodeEditing) {
            actions.openNodeModal(node.id, node.type);
        }
    }, [config, actions.openNodeModal]);

    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        if (!config?.enableDragAndDrop) return;
        setDragType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, [setDragType, config?.enableDragAndDrop]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        if (!config?.enableDragAndDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, [config?.enableDragAndDrop]);

    const onDrop = useCallback((event: React.DragEvent) => {
        if (!config?.enableDragAndDrop || !dragType) return;
        event.preventDefault();

        if (reactFlowWrapper.current) {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const nodeConfig = config.availableNodes?.find((node) => node.type === dragType);
            handleAddNode(dragType, nodeConfig?.defaultData || {}, position);
        }

        setDragType(null);
    }, [dragType, screenToFlowPosition, handleAddNode, setDragType, config]);

    return {
        onNodesChange: actions.onNodesChange,
        onEdgesChange: actions.onEdgesChange,
        onConnect: actions.onConnect,
        onNodeClick,
        onDragStart,
        onDragOver,
        onDrop,
        handleAddNode,
        actions,
    };
};
