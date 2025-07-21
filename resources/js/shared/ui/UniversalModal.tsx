import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { useFlowStore } from '@/app/store/flowStore';
import { getRegisteredModal, nodeHasModal } from '@/shared/lib/react-flow/nodeRegistry';

// Update interface to match the modalState structure from the store
interface UniversalModalProps {
    isOpen: boolean;
    nodeId: string | null;
    nodeType: string | null;
    nodeData: any;
    onClose: () => void;
}

export const UniversalModal: React.FC<UniversalModalProps> = ({
                                                                  isOpen,
                                                                  nodeId,
                                                                  nodeType,
                                                                  nodeData,
                                                                  onClose,
                                                              }) => {
    const nodes = useFlowStore((state) => state.nodes);

    if (!isOpen || !nodeId || !nodeType || !nodeHasModal(nodeType)) {
        return null;
    }

    // Try to get fresh node data from store, fallback to prop data
    let node = nodes.find(n => n.id === nodeId);

    if (!node && nodeData) {
        // Create temporary node object if not found in store
        node = {
            id: nodeId,
            type: nodeType,
            data: nodeData,
            position: { x: 0, y: 0 },
        };
    }

    if (!node) {
        console.warn(`Node ${nodeId} not found`);
        return null;
    }

    const ModalComponent = getRegisteredModal(nodeType);

    if (!ModalComponent) {
        console.warn(`No modal component registered for node type: ${nodeType}`);
        return null;
    }

    const getNodeTypeLabel = (type: string) => {
        switch (type) {
            case 'travel:flight':
                return 'Flight';
            case 'travel:booking':
                return 'Accommodation';
            default:
                return 'Node';
        }
    };

    const getNodeDescription = (type: string) => {
        switch (type) {
            case 'travel:flight':
                return 'Configure flight details including departure, arrival, dates, and price range.';
            case 'travel:booking':
                return 'Configure accommodation details including location, dates, and price range.';
            default:
                return 'Configure node settings.';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle>
                        Edit {getNodeTypeLabel(nodeType)}
                    </DialogTitle>
                    <DialogDescription>
                        {getNodeDescription(nodeType)}
                    </DialogDescription>
                </DialogHeader>

                <ModalComponent node={node} onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
};
