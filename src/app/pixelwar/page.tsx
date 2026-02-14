'use client';

import dynamic from 'next/dynamic';

const PixelWar = dynamic(() => import('@/components/PixelWar').then(m => ({ default: m.PixelWar })), { ssr: false });

export default function PixelWarPage() {
    return (
        <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <PixelWar />
        </main>
    );
}
