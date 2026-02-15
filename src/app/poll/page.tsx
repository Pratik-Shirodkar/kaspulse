'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Vote, ArrowLeft, Plus, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { PulsePoll } from '@/components/PulsePoll';

function PollPageContent() {
    const searchParams = useSearchParams();

    // Check if we are viewing a specific poll
    const poolQ = searchParams?.get('q');
    const poolA = searchParams?.get('a');
    const poolB = searchParams?.get('b');
    const poolW = searchParams?.get('w');

    const isViewing = !!(poolQ && poolA && poolB && poolW);

    // Creator State
    const [formQ, setFormQ] = useState('');
    const [formA, setFormA] = useState('');
    const [formB, setFormB] = useState('');
    const [formW, setFormW] = useState('');
    const [createdLink, setCreatedLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCreate = () => {
        if (!formQ || !formA || !formB || !formW) return;

        const params = new URLSearchParams({
            q: formQ,
            a: formA,
            b: formB,
            w: formW
        });

        const link = `${window.location.origin}/poll?${params.toString()}`;
        setCreatedLink(link);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(createdLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="mb-4 flex items-center justify-between">
                <Link href="/" className="text-white/40 hover:text-white/60 text-sm flex items-center gap-1 w-fit">
                    <ArrowLeft size={14} />
                    Back to Launcher
                </Link>
                {isViewing && (
                    <Link href="/poll" className="text-[var(--primary)] hover:text-cyan-300 text-sm flex items-center gap-1">
                        <Plus size={14} />
                        Create Your Own Poll
                    </Link>
                )}
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <div className="w-14 h-14 rounded-xl bg-[#f97316]/20 flex items-center justify-center">
                    <Vote size={28} className="text-[#f97316]" />
                </div>
                <div>
                    <div className="text-xs px-2 py-1 rounded bg-[#f97316]/20 text-[#f97316] inline-block mb-1">
                        Governance Track
                    </div>
                    <h1 className="text-3xl font-bold">
                        <span className="text-[#f97316]">Pulse</span> Poll
                    </h1>
                    <p className="text-white/50">On-chain community voting powered by Kaspa transactions</p>
                </div>
            </motion.div>

            {/* Content Switcher */}
            {isViewing ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-sm flex items-center justify-center gap-2">
                        <Share2 size={16} />
                        You are viewing a custom poll created by a **KasPulse** user.
                    </div>
                    <PulsePoll
                        question={poolQ}
                        optionA={poolA}
                        optionB={poolB}
                        wallet={poolW}
                    />
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Default/Demo Poll */}
                    <div>
                        <h2 className="text-lg font-bold mb-4 opacity-80">🔥 Trending Now</h2>
                        <PulsePoll isDemo />
                    </div>

                    {/* Creator Form */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card p-6 border-l-4 border-l-[#f97316]"
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-[#f97316]" />
                                Create a Poll
                            </h2>

                            {!createdLink ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Question</label>
                                        <input
                                            value={formQ} onChange={e => setFormQ(e.target.value)}
                                            placeholder="e.g. Will KAS flip SOL?"
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#f97316]/50 focus:outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Option A (Bull)</label>
                                            <input
                                                value={formA} onChange={e => setFormA(e.target.value)}
                                                placeholder="YES"
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#f97316]/50 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Option B (Bear)</label>
                                            <input
                                                value={formB} onChange={e => setFormB(e.target.value)}
                                                placeholder="NO"
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#f97316]/50 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Your Wallet Address (Receives Votes)</label>
                                        <input
                                            value={formW} onChange={e => setFormW(e.target.value)}
                                            placeholder="kaspa:qr..."
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono focus:border-[#f97316]/50 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleCreate}
                                        disabled={!formQ || !formA || !formB || !formW}
                                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${formQ && formA && formB && formW
                                                ? 'bg-[#f97316] text-black hover:bg-[#fb923c] shadow-lg shadow-orange-500/20'
                                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                                            }`}
                                    >
                                        <Sparkles size={16} /> Generate Poll Link
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                                        <Check size={16} /> Poll Created Successfully!
                                    </div>
                                    <p className="text-xs text-white/50">Share this link. Votes will send 1 KAS directly to your wallet.</p>

                                    <div className="flex gap-2">
                                        <input
                                            readOnly value={createdLink}
                                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/70"
                                        />
                                        <button onClick={copyLink} className="px-3 py-2 rounded-lg bg-[#f97316]/20 text-[#f97316] hover:bg-[#f97316]/30 transition-colors">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCreatedLink('')}
                                            className="flex-1 py-2 rounded-lg bg-white/5 text-xs hover:bg-white/10"
                                        >
                                            Create Another
                                        </button>
                                        <Link
                                            href={`/poll?q=${encodeURIComponent(formQ)}&a=${encodeURIComponent(formA)}&b=${encodeURIComponent(formB)}&w=${encodeURIComponent(formW)}`}
                                            className="flex-1 py-2 rounded-lg bg-[#f97316] text-black text-xs font-bold hover:bg-[#fb923c] flex items-center justify-center gap-1"
                                        >
                                            View Poll <ArrowLeft size={10} className="rotate-180" />
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Tips */}
                        <div className="glass-card p-4 text-xs text-white/40 space-y-2">
                            <p><strong>💡 How it works:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Polls are <strong>serverless</strong>. All data is in the URL.</li>
                                <li>Voting involves sending a <strong>real 1 KAS transaction</strong>.</li>
                                <li>You (the creator) keep all the KAS sent by voters.</li>
                                <li>Use it for paid surveys, governance, or just for fun!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Why Section */}
            {!isViewing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6 mt-12 text-center"
                >
                    <h3 className="text-lg font-semibold mb-2">Why On-Chain Voting?</h3>
                    <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
                        Every vote is a real Kaspa transaction — transparent, immutable, and verifiable.
                        With 1-second block times, results update in real-time. No central server, no manipulation.
                        This is what decentralized governance looks like.
                    </p>
                </motion.div>
            )}
        </div>
    );
}

export default function PollPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-white/30">Loading Pulse Poll...</div>}>
            <PollPageContent />
        </Suspense>
    );
}
