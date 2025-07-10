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
    useStore?: boolean;
}

// ✅ Even cleaner: spread all props
const FlowWithProviders: React.FC<FlowProps> = (props) => (
    <DnDProvider>
        <FlowCanvas {...props} />
    </DnDProvider>
);

export const Flow: React.FC<FlowProps> = (props) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Flow render', props);
    }

    return (
        <ReactFlowProvider>
            <FlowWithProviders {...props} />
        </ReactFlowProvider>
    );
};
