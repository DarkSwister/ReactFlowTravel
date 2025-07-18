import React, { useEffect } from 'react';
import { useFlowPersistence } from './useFlowPersistence';
import { useFlowConfig } from './useFlowConfig';
import { useFlowState } from './useFlowState';
import { useFlowHandlers } from './useFlowHandlers';
import { useFlowModal } from './useFlowModal';
import { getNodeTypes } from '@/shared/lib/react-flow/nodeRegistry';
import { FlowConfig } from '@/shared/types/flowConfig';

interface UseFlowCanvasProps {
    slice: string;
    configOverrides: Partial<FlowConfig>;
    isAuthorized: boolean;
    reactFlowWrapper: React.RefObject<HTMLDivElement>;
    // Add new props for planner integration
    initialNodes?: any[];
    initialEdges?: any[];
    plannerId?: number;
}

export const useFlowCanvas = ({
                                  slice,
                                  configOverrides,
                                  isAuthorized,
                                  reactFlowWrapper,
                                  initialNodes,
                                  initialEdges,
                                  plannerId
                              }: UseFlowCanvasProps) => {
    // Initialize persistence
    useFlowPersistence({
        onDataExpired: () => console.log('Flow diagram data has expired and been cleared'),
    });

    const config = useFlowConfig(slice, isAuthorized, configOverrides);
    const { nodes, edges, actions } = useFlowState();
    const handlers = useFlowHandlers(config, actions, reactFlowWrapper);
    const modal = useFlowModal();

    // For now, let's just log the initial data and handle it in the component
    // You can implement proper store methods later
    useEffect(() => {
        if (initialNodes || initialEdges) {
            console.log('Initial data received:', { initialNodes, initialEdges });
        }
    }, [initialNodes, initialEdges]);

    // getNodeTypes() is cached internally, so we can call it directly
    const nodeTypes = getNodeTypes();
    const isEmpty = nodes.length === 0;

    return {
        config,
        nodes: initialNodes && initialNodes.length > 0 ? initialNodes : nodes,
        edges: initialEdges && initialEdges.length > 0 ? initialEdges : edges,
        nodeTypes,
        handlers,
        modal,
        isEmpty
    };
};
