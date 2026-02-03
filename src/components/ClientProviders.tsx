'use client';

import { AIChat } from './AIChat';
import { WalletProvider } from './WalletProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <WalletProvider>
            {children}
            <AIChat />
        </WalletProvider>
    );
}
