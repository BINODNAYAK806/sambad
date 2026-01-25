import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse font-medium">Initializing Security Node...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
