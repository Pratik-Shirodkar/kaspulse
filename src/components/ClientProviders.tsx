'use client';

import { AIChat } from './AIChat';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <AIChat />
        </>
    );
}
