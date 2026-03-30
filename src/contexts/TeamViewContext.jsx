import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const TeamViewContext = createContext();

export const useTeamView = () => {
    const context = useContext(TeamViewContext);
    if (!context) {
        throw new Error('useTeamView must be used within a TeamViewProvider');
    }
    return context;
};

export const TeamViewProvider = ({ children }) => {
    const [isTeamView, setIsTeamView] = useState(false);
    const { user } = useAuth();

    const toggleTeamView = useCallback(() => {
        if (user?.role === 'sub-admin') {
            setIsTeamView(prev => !prev);
        }
    }, [user]);

    const value = {
        isTeamView,
        setIsTeamView,
        toggleTeamView,
    };

    return (
        <TeamViewContext.Provider value={value}>
            {children}
        </TeamViewContext.Provider>
    );
};