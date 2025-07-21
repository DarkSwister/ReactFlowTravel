import React from 'react';

export interface FlowConfig {
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
    onSave?: (flowData: { nodes: any[]; edges: any[]; viewport: any }) => Promise<void>;
    className?: string;
    height?: string;
    onNodeClick?: (nodeId: string, nodeType: string) => void;
    onCanvasClick?: () => void;
    enableDragAndDrop?: boolean;
    snapGrid?: Array<number>;
}

export interface FlowProps {
    config: FlowConfig;
    children?: React.ReactNode;
}
