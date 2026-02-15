'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Zap, Timer, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { sendTransaction } from '@/lib/wallet';

const VENDING_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

// ─── Items ─────────────────────────────────────────────
interface VendingItem {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    category: string;
    color: string;
}

const ITEMS: VendingItem[] = [
    { id: 'art1', name: 'Neon Kaspa Logo', description: 'HD vector logo with glow effect', price: 2, emoji: '🎨', category: 'Digital Art', color: '#00ffff' },
    { id: 'code1', name: 'Smart Contract Template', description: 'KRC-20 token template (Solidity-like)', price: 5, emoji: 'ðŸ“', category: 'Code', color: '#8b5cf6' },
    { id: 'nft1', name: 'Genesis Block NFT', description: 'Minted from block #1 metadata', price: 10, emoji: '💎', category: 'Collectible', color: '#f472b6' },
    { id: 'data1', name: 'Network Snapshot', description: 'Full DAG state export (JSON)', price: 3, emoji: '📊', category: 'Data', color: '#10b981' },
    { id: 'pass1', name: 'VIP Access Pass', description: '24h premium analytics dashboard', price: 1, emoji: '🔑', category: 'Access', color: '#facc15' },
    { id: 'music1', name: 'DAG Beats Track', description: 'Procedurally generated from block data', price: 2, emoji: '🎵', category: 'Audio', color: '#fb923c' },
];

// ─── Component ─────────────────────────────────────────
export function VendingMachine() {
    const [purchased, setPurchased] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState<string | null>(null);
    const [speedResult, setSpeedResult] = useState<{ id: string; time: number } | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const startTimeRef = useRef<number>(0);

    const [error, setError] = useState<string | null>(null);

    const handleBuy = async (item: VendingItem) => {
        if (purchased.has(item.id) || processing) return;

        setProcessing(item.id);
        setSpeedResult(null);
        setTxHash(null);
        setError(null);
        startTimeRef.current = performance.now();

        try {
            const hash = await sendTransaction(VENDING_ADDRESS, item.price);
            const elapsed = performance.now() - startTimeRef.current;
            setTxHash(hash);
            setSpeedResult({ id: item.id, time: elapsed });
            setPurchased(prev => new Set([...prev, item.id]));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transaction failed — connect wallet first');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="text-[var(--primary)]" size={20} />
                        Kaspa Vending Machine
                        <span className="live-dot" />
                    </h3>
                    <p className="text-sm text-white/50">
                        Pay &amp; unlock instantly — an IoT simulation proving Kaspa&apos;s speed
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                    >
                        ⚠ï¸ {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Speedometer overlay */}
            <AnimatePresence>
                {speedResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 p-4 rounded-xl text-center relative overflow-hidden"
                        style={{
                            background: 'rgba(0,255,255,0.04)',
                            border: '1px solid rgba(0,255,255,0.15)',
                        }}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Zap size={16} className="text-[var(--primary)]" />
                                <span className="text-xs text-white/40 uppercase tracking-wider">Payment Speed</span>
                            </div>
                            <div className="text-3xl font-mono font-bold text-[var(--primary)]">
                                {(speedResult.time / 1000).toFixed(2)}s
                            </div>
                            <div className="text-xs text-white/30 mt-1 font-mono">
                                tx: {txHash?.slice(0, 8)}...{txHash?.slice(-4)}
                            </div>

                            {/* Speed comparison */}
                            <div className="mt-3 flex justify-center gap-6 text-xs">
                                <div className="text-center">
                                    <div className="text-[var(--primary)] font-bold">Kaspa</div>
                                    <div className="text-white/40">{(speedResult.time / 1000).toFixed(1)}s ✓</div>
                                </div>
                                <div className="text-center opacity-40">
                                    <div className="text-white/50">Ethereum</div>
                                    <div className="text-white/30">~12s</div>
                                </div>
                                <div className="text-center opacity-30">
                                    <div className="text-white/40">Bitcoin</div>
                                    <div className="text-white/20">~600s</div>
                                </div>
                            </div>
                        </div>

                        {/* Animated bar */}
                        <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ITEMS.map(item => {
                    const isOwned = purchased.has(item.id);
                    const isProcessing = processing === item.id;
                    const justBought = speedResult?.id === item.id;

                    return (
                        <motion.div
                            key={item.id}
                            layout
                            className="relative rounded-xl overflow-hidden group"
                            style={{
                                background: isOwned ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isOwned ? 'rgba(16,185,129,0.2)' : justBought ? `${item.color}33` : 'rgba(255,255,255,0.05)'}`,
                            }}
                        >
                            {/* Locked overlay */}
                            {!isOwned && !isProcessing && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                    <Lock size={24} className="text-white/20" />
                                </div>
                            )}

                            {/* Processing overlay */}
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    >
                                        <Timer size={24} className="text-[var(--primary)]" />
                                    </motion.div>
                                    <span className="text-xs text-[var(--primary)] mt-2 font-mono">Confirming on DAG...</span>
                                </motion.div>
                            )}

                            {/* Unlocked badge */}
                            {isOwned && (
                                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}

                            <div className="p-4">
                                {/* Item icon + info */}
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{item.emoji}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                                        <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
                                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Buy button — z-30 so it sits above the lock overlay */}
                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={isOwned || !!processing}
                                    className={`relative z-30 mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-all ${isOwned
                                        ? 'bg-green-500/10 text-green-400 cursor-default'
                                        : isProcessing
                                            ? 'bg-white/5 text-white/20 cursor-wait'
                                            : 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 text-[var(--primary)] hover:from-[var(--primary)]/30 hover:to-[var(--secondary)]/30 cursor-pointer'
                                        }`}
                                >
                                    {isOwned ? (
                                        <span className="flex items-center justify-center gap-1"><Unlock size={14} /> Unlocked</span>
                                    ) : isProcessing ? (
                                        'Processing...'
                                    ) : (
                                        <span className="flex items-center justify-center gap-1"><Zap size={14} /> Buy — {item.price} KAS</span>
                                    )}
                                </button>
                            </div>

                            {/* Drop animation when purchased */}
                            <AnimatePresence>
                                {justBought && (
                                    <motion.div
                                        initial={{ y: -100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.3, 1] }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <Sparkles size={40} className="text-[var(--primary)]" />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Explainer */}
            <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.06)' }}>
                <p className="text-xs text-white/45 leading-relaxed">
                    <ShoppingBag size={12} className="inline text-violet-400 mr-1" />
                    <strong className="text-white/70">IoT-ready payments:</strong>{' '}
                    This simulates a real vending machine. Pay → item &quot;drops&quot; in under 1 second.
                    Bitcoin takes 10 minutes. Ethereum takes 12 seconds. Kaspa? <strong className="text-[var(--primary)]">Sub-second.</strong>
                </p>
            </div>
        </div>
    );
}
