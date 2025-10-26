import { ComponentType } from 'react';
import FlightNode from './FlightNode';
import BookingNode from './BookingNode';
import GroupNode from './GroupNode';
import { FlightModal } from './modals/FlightModal';
import { BookingModal } from './modals/BookingModal';

export interface NodeDefinition {
    component: ComponentType<any>;
    label: string;
    icon: string;
    category?: string;
    defaultData?: any;
    defaultStyle?: any;
    modalComponent?: ComponentType<any>;
}

// All available nodes in the system
export const NODE_REGISTRY: Record<string, NodeDefinition> = {
    'flight': {
        component: FlightNode,
        label: 'Flight',
        icon: 'Plane',
        category: 'travel',
        modalComponent: FlightModal,
        defaultData: {
            airline: '',
            flightNumber: '',
            departure: '',
            arrival: '',
            price: 500,
            priceRange: { min: 100, max: 10000, currency: 'EUR' }
        }
    },

    'booking': {
        component: BookingNode,
        label: 'Hotel',
        icon: 'Hotel',
        category: 'accommodation',
        modalComponent: BookingModal,
        defaultData: {
            bookingType: 'hotel',
            priceRange: { min: 50, max: 5000, currency: 'EUR' },
            estimatedPrice: 500
        }
    },

    'group': {
        component: GroupNode,
        label: 'Group',
        icon: 'Users',
        category: 'organization',
        defaultData: {
            destination: '',
            totalCost: 0,
            itemCount: 0
        },
        defaultStyle: {
            width: 400,
            height: 300,
        }
    },
};

// Get React Flow node types (for ReactFlow nodeTypes prop)
export const getNodeTypes = (): Record<string, ComponentType<any>> => {
    return Object.entries(NODE_REGISTRY).reduce(
        (acc, [type, def]) => ({ ...acc, [type]: def.component }),
        {}
    );
};

// Get available nodes list (for toolbar/sidebar)
export const getAvailableNodesList = () => {
    return Object.entries(NODE_REGISTRY).map(([type, def]) => ({
        type,
        label: def.label,
        icon: def.icon,
        defaultData: def.defaultData,
        defaultStyle: def.defaultStyle,
        hasModal: !!def.modalComponent,
    }));
};

// Get node definition
export const getNodeDefinition = (type: string): NodeDefinition | undefined => {
    return NODE_REGISTRY[type];
};

// Get modal component for a node type
export const getNodeModal = (type: string): ComponentType<any> | undefined => {
    return NODE_REGISTRY[type]?.modalComponent;
};