import React from 'react';

export interface FlowConfig {
    enableDragAndDrop?: boolean;
    showToolbar?: boolean;
    showControls?: boolean;
    showMiniMap?: boolean;
    showBackground?: boolean;
    allowNodeCreation?: boolean;
    allowNodeEditing?: boolean;
    allowNodeDeletion?: boolean;
    allowNodeModal?: boolean;
    allowNodeModalApiCalls?: boolean;
    allowUndo?: boolean;
    fitView?: boolean;
    defaultViewport?: { x: number; y: number; zoom: number };
    minZoom?: number;
    maxZoom?: number;
    onSave?: (flowData: { nodes: any[]; edges: any[]; viewport: any }) => Promise<void>;
    className?: string;
    height?: string;
    onNodeClick?: (nodeId: string, nodeType: string) => void;
    onCanvasClick?: () => void;
    snapGrid?: Array<number>;
}
