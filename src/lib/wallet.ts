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
    sendKaspa: (toAddress: string, sompi: number, options?: { priorityFee?: number }) => Promise<string>;
    getNetwork: () => Promise<string>;
    switchNetwork: (network: string) => Promise<void>;
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
    if (typeof window === 'undefined') return null;

    // Check window.kasware first — most reliable indicator
    if (window.kasware) return 'Kasware';
    if (window.kaspa) return 'Kaspa Wallet';

    return 'Wallet';
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
            console.log('Raw balance from wallet:', JSON.stringify(balanceInfo));
            // Kasware returns { confirmed, unconfirmed, total } in sompi
            // But some versions may return values already in KAS
            const rawTotal = balanceInfo.total;
            // If the value is very large (> 1000), it's in sompi → convert
            // If it's small, it's likely already in KAS
            balance = rawTotal > 1000 ? rawTotal / 1e8 : rawTotal;
        } catch (e) {
            console.warn('Could not fetch balance:', e);
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

// Get current network
export async function getNetwork(): Promise<string> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No wallet connected');
    }

    try {
        return await provider.getNetwork();
    } catch {
        return 'unknown';
    }
}

// Switch network (testnet/mainnet)
export async function switchNetwork(network: 'kaspa-testnet' | 'kaspa-mainnet'): Promise<void> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No wallet connected');
    }

    await provider.switchNetwork(network);
}

// Send KAS transaction (for on-chain anchoring)
// Returns the transaction ID
export async function sendTransaction(
    toAddress: string,
    amountKas: number = 1, // Default 1 KAS
    priorityFeeKas: number = 0
): Promise<string> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No wallet connected');
    }

    // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
    const sompi = Math.floor(amountKas * 1e8);
    const priorityFeesompi = Math.floor(priorityFeeKas * 1e8);

    if (sompi < 20000000) {
        throw new Error('Amount too small. Minimum is 0.2 KAS to avoid storage mass limits');
    }

    // Detect network and fix address mismatch
    let finalAddress = toAddress;
    try {
        const network = await provider.getNetwork();
        const isTestnet = network?.toLowerCase().includes('test');
        const addressIsTestnet = toAddress.startsWith('kaspatest:');

        // If network type doesn't match address prefix, fall back to self-transfer
        if (isTestnet && !addressIsTestnet) {
            const accounts = await provider.getAccounts();
            if (accounts.length > 0) {
                finalAddress = accounts[0];
                console.log(`Network mismatch: wallet on testnet but address is mainnet. Using self-transfer: ${finalAddress}`);
            }
        } else if (!isTestnet && addressIsTestnet) {
            const accounts = await provider.getAccounts();
            if (accounts.length > 0) {
                finalAddress = accounts[0];
                console.log(`Network mismatch: wallet on mainnet but address is testnet. Using self-transfer: ${finalAddress}`);
            }
        }
    } catch {
        // If network detection fails, just use the provided address
    }

    console.log(`Sending Transaction:`);
    console.log(`- To: ${finalAddress}`);
    console.log(`- Amount: ${sompi} sompi (${amountKas} KAS)`);
    console.log(`- Fee: ${priorityFeesompi} sompi (${priorityFeeKas} KAS)`);

    try {
        const txId = await provider.sendKaspa(finalAddress, sompi, {
            priorityFee: priorityFeesompi,
            // @ts-ignore - some wallet versions might use 'fee'
            fee: priorityFeesompi
        });
        return txId;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
}

// Create an on-chain anchor proof by sending a transaction
// The transaction ID serves as the on-chain proof
export async function createOnChainAnchor(
    hash: string,
    recipientAddress?: string
): Promise<{ txId: string; signature: string }> {
    const provider = getWalletProvider();

    if (!provider) {
        throw new Error('No wallet connected');
    }

    // Get connected wallet's address as default recipient (self-transfer)
    const accounts = await provider.getAccounts();
    const selfAddress = accounts[0];
    const toAddress = recipientAddress || selfAddress;

    // Sign the hash first (this proves you anchored this specific data)
    const signature = await provider.signMessage(hash);

    // Use a robust priority fee and sufficient amount to prevent errors
    // Amount: 1 KAS (visible in wallet)
    // Fee: 0.01 KAS (high priority)
    const txId = await sendTransaction(toAddress, 1.0, 0.01);

    return { txId, signature };
}
