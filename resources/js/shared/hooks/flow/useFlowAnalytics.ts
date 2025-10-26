import { useMemo } from 'react';
import { useFlowStore } from '@/app/store/flowStore';
import { getNodesInside } from '@/utils/groupUtils';

export interface NodeAnalytics {
    id: string;
    type: string;
    label: string;
    price: number;
    category: string;
    groupId?: string;
}

export interface GroupAnalytics {
    id: string;
    label: string;
    totalCost: number;
    nodeCount: number;
    nodes: NodeAnalytics[];
    categories: Record<string, { count: number; total: number }>;
}

export interface OverallAnalytics {
    totalCost: number;
    totalNodes: number;
    totalGroups: number;
    categories: Record<string, { count: number; total: number }>;
    groups: GroupAnalytics[];
    ungroupedNodes: NodeAnalytics[];
}

export const useFlowAnalytics = (): OverallAnalytics => {
    const nodes = useFlowStore(state => state.nodes);

    return useMemo(() => {
        const groupNodes = nodes.filter(node => node.type === 'group');
        const nonGroupNodes = nodes.filter(node => node.type !== 'group');

        // Process groups and their contained nodes using both parent-child relationships and positional detection
        const groups: GroupAnalytics[] = groupNodes.map(groupNode => {
            // Find nodes using both methods:
            // 1. Parent-child relationships (React Flow sub-flows)
            const childNodes = nonGroupNodes.filter(node => node.parentId === groupNode.id);

            // 2. Positional detection (legacy/fallback method)
            const positionalNodes = getNodesInside(groupNode, nonGroupNodes);

            // Combine both approaches, removing duplicates
            const combinedNodeIds = new Set([
                ...childNodes.map(n => n.id),
                ...positionalNodes.map(n => n.id)
            ]);

            const nodesInside = nonGroupNodes.filter(node => combinedNodeIds.has(node.id));

            const groupAnalytics: GroupAnalytics = {
                id: groupNode.id,
                label: (groupNode.data?.label || 'Unnamed Group') as string,
                totalCost: 0,
                nodeCount: nodesInside.length,
                nodes: [],
                categories: {}
            };

            // Process nodes inside this group
            nodesInside.forEach(node => {
                // Handle both price and estimatedPrice fields (booking nodes use estimatedPrice)
                const price = (node.data?.price || node.data?.estimatedPrice || 0) as number;
                const category = getNodeCategory(node.type);

                const nodeAnalytics: NodeAnalytics = {
                    id: node.id,
                    type: node.type,
                    label: (node.data?.label || 'Unnamed Node') as string,
                    price,
                    category,
                    groupId: groupNode.id
                };

                groupAnalytics.nodes.push(nodeAnalytics);
                groupAnalytics.totalCost += price;

                // Update category stats for this group
                if (!groupAnalytics.categories[category]) {
                    groupAnalytics.categories[category] = { count: 0, total: 0 };
                }
                groupAnalytics.categories[category].count++;
                groupAnalytics.categories[category].total += price;
            });

            return groupAnalytics;
        });

        // Find ungrouped nodes (nodes not inside any group)
        const groupedNodeIds = new Set(
            groups.flatMap(group => group.nodes.map(node => node.id))
        );

        const ungroupedNodes: NodeAnalytics[] = nonGroupNodes
            .filter(node => !groupedNodeIds.has(node.id))
            .map(node => ({
                id: node.id,
                type: node.type,
                label: (node.data?.label || 'Unnamed Node') as string,
                price: (node.data?.price || node.data?.estimatedPrice || 0) as number,
                category: getNodeCategory(node.type)
            }));

        // Calculate overall statistics
        const allNodes = [...groups.flatMap(g => g.nodes), ...ungroupedNodes];
        const totalCost = allNodes.reduce((sum, node) => sum + node.price, 0);

        // Calculate category totals across all nodes
        const categories: Record<string, { count: number; total: number }> = {};
        allNodes.forEach(node => {
            if (!categories[node.category]) {
                categories[node.category] = { count: 0, total: 0 };
            }
            categories[node.category].count++;
            categories[node.category].total += node.price;
        });

        return {
            totalCost,
            totalNodes: allNodes.length,
            totalGroups: groups.length,
            categories,
            groups,
            ungroupedNodes
        };
    }, [nodes]);
};

// Helper function to categorize nodes by type
function getNodeCategory(nodeType: string): string {
    switch (nodeType) {
        case 'flight':
            return 'Flights';
        case 'booking':
            return 'Accommodation';
        case 'activity':
            return 'Activities';
        case 'transport':
            return 'Transport';
        default:
            return 'Other';
    }
}

// Helper function to get category icon
export function getCategoryIcon(category: string): string {
    switch (category) {
        case 'Flights':
            return '✈️';
        case 'Accommodation':
            return '🏨';
        case 'Activities':
            return '🎭';
        case 'Transport':
            return '🚗';
        default:
            return '📍';
    }
}

// Helper function to get category color
export function getCategoryColor(category: string): string {
    switch (category) {
        case 'Flights':
            return 'text-blue-600 bg-blue-50';
        case 'Accommodation':
            return 'text-purple-600 bg-purple-50';
        case 'Activities':
            return 'text-green-600 bg-green-50';
        case 'Transport':
            return 'text-orange-600 bg-orange-50';
        default:
            return 'text-gray-600 bg-gray-50';
    }
}
