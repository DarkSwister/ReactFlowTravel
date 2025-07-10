import React from 'react';
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Hotel, Plane, Redo, Trash2, Undo, Users } from 'lucide-react';
import { FlowConfig } from '@/shared/types/flowConfig';

const iconMap = {
    Plane,
    Hotel,
    Users,
};

interface FlowToolbarProps {
    config: FlowConfig;
    handlers: any;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({ config, handlers }) => {
    if (!config.showToolbar) return null;

    // ✅ Check if handlers exist before using them
    const hasUndoRedo = handlers.actions &&
        typeof handlers.actions.undo === 'function' &&
        typeof handlers.actions.redo === 'function';

    const hasResetFlow = handlers.resetFlow && typeof handlers.resetFlow === 'function';

    // ✅ Handle different handler structures (store vs store-free)
    const handleAddNode = handlers.handleAddNode || handlers.addNode;
    const handleDragStart = handlers.onDragStart || (() => {});

    return (
        <Panel position="top-left" className="m-2">
            <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm dark:bg-gray-800">
                {config.allowNodeCreation && config.availableNodes && (
                    <>
                        {config.availableNodes.map(({ type, label, icon, defaultData }) => {
                            const IconComponent = iconMap[icon as keyof typeof iconMap];
                            return (
                                <Button
                                    key={type}
                                    onClick={() => handleAddNode?.(type, defaultData)}
                                    onDragStart={(e) => handleDragStart(e, type)}
                                    draggable={config.enableDragAndDrop}
                                    size="sm"
                                    variant="outline"
                                    className="flex cursor-grab items-center gap-1 active:cursor-grabbing"
                                >
                                    {IconComponent && <IconComponent className="h-4 w-4" />}
                                    {label}
                                </Button>
                            );
                        })}
                        <div className="mx-1 h-6 w-px bg-gray-300" />
                    </>
                )}

                {config.allowUndo && hasUndoRedo && (
                    <>
                        <Button
                            onClick={handlers.actions.undo}
                            size="sm"
                            variant="ghost"
                            title="Undo"
                            disabled={!handlers.actions.canUndo}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={handlers.actions.redo}
                            size="sm"
                            variant="ghost"
                            title="Redo"
                            disabled={!handlers.actions.canRedo}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                        <div className="mx-1 h-6 w-px bg-gray-300" />
                    </>
                )}

                {hasResetFlow && (
                    <Button
                        onClick={handlers.resetFlow}
                        size="sm"
                        variant="ghost"
                        title="Reset Flow"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}

                {/* ✅ Show message when undo/redo not available in store-free mode */}
                {config.allowUndo && !hasUndoRedo && (
                    <div className="text-xs text-gray-500 px-2">
                        Undo/Redo requires store mode
                    </div>
                )}
            </div>
        </Panel>
    );
};
