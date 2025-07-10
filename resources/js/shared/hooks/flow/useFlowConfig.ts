import { useMemo } from 'react';
import { getSliceConfig } from '@/shared/config/sliceConfigs';
import { FlowConfig } from '@/shared/types/flowConfig';

export const useFlowConfig = (
    slice: string,
    isAuthorized: boolean,
    configOverrides: Partial<FlowConfig>
): FlowConfig => {
    return useMemo(() => {
        const sliceConfig = getSliceConfig(slice, isAuthorized);
        return { ...sliceConfig, ...configOverrides };
    }, [slice, isAuthorized, configOverrides]);
};
