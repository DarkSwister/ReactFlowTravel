import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Edit2, Plane } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useFlowStore } from '@/app/store/flowStore.ts';
import { getNodesInside } from '@/utils/groupUtils';

interface GroupNodeProps {
    id: string;
    data: {
        label: string;
        totalCost?: number;
        itemCount?: number;
        destination?: string;
    };
    selected?: boolean;
    width?: number;
    height?: number;
    position: { x: number; y: number };
}

const GroupNode: React.FC<GroupNodeProps> = ({ id, data, selected, width = 400, height = 300, position }) => {
    const { updateNodeData, nodes, updateNode } = useFlowStore();
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label);
    const [prevNodesCount, setPrevNodesCount] = useState(0);

    // Get current group node
    const currentGroupNode = useMemo(() => {
        const groupNode = nodes.find(n => n.id === id);
        return groupNode ? {
            ...groupNode,
            position,
            width: width,
            height: height,
        } : null;
    }, [nodes, id, position, width, height]);

    // Calculate nodes inside this group - using both parent-child relationships and positional detection
    const nodesInside = useMemo(() => {
        if (!currentGroupNode) return [];

        const nonGroupNodes = nodes.filter(n => n.type !== 'group');

        // Find nodes using both methods:
        // 1. Parent-child relationships (React Flow sub-flows)
        const childNodes = nonGroupNodes.filter(n => n.parentId === id);

        // 2. Positional detection (legacy/fallback method)
        const positionalNodes = getNodesInside(currentGroupNode, nonGroupNodes);

        console.log(`🔍 GroupNode ${id} detection:`, {
            childNodes: childNodes.length,
            positionalNodes: positionalNodes.length,
            childNodeIds: childNodes.map(n => n.id),
            positionalNodeIds: positionalNodes.map(n => n.id),
            groupNode: currentGroupNode ? {
                id: currentGroupNode.id,
                position: currentGroupNode.position,
                width: currentGroupNode.width,
                height: currentGroupNode.height
            } : null,
            allNonGroupNodes: nonGroupNodes.map(n => ({
                id: n.id,
                type: n.type,
                position: n.position,
                parentId: n.parentId
            }))
        });

        if (positionalNodes.length > 0) {
            console.log(`🎯 GroupNode ${id}: Found ${positionalNodes.length} positional nodes!`, positionalNodes.map(n => ({
                id: n.id,
                type: n.type,
                data: n.data
            })));
        }

        // Combine both approaches, removing duplicates
        const combinedNodeIds = new Set([
            ...childNodes.map(n => n.id),
            ...positionalNodes.map(n => n.id)
        ]);
        return nonGroupNodes.filter(node => combinedNodeIds.has(node.id));
    }, [currentGroupNode, nodes, id]);

    // Calculate total cost from nodes inside (include both price and estimatedPrice)
    const calculatedCost = useMemo(() => {
        const cost = nodesInside.reduce((total: number, node: any) => {
            console.log(`📊 Node ${node.id} full data:`, {
                id: node.id,
                type: node.type,
                dataKeys: Object.keys(node.data || {}),
                fullData: node.data,
                priceField: node.data?.price,
                estimatedPriceField: node.data?.estimatedPrice
            });

            const price = (node.data?.price || node.data?.estimatedPrice || 0);
            console.log(`GroupNode ${id}: Node ${node.id} final - price=${node.data?.price}, estimatedPrice=${node.data?.estimatedPrice}, using=${price}`);
            return total + price;
        }, 0);
        console.log(`GroupNode ${id}: calculatedCost=${cost}, nodesInside.length=${nodesInside.length}`);
        return cost;
    }, [nodesInside, id]);

    // Auto-arrange nodes inside the group using parent-child relationships
    const arrangeNodesInside = useCallback(() => {
        if (!currentGroupNode || nodesInside.length === 0) return;

        const padding = 20;
        const nodeWidth = 200;
        const nodeHeight = 150;
        const spacing = 20;

        // Calculate columns and rows based on group size
        const availableWidth = width - (padding * 2);
        const maxCols = Math.floor(availableWidth / (nodeWidth + spacing));

        // Arrange nodes in a grid and set parent relationships
        nodesInside.forEach((node: any, index: number) => {
            const col = index % maxCols;
            const row = Math.floor(index / maxCols);

            // Use relative positioning within the group
            const newX = padding + (col * (nodeWidth + spacing));
            const newY = padding + 80 + (row * (nodeHeight + spacing)); // Account for header

            updateNode(node.id, {
                position: { x: newX, y: newY },
                parentId: id, // Set parent relationship
                extent: 'parent', // Constrain to parent boundaries
                expandParent: true, // Allow parent to expand
                data: { ...node.data, groupId: id }
            });
        });
    }, [currentGroupNode, nodesInside, width, updateNode, id]);

    // Auto-resize group to fit nodes
    const autoResizeGroup = useCallback(() => {
        if (!currentGroupNode || nodesInside.length === 0) return;

        const padding = 40;
        const nodeWidth = 200;
        const nodeHeight = 150;
        const spacing = 20;
        const headerHeight = 80;

        // Calculate required dimensions
        const cols = Math.ceil(Math.sqrt(nodesInside.length));
        const rows = Math.ceil(nodesInside.length / cols);

        const requiredWidth = Math.max(400, cols * (nodeWidth + spacing) - spacing + (padding * 2));
        const requiredHeight = Math.max(300, rows * (nodeHeight + spacing) - spacing + (padding * 2) + headerHeight);

        // Only resize if we need more space
        if (requiredWidth > width || requiredHeight > height) {
            updateNode(id, {
                width: Math.max(width, requiredWidth),
                height: Math.max(height, requiredHeight)
            });
        }
    }, [currentGroupNode, nodesInside.length, width, height, updateNode, id]);

    // Update total cost when nodes inside change
    useEffect(() => {
        if (calculatedCost !== data.totalCost) {
            updateNodeData(id, {
                totalCost: calculatedCost,
                itemCount: nodesInside.length
            });
        }
    }, [calculatedCost, data.totalCost, nodesInside.length, id, updateNodeData]);

    // Auto-arrange and resize when nodes are added/removed
    useEffect(() => {
        if (nodesInside.length !== prevNodesCount && nodesInside.length > 0) {
            autoResizeGroup();
            // Delay arrangement to allow resize to complete
            setTimeout(() => {
                arrangeNodesInside();
            }, 100);
        }
        setPrevNodesCount(nodesInside.length);
    }, [nodesInside.length, prevNodesCount, autoResizeGroup, arrangeNodesInside]);

    const handleSubmit = () => {
        updateNodeData(id, { label });
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setLabel(data.label);
            setIsEditing(false);
        }
    };

    return (
        <div
            className="group-node group-node-container w-full h-full"
            style={{
                minWidth: '400px',
                minHeight: '300px',
                position: 'relative',
                width: `${width}px`,
                height: `${height}px`,
                zIndex: 0 // Keep groups in background
            }}
        >
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={400}
                minHeight={300}
                handleStyle={{
                    backgroundColor: '#3b82f6',
                    width: '12px',
                    height: '12px',
                    border: '3px solid white',
                    borderRadius: '3px',
                }}
                lineStyle={{
                    borderColor: '#3b82f6',
                    borderWidth: '2px',
                }}
            />

            <Card
                className={cn(
                    "w-full h-full bg-background/70 backdrop-blur-sm border-2 border-dashed transition-colors shadow-lg",
                    selected
                        ? "border-blue-500/80 bg-background/80"
                        : "border-blue-400/60 hover:border-blue-400/80"
                )}
            >
                <CardHeader className="pb-3 px-4 py-3">
                    <div className="flex items-center justify-between">
                        {isEditing ? (
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onBlur={handleSubmit}
                                onKeyDown={handleKeyDown}
                                className="h-8 text-lg font-semibold border-0 px-2 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-3 flex-1">
                                <Plane className="w-5 h-5 text-blue-500" />
                                <h3
                                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => setIsEditing(true)}
                                >
                                    {data.destination ? `Trip to ${data.destination}` : data.label}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {nodesInside.length > 0 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                    {nodesInside.length} items
                                </Badge>
                            )}
                            {/* Cost display - positioned in header at same height as title */}
                            <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold">
                                ${calculatedCost.toFixed(0)}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 px-4 pb-4 h-full relative">

                    {/* Empty state - only show when no nodes inside */}
                    {nodesInside.length === 0 && (
                        <>
                            <div className="text-lg text-muted-foreground text-center opacity-60 mt-16">
                                Drop flights, hotels & activities here
                            </div>
                            <div className="absolute bottom-4 right-4 text-sm text-muted-foreground opacity-50">
                                Drag & drop zone • Resize from corners
                            </div>
                        </>
                    )}

                    {/* Filled state - minimal info when nodes are present */}
                    {nodesInside.length > 0 && (
                        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground opacity-70">
                            Auto-arranged • {nodesInside.length} items
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GroupNode;
