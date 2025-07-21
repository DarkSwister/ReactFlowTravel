import { FlowConfig } from '@/shared/types/flowConfig';
import { getAvailableNodes } from '@/shared/lib/react-flow/nodeRegistry';

// Import slices to ensure they're loaded
import '@/slices/travel';
// import '@/slices/business'; // when you add more

interface SliceConfig {
    authorized: Partial<FlowConfig>;
    unauthorized: Partial<FlowConfig>;
}

const SLICE_CONFIGS: Record<string, SliceConfig> = {
    travel: {
        authorized: {
            showToolbar: true,
            showControls: true,
            showMiniMap: false,
            showBackground: true,
            allowNodeCreation: true,
            allowNodeEditing: true,
            allowNodeDeletion: true,
            allowUndo: true,
            fitView: true,
            enableDragAndDrop: true,
        },
        unauthorized: {
            showToolbar: true,
            showControls: true,
            showMiniMap: false,
            showBackground: true,
            allowNodeCreation: true,
            allowNodeEditing: true,
            allowNodeDeletion: true,
            allowUndo: true,
            fitView: true,
            enableDragAndDrop: true,
        }
    },
    business: {
        authorized: {
            showToolbar: true,
            showControls: true,
            showMiniMap: true,
            showBackground: true,
            allowNodeCreation: true,
            allowNodeEditing: true,
            allowNodeDeletion: true,
            allowUndo: true,
            fitView: true,
            enableDragAndDrop: true,
            snapGrid: [20, 20], // Tighter grid for business
        },
        unauthorized: {
            showToolbar: true,
            showControls: true,
            showMiniMap: false,
            showBackground: true,
            allowNodeCreation: true,
            allowNodeEditing: true,
            allowNodeDeletion: true,
            allowUndo: true,
            fitView: true,
            enableDragAndDrop: true,
        }
    }
};

export const getSliceConfig = (slice: string, isAuthorized: boolean): FlowConfig => {
    const sliceConfig = SLICE_CONFIGS[slice] || SLICE_CONFIGS.travel;
    const config = isAuthorized ? sliceConfig.authorized : sliceConfig.unauthorized;

    return {
        // Base defaults
        showToolbar: true,
        showControls: true,
        showMiniMap: false,
        showBackground: true,
        allowNodeCreation: true,
        allowNodeEditing: true,
        allowNodeDeletion: true,
        allowUndo: true,
        fitView: true,
        enableDragAndDrop: true,
        availableNodes: getAvailableNodes(slice),
        // Apply slice-specific config
        ...config,
    };
};
