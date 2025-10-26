export const getNodesInside = (groupNode: any, otherNodes: any[]) => {
    if (!groupNode || !groupNode.position) {
        console.log('getNodesInside: No groupNode or position');
        return [];
    }

    const groupBounds = {
        x: groupNode.position.x || 0,
        y: groupNode.position.y || 0,
        width: groupNode.width || 600,
        height: groupNode.height || 400,
    };

    console.log('getNodesInside: groupBounds', groupBounds);
    console.log('getNodesInside: checking nodes', otherNodes.length);

    const result = otherNodes.filter(node => {
        // Skip group nodes and nodes already assigned to this group
        if (node.type === 'group' || !node.position) {
            console.log(`Skipping node ${node.id}: type=${node.type}, hasPosition=${!!node.position}`);
            return false;
        }

        const nodeWidth = 200; // Updated to match actual node sizes
        const nodeHeight = 150;

        const nodeBounds = {
            x: node.position.x || 0,
            y: node.position.y || 0,
            width: nodeWidth,
            height: nodeHeight,
        };

        const nodeCenterX = nodeBounds.x + nodeBounds.width / 2;
        const nodeCenterY = nodeBounds.y + nodeBounds.height / 2;

        // Check if node center is within group bounds (with header offset)
        const headerHeight = 80;
        const isInside = (
            nodeCenterX >= groupBounds.x &&
            nodeCenterX <= groupBounds.x + groupBounds.width &&
            nodeCenterY >= groupBounds.y + headerHeight && // Account for header
            nodeCenterY <= groupBounds.y + groupBounds.height
        );

        console.log(`Node ${node.id} collision check:`, {
            nodeCenter: { x: nodeCenterX, y: nodeCenterY },
            groupBounds,
            headerHeight,
            isInside,
            nodeId: node.id,
            nodeType: node.type
        });

        if (isInside) {
            console.log(`✅ Node ${node.id} IS INSIDE group - should be included`);
        } else {
            console.log(`❌ Node ${node.id} is outside group`);
        }

        return isInside;
    });

    console.log('getNodesInside result:', result.map(n => n.id));
    return result;
};

// Helper function to prevent node overlaps within a group
export const arrangeNodesInGrid = (nodes: any[], groupBounds: any, padding = 20, spacing = 20) => {
    const nodeWidth = 200;
    const nodeHeight = 150;
    const headerHeight = 80;

    const availableWidth = groupBounds.width - (padding * 2);
    const maxCols = Math.floor(availableWidth / (nodeWidth + spacing));

    return nodes.map((node, index) => {
        const col = index % maxCols;
        const row = Math.floor(index / maxCols);

        const newX = groupBounds.x + padding + (col * (nodeWidth + spacing));
        const newY = groupBounds.y + padding + headerHeight + (row * (nodeHeight + spacing));

        return {
            ...node,
            position: { x: newX, y: newY }
        };
    });
};
