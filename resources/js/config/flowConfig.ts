import { FlowConfig } from '@/types/flowConfig';

/**
 * Get default flow configuration based on authorization status
 */
export const getDefaultFlowConfig = (isAuthorized: boolean): FlowConfig => {
    return {
        showToolbar: true,
        showControls: true,
        showMiniMap: false,
        showBackground: true,
        allowNodeCreation: true,
        allowNodeEditing: true,
        allowNodeDeletion: true,
        allowNodeModal: true,
        allowNodeModalApiCalls: isAuthorized,
        allowUndo: isAuthorized,
        fitView: false,
        enableDragAndDrop: true,
        defaultViewport: { x: 0, y: 0, zoom: 1 },
    };
};
