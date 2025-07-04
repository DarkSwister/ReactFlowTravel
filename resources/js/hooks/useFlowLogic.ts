import { useCallback, useMemo, useState } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { Subgroup } from '@/utils/tripUtils';

// Helper function to check if a node is inside a group
const isNodeInsideGroup = (node: any, groupNode: any) => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.width || 220;
    const nodeHeight = node.height || 140;

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;
    const groupWidth = groupNode.width || 1000;
    const groupHeight = groupNode.height || 800;

    // Check if node is completely inside the group
    return (
        nodeX >= groupX &&
        nodeY >= groupY &&
        nodeX + nodeWidth <= groupX + groupWidth &&
        nodeY + nodeHeight <= groupY + groupHeight
    );
};

export const useFlowLogic = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [manualSubgroups, setManualSubgroups] = useState<Subgroup[]>([]);

    // Calculate subgroups based on visual groups
    const subgroups = useMemo(() => {
        const groupNodes = nodes.filter(node => node.type === 'group');
        const otherNodes = nodes.filter(node => node.type !== 'group');

        const visualSubgroups = groupNodes.map(groupNode => {
            const nodesInside = otherNodes.filter(node => isNodeInsideGroup(node, groupNode));
            const flightNode = otherNodes.find(n => n.data.groupId === groupNode.id);
            const allGroupNodes = flightNode ? [flightNode, ...nodesInside] : nodesInside;

            const totalCost = allGroupNodes.reduce((sum, n) => sum + (n.data.estimatedPrice || 0), 0);

            return {
                id: groupNode.id,
                name: groupNode.data.destination ? `Trip to ${groupNode.data.destination}` : groupNode.data.label,
                country: groupNode.data.destination || 'Unknown',
                color: '#3b82f6',
                nodes: allGroupNodes,
                isCollapsed: false,
                isManual: true,
                totalEstimatedCost: totalCost
            };
        });

        return [...manualSubgroups, ...visualSubgroups];
    }, [nodes, manualSubgroups]);

    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return {
        nodes,
        setNodes,
        onNodesChange,
        edges,
        setEdges,
        onEdgesChange,
        onConnect,
        subgroups,
        manualSubgroups,
        setManualSubgroups,
    };
};
