import { useEffect, useRef } from 'react';
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

                // Check if timestamp exists
                if (!persistedData.timestamp) {
                    return;
                }

                const now = Date.now();
                const UNAUTHORIZED_EXPIRY = 30 * 60 * 1000; // 30 minutes
                // No expiry for authorized users

                const isAuthorized = persistedData.userId && persistedData.userId !== 'anonymous';

                // Only check expiry for unauthorized users
                if (!isAuthorized) {
                    const timeDiff = now - persistedData.timestamp;

                    if (timeDiff > UNAUTHORIZED_EXPIRY) {
                        console.log('Unauthorized data expired, clearing...');
                        localStorage.removeItem('flow-diagram-storage');
                        clearLocalData();
                        onDataExpired?.();
                    }
                }
                // Authorized users' data never expires, so we don't check
            }
        } catch (error) {
            console.error('Error checking data expiration:', error);
        }
    };

    // Check for expired data on mount and periodically
    useEffect(() => {
        // Run immediately
        cleanupExpiredData();

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Set up new interval - check every 5 minutes
        intervalRef.current = setInterval(() => {
            cleanupExpiredData();
        }, 5 * 60 * 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cleanupExpiredData]);

    return {
        clearLocalData,
        cleanupExpiredData,
        isAuthenticated,
        userId,
    };
};
