import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Flow } from '@/shared/ui/flow/Flow.tsx';
import { useMemo } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const flowConfig = useMemo(() => ({
        showMiniMap: false,
        height: '700px',
    }), []);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div
                className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-2 text-[#1b1b18] lg:justify-center  dark:bg-[#0a0a0a]">

                <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-lg shadow-sm border overflow-hidden">
                    <Flow
                        slice="travel"
                        configOverrides={flowConfig}
                    />
                </div>


            </div>
        </>
    );
}
