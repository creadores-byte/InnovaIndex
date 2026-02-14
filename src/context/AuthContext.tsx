import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, Role } from '../types';

interface AuthContextType extends AuthState {
    login: (email: string, role: Role) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        loading: true,
    });

    useEffect(() => {
        // Simulating checking user session
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                setState({
                    user: JSON.parse(storedUser),
                    isAuthenticated: true,
                    loading: false,
                });
            } else {
                setState(prev => ({ ...prev, loading: false }));
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, role: Role) => {
        // 1. Check if user exists in synced Google Sheets data
        const syncedUsersRaw = localStorage.getItem('synced_users');
        const syncedUsers: User[] = syncedUsersRaw ? JSON.parse(syncedUsersRaw) : [];
        const existingUser = syncedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        // 2. Map user
        const userToLogin: User = existingUser ? {
            ...existingUser,
            // We respect the role chosen in the login UI for now (mocking flexibility) 
            // but prioritize the sheet role if it matches
            role: existingUser.role === role ? existingUser.role : role
        } : {
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email,
            role,
        };

        localStorage.setItem('auth_user', JSON.stringify(userToLogin));
        setState({
            user: userToLogin,
            isAuthenticated: true,
            loading: false,
        });
    };

    const logout = () => {
        localStorage.removeItem('auth_user');
        setState({
            user: null,
            isAuthenticated: false,
            loading: false,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
