import { registerNode, registerModal } from '@/shared/lib/react-flow/nodeRegistry';
import FlightNode from '@/shared/nodes/FlightNode';
import BookingNode from '@/shared/nodes/BookingNode';
import GroupNode from '@/shared/nodes/GroupNode';
import { FlightModal } from './ui/FlightModal';
import { BookingModal } from './ui/BookingModal';
import { createBaseFlowConfig } from '@/shared/config/flowConfigs';

// Self-register nodes with metadata
registerNode('travel:flight', FlightNode, {
    label: 'Flight',
    icon: 'Plane',
    category: 'travel',
    defaultData: {
        airline: '',
        flightNumber: '',
        departure: '',
        arrival: '',
        price: 500,
        priceRange: { min: 100, max: 10000, currency: 'EUR' } // Add this
    }
});

registerNode('travel:booking', BookingNode, {
    label: 'Hotel',
    icon: 'Hotel',
    category: 'travel',
    defaultData: {
        bookingType: 'hotel',
        priceRange: { min: 50, max: 5000, currency: 'EUR' },
        estimatedPrice: 500
    }
});

registerNode('travel:group', GroupNode, {
    label: 'Trip Group',
    icon: 'Users',
    category: 'travel',
    defaultData: {
        destination: '',
        totalCost: 0,
        itemCount: 0
    }
});

// Register wizards
registerModal('travel:flight', FlightModal);
registerModal('travel:booking', BookingModal);

