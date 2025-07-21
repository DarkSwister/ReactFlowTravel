import React from 'react';
import { Controls } from '@xyflow/react';

interface FlowControlsProps {
    show: boolean;
}

export const FlowControls: React.FC<FlowControlsProps> = ({ show }) => {
    if (!show) return null;

    return (
        <Controls className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" />
    );
};
