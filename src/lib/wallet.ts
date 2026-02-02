// Kaspa Wallet Integration
// Supports Kasware and other Kaspa wallets via window.kaspa or window.kasware

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    balance: number | null;
    walletName: string | null;
}

export interface KaspaWalletProvider {
    isKasware?: boolean;
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    signMessage: (message: string) => Promise<string>;
    disconnect?: () => Promise<void>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
    interface Window {
        kasware?: KaspaWalletProvider;
        kaspa?: KaspaWalletProvider;
    }
}

// Get wallet provider
export function getWalletProvider(): KaspaWalletProvider | null {
    if (typeof window === 'undefined') return null;

    // Check for Kasware first
    if (window.kasware) {
        return window.kasware;
    }

    // Check for generic Kaspa provider
    if (window.kaspa) {
        return window.kaspa;
    }

    return null;
}

// Check if wallet is available
export function isWalletAvailable(): boolean {
    return getWalletProvider() !== null;
}

// Get wallet name
export function getWalletName(): string | null {
    const provider = getWalletProvider();
    if (!provider) return null;

    if (provider.isKasware) return 'Kasware';
    if (window.kaspa) return 'Kaspa Wallet';

    return 'Unknown Wallet';
}

// Connect to wallet
export async function connectWallet(): Promise<WalletState> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No Kaspa wallet found. Please install Kasware or another Kaspa wallet.');
    }

    try {
        const accounts = await provider.requestAccounts();

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found in wallet');
        }

        const address = accounts[0];
        let balance = null;

        try {
            const balanceInfo = await provider.getBalance();
            balance = balanceInfo.total / 1e8; // Convert sompi to KAS
        } catch {
            console.warn('Could not fetch balance');
        }

        return {
            isConnected: true,
            address,
            balance,
            walletName: getWalletName()
        };
    } catch (error) {
        console.error('Wallet connection error:', error);
        throw error;
    }
}

// Disconnect wallet
export async function disconnectWallet(): Promise<void> {
    const provider = getWalletProvider();

    if (provider?.disconnect) {
        await provider.disconnect();
    }
}

// Get current accounts (without prompting)
export async function getAccounts(): Promise<string[]> {
    const provider = getWalletProvider();

    if (!provider) return [];

    try {
        return await provider.getAccounts();
    } catch {
        return [];
    }
}

// Sign a message (for data anchoring proof)
export async function signMessage(message: string): Promise<string> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No wallet connected');
    }

    return await provider.signMessage(message);
}

// Format address for display
export function formatAddress(address: string, startChars: number = 10, endChars: number = 8): string {
    if (!address) return '';
    if (address.length <= startChars + endChars + 3) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Format balance for display
export function formatBalance(balance: number | null): string {
    if (balance === null) return '---';
    return balance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}
