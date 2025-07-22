import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Built-in save function - same logic for all pages
const saveFlowToBackend = async (plannerId: number, nodes: Node[], edges: Edge[], viewport: { x: number; y: number; zoom: number }) => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (!csrfToken) {
        throw new Error('CSRF token not found');
    }

    console.log('💾 Saving flow to backend for planner:', plannerId);

    const response = await fetch(route('planners.save-flow', plannerId), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
        },
        body: JSON.stringify({
            nodes,
            edges,
            viewport,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Save failed: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }

    return response.json();
};

export interface NodeData {
    label: string;
    [key: string]: any;
}

export interface FlowSnapshot {
    nodes: Node[];
    edges: Edge[];
    timestamp: number;
}

export interface FlowState {
    // Core state
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
    plannerId: number | null;

    // History for undo/redo
    history: FlowSnapshot[];
    historyIndex: number;
    maxHistorySize: number;

    // Auto-save state
    autoSaveEnabled: boolean;
    autoSaveDelay: number;
    saveTimeoutId: NodeJS.Timeout | null;
    isSyncing: boolean;
    lastSyncedAt: number | null;
    pendingChanges: boolean;

    // Modal state
    modalState: {
        isOpen: boolean;
        nodeId: string | null;
        nodeType: string | null;
        nodeData: any;
    };

    // Selection state
    selectedNodeId: string | null;

    // Core operations
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    // Node management
    addNode: (node: Node) => void;
    updateNode: (nodeId: string, updates: Partial<Node>) => void;
    updateNodeData: (nodeId: string, data: Partial<NodeData>, saveStrategy?: 'auto' | 'immediate' | 'none') => void;
    updateNodeDataImmediate: (nodeId: string, data: Partial<NodeData>) => void;
    updateNodeDataCanvas: (nodeId: string, data: Partial<NodeData>) => void;
    deleteNode: (nodeId: string) => void;
    getNode: (nodeId: string) => Node | undefined;

    // History management
    saveToHistory: (markAsPending: boolean) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Auto-save management
    enableAutoSave: (enabled: boolean, delay?: number) => void;
    triggerAutoSave: () => void;
    cancelAutoSave: () => void;
    forceSave: () => Promise<void>;

    // Backend sync
    syncToBackend: () => Promise<void>;
    setPlannerId: (id: number | null) => void;

    // Modal management
    openNodeModal: (nodeId: string, nodeType: string) => void;
    closeModal: () => void;
    updateModalNodeData: (data: any) => void;

    // Selection
    setSelectedNodeId: (id: string | null) => void;

    // Utility
    resetFlow: () => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    initializeFlow: (nodes: Node[], edges: Edge[], viewport?: { x: number; y: number; zoom: number }) => void;
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}

