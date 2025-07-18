// Remove all store imports and simplify:
export const useFlowState = (initialNodes?: any[], initialEdges?: any[]) => {
    // For now, just return empty state - we're using local state in FlowCanvas
    return {
        nodes: initialNodes || [],
        edges: initialEdges || [],
        actions: {
            onNodesChange: () => {},
            onEdgesChange: () => {},
            onConnect: () => {},
            addNode: () => {},
            resetFlow: () => {},
            openNodeModal: () => {},
            canUndo: false,
            canRedo: false,
            undo: () => {},
            redo: () => {},
        }
    };
};
