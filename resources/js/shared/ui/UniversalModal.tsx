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

interface UniversalModalProps {
    isOpen: boolean;
    nodeId: string | null;
    nodeType: string | null;
    onClose: () => void;
}

export const UniversalModal: React.FC<UniversalModalProps> = ({
                                                                  isOpen,
                                                                  nodeId,
                                                                  nodeType,
                                                                  onClose,
                                                              }) => {
    const nodes = useFlowStore((state) => state.nodes);

    if (!isOpen || !nodeId || !nodeType || !nodeHasModal(nodeType)) {
        return null;
    }


    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        return null;
    }

    // Get the registered modal component for this node type
    const ModalComponent = getRegisteredModal(nodeType);

    if (!ModalComponent) {
        console.warn(`Node type ${nodeType} is marked as having a modal but no modal component is registered`);
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

                {/* Render the registered modal component */}
                <ModalComponent node={node} onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
};
