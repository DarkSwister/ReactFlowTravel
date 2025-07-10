import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, Activity, Car, Plus, MapPin } from 'lucide-react';
import { useDnD } from './DnDContext';

const Sidebar = () => {
    const [, setType] = useDnD();

    const onDragStart = (event, nodeType) => {
        setType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const dragItems = [
        {
            type: 'group',
            label: 'Group',
            icon: <MapPin className="w-4 h-4" />,
            description: 'Create group area',
            color: 'hsl(var(--primary))'
        },
        {
            type: 'flight',
            label: 'Flight',
            icon: <Plane className="w-3 h-3" />,
            color: 'hsl(var(--primary))'
        },
        {
            type: 'booking',
            label: 'Hotel',
            icon: <Hotel className="w-3 h-3" />,
            color: 'hsl(var(--primary))',
            bookingType: 'hotel'
        },
        {
            type: 'booking',
            label: 'Activity',
            icon: <Activity className="w-3 h-3" />,
            color: 'hsl(var(--primary))',
            bookingType: 'activity'
        },
        {
            type: 'booking',
            label: 'Transport',
            icon: <Car className="w-3 h-3" />,
            color: 'hsl(var(--primary))',
            bookingType: 'transport'
        }
    ];

    return (
        <div className="w-full h-8 bg-background border-b flex items-center px-2 gap-1">
            <div className="flex items-center gap-1 flex-shrink-0">
                <Plus className="w-2 h-2 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                    Add:
                </span>
            </div>

            <div className="flex items-center gap-1 flex-1">
                {dragItems.map((item, index) => (
                    <div
                        key={index}
                        className="cursor-grab active:cursor-grabbing flex items-center gap-1 px-1 py-0.5 rounded border hover:shadow-sm flex-shrink-0"
                        style={{ borderColor: item.color }}
                        draggable
                        onDragStart={e => onDragStart(e, item.type)}
                        data-booking-type={item.bookingType}
                    >
                        <div style={{ color: item.color }}>
                            {item.icon}
                        </div>
                        <span className="text-xs font-medium" style={{ color: item.color }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <Badge variant="outline" className="text-xs h-5">
                Drag →
            </Badge>
        </div>
    );
};

export default Sidebar;
