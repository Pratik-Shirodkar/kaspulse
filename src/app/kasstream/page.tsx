'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowLeft, Zap, Eye, EyeOff, DollarSign, Clock, Tv } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getBlueScore } from '@/lib/kaspa-api';
import { sendTransaction } from '@/lib/wallet';

const MERCHANT_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

export default function KasStreamPage() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isBlurred, setIsBlurred] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [totalPaid, setTotalPaid] = useState(0);
    const [watchTime, setWatchTime] = useState(0);
    const [lastPayment, setLastPayment] = useState(0);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const watchIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const COST_PER_5S = 1; // KAS per 5 seconds

    const paymentUri = `kaspa:${MERCHANT_ADDRESS.replace('kaspa:', '')}?amount=${COST_PER_5S}&message=KasStream`;

    // Recurring watch timer — tracks how long user has been watching
    useEffect(() => {
        if (!isBlurred && isStreaming) {
            watchIntervalRef.current = setInterval(() => {
                setWatchTime(prev => prev + 1);
            }, 1000);
        } else {
            if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
        }
        return () => {
            if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
        };
    }, [isBlurred, isStreaming]);

    const startStream = async () => {
        setShowQR(true);
        setTotalPaid(0);
        setWatchTime(0);
        setStreamError(null);
        setPaying(true);
        setIsStreaming(true);
        setIsBlurred(true);

        try {
            await sendTransaction(MERCHANT_ADDRESS, COST_PER_5S);
            setLastPayment(Date.now());
            setTotalPaid(COST_PER_5S);
            setIsBlurred(false);
            if (videoRef.current) {
                videoRef.current.play().catch(() => { });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Transaction failed';
            setStreamError(msg);
            setIsStreaming(false);
            setShowQR(false);
        } finally {
            setPaying(false);
        }
    };

    // "Extend" button — pay again to add more time
    const extendStream = async () => {
        if (paying) return;
        setPaying(true);
        setStreamError(null);

        try {
            await sendTransaction(MERCHANT_ADDRESS, COST_PER_5S);
            setLastPayment(Date.now());
            setTotalPaid(prev => prev + COST_PER_5S);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Transaction failed';
            setStreamError(msg);
        } finally {
            setPaying(false);
        }
    };

    const stopStream = () => {
        setIsStreaming(false);
        setShowQR(false);
        setIsBlurred(true);
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    const formatWatch = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link href="/" className="text-white/40 hover:text-white/60 text-sm flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Back to Launcher
                </Link>
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                        <Tv size={28} className="text-[var(--primary)]" />
                    </div>
                    <div>
                        <div className="text-xs px-2 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] inline-block mb-1">
                            Streaming Payments Track
                        </div>
                        <h1 className="text-3xl font-bold">
                            <span className="text-[var(--primary)]">Kas</span>Stream
                        </h1>
                        <p className="text-white/50">Pay-per-second video streaming powered by Kaspa</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player */}
                <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden rounded-xl">
                        <div className="relative aspect-video bg-black">
                            {/* Video with blur */}
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover transition-all duration-500"
                                style={{
                                    filter: isBlurred ? 'blur(20px) brightness(0.3)' : 'none',
                                }}
                                loop
                                muted
                                playsInline
                            >
                                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                            </video>

                            {/* Blur Overlay Content */}
                            <AnimatePresence>
                                {isBlurred && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center text-center z-10"
                                    >
                                        {!isStreaming ? (
                                            <>
                                                <EyeOff size={48} className="text-white/50 mb-4" />
                                                <h3 className="text-xl font-bold mb-2">Content Locked</h3>
                                                <p className="text-white/50 text-sm mb-6 max-w-md">
                                                    Pay-per-second with Kaspa. Stream payments unlock the video in real-time.
                                                    Only possible on a chain with 1-second block times.
                                                </p>
                                                <button
                                                    onClick={startStream}
                                                    disabled={paying}
                                                    className={`flex items-center gap-2 text-lg px-8 py-3 rounded-xl font-bold transition-all ${paying
                                                        ? 'bg-white/10 text-white/40 cursor-wait'
                                                        : 'btn-primary'
                                                        }`}
                                                >
                                                    <Play size={20} />
                                                    {paying ? '⏳ Sending TX...' : `Start Streaming (${COST_PER_5S} KAS / 5s)`}
                                                </button>
                                                {streamError && (
                                                    <p className="mt-3 text-sm text-red-400">⚠️ {streamError}</p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    <Zap size={48} className="text-[var(--primary)]" />
                                                </motion.div>
                                                <p className="text-[var(--primary)] font-semibold mt-4">
                                                    Waiting for payment...
                                                </p>
                                                <p className="text-white/40 text-sm mt-1">
                                                    Scan the QR code to start watching
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Now Playing indicator */}
                            {!isBlurred && isStreaming && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg z-10"
                                    style={{
                                        background: 'rgba(0,0,0,0.6)',
                                        border: '1px solid rgba(0,255,255,0.3)',
                                    }}
                                >
                                    <span className="live-dot" />
                                    <Eye size={14} className="text-[var(--primary)]" />
                                    <span className="text-xs text-[var(--primary)] font-semibold">LIVE</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Video Controls Bar */}
                        {isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 flex flex-col gap-2"
                                style={{ background: 'rgba(0,0,0,0.4)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={stopStream}
                                            className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                                        >
                                            <Pause size={14} />
                                            Stop
                                        </button>
                                        <div className="text-xs text-white/50">
                                            <Clock size={12} className="inline mr-1" />
                                            {formatWatch(watchTime)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button
                                            onClick={extendStream}
                                            disabled={paying}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-all ${paying
                                                ? 'bg-white/5 text-white/30 cursor-wait'
                                                : 'bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30 border border-[var(--primary)]/20'
                                                }`}
                                        >
                                            {paying ? '⏳ TX...' : `+ ${COST_PER_5S} KAS`}
                                        </button>
                                        <span className="text-white/40">
                                            Spent: <span className="text-[var(--primary)] font-semibold">{totalPaid.toFixed(0)} KAS</span>
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${!isBlurred ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {!isBlurred ? '● PAID' : '○ PENDING'}
                                        </span>
                                    </div>
                                </div>
                                {streamError && (
                                    <div className="text-xs text-red-400 text-center">⚠️ {streamError}</div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    {/* QR Payment Panel */}
                    <AnimatePresence>
                        {showQR && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-6 text-center"
                            >
                                <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
                                    <Zap size={18} className="text-[var(--primary)]" />
                                    Scan to Stream
                                </h3>
                                <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-4">
                                    <QRCodeSVG value={paymentUri} size={160} />
                                </div>
                                <p className="text-xs text-white/40 mb-3">
                                    {COST_PER_5S} KAS every 5 seconds
                                </p>
                                <div className="text-xs text-white/30 font-mono break-all">
                                    {MERCHANT_ADDRESS}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats Card */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <DollarSign size={18} className="text-[var(--success)]" />
                            Stream Stats
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Watch Time</span>
                                <span className="font-mono">{formatWatch(watchTime)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Total Spent</span>
                                <span className="font-mono text-[var(--primary)]">{totalPaid.toFixed(3)} KAS</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Rate</span>
                                <span className="font-mono">{COST_PER_5S} KAS / 5s</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Status</span>
                                <span className={`font-semibold ${!isBlurred && isStreaming ? 'text-green-400' : 'text-white/40'}`}>
                                    {!isBlurred && isStreaming ? 'Streaming' : isStreaming ? 'Waiting...' : 'Idle'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold text-white/60 mb-3">How It Works</h3>
                        <ol className="text-xs text-white/40 space-y-2">
                            <li>1. Click "Start Streaming" to begin</li>
                            <li>2. Scan the QR code with your Kaspa wallet</li>
                            <li>3. Video unblurs as payments flow in</li>
                            <li>4. Stop payments → video pauses instantly</li>
                        </ol>
                        <div className="mt-4 p-3 rounded-lg bg-[var(--primary)]/10 text-xs text-[var(--primary)]">
                            ⚡ Only possible on Kaspa — 1-second block times enable true streaming payments
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
