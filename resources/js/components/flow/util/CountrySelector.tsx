import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plane } from 'lucide-react';

const COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
];

interface CountrySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (countryData: string | { departure: string; arrival: string }) => void;
    nodeType: 'flight' | 'booking';
    bookingType?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSelect,
                                                         }) => {
    const [departure, setDeparture] = useState('');
    const [arrival, setArrival] = useState('');

    const handleSubmit = () => {
        if (departure && arrival) {
            onSelect({ departure, arrival });
            setDeparture('');
            setArrival('');
        }
    };

    const isValid = departure && arrival;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plane className="w-5 h-5" />
                        Select Flight Route
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="departure">From</Label>
                        <Select value={departure} onValueChange={setDeparture}>
                            <SelectTrigger>
                                <SelectValue placeholder="Departure country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="arrival">To</Label>
                        <Select value={arrival} onValueChange={setArrival}>
                            <SelectTrigger>
                                <SelectValue placeholder="Destination country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!isValid}>
                            Create Flight & Group
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CountrySelector;
