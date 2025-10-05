import { type Node } from '@xyflow/react';

/**
 * Utility functions for managing React Flow sub-flows with group nodes
 */

/**
 * Add a node to a group by setting parent relationship
 */
export function addNodeToGroup(nodeId: string, groupId: string, nodes: Node[]): Node[] {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return {
                ...node,
                parentId: groupId,
                extent: 'parent',
                expandParent: true,
                data: {
                    ...node.data,
                    groupId: groupId
                }
            };
        }
        return node;
    });
}

/**
 * Remove a node from its group by clearing parent relationship
 */
export function removeNodeFromGroup(nodeId: string, nodes: Node[]): Node[] {
    return nodes.map(node => {
        if (node.id === nodeId && node.parentId) {
            const { parentId, extent, expandParent, ...restNode } = node;
            const { groupId, ...restData } = node.data || {};
            
            return {
                ...restNode,
                data: restData
            };
        }
        return node;
    });
}

/**
 * Move a node from one group to another
 */
export function moveNodeBetweenGroups(nodeId: string, newGroupId: string, nodes: Node[]): Node[] {
    return addNodeToGroup(nodeId, newGroupId, nodes);
}

/**
 * Check if a position is inside a group node's boundaries
 */
export function isPositionInsideGroup(
    position: { x: number; y: number },
    groupNode: Node
): boolean {
    if (!groupNode.position || !groupNode.width || !groupNode.height) {
        return false;
    }

    return (
        position.x >= groupNode.position.x &&
        position.x <= groupNode.position.x + groupNode.width &&
        position.y >= groupNode.position.y &&
        position.y <= groupNode.position.y + groupNode.height
    );
}

/**
 * Find which group (if any) contains a given position
 */
export function findGroupContainingPosition(
    position: { x: number; y: number },
    nodes: Node[]
): Node | null {
    const groupNodes = nodes.filter(node => node.type === 'travel:group');
    
    for (const groupNode of groupNodes) {
        if (isPositionInsideGroup(position, groupNode)) {
            return groupNode;
        }
    }
    
    return null;
}

/**
 * Get all child nodes of a group
 */
export function getGroupChildren(groupId: string, nodes: Node[]): Node[] {
    return nodes.filter(node => node.parentId === groupId);
}

/**
 * Get all nodes that are not in any group
 */
export function getUngroupedNodes(nodes: Node[]): Node[] {
    return nodes.filter(node => !node.parentId && node.type !== 'travel:group');
}

/**
 * Arrange nodes in a grid within a group
 */
export function arrangeNodesInGroup(
    groupId: string, 
    nodes: Node[], 
    groupWidth: number = 400, 
    groupHeight: number = 300
): Node[] {
    const groupChildren = getGroupChildren(groupId, nodes);
    if (groupChildren.length === 0) return nodes;

    const padding = 20;
    const nodeWidth = 200;
    const nodeHeight = 150;
    const spacing = 20;
    const headerHeight = 80;

    // Calculate columns and rows based on group size
    const availableWidth = groupWidth - (padding * 2);
    const maxCols = Math.floor(availableWidth / (nodeWidth + spacing));

    return nodes.map(node => {
        if (node.parentId === groupId) {
            const index = groupChildren.findIndex(child => child.id === node.id);
            const col = index % maxCols;
            const row = Math.floor(index / maxCols);

            // Use relative positioning within the group
            const newX = padding + (col * (nodeWidth + spacing));
            const newY = padding + headerHeight + (row * (nodeHeight + spacing));

            return {
                ...node,
                position: { x: newX, y: newY }
            };
        }
        return node;
    });
}