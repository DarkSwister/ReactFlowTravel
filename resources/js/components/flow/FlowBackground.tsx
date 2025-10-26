import React from 'react';
import { Background } from '@xyflow/react';

interface FlowBackgroundProps {
    show: boolean;
}

export const FlowBackground: React.FC<FlowBackgroundProps> = ({ show }) => {
    if (!show) return null;

    return <Background color="#aaa" gap={16} className="dark:opacity-20" />;
};
