'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletState, connectWallet, disconnectWallet, getAccounts, isWalletAvailable, formatAddress, formatBalance } from '@/lib/wallet';
import { Wallet, LogOut, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletButtonProps {
    onConnect?: (state: WalletState) => void;
    onDisconnect?: () => void;
}

export function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
    const [walletState, setWalletState] = useState<WalletState>({
        isConnected: false,
        address: null,
        balance: null,
        walletName: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [walletAvailable, setWalletAvailable] = useState(false);

    // Check for existing connection on mount — retry to wait for extension injection
    useEffect(() => {
        let cancelled = false;

        const checkConnection = async () => {
            // Retry with increasing delays to wait for wallet extension injection
            const delays = [100, 500, 1000, 2000];
            for (const delay of delays) {
                if (cancelled) return;
                await new Promise(resolve => setTimeout(resolve, delay));
                if (isWalletAvailable()) {
                    setWalletAvailable(true);
                    break;
                }
            }

            if (!isWalletAvailable()) return;
            setWalletAvailable(true);

            const accounts = await getAccounts();
            if (accounts.length > 0) {
                try {
                    const state = await connectWallet();
                    setWalletState(state);
                    onConnect?.(state);
                } catch (error) {
                    console.error('Auto-connect failed:', error);
                }
            }
        };

        checkConnection();
        return () => { cancelled = true; };
    }, [onConnect]);

    const handleConnect = useCallback(async () => {
        setIsLoading(true);
        try {
            const state = await connectWallet();
            setWalletState(state);
            onConnect?.(state);
        } catch (error) {
            console.error('Connection error:', error);
            alert(error instanceof Error ? error.message : 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    }, [onConnect]);

    const handleDisconnect = useCallback(async () => {
        try {
            await disconnectWallet();
            setWalletState({
                isConnected: false,
                address: null,
                balance: null,
                walletName: null
            });
            setShowDropdown(false);
            onDisconnect?.();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }, [onDisconnect]);

    if (!walletAvailable) {
        return (
            <a
                href="https://kasware.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 text-sm"
            >
                <Wallet size={18} />
                <span>Install Kasware</span>
                <ExternalLink size={14} />
            </a>
        );
    }

    if (!walletState.isConnected) {
        return (
            <button
                onClick={handleConnect}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
            >
                <Wallet size={18} />
                <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="glass-card px-4 py-2 flex items-center gap-3 cursor-pointer hover:border-[var(--primary)]"
            >
                <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-glow" />
                <div className="text-left">
                    <div className="text-xs text-[var(--primary)] opacity-70">{walletState.walletName}</div>
                    <div className="text-sm font-mono">{formatAddress(walletState.address || '')}</div>
                </div>
                <div className="text-right ml-2">
                    <div className="text-xs opacity-50">Balance</div>
                    <div className="text-sm font-semibold text-[var(--primary)]">
                        {formatBalance(walletState.balance)} KAS
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 glass-card p-2 min-w-[200px] z-50"
                    >
                        <button
                            onClick={() => navigator.clipboard.writeText(walletState.address || '')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Copy Address
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-[var(--danger)]"
                        >
                            <LogOut size={16} />
                            Disconnect
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
