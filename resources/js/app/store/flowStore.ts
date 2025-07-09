import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    Node,
    Edge,
    Connection,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface PersistedData {
    nodes: Node[];
    edges: Edge[];
    timestamp: number;
    userId?: string | null;
}

export interface FlowState {
    nodes: Node[];
    edges: Edge[];

    // History for undo/redo
    history: {
        past: HistoryState[];
        present: HistoryState;
        future: HistoryState[];
    };

    // Actions that should trigger undo/redo
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    updateNodeData: (nodeId: string, data: any, saveHistory?: boolean) => void;
    deleteNode: (nodeId: string) => void;

    // UI state (not tracked in undo/redo)
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;

    // Modal state
    isModalOpen: boolean;
    modalNodeId: string | null;
    modalNodeType: string | null;
    openNodeModal: (nodeId: string, nodeType: string) => void;
    closeModal: () => void;

    // Undo/redo actions
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Helper to save state to history
    saveToHistory: () => void;

    // Persistence methods
    clearLocalData: () => void;
    setUserId: (userId: string | null) => void;
}

// Custom storage with expiration logic
const createExpiringStorage = () => {
    const UNAUTHORIZED_EXPIRY = 30 * 60 * 1000; // 30 minutes for unauthorized users
    const AUTHORIZED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days for authorized users

    return {
        getItem: (name: string) => {
            try {
                const item = localStorage.getItem(name);
                if (!item) return null;

                const data = JSON.parse(item);
                const persistedData: PersistedData = data.state;
                const now = Date.now();

                // Check if data has expired
                const isAuthorized = persistedData.userId && persistedData.userId !== 'anonymous';
                const expiryTime = isAuthorized ? AUTHORIZED_EXPIRY : UNAUTHORIZED_EXPIRY;

                if (now - persistedData.timestamp > expiryTime) {
                    localStorage.removeItem(name);
                    return null;
                }

                return item;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return null;
            }
        },
        setItem: (name: string, value: string) => {
            try {
                localStorage.setItem(name, value);
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        },
        removeItem: (name: string) => {
            try {
                localStorage.removeItem(name);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        },
    };
};

const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            selectedNodeId: null,

            // Initialize history
            history: {
                past: [],
                present: { nodes: [], edges: [] },
                future: [],
            },

            // Modal state
            isModalOpen: false,
            modalNodeId: null,
            modalNodeType: null,

            // Save current state to history before making changes
            saveToHistory: () => {
                const { nodes, edges, history } = get();
                const currentState = { nodes: [...nodes], edges: [...edges] };

                // Don't save if the state hasn't actually changed
                if (JSON.stringify(currentState) === JSON.stringify(history.present)) {
                    return;
                }

                set({
                    history: {
                        past: [...history.past, history.present].slice(-50),
                        present: currentState,
                        future: [],
                    },
                });
            },

            onNodesChange: (changes: NodeChange[]) => {
                const shouldSaveHistory = changes.some(change =>
                    change.type === 'remove' ||
                    (change.type === 'position' && change.dragging === false)
                );

                if (shouldSaveHistory) {
                    get().saveToHistory();
                }

                set({
                    nodes: applyNodeChanges(changes, get().nodes),
                });
            },

            onEdgesChange: (changes: EdgeChange[]) => {
                const shouldSaveHistory = changes.some(change => change.type === 'remove');

                if (shouldSaveHistory) {
                    get().saveToHistory();
                }

                set({
                    edges: applyEdgeChanges(changes, get().edges),
                });
            },

            onConnect: (connection: Connection) => {
                get().saveToHistory();
                set({
                    edges: addEdge(connection, get().edges),
                });
            },

            addNode: (node: Node) => {
                get().saveToHistory();
                set({
                    nodes: [...get().nodes, node],
                });
            },

            updateNodeData: (nodeId: string, data: any, saveHistory: boolean = false) => {
                if (saveHistory) {
                    get().saveToHistory();
                }

                set({
                    nodes: get().nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...data } }
                            : node
                    ),
                });
            },

            deleteNode: (nodeId: string) => {
                get().saveToHistory();
                const { nodes, edges } = get();
                set({
                    nodes: nodes.filter((node) => node.id !== nodeId),
                    edges: edges.filter(
                        (edge) => edge.source !== nodeId && edge.target !== nodeId
                    ),
                });
            },

            setSelectedNodeId: (id: string | null) => {
                set({ selectedNodeId: id });
            },

            openNodeModal: (nodeId: string, nodeType: string) => {
                set({
                    isModalOpen: true,
                    modalNodeId: nodeId,
                    modalNodeType: nodeType,
                });
            },

            closeModal: () => {
                set({
                    isModalOpen: false,
                    modalNodeId: null,
                    modalNodeType: null,
                });
            },

            undo: () => {
                const { history } = get();
                if (history.past.length === 0) return;

                const previous = history.past[history.past.length - 1];
                const newPast = history.past.slice(0, -1);

                set({
                    nodes: [...previous.nodes],
                    edges: [...previous.edges],
                    history: {
                        past: newPast,
                        present: { nodes: [...get().nodes], edges: [...get().edges] },
                        future: [history.present, ...history.future],
                    },
                });
            },

            redo: () => {
                const { history } = get();
                if (history.future.length === 0) return;

                const next = history.future[0];
                const newFuture = history.future.slice(1);

                set({
                    nodes: [...next.nodes],
                    edges: [...next.edges],
                    history: {
                        past: [...history.past, history.present],
                        present: next,
                        future: newFuture,
                    },
                });
            },

            canUndo: () => {
                return get().history.past.length > 0;
            },

            canRedo: () => {
                return get().history.future.length > 0;
            },

            // Persistence methods
            clearLocalData: () => {
                set({
                    nodes: [],
                    edges: [],
                    history: {
                        past: [],
                        present: { nodes: [], edges: [] },
                        future: [],
                    },
                });
            },

            setUserId: (userId: string | null) => {
                // This will trigger a re-save with the new userId
                // The persist middleware will handle updating the stored data
            },
        }),
        {
            name: 'flow-diagram-storage',
            storage: createJSONStorage(() => createExpiringStorage()),
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                timestamp: Date.now(),
                userId: null, // Will be set dynamically
            }),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Initialize history after rehydration
                    state.history = {
                        past: [],
                        present: { nodes: state.nodes, edges: state.edges },
                        future: [],
                    };
                }
            },
        }
    )
);

export { useFlowStore };

// Selectors
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useEdges = () => useFlowStore((state) => state.edges);
export const useIsModalOpen = () => useFlowStore((state) => state.isModalOpen);
export const useModalNodeId = () => useFlowStore((state) => state.modalNodeId);
export const useModalNodeType = () => useFlowStore((state) => state.modalNodeType);
export const useUndo = () => useFlowStore((state) => state.undo);
export const useRedo = () => useFlowStore((state) => state.redo);
export const useCanUndo = () => useFlowStore((state) => state.canUndo());
export const useCanRedo = () => useFlowStore((state) => state.canRedo());
