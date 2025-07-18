import React from 'react';
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Hotel, Plane, Redo, Trash2, Undo, Users, Save } from 'lucide-react';
import { FlowConfig } from '@/shared/types/flowConfig';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

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
    const { auth } = usePage().props as any;

    if (!config.showToolbar) return null;

    // ✅ Simplified checks
    const hasUndoRedo = handlers.actions &&
        typeof handlers.actions.undo === 'function' &&
        handlers.actions.canUndo !== undefined;

    const hasResetFlow = typeof handlers.resetFlow === 'function';
    const hasSave = typeof handlers.save === 'function';
    const handleAddNode = handlers.addNode;
    const handleDragStart = handlers.onDragStart;

    return (
        <>
            {/* Left Toolbar */}
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
                                        onDragStart={(e) => handleDragStart?.(e, type)}
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
                </div>
            </Panel>

            {/* Right Toolbar */}
            <Panel position="top-right" className="m-2">
                <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm dark:bg-gray-800">
                    {/* Save Button */}
                    {auth.user && (config.allowNodeEditing || config.allowNodeCreation) && hasSave && (
                        <>
                            <Button
                                onClick={handlers.save}
                                size="sm"
                                variant="default"
                                title="Save Changes"
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                            </Button>
                        </>
                    )}

                    {!auth.user && (
                        <>
                            <Button size="sm" variant="ghost" asChild>
                                <Link href={route('login')}>Log in</Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={route('register')}>Register</Link>
                            </Button>
                        </>
                    )}
                </div>
            </Panel>
        </>
    );
};
