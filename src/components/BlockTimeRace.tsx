'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, ArrowRight, Shield } from 'lucide-react';

interface ChainData {
    name: string;
    blockTime: number; // in seconds
    color: string;
    icon: string;
    consensus: 'PoW' | 'PoS';
}

// Only Proof-of-Work chains for fair comparison - Kaspa is the FASTEST PoW chain
const chains: ChainData[] = [
    { name: 'Kaspa', blockTime: 1, color: '#00ffff', icon: '⚡', consensus: 'PoW' },
    { name: 'Litecoin', blockTime: 150, color: '#345D9D', icon: 'Ł', consensus: 'PoW' },
    { name: 'Dogecoin', blockTime: 60, color: '#C2A633', icon: 'Ð', consensus: 'PoW' },
    { name: 'Bitcoin Cash', blockTime: 600, color: '#8DC351', icon: '₿', consensus: 'PoW' },
    { name: 'Ethereum Classic', blockTime: 13, color: '#3AB83A', icon: 'Ξ', consensus: 'PoW' },
    { name: 'Bitcoin', blockTime: 600, color: '#F7931A', icon: '₿', consensus: 'PoW' },
];

export function BlockTimeRace() {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRacing, setIsRacing] = useState(true);
    const [blockCounts, setBlockCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!isRacing) return;

        const interval = setInterval(() => {
            setElapsedTime(prev => {
                const newTime = prev + 0.1;

                // Update block counts
                const newCounts: Record<string, number> = {};
                chains.forEach(chain => {
                    newCounts[chain.name] = Math.floor(newTime / chain.blockTime);
                });
                setBlockCounts(newCounts);

                return newTime;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isRacing]);

    const resetRace = () => {
        setElapsedTime(0);
        setBlockCounts({});
        setIsRacing(true);
    };

    const maxBlocks = Math.max(...Object.values(blockCounts), 1);

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="text-[var(--primary)]" size={20} />
                        PoW Block Time Race
                    </h3>
                    <p className="text-sm text-white/50 flex items-center gap-1">
                        <Shield size={12} />
                        Comparing Proof-of-Work blockchains only
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-white/50" />
                        <span className="font-mono text-[var(--primary)]">
                            {elapsedTime.toFixed(1)}s
                        </span>
                    </div>
                    <button
                        onClick={() => setIsRacing(!isRacing)}
                        className={`px-3 py-1 rounded text-sm ${isRacing ? 'bg-white/10' : 'bg-[var(--success)] text-black'
                            }`}
                    >
                        {isRacing ? '⏸ Pause' : '▶ Resume'}
                    </button>
                    <button
                        onClick={resetRace}
                        className="px-3 py-1 rounded text-sm bg-white/10 hover:bg-white/20"
                    >
                        ↺ Reset
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {chains.map((chain, index) => {
                    const blocks = blockCounts[chain.name] || 0;
                    const progress = maxBlocks > 0 ? (blocks / maxBlocks) * 100 : 0;
                    const isKaspa = chain.name === 'Kaspa';

                    return (
                        <motion.div
                            key={chain.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative ${isKaspa ? 'bg-[var(--primary)]/10 rounded-lg p-3 -mx-3' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{chain.icon}</span>
                                    <span className={`font-medium ${isKaspa ? 'text-[var(--primary)]' : ''}`}>
                                        {chain.name}
                                    </span>
                                    <span className="text-xs text-white/40">
                                        ({chain.blockTime < 1 ? `${chain.blockTime * 1000}ms` : `${chain.blockTime}s`} block time)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg" style={{ color: chain.color }}>
                                        {blocks.toLocaleString()}
                                    </span>
                                    <span className="text-sm text-white/40">blocks</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: chain.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Kaspa winner indicator */}
                            {isKaspa && blocks > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -right-2 -top-2 bg-[var(--primary)] text-black text-xs px-2 py-1 rounded-full font-bold"
                                >
                                    🏆 FASTEST
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparison Stats */}
            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-[var(--primary)]">
                            {(blockCounts['Kaspa'] || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/50">Kaspa Blocks</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--secondary)]">
                            {blockCounts['Kaspa'] && blockCounts['Bitcoin']
                                ? Math.round((blockCounts['Kaspa'] / Math.max(blockCounts['Bitcoin'], 1)))
                                : blockCounts['Kaspa'] || 0}x
                        </div>
                        <div className="text-xs text-white/50">Faster than BTC</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--success)]">
                            {blockCounts['Kaspa'] && blockCounts['Litecoin']
                                ? Math.round((blockCounts['Kaspa'] / Math.max(blockCounts['Litecoin'], 1)))
                                : blockCounts['Kaspa'] ? `${Math.floor(150)}` : 0}x
                        </div>
                        <div className="text-xs text-white/50">Faster than LTC</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--warning)]">
                            1 sec
                        </div>
                        <div className="text-xs text-white/50">Block Finality</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
