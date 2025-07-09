import { registerNode, registerModal, getAvailableNodes } from '@/shared/lib/react-flow/nodeRegistry';
import FlightNode from '@/shared/nodes/FlightNode';
import BookingNode from '@/shared/nodes/BookingNode';
import GroupNode from '@/shared/nodes/GroupNode';
import { FlightModal } from './ui/FlightModal';
import { BookingModal } from './ui/BookingModal';

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
        price: 0,
        currency: 'EUR'
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

// Export auto-generated config
export const travelFlowConfig = {
    showToolbar: true,
    showControls: true,
    showMiniMap: true,
    showBackground: true,
    allowNodeCreation: true,
    allowNodeEditing: true,
    allowNodeDeletion: true,
    allowUndo: true,
    fitView: true,
    // Auto-generated from registry
    availableNodes: getAvailableNodes('travel'),
    enableDragAndDrop: true,
};

