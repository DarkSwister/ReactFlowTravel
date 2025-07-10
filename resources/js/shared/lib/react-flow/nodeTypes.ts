import { ComponentType } from 'react';
import { getNodeTypes } from './nodeRegistry';

// Create nodeTypes once and cache it
let stableNodeTypes: Record<string, ComponentType<any>> | null = null;

export const getStableNodeTypes = (): Record<string, ComponentType<any>> => {
    if (!stableNodeTypes) {
        stableNodeTypes = Object.freeze(getNodeTypes());
    }
    return stableNodeTypes;
};

// Create the stable nodeTypes immediately
export const STABLE_NODE_TYPES = getStableNodeTypes();

// Function to invalidate cache when registry changes
export const invalidateNodeTypesCache = () => {
    stableNodeTypes = null;
};
