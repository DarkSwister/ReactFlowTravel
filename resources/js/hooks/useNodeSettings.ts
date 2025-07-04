import { useState, useCallback } from 'react';

interface UseNodeSettingsProps {
    initialPriceRange?: { min: number; max: number; currency: string };
    initialEstimatedPrice?: number;
    initialDateRange?: { start: Date; end: Date };
    onUpdatePricing?: (priceRange: { min: number; max: number; currency: string }, estimatedPrice: number) => void;
    onUpdateDateRange?: (dateRange: { start: Date; end: Date }) => void;
}

export const useNodeSettings = ({
                                    initialPriceRange = { min: 100, max: 1000, currency: 'USD' },
                                    initialEstimatedPrice = 500,
                                    initialDateRange = { start: new Date(), end: new Date() },
                                    onUpdatePricing,
                                    onUpdateDateRange
                                }: UseNodeSettingsProps) => {
    const [priceRange, setPriceRange] = useState([
        initialPriceRange.min,
        initialPriceRange.max
    ]);
    const [estimatedPrice, setEstimatedPrice] = useState(initialEstimatedPrice);
    const [startDate, setStartDate] = useState<Date>(initialDateRange.start);
    const [endDate, setEndDate] = useState<Date>(initialDateRange.end);

    const handlePriceRangeChange = useCallback((values: number[]) => {
        setPriceRange(values);
        const avgPrice = (values[0] + values[1]) / 2;
        setEstimatedPrice(Math.round(avgPrice));

        onUpdatePricing?.({
            min: values[0],
            max: values[1],
            currency: initialPriceRange.currency
        }, Math.round(avgPrice));
    }, [initialPriceRange.currency, onUpdatePricing]);

    const handleEstimatedPriceChange = useCallback((value: string) => {
        const price = parseInt(value) || 0;
        setEstimatedPrice(price);

        onUpdatePricing?.({
            min: priceRange[0],
            max: priceRange[1],
            currency: initialPriceRange.currency
        }, price);
    }, [priceRange, initialPriceRange.currency, onUpdatePricing]);

    const handleDateChange = useCallback((start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        onUpdateDateRange?.({ start, end });
    }, [onUpdateDateRange]);

    const updatePriceRange = useCallback((newRange: [number, number]) => {
        setPriceRange(newRange);
        const newEstimated = Math.min(estimatedPrice, newRange[1]);
        setEstimatedPrice(newEstimated);
    }, [estimatedPrice]);

    return {
        priceRange,
        estimatedPrice,
        startDate,
        endDate,
        handlePriceRangeChange,
        handleEstimatedPriceChange,
        handleDateChange,
        updatePriceRange,
        setPriceRange,
        setEstimatedPrice,
        setStartDate,
        setEndDate
    };
};
