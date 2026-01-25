import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
    isActivated: boolean;
    inTrial: boolean;
    daysLeft: number;
    expiry?: string | null;
    user: any | null;
    loading: boolean;
}

interface AuthContextType extends AuthState {
    login: (user: any) => void;
    logout: () => void;
    setActivated: (val: boolean) => void;
    refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isActivated: true, // Always free
        inTrial: false,
        daysLeft: 999,
        expiry: null,
        user: null,
        loading: true,
    });

    const refreshStatus = async () => {
        // No-op for free version
        setState(s => ({ ...s, loading: false }));
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    const login = (user: any) => {
        setState(s => ({ ...s, user }));
        // Consider storing user in sessionStorage if persistence across refreshes is needed
    };

    const logout = () => {
        setState(s => ({ ...s, user: null }));
    };

    const setActivated = (val: boolean) => {
        setState(s => ({ ...s, isActivated: val }));
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, setActivated, refreshStatus }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
