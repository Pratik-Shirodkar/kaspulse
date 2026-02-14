'use client';

import { AIChat } from './AIChat';
import { WalletProvider } from './WalletProvider';
import { BlockchainProvider } from './BlockchainProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <WalletProvider>
            <BlockchainProvider>
                {children}
            </BlockchainProvider>
            <AIChat />
        </WalletProvider>
    );
}
