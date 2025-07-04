export const getNodesInside = (groupNode: any, otherNodes: any[]) => {
    const groupBounds = {
        x: groupNode.position.x,
        y: groupNode.position.y,
        width: groupNode.width || 600,
        height: groupNode.height || 400,
    };

    return otherNodes.filter(node => {
        if (node.data.groupId === groupNode.id || node.type === 'group') {
            return false;
        }

        const nodeWidth = 220;
        const nodeHeight = 140;

        const nodeBounds = {
            x: node.position.x,
            y: node.position.y,
            width: nodeWidth,
            height: nodeHeight,
        };

        const nodeCenterX = nodeBounds.x + nodeBounds.width / 2;
        const nodeCenterY = nodeBounds.y + nodeBounds.height / 2;

        return (
            nodeCenterX >= groupBounds.x &&
            nodeCenterX <= groupBounds.x + groupBounds.width &&
            nodeCenterY >= groupBounds.y &&
            nodeCenterY <= groupBounds.y + groupBounds.height
        );
    });
};
