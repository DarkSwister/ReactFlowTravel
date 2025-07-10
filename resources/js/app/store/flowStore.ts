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
import { shallow } from 'zustand/shallow';
import isEqual from 'fast-deep-equal/es6';

// Better deep clone with structured clone ponyfill
const deepClone = (obj: any) => {
    if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
    }
    // Use a more robust fallback
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.warn('Deep clone failed, returning original object:', error);
        return obj;
    }
};

// More accurate storage size calculation
const getByteSize = (str: string): number => {
    if (typeof Blob !== 'undefined') {
        return new Blob([str]).size;
    }
    // Fallback: approximate UTF-8 byte size
    return new TextEncoder().encode(str).length;
};

// Throttled history save to prevent excessive saves during drag operations
let historyThrottleTimeout: NodeJS.Timeout | null = null;
const throttleHistorySave = (callback: () => void, delay: number = 100) => {
    if (historyThrottleTimeout) {
        clearTimeout(historyThrottleTimeout);
    }
    historyThrottleTimeout = setTimeout(callback, delay);
};

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}
export interface NodeData extends Record<string, unknown> {
    label?: string;
    [key: string]: unknown;
}

export interface FlowState {
    nodes: Node[];
    edges: Edge[];
    userId: string | null;

    history: {
        past: HistoryState[];
        present: HistoryState;
        future: HistoryState[];
    };

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    updateNodeData: <T extends NodeData = NodeData>(nodeId: string, data: Partial<T>) => void;
    updateNodeDataAndSave: <T extends NodeData = NodeData>(nodeId: string, data: Partial<T>) => void;
    deleteNode: (nodeId: string) => void;

    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;

    isModalOpen: boolean;
    modalNodeId: string | null;
    modalNodeType: string | null;
    openNodeModal: (nodeId: string, nodeType: string) => void;
    closeModal: () => void;

    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    saveToHistory: () => void;
    saveToHistoryThrottled: () => void;

    clearLocalData: () => void;
    setUserId: (userId: string | null) => void;

    isValidSelection: () => boolean;
    getGraphSize: () => number;
    resetFlow: () => void;
    resetTimestamp: () => void;
}


const TIMESTAMP_KEY = 'flow-diagram-timestamp';
const USER_ID_KEY = 'flow-user-id';

const getFlowTimestamp = (): number | null => {
    try {
        const timestamp = localStorage.getItem(TIMESTAMP_KEY);
        return timestamp ? parseInt(timestamp, 10) : null;
    } catch {
        return null;
    }
};

const setFlowTimestamp = (timestamp: number) => {
    try {
        localStorage.setItem(TIMESTAMP_KEY, timestamp.toString());
        console.log('🕐 Set flow timestamp:', new Date(timestamp).toLocaleString());
    } catch (error) {
        console.error('Error setting flow timestamp:', error);
    }
};

const initializeFlowTimestamp = () => {
    const existing = getFlowTimestamp();
    if (!existing) {
        const now = Date.now();
        setFlowTimestamp(now);
        console.log('🆕 Initialized new flow timestamp:', new Date(now).toLocaleString());
        return now;
    }
    console.log('✅ Using existing flow timestamp:', new Date(existing).toLocaleString());
    return existing;
};

const clearFlowTimestamp = () => {
    try {
        localStorage.removeItem(TIMESTAMP_KEY);
        console.log('🗑️ Cleared flow timestamp');
    } catch (error) {
        console.error('Error clearing flow timestamp:', error);
    }
};


