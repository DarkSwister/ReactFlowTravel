import React, { ComponentType } from 'react';

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

// ✅ Declare cache variables first
let cachedNodeTypes: Record<string, ComponentType<any>> | null = null;
let registryVersion = 0;

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

    // Invalidate cache when registry changes
    cachedNodeTypes = null;
    registryVersion++;
}

export function registerModal(type: string, component: ComponentType<any>) {
    modalRegistry.set(type, component);

    // Automatically set hasModal to true when a modal is registered
    const existingMetadata = nodeRegistry.get(type);
    if (existingMetadata) {
        nodeRegistry.set(type, { ...existingMetadata, hasModal: true });

        // Invalidate cache when registry changes
        cachedNodeTypes = null;
        registryVersion++;
    }
}

export function getNodeTypes() {
    // Return cached version if available
    if (cachedNodeTypes) {
        return cachedNodeTypes;
    }

    // Create new types object and cache it
    const types: Record<string, ComponentType<any>> = {};
    nodeRegistry.forEach((metadata, type) => {
        types[type] = metadata.component;
    });

    cachedNodeTypes = types;
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

export function getRegistryVersion() {
    return registryVersion;
}

export function clearNodeTypesCache() {
    cachedNodeTypes = null;
}
