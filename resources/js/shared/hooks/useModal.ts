import { create } from 'zustand';

interface ModalState {
    isOpen: boolean;
    nodeId: string | null;
    nodeType: string | null;
    openModal: (nodeId: string, nodeType: string) => void;
    closeModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
    isOpen: false,
    nodeId: null,
    nodeType: null,
    openModal: (nodeId, nodeType) => set({ isOpen: true, nodeId, nodeType }),
    closeModal: () => set({ isOpen: false, nodeId: null, nodeType: null }),
}));
