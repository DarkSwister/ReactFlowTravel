import { ComponentType } from 'react';

interface NodeMetadata {
    component: ComponentType<any>;
    label: string;
    icon: string;
    category?: string;
    defaultData?: any;
    hasModal?: boolean;
}

const nodeRegistry = new Map<string, NodeMetadata>();
const modalRegistry = new Map<string, React.ComponentType<any>>();

export function registerNode(
    type: string,
    component: ComponentType<any>,
    metadata: {
        label: string;
        icon: string;
        defaultData?: any;
        category?: string;
        hasModal?: boolean;
    }
) {
    nodeRegistry.set(type, {
        component,
        ...metadata
    });
}

export function registerModal(type: string, component: ComponentType<any>) {
    modalRegistry.set(type, component);

    // Automatically set hasModal to true when a modal is registered
    const existingMetadata = nodeRegistry.get(type);
    if (existingMetadata) {
        nodeRegistry.set(type, { ...existingMetadata, hasModal: true });
    }
}

export function getNodeTypes() {
    const types: Record<string, ComponentType<any>> = {};
    nodeRegistry.forEach((metadata, type) => {
        types[type] = metadata.component;
    });
    return types;
}

export function getRegisteredModal(type: string) {
    return modalRegistry.get(type);
}

export function getNodeMetadata(type: string) {
    return nodeRegistry.get(type);
}

export function nodeHasModal(type: string): boolean {
    const metadata = nodeRegistry.get(type);
    return metadata?.hasModal === true;
}

export function getAvailableNodes(category?: string) {
    const nodes: Array<{
        type: string;
        label: string;
        icon: string;
        defaultData?: any;
        hasModal?: boolean;
    }> = [];

    nodeRegistry.forEach((metadata, type) => {
        if (!category || metadata.category === category) {
            nodes.push({
                type,
                label: metadata.label,
                icon: metadata.icon,
                defaultData: metadata.defaultData,
                hasModal: metadata.hasModal,
            });
        }
    });

    return nodes;
}
