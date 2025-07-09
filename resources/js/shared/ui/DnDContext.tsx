import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DnDContextType {
    type: string | null;
    setType: (type: string | null) => void;
}

const DnDContext = createContext<DnDContextType | undefined>(undefined);

export const DnDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [type, setType] = useState<string | null>(null);

    return (
        <DnDContext.Provider value={{ type, setType }}>
            {children}
        </DnDContext.Provider>
    );
};

export const useDnD = (): [string | null, (type: string | null) => void] => {
    const context = useContext(DnDContext);
    if (context === undefined) {
        throw new Error('useDnD must be used within a DnDProvider');
    }
    return [context.type, context.setType];
};
