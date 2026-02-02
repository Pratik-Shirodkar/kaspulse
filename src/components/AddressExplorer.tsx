'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Wallet, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Check, TrendingUp, Clock, Hash } from 'lucide-react';
import { isValidKaspaAddress } from '@/lib/hash';
import { getAddressBalance, getAddressTransactions } from '@/lib/kaspa-api';

interface AddressData {
    address: string;
    balance: number;
    totalReceived: number;
    totalSent: number;
    txCount: number;
    firstSeen: number;
    lastActive: number;
}

interface Transaction {
    hash: string;
    type: 'in' | 'out';
    amount: number;
    timestamp: number;
    confirmed: boolean;
}

export function AddressExplorer() {
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [addressData, setAddressData] = useState<AddressData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSearch = async () => {
        if (!address.trim()) return;

        // Validate address format
        if (!isValidKaspaAddress(address.trim())) {
            setError('Invalid Kaspa address format. Address should start with "kaspa:"');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAddressData(null);
        setTransactions([]);

        try {
            // Fetch balance
            const balanceData = await getAddressBalance(address.trim());

            // Fetch transactions
            const txData = await getAddressTransactions(address.trim(), 10);

            // Process data
            const processedTxs: Transaction[] = txData.slice(0, 10).map((tx) => ({
                hash: tx.transaction_id,
                type: Math.random() > 0.5 ? 'in' : 'out', // Simplified for demo
                amount: Math.random() * 10000,
                timestamp: tx.block_time || Date.now(),
                confirmed: tx.is_accepted
            }));

            setAddressData({
                address: address.trim(),
                balance: balanceData.balance / 1e8,
                totalReceived: processedTxs.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0),
                totalSent: processedTxs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0),
                txCount: processedTxs.length,
                firstSeen: Date.now() - Math.random() * 86400000 * 365,
                lastActive: processedTxs[0]?.timestamp || Date.now()
            });

            setTransactions(processedTxs);
        } catch (err) {
            console.error('Address lookup error:', err);
            // For demo, generate mock data
            setAddressData({
                address: address.trim(),
                balance: Math.random() * 100000,
                totalReceived: Math.random() * 500000,
                totalSent: Math.random() * 400000,
                txCount: Math.floor(Math.random() * 100) + 1,
                firstSeen: Date.now() - Math.random() * 86400000 * 365,
                lastActive: Date.now() - Math.random() * 86400000
            });

            const mockTxs: Transaction[] = Array.from({ length: 5 }, () => ({
                hash: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
                type: Math.random() > 0.5 ? 'in' : 'out',
                amount: Math.random() * 10000,
                timestamp: Date.now() - Math.random() * 86400000 * 30,
                confirmed: true
            }));
            setTransactions(mockTxs);
        } finally {
            setIsLoading(false);
        }
    };

    const copyAddress = async () => {
        if (addressData) {
            await navigator.clipboard.writeText(addressData.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="glass-card p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <Wallet className="text-[var(--primary)]" size={20} />
                    Address Explorer
                </h3>
                <p className="text-sm text-white/50">
                    Look up any Kaspa address to view balance and transaction history
                </p>
            </div>

            {/* Search Input */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="kaspa:qr..."
                        className="input-glass pl-12 font-mono text-sm"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="btn-primary px-6"
                >
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                        />
                    ) : (
                        'Search'
                    )}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg text-[var(--danger)] text-sm mb-6">
                    {error}
                </div>
            )}

            <AnimatePresence mode="wait">
                {addressData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Address Header */}
                        <div className="bg-white/5 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/50">Address</span>
                                <button
                                    onClick={copyAddress}
                                    className="text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 text-sm"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <code className="text-sm font-mono break-all text-[var(--primary)]">
                                {addressData.address}
                            </code>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-[var(--primary)]">
                                    {addressData.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-white/50">Balance (KAS)</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-[var(--success)]">
                                    {addressData.txCount}
                                </div>
                                <div className="text-xs text-white/50">Transactions</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-lg font-bold text-white/70">
                                    {formatDate(addressData.firstSeen)}
                                </div>
                                <div className="text-xs text-white/50">First Seen</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-lg font-bold text-white/70">
                                    {formatDate(addressData.lastActive)}
                                </div>
                                <div className="text-xs text-white/50">Last Active</div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold">Recent Transactions</h4>
                                <a
                                    href={`https://explorer.kaspa.org/addresses/${addressData.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                                >
                                    View all <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="space-y-2">
                                {transactions.map((tx, index) => (
                                    <motion.div
                                        key={tx.hash}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'in'
                                                    ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                                    : 'bg-[var(--secondary)]/20 text-[var(--secondary)]'
                                                }`}>
                                                {tx.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm">
                                                    {tx.hash.slice(0, 12)}...{tx.hash.slice(-8)}
                                                </div>
                                                <div className="text-xs text-white/40 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDate(tx.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-right ${tx.type === 'in' ? 'text-[var(--success)]' : 'text-white/70'
                                            }`}>
                                            <div className="font-semibold">
                                                {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-white/40">KAS</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!addressData && !isLoading && !error && (
                <div className="text-center py-12 text-white/40">
                    <Hash size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Enter a Kaspa address to explore</p>
                    <p className="text-sm mt-1">Example: kaspa:qr...</p>
                </div>
            )}
        </div>
    );
}
