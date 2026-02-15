'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, ArrowLeft, Zap, Eye, EyeOff, DollarSign, Clock, Tv,
    Plus, Link2, Copy, Check, User, Wallet, Settings, BarChart3,
    Video, ExternalLink, ChevronRight, Sparkles, Timer, ArrowRight,
    Upload, Globe, Tag
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { sendTransaction } from '@/lib/wallet';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES & SAMPLE CONTENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
interface StreamConfig {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    creatorWallet: string;
    creatorName: string;
    pricePerInterval: number;   // KAS
    intervalSeconds: number;    // seconds per payment interval
    thumbnail?: string;
    category: string;
}

const SAMPLE_STREAMS: StreamConfig[] = [
    {
        id: 'nature-relax',
        title: 'Alpine Meadows — 4K Nature Relaxation',
        description: 'Breathtaking mountain scenery with ambient sounds. Perfect for relaxation and focus.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        creatorWallet: 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv',
        creatorName: 'NatureVault',
        pricePerInterval: 1,
        intervalSeconds: 10,
        category: 'Relaxation',
    },
    {
        id: 'blockchain-101',
        title: 'Kaspa BlockDAG Explained',
        description: 'A deep-dive into how PHANTOM/GhostDAG consensus works and why Kaspa achieves 1-second blocks.',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        creatorWallet: 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv',
        creatorName: 'KaspaAcademy',
        pricePerInterval: 2,
        intervalSeconds: 15,
        category: 'Education',
    },
    {
        id: 'live-trading',
        title: 'Live Crypto Analysis — KAS Technicals',
        description: 'Real-time chart analysis and trading setups for KAS/USDT. Premium signals for subscribers.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        creatorWallet: 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv',
        creatorName: 'CryptoDesk',
        pricePerInterval: 5,
        intervalSeconds: 10,
        category: 'Trading',
    },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   INNER COMPONENT (uses useSearchParams)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function KasStreamInner() {
    const searchParams = useSearchParams();

    // ─── Tabs ───
    type Tab = 'browse' | 'create' | 'watch';
    const [tab, setTab] = useState<Tab>('browse');

    // ─── Creator form ───
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formVideo, setFormVideo] = useState('');
    const [formWallet, setFormWallet] = useState('');
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('1');
    const [formInterval, setFormInterval] = useState('10');
    const [formCategory, setFormCategory] = useState('General');
    const [createdLink, setCreatedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [myStreams, setMyStreams] = useState<StreamConfig[]>([]);

    // ─── Viewer / Watching state ───
    const [activeStream, setActiveStream] = useState<StreamConfig | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isBlurred, setIsBlurred] = useState(true);
    const [paying, setPaying] = useState(false);
    const [totalPaid, setTotalPaid] = useState(0);
    const [watchTime, setWatchTime] = useState(0);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [viewerCount] = useState(() => Math.floor(Math.random() * 30) + 5);
    const videoRef = useRef<HTMLVideoElement>(null);
    const watchRef = useRef<ReturnType<typeof setInterval>>(undefined);

    // ─── Creator Earnings (simulated from session) ───
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [totalViewers, setTotalViewers] = useState(0);
    const [totalWatchMinutes, setTotalWatchMinutes] = useState(0);

    // Handle URL params for shared streams
    useEffect(() => {
        const streamId = searchParams?.get('stream');
        if (streamId) {
            const found = [...SAMPLE_STREAMS, ...myStreams].find(s => s.id === streamId);
            if (found) {
                setActiveStream(found);
                setTab('watch');
            }
        }

        // Check for custom stream via URL params
        const title = searchParams?.get('title');
        const video = searchParams?.get('video');
        const wallet = searchParams?.get('wallet');
        if (title && video && wallet) {
            const custom: StreamConfig = {
                id: 'custom-' + Date.now(),
                title: decodeURIComponent(title),
                description: searchParams?.get('desc') ? decodeURIComponent(searchParams.get('desc')!) : '',
                videoUrl: decodeURIComponent(video),
                creatorWallet: decodeURIComponent(wallet),
                creatorName: searchParams?.get('creator') ? decodeURIComponent(searchParams.get('creator')!) : 'Creator',
                pricePerInterval: Number(searchParams?.get('price') || 1),
                intervalSeconds: Number(searchParams?.get('interval') || 10),
                category: searchParams?.get('cat') ? decodeURIComponent(searchParams.get('cat')!) : 'General',
            };
            setActiveStream(custom);
            setTab('watch');
        }
    }, [searchParams]);

    // Watch timer
    useEffect(() => {
        if (!isBlurred && isStreaming) {
            watchRef.current = setInterval(() => setWatchTime(p => p + 1), 1000);
        } else {
            if (watchRef.current) clearInterval(watchRef.current);
        }
        return () => { if (watchRef.current) clearInterval(watchRef.current); };
    }, [isBlurred, isStreaming]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Pay & start watching
    const startWatching = async () => {
        if (!activeStream) return;
        setPaying(true); setStreamError(null); setIsStreaming(true); setIsBlurred(true); setWatchTime(0); setTotalPaid(0);
        try {
            await sendTransaction(activeStream.creatorWallet, activeStream.pricePerInterval);
            setTotalPaid(activeStream.pricePerInterval);
            setIsBlurred(false);
            setTotalEarnings(p => p + activeStream.pricePerInterval);
            setTotalViewers(p => p + 1);
            videoRef.current?.play().catch(() => { });
        } catch (err) {
            setStreamError(err instanceof Error ? err.message : 'Transaction failed');
            setIsStreaming(false);
        } finally { setPaying(false); }
    };

    const extendWatch = async () => {
        if (!activeStream || paying) return;
        setPaying(true); setStreamError(null);
        try {
            await sendTransaction(activeStream.creatorWallet, activeStream.pricePerInterval);
            setTotalPaid(p => p + activeStream.pricePerInterval);
            setTotalEarnings(p => p + activeStream.pricePerInterval);
            setTotalWatchMinutes(p => p + Math.round(activeStream.intervalSeconds / 60 * 10) / 10);
        } catch (err) {
            setStreamError(err instanceof Error ? err.message : 'Transaction failed');
        } finally { setPaying(false); }
    };

    const stopWatching = () => {
        setIsStreaming(false); setIsBlurred(true);
        setTotalWatchMinutes(p => p + Math.round(watchTime / 60 * 10) / 10);
        videoRef.current?.pause();
    };

    // Create stream
    const handleCreate = () => {
        if (!formTitle || !formVideo || !formWallet) return;
        const stream: StreamConfig = {
            id: 'user-' + Date.now(),
            title: formTitle,
            description: formDesc,
            videoUrl: formVideo,
            creatorWallet: formWallet,
            creatorName: formName || 'Anonymous',
            pricePerInterval: Number(formPrice) || 1,
            intervalSeconds: Number(formInterval) || 10,
            category: formCategory,
        };
        setMyStreams(p => [...p, stream]);

        // Build shareable link
        const params = new URLSearchParams({
            title: stream.title,
            video: stream.videoUrl,
            wallet: stream.creatorWallet,
            creator: stream.creatorName,
            price: String(stream.pricePerInterval),
            interval: String(stream.intervalSeconds),
            cat: stream.category,
            desc: stream.description,
        });
        const link = `${window.location.origin}/kasstream?${params.toString()}`;
        setCreatedLink(link);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(createdLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openStream = (s: StreamConfig) => {
        setActiveStream(s);
        setTab('watch');
        setIsStreaming(false);
        setIsBlurred(true);
        setTotalPaid(0);
        setWatchTime(0);
        setStreamError(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link href="/" className="text-white/40 hover:text-white/60 text-sm flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Launcher
                </Link>
            </div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Tv size={28} className="text-amber-400" />
                    </div>
                    <div>
                        <div className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 inline-block mb-1">
                            Streaming Payments Track
                        </div>
                        <h1 className="text-3xl font-bold">
                            <span className="text-amber-400">Kas</span>Stream
                        </h1>
                        <p className="text-white/50 text-sm">Pay-per-second content platform powered by Kaspa</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 mb-8 w-fit">
                {[
                    { id: 'browse' as Tab, label: 'Browse', icon: Globe },
                    { id: 'create' as Tab, label: 'Create', icon: Plus },
                    { id: 'watch' as Tab, label: 'Watch', icon: Play, hidden: !activeStream },
                ].filter(t => !t.hidden).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'text-white/50 hover:text-white/70'
                            }`}
                    >
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â• BROWSE TAB â•â•â•â•â•â•â•â•â•â•â• */}
            {tab === 'browse' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Earnings banner for creators */}
                    {totalEarnings > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-4 mb-6 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                                    <BarChart3 size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white/80">Creator Earnings</div>
                                    <div className="text-xs text-white/40">This session</div>
                                </div>
                            </div>
                            <div className="flex gap-6 text-center">
                                <div>
                                    <div className="text-lg font-bold text-green-400 font-mono">{totalEarnings.toFixed(1)} KAS</div>
                                    <div className="text-[10px] text-white/30">Revenue</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white/70 font-mono">{totalViewers}</div>
                                    <div className="text-[10px] text-white/30">Viewers</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white/70 font-mono">{totalWatchMinutes.toFixed(1)}</div>
                                    <div className="text-[10px] text-white/30">Min. Watched</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Content Library</h2>
                        <button onClick={() => setTab('create')} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                            <Plus size={15} /> Publish Content
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...SAMPLE_STREAMS, ...myStreams].map((s, i) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => openStream(s)}
                                className="glass-card cursor-pointer hover:border-amber-500/20 transition-all group"
                            >
                                {/* Thumbnail area */}
                                <div className="relative h-36 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-t-xl flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-black/40" />
                                    <Video size={32} className="text-white/30 relative z-10" />
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/60 font-mono z-10">
                                        {s.pricePerInterval} KAS / {s.intervalSeconds}s
                                    </div>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-amber-400 z-10">
                                        {s.category}
                                    </div>
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/80 flex items-center justify-center">
                                            <Play size={20} className="text-black ml-0.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-sm mb-1 text-white/90 group-hover:text-amber-400 transition-colors line-clamp-1">{s.title}</h3>
                                    <p className="text-xs text-white/35 line-clamp-2 mb-3 leading-relaxed">{s.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <User size={10} className="text-white/50" />
                                            </div>
                                            <span className="text-[11px] text-white/40">{s.creatorName}</span>
                                        </div>
                                        <span className="text-[11px] text-amber-400/60 flex items-center gap-1">
                                            <Zap size={10} /> Pay to Watch
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* How it works */}
                    <div className="mt-8 glass-card p-6">
                        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-400" /> How KasStream Works
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { step: '01', title: 'Creator publishes', desc: 'Set your video URL, pricing, and wallet address. Get a shareable link.', icon: Upload },
                                { step: '02', title: 'Viewer pays to watch', desc: 'Video is blurred until a real KAS transaction is sent to the creator\'s wallet.', icon: Eye },
                                { step: '03', title: 'Creator earns instantly', desc: 'Payments go directly to the creator. No middleman, 1-second finality.', icon: DollarSign },
                            ].map(s => (
                                <div key={s.step} className="flex gap-3">
                                    <div className="text-2xl font-black text-amber-400/20 leading-none">{s.step}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <s.icon size={14} className="text-amber-400" />
                                            <span className="text-sm font-semibold text-white/80">{s.title}</span>
                                        </div>
                                        <p className="text-xs text-white/35 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â• CREATE TAB â•â•â•â•â•â•â•â•â•â•â• */}
            {tab === 'create' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                    <h2 className="text-lg font-bold mb-1">Publish Your Content</h2>
                    <p className="text-sm text-white/40 mb-6">Set your video, pricing, and wallet. Viewers pay YOU directly — no middleman.</p>

                    <div className="space-y-6">
                        {/* Content Details */}
                        <div className="glass-card p-5">
                            <h3 className="text-sm font-bold text-white/70 mb-4 flex items-center gap-2"><Video size={14} /> Content Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">Title *</label>
                                    <input
                                        value={formTitle} onChange={e => setFormTitle(e.target.value)}
                                        placeholder="My Awesome Video"
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">Description</label>
                                    <textarea
                                        value={formDesc} onChange={e => setFormDesc(e.target.value)}
                                        placeholder="What's this content about?"
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none h-20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">Video URL * <span className="text-white/20">(direct .mp4 or embed link)</span></label>
                                    <input
                                        value={formVideo} onChange={e => setFormVideo(e.target.value)}
                                        placeholder="https://example.com/video.mp4"
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none font-mono text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Creator Name</label>
                                        <input
                                            value={formName} onChange={e => setFormName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Category</label>
                                        <select
                                            value={formCategory} onChange={e => setFormCategory(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                                        >
                                            {['General', 'Education', 'Entertainment', 'Trading', 'Gaming', 'Music', 'Tech'].map(c => (
                                                <option key={c} value={c} className="bg-[#0c0c16]">{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="glass-card p-5">
                            <h3 className="text-sm font-bold text-white/70 mb-4 flex items-center gap-2"><Tag size={14} /> Pricing</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">Price (KAS)</label>
                                    <input
                                        type="number" min="0.1" step="0.1"
                                        value={formPrice} onChange={e => setFormPrice(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">Per (seconds)</label>
                                    <input
                                        type="number" min="5" step="5"
                                        value={formInterval} onChange={e => setFormInterval(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-amber-500/50 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 text-xs text-amber-400 flex items-center gap-2">
                                <Zap size={13} /> Viewers will pay <strong>{formPrice} KAS</strong> every <strong>{formInterval} seconds</strong> directly to your wallet.
                            </div>
                        </div>

                        {/* Wallet */}
                        <div className="glass-card p-5">
                            <h3 className="text-sm font-bold text-white/70 mb-4 flex items-center gap-2"><Wallet size={14} /> Your Wallet</h3>
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Kaspa Wallet Address * <span className="text-white/20">(receives all payments)</span></label>
                                <input
                                    value={formWallet} onChange={e => setFormWallet(e.target.value)}
                                    placeholder="kaspa:qr..."
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-amber-500/50 focus:outline-none font-mono"
                                />
                            </div>
                        </div>

                        {/* Publish */}
                        <button
                            onClick={handleCreate}
                            disabled={!formTitle || !formVideo || !formWallet}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${formTitle && formVideo && formWallet
                                ? 'bg-amber-500 text-black hover:bg-amber-400'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            <Sparkles size={16} /> Publish & Get Shareable Link
                        </button>

                        {/* Created link */}
                        <AnimatePresence>
                            {createdLink && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-5"
                                >
                                    <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                                        <Check size={16} /> Stream Published!
                                    </h3>
                                    <p className="text-xs text-white/40 mb-3">Share this link with viewers. They&apos;ll pay directly to your wallet.</p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly value={createdLink}
                                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 font-mono"
                                        />
                                        <button onClick={copyLink} className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { openStream(myStreams[myStreams.length - 1]); }}
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-sm text-white/60 hover:text-white/80"
                                    >
                                        <Play size={14} /> Preview Your Stream
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â• WATCH TAB â•â•â•â•â•â•â•â•â•â•â• */}
            {tab === 'watch' && activeStream && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Video Player */}
                        <div className="lg:col-span-2">
                            <div className="glass-card overflow-hidden rounded-xl">
                                <div className="relative aspect-video bg-black">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover transition-all duration-500"
                                        style={{ filter: isBlurred ? 'blur(20px) brightness(0.3)' : 'none' }}
                                        loop muted playsInline
                                    >
                                        <source src={activeStream.videoUrl} type="video/mp4" />
                                    </video>

                                    {/* Blur overlay */}
                                    <AnimatePresence>
                                        {isBlurred && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex flex-col items-center justify-center text-center z-10"
                                            >
                                                {!isStreaming ? (
                                                    <>
                                                        <EyeOff size={44} className="text-white/40 mb-4" />
                                                        <h3 className="text-lg font-bold mb-1">Content Locked</h3>
                                                        <p className="text-white/40 text-sm mb-2">{activeStream.title}</p>
                                                        <p className="text-white/25 text-xs mb-6 max-w-sm">
                                                            Pay {activeStream.pricePerInterval} KAS every {activeStream.intervalSeconds}s to watch.
                                                            Payment goes directly to <strong>{activeStream.creatorName}</strong>.
                                                        </p>
                                                        <button
                                                            onClick={startWatching}
                                                            disabled={paying}
                                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${paying
                                                                ? 'bg-white/10 text-white/40 cursor-wait'
                                                                : 'bg-amber-500 text-black hover:bg-amber-400'
                                                                }`}
                                                        >
                                                            <Play size={18} />
                                                            {paying ? 'â³ Sending TX...' : `Pay & Watch (${activeStream.pricePerInterval} KAS)`}
                                                        </button>
                                                        {streamError && <p className="mt-3 text-sm text-red-400">⚠ï¸ {streamError}</p>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                            <Zap size={44} className="text-amber-400" />
                                                        </motion.div>
                                                        <p className="text-amber-400 font-semibold mt-4">Processing payment...</p>
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Live indicator */}
                                    {!isBlurred && isStreaming && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg z-10"
                                            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(245,158,11,0.3)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            <Eye size={13} className="text-amber-400" />
                                            <span className="text-xs text-amber-400 font-semibold">LIVE</span>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Controls */}
                                {isStreaming && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="p-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button onClick={stopWatching} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300">
                                                <Pause size={14} /> Stop
                                            </button>
                                            <span className="text-xs text-white/50"><Clock size={12} className="inline mr-1" />{fmt(watchTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <button
                                                onClick={extendWatch}
                                                disabled={paying}
                                                className={`px-3 py-1 rounded-lg font-semibold transition-all ${paying
                                                    ? 'bg-white/5 text-white/30 cursor-wait'
                                                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/20'
                                                    }`}
                                            >
                                                {paying ? 'â³ TX...' : `+ ${activeStream.pricePerInterval} KAS`}
                                            </button>
                                            <span className="text-white/40">Spent: <span className="text-amber-400 font-semibold">{totalPaid.toFixed(0)} KAS</span></span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-mono ${!isBlurred ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {!isBlurred ? 'â— PAID' : '○ PENDING'}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Video info below player */}
                            <div className="mt-4">
                                <h2 className="text-xl font-bold mb-1">{activeStream.title}</h2>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <User size={12} className="text-amber-400" />
                                        </div>
                                        <span className="text-sm text-white/60 font-medium">{activeStream.creatorName}</span>
                                    </div>
                                    <span className="text-xs text-white/20">•</span>
                                    <span className="text-xs text-white/30">{activeStream.category}</span>
                                    <span className="text-xs text-white/20">•</span>
                                    <span className="text-xs text-amber-400/60">{activeStream.pricePerInterval} KAS / {activeStream.intervalSeconds}s</span>
                                </div>
                                {activeStream.description && (
                                    <p className="text-sm text-white/35 leading-relaxed">{activeStream.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="space-y-4">
                            {/* Payment info */}
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <DollarSign size={15} className="text-green-400" /> Payment Info
                                </h3>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between"><span className="text-white/40">Watch Time</span><span className="font-mono">{fmt(watchTime)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Total Spent</span><span className="font-mono text-amber-400">{totalPaid.toFixed(1)} KAS</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Rate</span><span className="font-mono">{activeStream.pricePerInterval} KAS / {activeStream.intervalSeconds}s</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Status</span>
                                        <span className={`font-semibold ${!isBlurred && isStreaming ? 'text-green-400' : 'text-white/40'}`}>
                                            {!isBlurred && isStreaming ? 'Streaming' : isStreaming ? 'Waiting...' : 'Idle'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Creator wallet (paid to) */}
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Wallet size={15} className="text-amber-400" /> Creator Receives
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <User size={12} className="text-amber-400" />
                                    </div>
                                    <span className="text-sm font-medium">{activeStream.creatorName}</span>
                                </div>
                                <div className="text-[10px] text-white/25 font-mono break-all p-2 rounded bg-white/3 border border-white/5">
                                    {activeStream.creatorWallet}
                                </div>
                                <p className="text-[10px] text-white/20 mt-2">
                                    Payments flow directly to this wallet. No middleman. 1-second finality.
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="glass-card p-5 text-center">
                                <h3 className="text-sm font-bold mb-3 flex items-center justify-center gap-2">
                                    <Zap size={15} className="text-amber-400" /> Scan to Pay
                                </h3>
                                <div className="bg-white rounded-xl p-3 mx-auto w-fit mb-2">
                                    <QRCodeSVG
                                        value={`kaspa:${activeStream.creatorWallet.replace('kaspa:', '')}?amount=${activeStream.pricePerInterval}&message=KasStream`}
                                        size={130}
                                    />
                                </div>
                                <p className="text-[10px] text-white/30">{activeStream.pricePerInterval} KAS per {activeStream.intervalSeconds}s</p>
                            </div>

                            {/* Back to browse */}
                            <button
                                onClick={() => { setTab('browse'); stopWatching(); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-sm text-white/50 hover:text-white/70"
                            >
                                <ArrowLeft size={14} /> Back to Library
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAGE (with Suspense for useSearchParams)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function KasStreamPage() {
    return (
        <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8 text-white/30">Loading KasStream...</div>}>
            <KasStreamInner />
        </Suspense>
    );
}
