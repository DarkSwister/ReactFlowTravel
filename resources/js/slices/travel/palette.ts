export const travelPalette = [
    { type: 'travel:flight', label: 'Flight', icon: '✈️' },
    { type: 'travel:booking', label: 'Accommodation', icon: '🏨' },
    { type: 'travel:transport', label: 'Transport', icon: '🚌' },
    { type: 'travel:group', label: 'Group', icon: '📁' },
];

export const getNodeTypeConfig = (type: string) => {
    return travelPalette.find(item => item.type === type);
};