// Fixed storage implementation
const createExpiringStorage = () => {
    const UNAUTHORIZED_EXPIRY = 30 * 60 * 1000; // 30 minutes
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

    const getUserId = (): string | null => {
        try {
            return localStorage.getItem(USER_ID_KEY);
        } catch {
            return null;
        }
    };

    const setUserIdInStorage = (userId: string | null) => {
        try {
            if (userId) {
                localStorage.setItem(USER_ID_KEY, userId);
            } else {
                localStorage.removeItem(USER_ID_KEY);
            }
        } catch (error) {
            console.error('Error setting userId in localStorage:', error);
        }
    };

    const checkExpiry = (): boolean => {
        const timestamp = getFlowTimestamp();
        const userId = getUserId();

        if (!timestamp) return false;

        const isAuthorized = userId && userId !== 'anonymous';
        if (isAuthorized) return false; // Never expire for authorized users

        const now = Date.now();
        const isExpired = (now - timestamp) > UNAUTHORIZED_EXPIRY;

        if (isExpired) {
            console.log('⏰ Flow data expired');
        }

        return isExpired;
    };


    return {
        getItem: (name: string) => {
            try {
                // Check expiry first
                if (checkExpiry()) {
                    localStorage.removeItem(name);
                    clearFlowTimestamp();
                    return null;
                }

                const item = localStorage.getItem(name);
                if (!item) return null;

                // Initialize timestamp if it doesn't exist
                if (!getFlowTimestamp()) {
                    initializeFlowTimestamp();
                }

                return item;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return null;
            }
        },
        setItem: (name: string, value: string) => {
            try {
                if (getByteSize(value) > MAX_STORAGE_SIZE) {
                    console.warn('Storage data exceeds size limit, clearing old data');
                    localStorage.removeItem(name);
                    clearFlowTimestamp();
                    return;
                }

                // Initialize timestamp if this is the first save
                if (!getFlowTimestamp()) {
                    initializeFlowTimestamp();
                }

                const data = JSON.parse(value);
                const userId = getUserId();

                if (data.state) {
                    data.state.userId = userId;
                    // Don't store timestamp in the main data - it's managed separately
                }

                if (!getFlowTimestamp()) {
                    initializeFlowTimestamp();
                }

                localStorage.setItem(name, JSON.stringify(data));
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        },
        removeItem: (name: string) => {
            try {
                localStorage.removeItem(name);
                clearFlowTimestamp();
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        },
        setUserId: setUserIdInStorage,
        clearFlowTimestamp,
    };
};

const storage = createExpiringStorage();

const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            nodes: [] as Node[],
            edges: [] as Edge[],
            selectedNodeId: null,
            userId: null,

            history: {
                past: [],
                present: { nodes: [] as Node[], edges: [] as Edge[] },
                future: [],
            },

            isModalOpen: false,
            modalNodeId: null,
            modalNodeType: null,

            // Atomic history save to prevent race conditions
            saveToHistory: () => {
                set((state) => {
                    const currentState = {
                        nodes: deepClone(state.nodes),
                        edges: deepClone(state.edges)
                    };

                    if (isEqual(currentState, state.history.present)) {
                        return state; // No changes
                    }

                    return {
                        ...state,
                        history: {
                            past: [...state.history.past, deepClone(state.history.present)].slice(-50),
                            present: currentState,
                            future: [],
                        },
                    };
                });
            },

            // Throttled version for drag operations
            saveToHistoryThrottled: () => {
                throttleHistorySave(() => {
                    get().saveToHistory();
                });
            },

            onNodesChange: (changes: NodeChange[]) => {
                const shouldSaveHistory = changes.some(change =>
                    change.type === 'remove' ||
                    (change.type === 'position' && change.dragging === false)
                );

                if (shouldSaveHistory) {
                    // Use throttled save for position changes
                    const hasPositionChange = changes.some(change =>
                        change.type === 'position' && change.dragging === false
                    );

                    if (hasPositionChange) {
                        get().saveToHistoryThrottled();
                    } else {
                        get().saveToHistory();
                    }
                }

                const newNodes = applyNodeChanges(changes, get().nodes);
                const removedNodeIds = changes
                    .filter(change => change.type === 'remove')
                    .map(change => (change as any).id);

                const currentSelectedId = get().selectedNodeId;
                const shouldClearSelection = currentSelectedId &&
                    removedNodeIds.includes(currentSelectedId);

                set({
                    nodes: newNodes,
                    ...(shouldClearSelection && { selectedNodeId: null }),
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

            updateNodeData: <T extends NodeData = NodeData>(nodeId: string, data: Partial<T>) => {
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...data } }
                            : node
                    ),
                });
            },

            // Fixed race condition by using atomic update
            updateNodeDataAndSave: <T extends NodeData = NodeData>(nodeId: string, data: Partial<T>) => {
                set((state) => {
                    // Save to history first
                    const currentState = {
                        nodes: deepClone(state.nodes),
                        edges: deepClone(state.edges)
                    };

                    const newHistory = isEqual(currentState, state.history.present)
                        ? state.history
                        : {
                            past: [...state.history.past, deepClone(state.history.present)].slice(-50),
                            present: currentState,
                            future: [],
                        };

                    // Then update the node
                    const newNodes = state.nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...data } }
                            : node
                    );

                    return {
                        ...state,
                        nodes: newNodes,
                        history: newHistory,
                    };
                });
            },

            deleteNode: (nodeId: string) => {
                get().saveToHistory();
                const { nodes, edges, selectedNodeId } = get();

                set({
                    nodes: nodes.filter((node) => node.id !== nodeId),
                    edges: edges.filter(
                        (edge) => edge.source !== nodeId && edge.target !== nodeId
                    ),
                    selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
                });
            },

            setSelectedNodeId: (id: string | null) => {
                if (id && !get().nodes.find(node => node.id === id)) {
                    console.warn(`Attempted to select non-existent node: ${id}`);
                    return;
                }
                set({ selectedNodeId: id });
            },

            openNodeModal: (nodeId: string, nodeType: string) => {
                if (!get().nodes.find(node => node.id === nodeId)) {
                    console.warn(`Attempted to open modal for non-existent node: ${nodeId}`);
                    return;
                }

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
                const currentState = { nodes: get().nodes, edges: get().edges };

                set({
                    nodes: deepClone(previous.nodes),
                    edges: deepClone(previous.edges),
                    history: {
                        past: newPast,
                        present: deepClone(previous),
                        future: [deepClone(currentState), ...history.future],
                    },
                    selectedNodeId: get().selectedNodeId &&
                    !previous.nodes.find(node => node.id === get().selectedNodeId)
                        ? null : get().selectedNodeId,
                });
            },

            redo: () => {
                const { history } = get();
                if (history.future.length === 0) return;

                const next = history.future[0];
                const newFuture = history.future.slice(1);
                const currentState = { nodes: get().nodes, edges: get().edges };

                set({
                    nodes: deepClone(next.nodes),
                    edges: deepClone(next.edges),
                    history: {
                        past: [...history.past, deepClone(currentState)],
                        present: deepClone(next),
                        future: newFuture,
                    },
                    selectedNodeId: get().selectedNodeId &&
                    !next.nodes.find(node => node.id === get().selectedNodeId)
                        ? null : get().selectedNodeId,
                });
            },

            canUndo: () => {
                return get().history.past.length > 0;
            },

            canRedo: () => {
                return get().history.future.length > 0;
            },

            isValidSelection: () => {
                const { selectedNodeId, nodes } = get();
                return selectedNodeId ? nodes.some(node => node.id === selectedNodeId) : true;
            },

            getGraphSize: () => {
                const { nodes, edges } = get();
                const jsonString = JSON.stringify({ nodes, edges });
                return getByteSize(jsonString);
            },

            clearLocalData: () => {
                clearFlowTimestamp(); // Clear the separate timestamp
                set({
                    nodes: [],
                    edges: [],
                    selectedNodeId: null,
                    history: {
                        past: [],
                        present: { nodes: [], edges: [] },
                        future: [],
                    },
                });
            },

            // Fixed persistence trigger
            setUserId: (userId: string | null) => {
                storage.setUserId(userId);
                set({ userId }); // This will trigger persistence automatically
            },

            // Replace the resetFlow function
            resetFlow: () => {
                set((state) => {
                    // Save current state to history before reset
                    const currentState = {
                        nodes: deepClone(state.nodes),
                        edges: deepClone(state.edges)
                    };

                    // Only save to history if there's actually something to save
                    const newHistory = state.nodes.length > 0 || state.edges.length > 0
                        ? {
                            past: [...state.history.past, deepClone(state.history.present)].slice(-50),
                            present: currentState,
                            future: [],
                        }
                        : state.history;

                    clearFlowTimestamp();

                    return {
                        ...state,
                        nodes: [],
                        edges: [],
                        selectedNodeId: null,
                        // Keep the history so user can undo the reset
                        history: {
                            ...newHistory,
                            present: { nodes: [], edges: [] }, // Current state is now empty
                        },
                    };
                });
            },

            resetTimestamp: () => {
                console.log('resetTimestamp called');
                clearFlowTimestamp();
                // If there's current data, reinitialize timestamp
                const { nodes, edges } = get();
                if (nodes.length > 0 || edges.length > 0) {
                    initializeFlowTimestamp();
                }
            },
        }),


        {
            name: 'flow-diagram-storage',
            storage: createJSONStorage(() => storage),
            partialize: (state) => {
                return {
                    nodes: state.nodes,
                    edges: state.edges,
                    userId: state.userId,
                };
            },
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state && (state.nodes?.length > 0 || state.edges?.length > 0)) {
                    initializeFlowTimestamp();
                }


                if (state) {
                    state.nodes = state.nodes || [];
                    state.edges = state.edges || [];

                    // Initialize history after rehydration with deep clones
                    state.history = {
                        past: [],
                        present: {
                            nodes: deepClone(state.nodes || []),
                            edges: deepClone(state.edges || [])
                        },
                        future: [],
                    };

                    // Validate selection after rehydration
                    if (state.selectedNodeId &&
                        !state.nodes.find(node => node.id === state.selectedNodeId)) {
                        state.selectedNodeId = null;
                    }
                }
            },
        }
    )
);

export { useFlowStore };

export const useNodes = (): Node[] => useFlowStore((state) => state.nodes, shallow);
export const useEdges = (): Edge[] => useFlowStore((state) => state.edges, shallow);

export const useIsModalOpen = () => useFlowStore((state) => state.isModalOpen);
export const useModalNodeId = () => useFlowStore((state) => state.modalNodeId);
export const useModalNodeType = () => useFlowStore((state) => state.modalNodeType);
export const useUndo = () => useFlowStore((state) => state.undo);
export const useRedo = () => useFlowStore((state) => state.redo);
export const useCanUndo = () => useFlowStore((state) => state.canUndo());
export const useCanRedo = () => useFlowStore((state) => state.canRedo());


