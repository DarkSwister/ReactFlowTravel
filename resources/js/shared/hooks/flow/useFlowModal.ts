import {
    useIsModalOpen,
    useModalNodeId,
    useModalNodeType,
    useFlowStore,
} from '@/app/store/flowStore';

export const useFlowModal = () => {
    const isOpen = useIsModalOpen();
    const nodeId = useModalNodeId();
    const nodeType = useModalNodeType();
    const onClose = useFlowStore((state) => state.closeModal);

    return {
        isOpen,
        nodeId,
        nodeType,
        onClose,
    };
};
