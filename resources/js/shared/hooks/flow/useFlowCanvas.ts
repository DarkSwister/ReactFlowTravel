import React, { useMemo } from 'react';
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
}

export const useFlowCanvas = ({
                                  slice,
                                  configOverrides,
                                  isAuthorized,
                                  reactFlowWrapper
                              }: UseFlowCanvasProps) => {
    // Initialize persistence
    // useFlowPersistence({
    //     onDataExpired: () => console.log('Flow diagram data has expired and been cleared'),
    // });

    const config = useFlowConfig(slice, isAuthorized, configOverrides);
    const { nodes, edges, actions } = useFlowState();
    const handlers = useFlowHandlers(config, actions, reactFlowWrapper);
    const modal = useFlowModal();

    const nodeTypes = useMemo(() => getNodeTypes(), []);
    const isEmpty = nodes.length === 0;

    return {
        config,
        nodes,
        edges,
        nodeTypes,
        handlers,
        modal,
        isEmpty
    };
};
