import React, { createContext, useContext, useState, useCallback } from 'react';

export const DataSyncContext = createContext();

export const useDataSync = () => {
    const context = useContext(DataSyncContext);
    if (!context) {
        throw new Error('useDataSync must be used within a DataSyncProvider');
    }
    return context;
};

export const DataSyncProvider = ({ children }) => {
    const [syncKey, setSyncKey] = useState(0);

    const triggerSync = useCallback(() => {
        setSyncKey(prevKey => prevKey + 1);
    }, []);

    return (
        <DataSyncContext.Provider value={{ syncKey, triggerSync }}>
            {children}
        </DataSyncContext.Provider>
    );
};