export const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            // Initial state
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            plannerId: null,
            history: [],
            historyIndex: -1,
            maxHistorySize: 10,
            autoSaveEnabled: false,
            autoSaveDelay: 5000,
            saveTimeoutId: null,
            isSyncing: false,
            lastSyncedAt: null,
            pendingChanges: false,
            modalState: {
                isOpen: false,
                nodeId: null,
                nodeType: null,
                nodeData: null,
            },
            selectedNodeId: null,

            setPlannerId: (id: number | null) => {
                const state = get();

                const isActuallySwitching = state.plannerId !== id && !(state.plannerId === null && id === null);
                // If switching to a different planner, clear the flow
                if (isActuallySwitching) {
                    console.log('🔄 Switching planner context, clearing flow');
                    set({
                        plannerId: id,
                        nodes: [],
                        edges: [],
                        viewport: { x: 0, y: 0, zoom: 1 },
                        history: [],
                        historyIndex: -1,
                        pendingChanges: false,
                    });
                } else {
                    console.log('✅ Same planner context, keeping data');
                    set({ plannerId: id });
                }

                // Enable auto-save only for authenticated users with planner ID
                state.enableAutoSave(!!id);
            },

            setViewport: (viewport: { x: number; y: number; zoom: number }) => {
                set({ viewport });
            },

            // Auto-save management
            enableAutoSave: (enabled: boolean, delay?: number) => {
                const state = get();

                if (!enabled && state.saveTimeoutId) {
                    clearTimeout(state.saveTimeoutId);
                }

                set({
                    autoSaveEnabled: enabled,
                    autoSaveDelay: delay || state.autoSaveDelay,
                    saveTimeoutId: enabled ? state.saveTimeoutId : null,
                });

                console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
            },

            triggerAutoSave: () => {
                const state = get();

                if (!state.autoSaveEnabled || !state.plannerId || !state.pendingChanges || state.isSyncing) {
                    return;
                }

                // Cancel existing timeout
                if (state.saveTimeoutId) {
                    clearTimeout(state.saveTimeoutId);
                }

                // Set new debounced timeout
                const timeoutId = setTimeout(() => {
                    const currentState = get();
                    if (currentState.pendingChanges && !currentState.isSyncing && currentState.plannerId) {
                        console.log('⏰ Auto-save triggered');
                        currentState.syncToBackend().catch(console.error);
                    }
                }, state.autoSaveDelay);

                set({ saveTimeoutId: timeoutId });
            },

            cancelAutoSave: () => {
                const state = get();
                if (state.saveTimeoutId) {
                    clearTimeout(state.saveTimeoutId);
                    set({ saveTimeoutId: null });
                }
            },

            forceSave: async () => {
                const state = get();
                state.cancelAutoSave();
                console.log('🔄 Forcing save');
                if (state.pendingChanges && state.plannerId) {
                    await state.syncToBackend();
                }
            },

            syncToBackend: async () => {
                const state = get();

                if (!state.plannerId || state.isSyncing || !state.pendingChanges) {
                    return;
                }

                try {
                    set({ isSyncing: true });

                    await saveFlowToBackend(state.plannerId, state.nodes, state.edges, state.viewport);

                    set({
                        isSyncing: false,
                        lastSyncedAt: Date.now(),
                        pendingChanges: false,
                        saveTimeoutId: null,
                    });

                    console.log('✅ Flow synced successfully');
                } catch (error) {
                    console.error('❌ Failed to sync flow:', error);
                    set({ isSyncing: false });
                    throw error;
                }
            },

            // History management
            saveToHistory: (markAsPending: boolean = true) => {
                const state = get();
                const snapshot: FlowSnapshot = {
                    nodes: [...state.nodes],
                    edges: [...state.edges],
                    timestamp: Date.now(),
                };

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(snapshot);

                if (newHistory.length > state.maxHistorySize) {
                    newHistory.shift();
                } else {
                    set({ historyIndex: state.historyIndex + 1 });
                }

                set({
                    history: newHistory,
                    pendingChanges: markAsPending,
                });
            },

            // ReactFlow operations
            onNodesChange: (changes: NodeChange[]) => {
                const state = get();

                const significantChanges = changes.some(change =>
                    change.type === 'remove' ||
                    change.type === 'add' ||
                    (change.type === 'position' && change.dragging === false)
                );

                if (significantChanges) {
                    state.saveToHistory(true);
                }

                const newNodes = applyNodeChanges(changes, state.nodes);
                const hasChanges = JSON.stringify(newNodes) !== JSON.stringify(state.nodes);

                set({
                    nodes: newNodes,
                    pendingChanges: hasChanges || state.pendingChanges,
                });

                if (hasChanges && significantChanges) {
                    state.triggerAutoSave();
                }
            },

            onEdgesChange: (changes: EdgeChange[]) => {
                const state = get();

                const significantChanges = changes.some(change => change.type === 'remove' || change.type === 'add');

                if (significantChanges) {
                    state.saveToHistory(true);
                }

                const newEdges = applyEdgeChanges(changes, state.edges);
                const hasChanges = JSON.stringify(newEdges) !== JSON.stringify(state.edges);

                set({
                    edges: newEdges,
                    pendingChanges: hasChanges || state.pendingChanges,
                });

                if (hasChanges) {
                    state.triggerAutoSave();
                }
            },

            onConnect: (connection: Connection) => {
                const state = get();
                state.saveToHistory(true);

                set({
                    edges: addEdge(connection, state.edges),
                    pendingChanges: true,
                });

                state.triggerAutoSave();
            },

            // Node management
            addNode: (node: Node) => {
                const state = get();
                state.saveToHistory(true);

                set(state => ({
                    nodes: [...state.nodes, node],
                    pendingChanges: true,
                }));

                state.triggerAutoSave();
            },

            updateNode: (nodeId: string, updates: Partial<Node>) => {
                set(state => ({
                    nodes: state.nodes.map(node => node.id === nodeId ? { ...node, ...updates } : node),
                    pendingChanges: true,
                }));

                get().triggerAutoSave();
            },

            updateNodeData: (nodeId: string, data: Partial<NodeData>, saveStrategy: 'auto' | 'immediate' | 'none' = 'auto') => {
                const state = get();
                const existingNode = state.nodes.find(n => n.id === nodeId);

                if (!existingNode) return;

                const hasChanges = JSON.stringify({ ...existingNode.data, ...data }) !== JSON.stringify(existingNode.data);
                if (!hasChanges) return;

                set(state => ({
                    nodes: state.nodes.map(node =>
                        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
                    ),
                    pendingChanges: true,
                }));

                if (state.modalState.nodeId === nodeId) {
                    set(state => ({
                        modalState: {
                            ...state.modalState,
                            nodeData: { ...state.modalState.nodeData, ...data },
                        },
                    }));
                }

                switch (saveStrategy) {
                    case 'immediate':
                        state.forceSave().catch(console.error);
                        break;
                    case 'auto':
                        state.triggerAutoSave();
                        break;
                }
            },

            updateNodeDataImmediate: (nodeId: string, data: Partial<NodeData>) => {
                get().updateNodeData(nodeId, data, 'immediate');
            },

            updateNodeDataCanvas: (nodeId: string, data: Partial<NodeData>) => {
                get().updateNodeData(nodeId, data, 'auto');
            },

            deleteNode: (nodeId: string) => {
                const state = get();
                state.saveToHistory(true);

                set(state => ({
                    nodes: state.nodes.filter(node => node.id !== nodeId),
                    edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
                    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
                    modalState: state.modalState.nodeId === nodeId
                        ? { isOpen: false, nodeId: null, nodeType: null, nodeData: null }
                        : state.modalState,
                    pendingChanges: true,
                }));

                state.triggerAutoSave();
            },

            getNode: (nodeId: string) => {
                return get().nodes.find(node => node.id === nodeId);
            },

            undo: () => {
                const state = get();
                if (!state.canUndo()) return;

                const previousSnapshot = state.history[state.historyIndex - 1];
                if (previousSnapshot) {
                    set({
                        nodes: [...previousSnapshot.nodes],
                        edges: [...previousSnapshot.edges],
                        historyIndex: state.historyIndex - 1,
                        pendingChanges: true,
                    });
                    state.triggerAutoSave();
                }
            },

            redo: () => {
                const state = get();
                if (!state.canRedo()) return;

                const nextSnapshot = state.history[state.historyIndex + 1];
                if (nextSnapshot) {
                    set({
                        nodes: [...nextSnapshot.nodes],
                        edges: [...nextSnapshot.edges],
                        historyIndex: state.historyIndex + 1,
                        pendingChanges: true,
                    });
                    state.triggerAutoSave();
                }
            },

            canUndo: () => {
                const state = get();
                return state.historyIndex > 0;
            },

            canRedo: () => {
                const state = get();
                return state.historyIndex < state.history.length - 1;
            },

            // Modal management
            openNodeModal: (nodeId: string, nodeType: string) => {
                const state = get();
                const node = state.nodes.find(n => n.id === nodeId);

                if (!node) {
                    console.warn(`Attempted to open modal for non-existent node: ${nodeId}`);
                    return;
                }

                set({
                    modalState: {
                        isOpen: true,
                        nodeId,
                        nodeType,
                        nodeData: node.data,
                    },
                });
            },

            closeModal: () => {
                const state = get();

                if (state.modalState.nodeId && state.pendingChanges) {
                    state.forceSave().catch(console.error);
                }

                set({
                    modalState: {
                        isOpen: false,
                        nodeId: null,
                        nodeType: null,
                        nodeData: null,
                    },
                });
            },

            updateModalNodeData: (data: any) => {
                const state = get();
                if (state.modalState.nodeId) {
                    state.updateNodeDataImmediate(state.modalState.nodeId, data);
                }
            },

            setSelectedNodeId: (id: string | null) => {
                set({ selectedNodeId: id });
            },

            // Utility operations
            resetFlow: () => {
                const state = get();
                state.saveToHistory(false);

                set({
                    nodes: [],
                    edges: [],
                    selectedNodeId: null,
                    modalState: {
                        isOpen: false,
                        nodeId: null,
                        nodeType: null,
                        nodeData: null,
                    },
                    pendingChanges: true,
                });

                state.triggerAutoSave();
            },

            setNodes: (nodes: Node[]) => {
                set({ nodes, pendingChanges: true });
                get().triggerAutoSave();
            },

            setEdges: (edges: Edge[]) => {
                set({ edges, pendingChanges: true });
                get().triggerAutoSave();
            },

            initializeFlow: (nodes: Node[], edges: Edge[], viewport?: { x: number; y: number; zoom: number }) => {
                console.log('🚀 Initializing flow with', nodes.length, 'nodes and', edges.length, 'edges');

                const currentState = get();
                if (currentState.saveTimeoutId) {
                    clearTimeout(currentState.saveTimeoutId);
                }

                set({
                    nodes,
                    edges,
                    viewport: viewport || { x: 0, y: 0, zoom: 1 },
                    history: [],
                    historyIndex: -1,
                    pendingChanges: false,
                    lastSyncedAt: Date.now(),
                    isSyncing: false,
                });

                // Save initial state to history
                const snapshot: FlowSnapshot = {
                    nodes: [...nodes],
                    edges: [...edges],
                    timestamp: Date.now(),
                };

                set({
                    history: [snapshot],
                    historyIndex: 0,
                });

                console.log('✅ Flow initialized');
            },
        }),
        {
            name: 'reactflow-travel-store',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                viewport: state.viewport,
                plannerId: state.plannerId,
                autoSaveEnabled: state.autoSaveEnabled,
                autoSaveDelay: state.autoSaveDelay,
            }),
        },
    ),
);


