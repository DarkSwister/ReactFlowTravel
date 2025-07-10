import { FlowConfig } from '@/shared/types/flowConfig';
import { getAvailableNodes } from '@/shared/lib/react-flow/nodeRegistry';

export const createBaseFlowConfig = (category: string): FlowConfig => ({
    showToolbar: true,
    showControls: true,
    showMiniMap: true,
    showBackground: true,
    allowNodeCreation: true,
    allowNodeEditing: true,
    allowNodeDeletion: true,
    allowUndo: true,
    fitView: true,
    availableNodes: getAvailableNodes(category),
    enableDragAndDrop: true,
});

export const createUnauthorizedConfig = (category: string): FlowConfig => ({
    ...createBaseFlowConfig(category),
    allowNodeCreation: false,
    allowNodeEditing: false,
    allowNodeDeletion: false,
    allowUndo: false,
    showMiniMap: false,
    enableDragAndDrop: false,
});

export const createAuthorizedConfig = (category: string): FlowConfig => ({
    ...createBaseFlowConfig(category),
    enableDragAndDrop: true,
});

// Slice-specific configs
export const getTravelConfig = (isAuthorized: boolean): FlowConfig => {
    const baseConfig = isAuthorized
        ? createAuthorizedConfig('travel')
        : createUnauthorizedConfig('travel');

    return {
        ...baseConfig,
        // Travel-specific overrides
        showMiniMap: isAuthorized, // Travel users get minimap
        height: '600px', // Taller for travel
        fitView: true,
    };
};

export const getBusinessConfig = (isAuthorized: boolean): FlowConfig => {
    const baseConfig = isAuthorized
        ? createAuthorizedConfig('business')
        : createUnauthorizedConfig('business');

    return {
        ...baseConfig,
        // Business-specific overrides
        showMiniMap: true, // Business always shows minimap
        defaultViewport: { x: 0, y: 0, zoom: 0.8 }, // Different default zoom
        snapGrid: [20, 20], // Tighter grid for business
    };
};

// Config factory
export const getSliceConfig = (slice: string, isAuthorized: boolean): FlowConfig => {
    switch (slice) {
        case 'travel':
            return getTravelConfig(isAuthorized);
        case 'business':
            return getBusinessConfig(isAuthorized);
        default:
            return getTravelConfig(isAuthorized); // Default fallback
    }
};
