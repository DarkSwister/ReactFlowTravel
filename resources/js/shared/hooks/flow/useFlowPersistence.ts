import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useFlowStore } from '@/app/store/flowStore.ts';
import { type SharedData } from '@/types';

interface UseFlowPersistenceOptions {
    onDataExpired?: () => void;
}

export const useFlowPersistence = (options: UseFlowPersistenceOptions = {}) => {
    const { onDataExpired } = options;
    const { auth } = usePage<SharedData>().props;
    const { clearLocalData, setUserId } = useFlowStore();

    const isAuthenticated = !!auth.user;
    const userId = auth.user?.id?.toString() || null;

    useEffect(() => {
        // Update user ID when authentication state changes
        setUserId(userId);
    }, [userId, setUserId]);

    useEffect(() => {
        // Clear data when user logs out
        if (!isAuthenticated) {
            // Don't immediately clear - let it expire naturally for anonymous users
            // But you could clear it immediately if you prefer:
            // clearLocalData();
        }
    }, [isAuthenticated, clearLocalData]);

    // Cleanup function to manually clear expired data
    const cleanupExpiredData = () => {
        try {
            const stored = localStorage.getItem('flow-diagram-storage');
            if (stored) {
                const data = JSON.parse(stored);
                const persistedData = data.state;
                const now = Date.now();
                const UNAUTHORIZED_EXPIRY = 30 * 60 * 1000; // 30 minutes
                const AUTHORIZED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

                const isAuthorized = persistedData.userId && persistedData.userId !== 'anonymous';
                const expiryTime = isAuthorized ? AUTHORIZED_EXPIRY : UNAUTHORIZED_EXPIRY;

                if (now - persistedData.timestamp > expiryTime) {
                    localStorage.removeItem('flow-diagram-storage');
                    clearLocalData();
                    onDataExpired?.();
                }
            }
        } catch (error) {
            console.error('Error checking data expiration:', error);
        }
    };

    // Check for expired data on mount and periodically
    useEffect(() => {
        cleanupExpiredData();

        // Check every 5 minutes for expired data
        const interval = setInterval(cleanupExpiredData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [cleanupExpiredData]);

    return {
        clearLocalData,
        cleanupExpiredData,
        isAuthenticated,
        userId,
    };
};