// Selector hooks for better performance
export const useNodes = () => useFlowStore(state => state.nodes);
export const useEdges = () => useFlowStore(state => state.edges);
export const useCanUndo = () => useFlowStore(state => state.canUndo());
export const useCanRedo = () => useFlowStore(state => state.canRedo());
export const useUndo = () => useFlowStore(state => state.undo);
export const useRedo = () => useFlowStore(state => state.redo);
export const useIsSyncing = () => useFlowStore(state => state.isSyncing);
export const usePendingChanges = () => useFlowStore(state => state.pendingChanges);
export const useModalState = () => useFlowStore(state => state.modalState);
export const useSelectedNodeId = () => useFlowStore(state => state.selectedNodeId);

export const useViewport = () => useFlowStore(state => state.viewport);

// Operation hooks for cleaner component code
export const useFlowOperations = () =>
    useFlowStore(state => ({
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        onConnect: state.onConnect,
        addNode: state.addNode,
        updateNode: state.updateNode,
        deleteNode: state.deleteNode,
        resetFlow: state.resetFlow,
        getNode: state.getNode,
    }));

export const useModalOperations = () =>
    useFlowStore(state => ({
        openNodeModal: state.openNodeModal,
        closeModal: state.closeModal,
        updateModalNodeData: state.updateModalNodeData,
    }));

export const useAutoSaveOperations = () =>
    useFlowStore(state => ({
        enableAutoSave: state.enableAutoSave,
        triggerAutoSave: state.triggerAutoSave,
        cancelAutoSave: state.cancelAutoSave,
        forceSave: state.forceSave,
    }));

export const useNodeOperations = () =>
    useFlowStore(state => ({
        updateNodeData: state.updateNodeData,
        updateNodeDataImmediate: state.updateNodeDataImmediate,
        updateNodeDataCanvas: state.updateNodeDataCanvas,
    }));
