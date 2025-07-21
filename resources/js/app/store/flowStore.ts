import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Built-in save function - same logic for all pages
const saveFlowToBackend = async (plannerId: number, nodes: Node[], edges: Edge[]) => {
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
            viewport: { x: 0, y: 0, zoom: 1 }, // You might want to track actual viewport
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
    setPlannerId: (id: number) => void;

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
    initializeFlow: (nodes: Node[], edges: Edge[]) => void;
    cleanup: () => void;
}

export const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            // Initial state
            nodes: [],
            edges: [],
            plannerId: null,
            history: [],
            historyIndex: -1,
            maxHistorySize: 50,
            autoSaveEnabled: true,
            autoSaveDelay: 3000, // 3 seconds
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
                    pendingChanges: markAsPending, // ✅ Only mark as pending if requested
                });

                if (markAsPending) {
                    console.log('📝 Saved to history with pending changes');
                } else {
                    console.log('📝 Saved to history without pending changes');
                }
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

                console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}${delay ? ` with ${delay}ms delay` : ''}`);
            },

            triggerAutoSave: () => {
                const state = get();

                // ✅ More strict conditions
                if (
                    !state.autoSaveEnabled ||
                    !state.plannerId ||
                    !state.pendingChanges || // Don't save if no changes
                    state.isSyncing
                ) {
                    // Don't save if already syncing
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
                        console.log('⏰ Auto-save triggered after inactivity');
                        currentState.syncToBackend().catch((error) => {
                            console.error('❌ Auto-save failed:', error);
                        });
                    }
                }, state.autoSaveDelay);

                set({ saveTimeoutId: timeoutId });
                console.log(`⏱️ Auto-save scheduled in ${state.autoSaveDelay}ms`);
            },

            cancelAutoSave: () => {
                const state = get();
                if (state.saveTimeoutId) {
                    clearTimeout(state.saveTimeoutId);
                    set({ saveTimeoutId: null });
                    console.log('❌ Auto-save cancelled');
                }
            },

            forceSave: async () => {
                const state = get();
                console.log('💾 Force save triggered');

                state.cancelAutoSave();

                if (state.pendingChanges && state.plannerId) {
                    await state.syncToBackend();
                } else {
                    console.log('ℹ️ No changes to save');
                }
            },

            // Backend sync
            syncToBackend: async () => {
                const state = get();
                if (!state.plannerId || state.isSyncing || !state.pendingChanges) {
                    console.log('Sync skipped:', {
                        plannerId: !!state.plannerId,
                        isSyncing: state.isSyncing,
                        pendingChanges: state.pendingChanges,
                    });
                    return;
                }

                try {
                    set({ isSyncing: true });

                    await saveFlowToBackend(state.plannerId, state.nodes, state.edges);

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

            setPlannerId: (id: number) => {
                set({ plannerId: id });
                console.log('🆔 Planner ID set to:', id);
            },

            // ReactFlow operations
            onNodesChange: (changes: NodeChange[]) => {
                const state = get();

                // Only save to history for significant changes
                const significantChanges = changes.some((change) => change.type === 'remove' || change.type === 'add');

                if (significantChanges) {
                    state.saveToHistory(true); // Mark as pending
                }

                const newNodes = applyNodeChanges(changes, state.nodes);

                // Only mark as pending if nodes actually changed
                const hasChanges = JSON.stringify(newNodes) !== JSON.stringify(state.nodes);

                set({
                    nodes: newNodes,
                    pendingChanges: hasChanges || state.pendingChanges,
                });

                if (hasChanges) {
                    console.log('🔄 Nodes changed, triggering auto-save');
                    state.triggerAutoSave();
                } else {
                    console.log('ℹ️ Node changes applied but no actual changes detected');
                }
            },

            onEdgesChange: (changes: EdgeChange[]) => {
                const state = get();

                const significantChanges = changes.some((change) => change.type === 'remove' || change.type === 'add');

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
                    console.log('🔄 Edges changed, triggering auto-save');
                    state.triggerAutoSave();
                }
            },

            onConnect: (connection: Connection) => {
                const state = get();
                console.log('🔗 New connection created');

                state.saveToHistory(true); // This is a significant change

                set({
                    edges: addEdge(connection, state.edges),
                    pendingChanges: true,
                });

                state.triggerAutoSave();
            },

            // Node management
            addNode: (node: Node) => {
                const state = get();
                console.log('➕ Adding new node:', node.id);

                state.saveToHistory(true);

                set((state) => ({
                    nodes: [...state.nodes, node],
                    pendingChanges: true,
                }));

                state.triggerAutoSave();
            },

            updateNode: (nodeId: string, updates: Partial<Node>) => {
                const state = get();

                set((state) => ({
                    nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
                    pendingChanges: true,
                }));

                state.triggerAutoSave();
            },

            updateNodeData: (nodeId: string, data: Partial<NodeData>, saveStrategy: 'auto' | 'immediate' | 'none' = 'auto') => {
                const state = get();
                const existingNode = state.nodes.find((n) => n.id === nodeId);

                if (!existingNode) {
                    console.warn('⚠️ Attempted to update non-existent node:', nodeId);
                    return;
                }

                // Check if data actually changed
                const hasChanges = JSON.stringify({ ...existingNode.data, ...data }) !== JSON.stringify(existingNode.data);

                if (!hasChanges) {
                    console.log('ℹ️ Node data update skipped - no changes detected');
                    return;
                }

                console.log('📝 Updating node data:', nodeId, saveStrategy);

                // Update node data locally
                set((state) => ({
                    nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node)),
                    pendingChanges: true,
                }));

                // Update modal data if this node is currently open
                if (state.modalState.nodeId === nodeId) {
                    set((state) => ({
                        modalState: {
                            ...state.modalState,
                            nodeData: { ...state.modalState.nodeData, ...data },
                        },
                    }));
                }

                // Handle save strategy
                switch (saveStrategy) {
                    case 'immediate':
                        console.log('💾 Immediate save for node:', nodeId);
                        state.forceSave().catch(console.error);
                        break;

                    case 'auto':
                        console.log('⏰ Auto-save triggered for node:', nodeId);
                        state.triggerAutoSave();
                        break;

                    case 'none':
                        console.log('📝 Local-only update for node:', nodeId);
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
                state.saveToHistory();

                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== nodeId),
                    edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
                    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
                    modalState:
                        state.modalState.nodeId === nodeId ? { isOpen: false, nodeId: null, nodeType: null, nodeData: null } : state.modalState,
                    pendingChanges: true,
                }));

                state.triggerAutoSave();
            },

            getNode: (nodeId: string) => {
                const state = get();
                return state.nodes.find((node) => node.id === nodeId);
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

                    console.log('↶ Undo performed');
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

                    console.log('↷ Redo performed');
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
                const node = state.nodes.find((n) => n.id === nodeId);

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

                console.log('🔧 Modal opened for node:', nodeId);
            },

            closeModal: () => {
                const state = get();

                // If there are unsaved changes in modal, save them immediately
                if (state.modalState.nodeId && state.pendingChanges) {
                    console.log('💾 Saving modal changes before closing');
                    state.forceSave().catch((error) => {
                        console.error('Failed to save modal changes:', error);
                    });
                }

                set({
                    modalState: {
                        isOpen: false,
                        nodeId: null,
                        nodeType: null,
                        nodeData: null,
                    },
                });

                console.log('❌ Modal closed');
            },

            updateModalNodeData: (data: any) => {
                const state = get();
                if (state.modalState.nodeId) {
                    console.log('🔄 Updating modal node data with immediate save');
                    state.updateNodeDataImmediate(state.modalState.nodeId, data);
                }
            },

            // Selection
            setSelectedNodeId: (id: string | null) => {
                set({ selectedNodeId: id });
            },

            // Utility operations
            resetFlow: () => {
                const state = get();
                state.saveToHistory();

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
                console.log('🗑️ Flow reset');
            },

            setNodes: (nodes: Node[]) => {
                set({ nodes, pendingChanges: true });
                get().triggerAutoSave();
            },

            setEdges: (edges: Edge[]) => {
                set({ edges, pendingChanges: true });
                get().triggerAutoSave();
            },

            initializeFlow: (nodes: Node[], edges: Edge[]) => {
                console.log('🚀 Initializing flow with', nodes.length, 'nodes and', edges.length, 'edges');

                const currentState = get();
                if (currentState.saveTimeoutId) {
                    clearTimeout(currentState.saveTimeoutId);
                }
                set({
                    nodes,
                    edges,
                    history: [],
                    historyIndex: -1,
                    pendingChanges: false, // ✅ Important: No pending changes on init
                    lastSyncedAt: Date.now(), // ✅ Mark as synced since this is server data
                    isSyncing: false,
                });

                // Save initial state to history WITHOUT marking as pending
                const snapshot: FlowSnapshot = {
                    nodes: [...nodes],
                    edges: [...edges],
                    timestamp: Date.now(),
                };

                set({
                    history: [snapshot],
                    historyIndex: 0,
                    // Still no pending changes
                });

                console.log('✅ Flow initialized without triggering save');
            },

            cleanup: () => {
                const state = get();

                // Cancel any pending auto-save
                state.cancelAutoSave();

                // Clear state
                set({
                    plannerId: null,
                    pendingChanges: false,
                    isSyncing: false,
                    modalState: {
                        isOpen: false,
                        nodeId: null,
                        nodeType: null,
                        nodeData: null,
                    },
                    selectedNodeId: null,
                });

                console.log('🧹 Store cleaned up');
            },
        }),
        {
            name: 'flow-storage',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                plannerId: state.plannerId,
                autoSaveEnabled: state.autoSaveEnabled,
                autoSaveDelay: state.autoSaveDelay,
                // Don't persist history, modal state, or sync state
            }),
        },
    ),
);

// Selector hooks for better performance
export const useNodes = () => useFlowStore((state) => state.nodes, shallow);
export const useEdges = () => useFlowStore((state) => state.edges, shallow);
export const useCanUndo = () => useFlowStore((state) => state.canUndo());
export const useCanRedo = () => useFlowStore((state) => state.canRedo());
export const useUndo = () => useFlowStore((state) => state.undo);
export const useRedo = () => useFlowStore((state) => state.redo);
export const useIsSyncing = () => useFlowStore((state) => state.isSyncing);
export const usePendingChanges = () => useFlowStore((state) => state.pendingChanges);
export const useModalState = () => useFlowStore((state) => state.modalState, shallow);
export const useSelectedNodeId = () => useFlowStore((state) => state.selectedNodeId);
// Operation hooks for cleaner component code
export const useFlowOperations = () =>
    useFlowStore((state) => ({
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
    useFlowStore((state) => ({
        openNodeModal: state.openNodeModal,
        closeModal: state.closeModal,
        updateModalNodeData: state.updateModalNodeData,
    }));

export const useAutoSaveOperations = () =>
    useFlowStore((state) => ({
        enableAutoSave: state.enableAutoSave,
        triggerAutoSave: state.triggerAutoSave,
        cancelAutoSave: state.cancelAutoSave,
        forceSave: state.forceSave,
    }));

export const useNodeOperations = () =>
    useFlowStore((state) => ({
        updateNodeData: state.updateNodeData,
        updateNodeDataImmediate: state.updateNodeDataImmediate,
        updateNodeDataCanvas: state.updateNodeDataCanvas,
    }));
