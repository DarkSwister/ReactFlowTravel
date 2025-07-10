import {
    useNodes,
    useEdges,
    useFlowStore,
    useCanUndo,
    useCanRedo,
    useUndo,
    useRedo,
} from '@/app/store/flowStore';

export const useFlowState = () => {
    const nodes = useNodes();
    const edges = useEdges();

    const actions = {
        onNodesChange: useFlowStore((state) => state.onNodesChange),
        onEdgesChange: useFlowStore((state) => state.onEdgesChange),
        onConnect: useFlowStore((state) => state.onConnect),
        addNode: useFlowStore((state) => state.addNode),
        resetFlow: useFlowStore((state) => state.resetFlow),
        openNodeModal: useFlowStore((state) => state.openNodeModal),
        canUndo: useCanUndo(),
        canRedo: useCanRedo(),
        undo: useUndo(),
        redo: useRedo(),
    };

    return { nodes, edges, actions };
};
