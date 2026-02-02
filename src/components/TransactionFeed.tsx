'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
    id: string;
    hash: string;
    timestamp: number;
    type: 'in' | 'out';
    amount: number;
}

// Simulated live transaction data for demo
function generateMockTransaction(): Transaction {
    const types: ('in' | 'out')[] = ['in', 'out'];
    return {
        id: Math.random().toString(36).substring(2, 15),
        hash: Array.from({ length: 64 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join(''),
        timestamp: Date.now(),
        type: types[Math.floor(Math.random() * 2)],
        amount: Math.random() * 10000
    };
}

export function TransactionFeed() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        // Initialize with some transactions
        const initial = Array.from({ length: 5 }, generateMockTransaction);
        setTransactions(initial);

        // Add new transactions periodically (simulating live feed)
        const interval = setInterval(() => {
            const newTx = generateMockTransaction();
            setTransactions(prev => [newTx, ...prev].slice(0, 10));
        }, 2000 + Math.random() * 3000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 1000) return 'Just now';
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return new Date(timestamp).toLocaleTimeString();
    };

    const formatHash = (hash: string) => {
        return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock size={20} className="text-[var(--primary)]" />
                    Live Transactions
                </h3>
                <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                    <span className="live-dot" />
                    LIVE
                </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {transactions.map((tx) => (
                        <motion.div
                            key={tx.id}
                            layout
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'in'
                                        ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                        : 'bg-[var(--secondary)]/20 text-[var(--secondary)]'
                                    }`}>
                                    {tx.type === 'in'
                                        ? <ArrowDownLeft size={16} />
                                        : <ArrowUpRight size={16} />
                                    }
                                </div>
                                <div>
                                    <div className="font-mono text-sm group-hover:text-[var(--primary)] transition-colors">
                                        {formatHash(tx.hash)}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        {formatTime(tx.timestamp)}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-right ${tx.type === 'in' ? 'text-[var(--success)]' : 'text-white/70'
                                }`}>
                                <div className="font-semibold">
                                    {tx.type === 'in' ? '+' : '-'}{formatAmount(tx.amount)}
                                </div>
                                <div className="text-xs text-white/40">KAS</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-4 text-center">
                <a
                    href="https://explorer.kaspa.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--primary)] hover:underline"
                >
                    View all on Explorer →
                </a>
            </div>
        </div>
    );
}
