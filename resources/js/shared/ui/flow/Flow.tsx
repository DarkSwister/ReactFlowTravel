import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DnDProvider } from '../DnDContext';
import { FlowCanvas } from './FlowCanvas';
import { FlowConfig } from '@/shared/types/flowConfig';

interface FlowProps {
    slice?: string;
    configOverrides?: Partial<FlowConfig>;
    children?: React.ReactNode;
    // Flow data props
    initialNodes?: any[];
    initialEdges?: any[];
    initialViewport?: { x: number; y: number; zoom: number };
    plannerId?: number;
}

const FlowWithProviders: React.FC<FlowProps> = (props) => (
    <DnDProvider>
        <FlowCanvas {...props} />
    </DnDProvider>
);

export const Flow: React.FC<FlowProps> = (props) => {
    return (
        <ReactFlowProvider>
            <FlowWithProviders {...props} />
        </ReactFlowProvider>
    );
};
