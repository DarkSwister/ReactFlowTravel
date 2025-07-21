import React, { useState } from 'react';
import { useFlowStore } from '@/app/store/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FlightModalProps {
    node: any;
    onClose: () => void;
}

export const FlightModal: React.FC<FlightModalProps> = ({ node, onClose }) => {
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const [formData, setFormData] = useState({
        label: node.data.label || '',
        departure: node.data.departure || '',
        arrival: node.data.arrival || '',
        departureDate: node.data.departureDate || '',
        airline: node.data.airline || '',
        flightNumber: node.data.flightNumber || '',
        priceMin: node.data.priceRange?.min || 100,
        priceMax: node.data.priceRange?.max || 500,
    });

    const handleSave = () => {
        updateNodeData(node.id, {
            label: formData.label,
            departure: formData.departure,
            arrival: formData.arrival,
            departureDate: formData.departureDate,
            airline: formData.airline,
            flightNumber: formData.flightNumber,
            priceRange: {
                min: formData.priceMin,
                max: formData.priceMax,
                currency: 'USD'
            }
        }, true); // Save to history
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="flight-label">Flight Name</Label>
                <Input
                    id="flight-label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Morning Flight to Paris"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="flight-departure">Departure</Label>
                    <Input
                        id="flight-departure"
                        value={formData.departure}
                        onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                        placeholder="e.g., NYC, JFK"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="flight-arrival">Arrival</Label>
                    <Input
                        id="flight-arrival"
                        value={formData.arrival}
                        onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                        placeholder="e.g., LAX, Los Angeles"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="flight-airline">Airline</Label>
                    <Input
                        id="flight-airline"
                        value={formData.airline}
                        onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                        placeholder="e.g., American Airlines"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="flight-number">Flight Number</Label>
                    <Input
                        id="flight-number"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                        placeholder="e.g., AA123"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="flight-date">Departure Date</Label>
                <Input
                    id="flight-date"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="flight-price-min">Min Price ($)</Label>
                    <Input
                        id="flight-price-min"
                        type="number"
                        value={formData.priceMin}
                        onChange={(e) => setFormData({ ...formData, priceMin: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="flight-price-max">Max Price ($)</Label>
                    <Input
                        id="flight-price-max"
                        type="number"
                        value={formData.priceMax}
                        onChange={(e) => setFormData({ ...formData, priceMax: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="50"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    Save Flight
                </Button>
            </div>
        </div>
    );
};
