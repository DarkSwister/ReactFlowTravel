import { FlowConfig } from '@/shared/types/flowConfig';
import { getSliceConfig } from '@/shared/config/flowConfigs';

type SliceInitializer = () => Promise<any>;

interface SliceDefinition {
    initializer: SliceInitializer;
    getConfig: (isAuthorized: boolean) => FlowConfig;
    isLoaded: boolean;
}

class SliceRegistry {
    private slices: Record<string, SliceDefinition> = {};

    register(
        category: string,
        initializer: SliceInitializer,
        getConfig: (isAuthorized: boolean) => FlowConfig
    ) {
        this.slices[category] = { initializer, getConfig, isLoaded: false };
    }

    async ensureInitialized(category: string) {
        if (!this.slices[category]) {
            throw new Error(`Slice '${category}' is not registered`);
        }

        if (!this.slices[category].isLoaded) {
            await this.slices[category].initializer();
            this.slices[category].isLoaded = true;
        }
    }

    // Synchronous check
    isInitialized(category: string): boolean {
        return this.slices[category]?.isLoaded || false;
    }

    getConfig(category: string, isAuthorized: boolean): FlowConfig {
        if (!this.slices[category]) {
            throw new Error(`Slice '${category}' is not registered`);
        }
        return this.slices[category].getConfig(isAuthorized);
    }

    getAvailableCategories() {
        return Object.keys(this.slices);
    }
}

export const sliceRegistry = new SliceRegistry();

// Register slices with their configs
sliceRegistry.register(
    'travel',
    () => import('@/slices/travel'),
    (isAuthorized) => getSliceConfig('travel', isAuthorized)
);

// Pre-load travel slice immediately (since it's the default)
sliceRegistry.ensureInitialized('travel').catch(console.error);
