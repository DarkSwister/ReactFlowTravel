import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
} from '@xyflow/react';

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
    nodes: Node[];
    edges: Edge[];

    // History for undo/redo
    history: FlowSnapshot[];
    historyIndex: number;
    maxHistorySize: number;

    // Backend sync state
    isSyncing: boolean;
    lastSyncedAt: number | null;
    pendingChanges: boolean;
    plannerId: number | null;

    // Essential operations
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    // Node management with backend sync
    addNode: (node: Node, syncToBackend?: boolean) => Promise<void>;
    updateNodeData: <T extends NodeData = NodeData>(
        nodeId: string,
        data: Partial<T>,
        syncToBackend?: boolean
    ) => Promise<void>;
    deleteNode: (nodeId: string, syncToBackend?: boolean) => Promise<void>;

    // History management
    saveToHistory: () => void;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Backend sync
    syncToBackend: () => Promise<void>;
    loadFromBackend: (plannerId: number) => Promise<void>;
    setPlannerId: (id: number) => void;

    // Modal state
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    isModalOpen: boolean;
    modalNodeId: string | null;
    modalNodeType: string | null;
    openNodeModal: (nodeId: string, nodeType: string) => void;
    closeModal: () => void;

    // Basic operations
    resetFlow: () => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
}

