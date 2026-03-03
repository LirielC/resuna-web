"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    redirectTo?: string;
    loadingComponent?: ReactNode;
}

/**
 * Component to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({
    children,
    redirectTo = '/login',
    loadingComponent
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if not loading and no user
        if (!loading && !user) {
            // Store the intended destination for redirect after login
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('redirectAfterLogin', currentPath);

            router.replace(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <>
                {loadingComponent || (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // If not authenticated, return null (will redirect in useEffect)
    if (!user) {
        return null;
    }

    // User is authenticated, render children
    return <>{children}</>;
}
