import React from 'react';
import { Plane } from 'lucide-react';
import { FlowConfig } from '@/shared/types/flowConfig';

interface FlowEmptyStateProps {
    show: boolean;
    config: FlowConfig;
}

export const FlowEmptyState: React.FC<FlowEmptyStateProps> = ({ show, config }) => {
    if (!show) return null;

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
                <Plane className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <h3 className="mb-2 text-lg font-medium">Start Planning</h3>
                <p className="text-sm">
                    {config.allowNodeCreation
                        ? config.enableDragAndDrop
                            ? 'Click or drag items from the toolbar above'
                            : 'Add items using the toolbar above'
                        : 'No items to display'}
                </p>
            </div>
        </div>
    );
};
