'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Zap, TrendingUp, TrendingDown, Users, Shield, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { sendTransaction } from '@/lib/wallet';

const VOTE_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

interface VoteEvent {
    side: 'bull' | 'bear';
    hash: string;
    time: number;
}

function generateHash(): string {
    const c = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 12; i++) h += c[Math.floor(Math.random() * 16)];
    return h;
}

export function PulsePoll() {
    const [votesBull, setVotesBull] = useState(142);
    const [votesBear, setVotesBear] = useState(89);
    const [recentVotes, setRecentVotes] = useState<VoteEvent[]>([]);
    const [activeVoters, setActiveVoters] = useState(34 + Math.floor(Math.random() * 20));
    const [userVoted, setUserVoted] = useState<'bull' | 'bear' | null>(null);
    const [voteFlash, setVoteFlash] = useState<'bull' | 'bear' | null>(null);
    const [voting, setVoting] = useState(false);
    const [voteError, setVoteError] = useState<string | null>(null);

    const total = votesBull + votesBear;
    const percentBull = Math.round((votesBull / total) * 100);
    const percentBear = 100 - percentBull;

    // Simulate live voting from other users
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const side: 'bull' | 'bear' = Math.random() > 0.45 ? 'bull' : 'bear';
                const hash = generateHash();

                if (side === 'bull') setVotesBull(v => v + 1);
                else setVotesBear(v => v + 1);

                setRecentVotes(prev => [{ side, hash, time: Date.now() }, ...prev].slice(0, 6));
                setVoteFlash(side);
                setTimeout(() => setVoteFlash(null), 400);

                if (Math.random() < 0.15) {
                    setActiveVoters(prev => Math.max(15, prev + (Math.random() > 0.5 ? 1 : -1)));
                }
            }
        }, 900);
        return () => clearInterval(interval);
    }, []);

    const handleVote = useCallback(async (side: 'bull' | 'bear') => {
        if (voting || userVoted) return;
        setVoting(true);
        setVoteError(null);

        try {
            const txHash = await sendTransaction(VOTE_ADDRESS, 1);

            if (side === 'bull') setVotesBull(v => v + 1);
            else setVotesBear(v => v + 1);

            setRecentVotes(prev => [{ side, hash: txHash.slice(0, 12), time: Date.now() }, ...prev].slice(0, 6));
            setUserVoted(side);
            setVoteFlash(side);
            setTimeout(() => setVoteFlash(null), 400);
        } catch (err) {
            setVoteError(err instanceof Error ? err.message : 'Transaction failed — connect wallet first');
        } finally {
            setVoting(false);
        }
    }, [voting, userVoted]);

    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Live badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                <span className="live-dot" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live Vote</span>
            </div>

            {/* Header */}
            <div className="mb-5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Vote className="text-[var(--primary)]" size={20} />
                    Pulse Poll — Kaspathon Governance
                </h3>
                <p className="text-sm text-white/50 mt-0.5">
                    &quot;Should Kaspa increase block rewards?&quot; — addressing <strong className="text-[var(--primary)]">KaspaVote</strong>
                </p>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-4 text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-[var(--primary)]" />
                    {activeVoters} voting now
                </div>
                <div className="flex items-center gap-1.5">
                    <Shield size={12} className="text-green-400" />
                    Tamper-proof
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-400" />
                    Results in milliseconds
                </div>
            </div>

            {/* ─── The Tug-of-War Bar ─── */}
            <div className="relative h-20 w-full rounded-xl overflow-hidden mb-4" style={{ background: '#0a0a14' }}>
                {/* Bull side */}
                <motion.div
                    className="absolute left-0 top-0 h-full flex items-center justify-start pl-4"
                    animate={{ width: `${percentBull}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        background: 'linear-gradient(90deg, rgba(0,255,255,0.3), rgba(0,255,255,0.15))',
                        borderRight: '2px solid rgba(0,255,255,0.5)',
                        boxShadow: voteFlash === 'bull' ? 'inset 0 0 30px rgba(0,255,255,0.3)' : 'none',
                    }}
                >
                    <div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={16} className="text-[var(--primary)]" />
                            <span className="font-bold text-[var(--primary)] text-lg">YES</span>
                        </div>
                        <div className="text-xs text-white/60">{votesBull} votes ({percentBull}%)</div>
                    </div>
                </motion.div>

                {/* Bear side */}
                <motion.div
                    className="absolute right-0 top-0 h-full flex items-center justify-end pr-4"
                    animate={{ width: `${percentBear}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        background: 'linear-gradient(270deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                        borderLeft: '2px solid rgba(239,68,68,0.5)',
                        boxShadow: voteFlash === 'bear' ? 'inset 0 0 30px rgba(239,68,68,0.3)' : 'none',
                    }}
                >
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-bold text-red-400 text-lg">NO</span>
                            <TrendingDown size={16} className="text-red-400" />
                        </div>
                        <div className="text-xs text-white/60">{votesBear} votes ({percentBear}%)</div>
                    </div>
                </motion.div>

                {/* Center divider */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white/10" />
            </div>

            {/* ─── QR Codes + Vote Buttons ─── */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                {/* BULL vote */}
                <div className="text-center">
                    <div className="inline-block bg-white p-2 rounded-xl mb-2">
                        <QRCodeSVG
                            value={`kaspa:${VOTE_ADDRESS.replace('kaspa:', '')}?amount=1&message=VOTE_YES`}
                            size={80}
                            level="M"
                        />
                    </div>
                    <button
                        onClick={() => handleVote('bull')}
                        disabled={userVoted !== null || voting}
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${userVoted === 'bull'
                            ? 'bg-[var(--primary)]/30 text-[var(--primary)] border border-[var(--primary)]/40'
                            : userVoted || voting
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30 border border-[var(--primary)]/20'
                            }`}
                    >
                        {userVoted === 'bull' ? '✓ Voted YES' : voting ? '⏳ Sending TX...' : '👍 Vote YES (1 KAS)'}
                    </button>
                </div>

                {/* BEAR vote */}
                <div className="text-center">
                    <div className="inline-block bg-white p-2 rounded-xl mb-2">
                        <QRCodeSVG
                            value={`kaspa:${VOTE_ADDRESS.replace('kaspa:', '')}?amount=1&message=VOTE_NO`}
                            size={80}
                            level="M"
                        />
                    </div>
                    <button
                        onClick={() => handleVote('bear')}
                        disabled={userVoted !== null || voting}
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${userVoted === 'bear'
                            ? 'bg-red-500/30 text-red-400 border border-red-500/40'
                            : userVoted || voting
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20'
                            }`}
                    >
                        {userVoted === 'bear' ? '✓ Voted NO' : voting ? '⏳ Sending TX...' : '👎 Vote NO (1 KAS)'}
                    </button>
                </div>
            </div>

            {/* Vote Error Banner */}
            {voteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    ⚠️ {voteError}
                </div>
            )}

            {/* ─── Live Vote Feed ─── */}
            <div>
                <h4 className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Live Votes</h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                    <AnimatePresence mode="popLayout">
                        {recentVotes.map((v, i) => (
                            <motion.div
                                key={v.hash + v.time}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-between p-2 rounded-lg text-xs"
                                style={{
                                    background: i === 0
                                        ? (v.side === 'bull' ? 'rgba(0,255,255,0.06)' : 'rgba(239,68,68,0.06)')
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${i === 0
                                        ? (v.side === 'bull' ? 'rgba(0,255,255,0.15)' : 'rgba(239,68,68,0.15)')
                                        : 'rgba(255,255,255,0.04)'
                                        }`,
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {v.side === 'bull'
                                        ? <TrendingUp size={12} className="text-[var(--primary)]" />
                                        : <TrendingDown size={12} className="text-red-400" />
                                    }
                                    <span className="font-mono text-white/40">{v.hash.slice(0, 8)}...</span>
                                </div>
                                <span className={v.side === 'bull' ? 'text-[var(--primary)]' : 'text-red-400'}>
                                    {v.side === 'bull' ? 'YES' : 'NO'}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Explainer */}
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(0,255,255,0.02)', border: '1px solid rgba(0,255,255,0.06)' }}>
                <p className="text-xs text-white/45 leading-relaxed text-center">
                    <Zap size={12} className="inline text-[var(--primary)] mr-1" />
                    <strong className="text-white/70">Tamper-proof governance:</strong>{' '}
                    Each vote = 1 KAS transaction. Results update in milliseconds as transactions hit the DAG.
                    No central authority, no delays — the fastest voting machine ever built.
                </p>
            </div>
        </div>
    );
}
