import React, { useState } from 'react';
import { useFlowStore } from '@/app/store/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingModalProps {
    node: any;
    onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ node, onClose }) => {
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const [formData, setFormData] = useState({
        label: node.data.label || '',
        location: node.data.location || '',
        checkIn: node.data.checkIn || '',
        checkOut: node.data.checkOut || '',
        bookingType: node.data.bookingType || 'hotel',
        priceMin: node.data.priceRange?.min || 50,
        priceMax: node.data.priceRange?.max || 300,
    });

    const handleSave = () => {
        updateNodeData(node.id, {
            label: formData.label,
            location: formData.location,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            bookingType: formData.bookingType,
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
                <Label htmlFor="booking-label">Accommodation Name</Label>
                <Input
                    id="booking-label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Grand Hotel Downtown"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="booking-type">Type</Label>
                <Select value={formData.bookingType} onValueChange={(value) => setFormData({ ...formData, bookingType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select accommodation type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="bnb">Bed & Breakfast</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="booking-location">Location</Label>
                <Input
                    id="booking-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., New York, NY"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="booking-checkin">Check-in Date</Label>
                    <Input
                        id="booking-checkin"
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="booking-checkout">Check-out Date</Label>
                    <Input
                        id="booking-checkout"
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="booking-price-min">Min Price per night ($)</Label>
                    <Input
                        id="booking-price-min"
                        type="number"
                        value={formData.priceMin}
                        onChange={(e) => setFormData({ ...formData, priceMin: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="25"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="booking-price-max">Max Price per night ($)</Label>
                    <Input
                        id="booking-price-max"
                        type="number"
                        value={formData.priceMax}
                        onChange={(e) => setFormData({ ...formData, priceMax: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="25"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    Save Accommodation
                </Button>
            </div>
        </div>
    );
};
