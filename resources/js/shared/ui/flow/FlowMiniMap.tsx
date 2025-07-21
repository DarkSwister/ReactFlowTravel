import React from 'react';
import { MiniMap } from '@xyflow/react';

interface FlowMiniMapProps {
    show: boolean;
}

export const FlowMiniMap: React.FC<FlowMiniMapProps> = ({ show }) => {
    if (!show) return null;

    return (
        <MiniMap
            className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            maskColor="rgba(0, 0, 0, 0.1)"
        />
    );
};
