import { useState } from 'react';
import { useFlowStore } from '@/app/store/flowStore.ts';

interface PriceRange {
    min: number;
    max: number;
    currency: string;
}

interface UseNodeCommonLogicProps {
    id: string;
    initialLabel: string;
    priceRange: PriceRange;
    initialPrice?: number;
    modalType: string;
}

export const useNodeCommonLogic = ({
                                       id,
                                       initialLabel,
                                       priceRange,
                                       initialPrice,
                                       modalType
                                   }: UseNodeCommonLogicProps) => {
    const { openNodeModal, updateNodeData } = useFlowStore();
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [label, setLabel] = useState(initialLabel);

    const calculatedInitialPrice = initialPrice ?? Math.round((priceRange.min + priceRange.max) / 2);
    const [price, setPrice] = useState(calculatedInitialPrice);

    const handleSettingsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openNodeModal(id, modalType);
    };

    const handleLabelSubmit = () => {
        updateNodeData(id, { label });
        setIsEditingLabel(false);
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLabelSubmit();
        } else if (e.key === 'Escape') {
            setLabel(initialLabel);
            setIsEditingLabel(false);
        }
    };

    const handleLabelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingLabel(true);
    };

    const handlePriceChange = (values: number[]) => {
        const newPrice = values[0];
        setPrice(newPrice);
        updateNodeData(id, { price: newPrice });
    };

    const handleNodeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return {
        // State
        isEditingLabel,
        label,
        price,

        // Handlers
        handleSettingsClick,
        handleLabelSubmit,
        handleLabelKeyDown,
        handleLabelClick,
        handlePriceChange,
        handleNodeClick,

        // Setters (if needed for external control)
        setIsEditingLabel,
        setLabel,
        setPrice
    };
};
