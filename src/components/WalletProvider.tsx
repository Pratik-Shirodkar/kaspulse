'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    isWalletAvailable,
    connectWallet,
    disconnectWallet,
    getAccounts,
    signMessage,
    getWalletProvider,
    WalletState,
} from '@/lib/wallet';

interface WalletContextType {
    isInstalled: boolean;
    isConnected: boolean;
    address: string | null;
    balance: number | null;
    walletName: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    signProof: (hash: string) => Promise<string>;
    refreshBalance: () => Promise<void>;
    isConnecting: boolean;
    error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const [state, setState] = useState<WalletState>({
        isConnected: false,
        address: null,
        balance: null,
        walletName: null,
    });
    const [isInstalled, setIsInstalled] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if wallet is installed on mount
    useEffect(() => {
        const checkInstalled = async () => {
            // Wait a bit for wallet injection
            await new Promise(resolve => setTimeout(resolve, 100));
            setIsInstalled(isWalletAvailable());

            // Check for existing connection
            const accounts = await getAccounts();
            if (accounts.length > 0) {
                try {
                    const walletState = await connectWallet();
                    setState(walletState);
                } catch (error) {
                    console.error('Auto-connect failed:', error);
                }
            }
        };

        checkInstalled();
    }, []);

    const connect = useCallback(async () => {
        if (!isInstalled) {
            setError('Please install Kasware wallet from kasware.xyz');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const walletState = await connectWallet();
            setState(walletState);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Connection failed';
            setError(message);
        } finally {
            setIsConnecting(false);
        }
    }, [isInstalled]);

    const disconnect = useCallback(async () => {
        await disconnectWallet();
        setState({
            isConnected: false,
            address: null,
            balance: null,
            walletName: null,
        });
    }, []);

    const refreshBalance = useCallback(async () => {
        if (!state.isConnected) return;

        try {
            const provider = getWalletProvider();
            if (provider) {
                const balanceInfo = await provider.getBalance();
                setState(prev => ({ ...prev, balance: balanceInfo.total / 1e8 }));
            }
        } catch (err) {
            console.error('Failed to refresh balance:', err);
        }
    }, [state.isConnected]);

    const signProof = useCallback(async (hash: string): Promise<string> => {
        if (!state.isConnected) {
            throw new Error('Wallet not connected');
        }

        return await signMessage(hash);
    }, [state.isConnected]);

    const value: WalletContextType = {
        isInstalled,
        isConnected: state.isConnected,
        address: state.address,
        balance: state.balance,
        walletName: state.walletName,
        connect,
        disconnect,
        signProof,
        refreshBalance,
        isConnecting,
        error,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}
