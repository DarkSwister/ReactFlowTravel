import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { travelFlowConfig } from '@/slices/travel';
import { Flow } from '@/shared/ui/Flow.tsx';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const previewConfig = {
        ...travelFlowConfig,
        showMiniMap: false,
        allowNodeDeletion: true,
        height: '700px',
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div
                className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-2 text-[#1b1b18] lg:justify-center  dark:bg-[#0a0a0a]">

                <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-lg shadow-sm border overflow-hidden">
                    <Flow config={previewConfig} />
                </div>


            </div>
        </>
    );
}
