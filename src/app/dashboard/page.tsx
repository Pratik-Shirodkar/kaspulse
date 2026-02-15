'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { TransactionFeed } from '@/components/TransactionFeed';
import { DAGVisualizer } from '@/components/DAGVisualizer';
import { BlockTimeRace } from '@/components/BlockTimeRace';
import { NetworkHealthMonitor } from '@/components/NetworkHealthMonitor';
import { AddressExplorer } from '@/components/AddressExplorer';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { getNetworkStats } from '@/lib/kaspa-api';
import { Blocks, Gauge, DollarSign, Coins, Activity, Zap, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SonicDAG from '@/components/SonicDAG';

interface NetworkStats {
    blockCount: number;
    blueScore: number;
    hashrate: number;
    price: number;
    circulatingSupply: number;
    daaScore: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getNetworkStats();
                setStats(data);
                setLastUpdate(new Date());
                setError(null);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                setError('Failed to connect to Kaspa network');
                setStats({
                    blockCount: 85000000 + Math.floor(Math.random() * 1000),
                    blueScore: 85000000 + Math.floor(Math.random() * 1000),
                    hashrate: 800 + Math.random() * 50,
                    price: 0.12 + Math.random() * 0.01,
                    circulatingSupply: 24000000000,
                    daaScore: 85000000 + Math.floor(Math.random() * 1000)
                });
                setLastUpdate(new Date());
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="mb-4">
                <Link href="/" className="text-white/40 hover:text-white/60 text-sm">
                    ← Back to Launcher
                </Link>
            </div>

            {/* Live Block Ticker Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 mb-6 flex items-center justify-between shimmer-line"
            >
                <div className="flex items-center gap-3">
                    <span className="live-dot" />
                    <span className="text-xs text-white/50">LIVE</span>
                    <span className="text-xs text-white/30">|</span>
                    <Blocks size={14} className="text-[var(--primary)]" />
                    <span className="text-sm font-mono font-bold text-[var(--primary)]">
                        Block #{(stats?.blueScore || 0).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <SonicDAG blueScore={stats?.blueScore || 0} />
                    {lastUpdate && (
                        <span className="text-xs text-white/40">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                    <Database size={28} className="text-[var(--primary)]" />
                </div>
                <div>
                    <div className="text-xs px-2 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] inline-flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                        Connected to Kaspa Testnet
                    </div>
                    <h1 className="text-3xl font-bold">
                        <span className="text-[var(--primary)]">KasPulse</span> Live
                    </h1>
                    <p className="text-white/50">Live network analytics, AI insights & blockchain visualization</p>
                </div>
            </motion.div>

            {error && (
                <div className="glass-card p-4 mb-6 border-[var(--warning)] text-center">
                    <p className="text-[var(--warning)]">{error}</p>
                    <p className="text-sm text-white/50 mt-1">Showing demo data</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Block Height" value={stats?.blueScore || 0} icon={<Blocks size={20} />} isLive trend="up" />
                <StatCard label="Hashrate" value={stats?.hashrate || 0} suffix=" TH/s" decimals={1} icon={<Gauge size={20} />} isLive />
                <StatCard label="KAS Price" value={stats?.price || 0} prefix="$" decimals={4} icon={<DollarSign size={20} />} isLive />
                <StatCard label="Supply" value={(stats?.circulatingSupply || 0) / 1e9} suffix="B" decimals={1} icon={<Coins size={20} />} />
                <StatCard label="DAA Score" value={stats?.daaScore || 0} icon={<Activity size={20} />} isLive trend="up" />
                <StatCard label="Block Time" value={1} suffix="s" icon={<Zap size={20} />} trend="neutral" />
            </div>

            {/* AI Insights Panel - PROMINENT AI FEATURE */}
            <div className="mb-8">
                <AIInsightsPanel />
            </div>

            <div className="section-divider" />

            {/* DAG Visualizer */}
            <div className="mb-8">
                <DAGVisualizer />
            </div>

            <div className="section-divider" />

            {/* Block Time Race */}
            <div className="mb-8">
                <BlockTimeRace />
            </div>

            <div className="section-divider" />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <TransactionFeed />
                <NetworkHealthMonitor />
            </div>

            {/* Advanced Section Toggle */}
            <div className="mb-6">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mx-auto"
                >
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Tools
                </button>
            </div>

            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8"
                    >
                        <AddressExplorer />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
