import { createContext, useContext, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DnDContext = createContext([null, (_: any) => {}]);

export const DnDProvider = ({ children }) => {
    const [type, setType] = useState(null);

    return (
        <DnDContext.Provider value={[type, setType]}>
            {children}
        </DnDContext.Provider>
    );
}

export default DnDContext;

export const useDnD = () => {
    return useContext(DnDContext);
}