// Backend API functions
const backendAPI = {
    async saveFlow(plannerId: number, nodes: Node[], edges: Edge[]) {
        const response = await fetch(`/api/planners/${plannerId}/flow`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({ nodes, edges }),
        });

        if (!response.ok) {
            throw new Error('Failed to save flow');
        }

        return response.json();
    },

    async loadFlow(plannerId: number) {
        const response = await fetch(`/api/planners/${plannerId}/flow`);

        if (!response.ok) {
            throw new Error('Failed to load flow');
        }

        return response.json();
    },

    async updateNode(plannerId: number, nodeId: string, data: Partial<NodeData>) {
        const response = await fetch(`/api/planners/${plannerId}/nodes/${nodeId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({ data }),
        });

        if (!response.ok) {
            throw new Error('Failed to update node');
        }

        return response.json();
    }
};

export const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            history: [],
            historyIndex: -1,
            maxHistorySize: 50,
            isSyncing: false,
            lastSyncedAt: null,
            pendingChanges: false,
            plannerId: null,
            selectedNodeId: null,
            isModalOpen: false,
            modalNodeId: null,
            modalNodeType: null,

            // Save current state to history
            saveToHistory: () => {
                const state = get();
                const snapshot: FlowSnapshot = {
                    nodes: [...state.nodes],
                    edges: [...state.edges],
                    timestamp: Date.now(),
                };

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(snapshot);

                // Limit history size
                if (newHistory.length > state.maxHistorySize) {
                    newHistory.shift();
                } else {
                    set({ historyIndex: state.historyIndex + 1 });
                }

                set({
                    history: newHistory,
                    pendingChanges: true
                });
            },

            // ReactFlow operations with history
            onNodesChange: (changes: NodeChange[]) => {
                const state = get();

                // Save to history before making changes
                if (changes.some(change => change.type === 'remove' || change.type === 'add')) {
                    state.saveToHistory();
                }

                set({
                    nodes: applyNodeChanges(changes, state.nodes),
                    pendingChanges: true,
                });
            },

            onEdgesChange: (changes: EdgeChange[]) => {
                const state = get();

                if (changes.some(change => change.type === 'remove' || change.type === 'add')) {
                    state.saveToHistory();
                }

                set({
                    edges: applyEdgeChanges(changes, state.edges),
                    pendingChanges: true,
                });
            },

            onConnect: (connection: Connection) => {
                const state = get();
                state.saveToHistory();

                set({
                    edges: addEdge(connection, state.edges),
                    pendingChanges: true,
                });
            },

            // Node management with backend sync
            addNode: async (node: Node, syncToBackend = true) => {
                const state = get();
                state.saveToHistory();

                set((state) => ({
                    nodes: [...state.nodes, node],
                    pendingChanges: true,
                }));

                if (syncToBackend && state.plannerId) {
                    try {
                        await state.syncToBackend();
                    } catch (error) {
                        console.error('Failed to sync node addition:', error);
                    }
                }
            },

            updateNodeData: async <T extends NodeData = NodeData>(
                nodeId: string,
                data: Partial<T>,
                syncToBackend = true
            ) => {
                const state = get();

                // Optimistic update
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...data } }
                            : node
                    ),
                    pendingChanges: true,
                }));

                // Sync to backend
                if (syncToBackend && state.plannerId) {
                    try {
                        set({ isSyncing: true });
                        await backendAPI.updateNode(state.plannerId, nodeId, data);
                        set({
                            isSyncing: false,
                            lastSyncedAt: Date.now(),
                            pendingChanges: false
                        });
                    } catch (error) {
                        console.error('Failed to sync node update:', error);
                        set({ isSyncing: false });

                        // Optionally revert the optimistic update
                        // You could implement a rollback mechanism here
                    }
                }
            },

            deleteNode: async (nodeId: string, syncToBackend = true) => {
                const state = get();
                state.saveToHistory();

                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== nodeId),
                    edges: state.edges.filter(
                        (edge) => edge.source !== nodeId && edge.target !== nodeId
                    ),
                    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
                    pendingChanges: true,
                }));

                if (syncToBackend && state.plannerId) {
                    try {
                        await state.syncToBackend();
                    } catch (error) {
                        console.error('Failed to sync node deletion:', error);
                    }
                }
            },

            // History operations
            undo: async () => {
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

                    // Sync the undone state to backend
                    if (state.plannerId) {
                        try {
                            await state.syncToBackend();
                        } catch (error) {
                            console.error('Failed to sync undo:', error);
                        }
                    }
                }
            },

            redo: async () => {
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

                    if (state.plannerId) {
                        try {
                            await state.syncToBackend();
                        } catch (error) {
                            console.error('Failed to sync redo:', error);
                        }
                    }
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

            // Backend sync
            syncToBackend: async () => {
                const state = get();
                if (!state.plannerId || state.isSyncing) return;

                try {
                    set({ isSyncing: true });
                    await backendAPI.saveFlow(state.plannerId, state.nodes, state.edges);
                    set({
                        isSyncing: false,
                        lastSyncedAt: Date.now(),
                        pendingChanges: false
                    });
                } catch (error) {
                    console.error('Failed to sync to backend:', error);
                    set({ isSyncing: false });
                    throw error;
                }
            },

            loadFromBackend: async (plannerId: number) => {
                try {
                    set({ isSyncing: true, plannerId });
                    const data = await backendAPI.loadFlow(plannerId);

                    set({
                        nodes: data.nodes || [],
                        edges: data.edges || [],
                        history: [],
                        historyIndex: -1,
                        isSyncing: false,
                        lastSyncedAt: Date.now(),
                        pendingChanges: false,
                    });

                    // Save initial state to history
                    get().saveToHistory();
                } catch (error) {
                    console.error('Failed to load from backend:', error);
                    set({ isSyncing: false });
                    throw error;
                }
            },

            setPlannerId: (id: number) => {
                set({ plannerId: id });
            },

            // Modal management
            setSelectedNodeId: (id: string | null) => {
                set({ selectedNodeId: id });
            },

            openNodeModal: (nodeId: string, nodeType: string) => {
                set((state) => {
                    const nodeExists = state.nodes.find(node => node.id === nodeId);
                    if (!nodeExists) {
                        console.warn(`Attempted to open modal for non-existent node: ${nodeId}`);
                        return state;
                    }

                    return {
                        ...state,
                        isModalOpen: true,
                        modalNodeId: nodeId,
                        modalNodeType: nodeType,
                    };
                });
            },

            closeModal: () => {
                set({
                    isModalOpen: false,
                    modalNodeId: null,
                    modalNodeType: null,
                });
            },

            // Basic operations
            resetFlow: () => {
                const state = get();
                state.saveToHistory();

                set({
                    nodes: [],
                    edges: [],
                    selectedNodeId: null,
                    isModalOpen: false,
                    modalNodeId: null,
                    modalNodeType: null,
                    pendingChanges: true,
                });
            },

            setNodes: (nodes: Node[]) => {
                set({ nodes, pendingChanges: true });
            },

            setEdges: (edges: Edge[]) => {
                set({ edges, pendingChanges: true });
            },
        }),
        {
            name: 'flow-storage',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                plannerId: state.plannerId,
                // Don't persist history to avoid localStorage bloat
            }),
        }
    )
);

// Updated selector hooks
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useEdges = () => useFlowStore((state) => state.edges);
export const useCanUndo = () => useFlowStore((state) => state.canUndo());
export const useCanRedo = () => useFlowStore((state) => state.canRedo());
export const useUndo = () => useFlowStore((state) => state.undo);
export const useRedo = () => useFlowStore((state) => state.redo);
export const useIsSyncing = () => useFlowStore((state) => state.isSyncing);
export const usePendingChanges = () => useFlowStore((state) => state.pendingChanges);
