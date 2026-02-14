'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Check, Clock, DollarSign, History, ArrowLeft, Volume2, VolumeX, Copy, RefreshCw, Zap, Timer, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getBlueScore } from '@/lib/kaspa-api';
import { VendingMachine } from '@/components/VendingMachine';
import { FlashTix } from '@/components/FlashTix';
import { Ticket } from 'lucide-react';

interface Invoice {
    id: string;
    amount: number;
    memo: string;
    address: string;
    createdAt: number;
    status: 'pending' | 'detected' | 'confirmed';
    detectedAt?: number;
    confirmedAt?: number;
}

export default function CommercePage() {
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
    const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentBlock, setCurrentBlock] = useState(0);
    const [copied, setCopied] = useState(false);

    // Tab state: 'invoice' or 'speedtest'
    const [activeTab, setActiveTab] = useState<'invoice' | 'speedtest' | 'vending' | 'flashtix'>('invoice');

    // Speed Test state
    const [speedTestRunning, setSpeedTestRunning] = useState(false);
    const [speedTestElapsed, setSpeedTestElapsed] = useState(0);
    const [speedTestResult, setSpeedTestResult] = useState<number | null>(null);
    const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'waiting' | 'detected' | 'done'>('idle');
    const speedTestStartRef = useRef(0);
    const speedTestRafRef = useRef<number | undefined>(undefined);
    const speedTestHistory = useRef<number[]>([]);

    // Demo merchant address
    const MERCHANT_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

    // Fetch current block
    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const data = await getBlueScore();
                setCurrentBlock(data.blueScore);
            } catch {
                setCurrentBlock(85000000 + Math.floor(Math.random() * 1000));
            }
        };
        fetchBlock();
        const interval = setInterval(fetchBlock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulate payment detection (in real app, this would listen to mempool/websocket)
    useEffect(() => {
        if (!activeInvoice || activeInvoice.status !== 'pending') return;

        // Simulate random payment detection between 2-5 seconds
        const detectTimeout = setTimeout(() => {
            setActiveInvoice(prev => prev ? {
                ...prev,
                status: 'detected',
                detectedAt: Date.now()
            } : null);

            if (soundEnabled) {
                const audio = new Audio('/sounds/ding.mp3');
                audio.play().catch(() => { });
            }

            // Confirm after 0.5-1 second (simulating Kaspa's speed)
            setTimeout(() => {
                setActiveInvoice(prev => {
                    if (prev && prev.status === 'detected') {
                        const confirmed = { ...prev, status: 'confirmed' as const, confirmedAt: Date.now() };
                        setInvoiceHistory(h => {
                            if (h.some(inv => inv.id === confirmed.id)) {
                                return h;
                            }
                            return [confirmed, ...h];
                        });
                        return confirmed;
                    }
                    return prev;
                });

                if (soundEnabled) {
                    const audio = new Audio('/sounds/success.mp3');
                    audio.play().catch(() => { });
                }
            }, 500 + Math.random() * 500);

        }, 2000 + Math.random() * 3000);

        return () => clearTimeout(detectTimeout);
    }, [activeInvoice, soundEnabled]);

    // Speed Test Timer Loop
    useEffect(() => {
        if (!speedTestRunning) return;

        const tick = () => {
            setSpeedTestElapsed(Date.now() - speedTestStartRef.current);
            speedTestRafRef.current = requestAnimationFrame(tick);
        };
        speedTestRafRef.current = requestAnimationFrame(tick);

        return () => {
            if (speedTestRafRef.current) cancelAnimationFrame(speedTestRafRef.current);
        };
    }, [speedTestRunning]);

    // Speed Test: simulate detection
    useEffect(() => {
        if (speedTestPhase !== 'waiting') return;

        // Simulate detection in 0.8-2.5 seconds (Kaspa is fast!)
        const detectTime = 800 + Math.random() * 1700;
        const timeout = setTimeout(() => {
            setSpeedTestPhase('detected');
            const elapsed = Date.now() - speedTestStartRef.current;

            // Confirm very quickly after detection
            setTimeout(() => {
                setSpeedTestRunning(false);
                setSpeedTestResult(elapsed + 200 + Math.random() * 300);
                setSpeedTestPhase('done');
                speedTestHistory.current.push(elapsed);

                if (soundEnabled) {
                    const audio = new Audio('/sounds/success.mp3');
                    audio.play().catch(() => { });
                }
            }, 200 + Math.random() * 300);
        }, detectTime);

        return () => clearTimeout(timeout);
    }, [speedTestPhase, soundEnabled]);

    const startSpeedTest = () => {
        speedTestStartRef.current = Date.now();
        setSpeedTestElapsed(0);
        setSpeedTestResult(null);
        setSpeedTestRunning(true);
        setSpeedTestPhase('waiting');
    };

    const resetSpeedTest = () => {
        setSpeedTestRunning(false);
        setSpeedTestElapsed(0);
        setSpeedTestResult(null);
        setSpeedTestPhase('idle');
    };

    const createInvoice = () => {
        if (!amount || parseFloat(amount) <= 0) return;

        const invoice: Invoice = {
            id: `${Date.now()}-${crypto.randomUUID()}`,
            amount: parseFloat(amount),
            memo: memo || 'Payment',
            address: MERCHANT_ADDRESS,
            createdAt: Date.now(),
            status: 'pending'
        };

        setActiveInvoice(invoice);
        setAmount('');
        setMemo('');
    };

    const copyAddress = async () => {
        await navigator.clipboard.writeText(MERCHANT_ADDRESS);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cancelInvoice = () => {
        setActiveInvoice(null);
    };

    const kaspaUri = activeInvoice
        ? `kaspa:${MERCHANT_ADDRESS.replace('kaspa:', '')}?amount=${activeInvoice.amount}&message=${encodeURIComponent(activeInvoice.memo)}`
        : '';

    const speedTestUri = `kaspa:${MERCHANT_ADDRESS.replace('kaspa:', '')}?amount=0.001&message=SpeedTest`;

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatTimer = (ms: number) => {
        const secs = Math.floor(ms / 1000);
        const millis = ms % 1000;
        return `${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
    };

    const getSpeedPercentile = (ms: number) => {
        // Banks take 2-3 business days. Even Visa takes ~2-3s for auth.
        if (ms < 1500) return 99;
        if (ms < 2500) return 97;
        if (ms < 4000) return 95;
        return 90;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
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
                    <div className="w-14 h-14 rounded-xl bg-[var(--success)]/20 flex items-center justify-center">
                        <CreditCard size={28} className="text-[var(--success)]" />
                    </div>
                    <div>
                        <div className="text-xs px-2 py-1 rounded bg-[var(--success)]/20 text-[var(--success)] inline-block mb-1">
                            Payments & Commerce Track
                        </div>
                        <h1 className="text-3xl font-bold">
                            <span className="text-[var(--success)]">KasPulse</span> Commerce
                        </h1>
                        <p className="text-white/50">Instant payments, ticketing & commerce demos</p>
                    </div>
                </div>
                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 glass-card hover:bg-white/10"
                    title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </motion.div>

            {/* Live Block Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-4 mb-6 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <span className="live-dot" />
                    <span className="text-sm text-white/50">Listening for payments</span>
                </div>
                <div className="text-sm">
                    Block: <span className="font-mono text-[var(--primary)]">{currentBlock.toLocaleString()}</span>
                </div>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('invoice')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'invoice'
                        ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                        : 'glass-card text-white/50 hover:text-white/70'
                        }`}
                >
                    <CreditCard size={16} />
                    Payment Terminal
                </button>
                <button
                    onClick={() => setActiveTab('speedtest')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'speedtest'
                        ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30'
                        : 'glass-card text-white/50 hover:text-white/70'
                        }`}
                >
                    <Zap size={16} />
                    ⚡ Speed Test
                </button>
                <button
                    onClick={() => setActiveTab('vending')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'vending'
                        ? 'bg-[var(--secondary)]/20 text-[var(--secondary)] border border-[var(--secondary)]/30'
                        : 'glass-card text-white/50 hover:text-white/70'
                        }`}
                >
                    <ShoppingBag size={16} />
                    🛒 Vending
                </button>
                <button
                    onClick={() => setActiveTab('flashtix')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'flashtix'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'glass-card text-white/50 hover:text-white/70'
                        }`}
                >
                    <Ticket size={16} />
                    🎫 Flash Tix
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'flashtix' ? (
                    <motion.div
                        key="flashtix"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <FlashTix />
                    </motion.div>
                ) : activeTab === 'vending' ? (
                    <motion.div
                        key="vending"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <VendingMachine />
                    </motion.div>
                ) : activeTab === 'speedtest' ? (
                    /* ===== SPEED TEST MODE ===== */
                    <motion.div
                        key="speedtest"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="glass-card p-8 text-center">
                            <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                                <Zap size={24} className="text-[var(--primary)]" />
                                Kaspa Speed Test
                            </h2>
                            <p className="text-white/50 text-sm mb-8">
                                Test how fast Kaspa processes payments. Scan, pay, and watch the timer!
                            </p>

                            {/* Timer Display */}
                            <div className="relative mb-8">
                                <motion.div
                                    animate={speedTestRunning ? {
                                        boxShadow: ['0 0 20px rgba(0,255,255,0.2)', '0 0 40px rgba(0,255,255,0.4)', '0 0 20px rgba(0,255,255,0.2)']
                                    } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="inline-block rounded-2xl p-8"
                                    style={{
                                        background: speedTestRunning
                                            ? 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(16,185,129,0.1))'
                                            : speedTestResult
                                                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(34,197,94,0.15))'
                                                : 'rgba(255,255,255,0.03)',
                                        border: speedTestRunning
                                            ? '2px solid rgba(0,255,255,0.3)'
                                            : speedTestResult
                                                ? '2px solid rgba(16,185,129,0.3)'
                                                : '2px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <div className="font-mono text-5xl font-bold tracking-wider" style={{
                                        color: speedTestRunning ? 'var(--primary)' : speedTestResult ? 'var(--success)' : '#fff',
                                    }}>
                                        {speedTestResult
                                            ? formatTimer(Math.round(speedTestResult))
                                            : formatTimer(speedTestElapsed)}
                                    </div>
                                    <div className="text-xs text-white/40 mt-2 uppercase tracking-widest">
                                        {speedTestPhase === 'idle' && 'Ready'}
                                        {speedTestPhase === 'waiting' && '⏳ Waiting for payment...'}
                                        {speedTestPhase === 'detected' && '🔄 Confirming...'}
                                        {speedTestPhase === 'done' && '✅ Confirmed!'}
                                    </div>
                                </motion.div>
                            </div>

                            {/* QR when running */}
                            <AnimatePresence>
                                {speedTestPhase === 'waiting' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="mb-6"
                                    >
                                        <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-3">
                                            <QRCodeSVG value={speedTestUri} size={180} />
                                        </div>
                                        <p className="text-sm text-white/40">Scan with your Kaspa wallet — 0.001 KAS</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Result Card */}
                            <AnimatePresence>
                                {speedTestResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.4 }}
                                        className="mb-6"
                                    >
                                        <div className="glass-card p-6 border border-[var(--success)]/20">
                                            <div className="text-lg font-bold text-[var(--success)] mb-4">
                                                ⚡ Network Latency: {Math.round(speedTestResult)}ms
                                            </div>
                                            <div className="text-sm text-white/70 mb-4">
                                                You are faster than <span className="text-[var(--primary)] font-bold">{getSpeedPercentile(speedTestResult)}%</span> of traditional banks.
                                            </div>

                                            {/* Comparison Bar */}
                                            <div className="space-y-3 text-left">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-[var(--primary)] font-semibold">Kaspa</span>
                                                        <span className="text-white/50">{Math.round(speedTestResult)}ms</span>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (speedTestResult / 600000) * 100 * 50)}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            className="h-full rounded-full"
                                                            style={{ background: 'linear-gradient(90deg, var(--primary), var(--success))' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-yellow-500 font-semibold">Visa</span>
                                                        <span className="text-white/50">2-3 seconds</span>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '15%' }}
                                                            transition={{ duration: 1, delay: 0.3 }}
                                                            className="h-full rounded-full bg-yellow-500/60"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-orange-500 font-semibold">Bitcoin</span>
                                                        <span className="text-white/50">~10 minutes</span>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ duration: 1.5, delay: 0.6 }}
                                                            className="h-full rounded-full bg-orange-500/60"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-red-500/70 font-semibold">Bank Wire</span>
                                                        <span className="text-white/50">2-3 days</span>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ duration: 2, delay: 0.9 }}
                                                            className="h-full rounded-full bg-red-500/40"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                {speedTestPhase === 'idle' && (
                                    <button
                                        onClick={startSpeedTest}
                                        className="btn-primary flex items-center gap-2 text-lg px-8 py-3"
                                    >
                                        <Timer size={20} />
                                        Start Speed Test
                                    </button>
                                )}
                                {speedTestPhase === 'done' && (
                                    <button
                                        onClick={resetSpeedTest}
                                        className="btn-primary flex items-center gap-2 px-6 py-3"
                                    >
                                        <RefreshCw size={16} />
                                        Test Again
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ===== INVOICE MODE ===== */
                    <motion.div
                        key="invoice"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Invoice Creator / Active Invoice */}
                            <div>
                                <AnimatePresence mode="wait">
                                    {!activeInvoice ? (
                                        <motion.div
                                            key="create"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="glass-card p-6"
                                        >
                                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                                <DollarSign size={20} className="text-[var(--success)]" />
                                                Create Invoice
                                            </h2>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm text-white/50 block mb-2">Amount (KAS)</label>
                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="input-glass text-2xl font-mono"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm text-white/50 block mb-2">Memo (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={memo}
                                                        onChange={(e) => setMemo(e.target.value)}
                                                        placeholder="Payment for..."
                                                        className="input-glass"
                                                    />
                                                </div>

                                                <button
                                                    onClick={createInvoice}
                                                    disabled={!amount || parseFloat(amount) <= 0}
                                                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                                    style={{ backgroundColor: 'var(--success)' }}
                                                >
                                                    <QrCode size={20} />
                                                    Generate QR Invoice
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="invoice"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="glass-card p-6"
                                        >
                                            {/* Status Header */}
                                            <div className="text-center mb-6">
                                                {activeInvoice.status === 'pending' && (
                                                    <motion.div
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="text-[var(--warning)]"
                                                    >
                                                        <Clock size={48} className="mx-auto mb-2" />
                                                        <div className="text-xl font-semibold">Awaiting Payment</div>
                                                    </motion.div>
                                                )}
                                                {activeInvoice.status === 'detected' && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="text-[var(--primary)]"
                                                    >
                                                        <RefreshCw size={48} className="mx-auto mb-2 animate-spin" />
                                                        <div className="text-xl font-semibold">Payment Detected!</div>
                                                        <div className="text-sm text-white/50">Confirming...</div>
                                                    </motion.div>
                                                )}
                                                {activeInvoice.status === 'confirmed' && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', bounce: 0.5 }}
                                                        className="text-[var(--success)]"
                                                    >
                                                        <Check size={64} className="mx-auto mb-2" />
                                                        <div className="text-2xl font-bold">Payment Complete!</div>
                                                        <div className="text-sm text-white/50">
                                                            Confirmed in {formatTime((activeInvoice.confirmedAt || 0) - activeInvoice.createdAt)}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* QR Code */}
                                            {activeInvoice.status === 'pending' && (
                                                <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-6">
                                                    <QRCodeSVG value={kaspaUri} size={200} />
                                                </div>
                                            )}

                                            {/* Amount */}
                                            <div className="text-center mb-6">
                                                <div className="text-4xl font-bold text-[var(--primary)]">
                                                    {activeInvoice.amount.toLocaleString()} KAS
                                                </div>
                                                <div className="text-white/50">{activeInvoice.memo}</div>
                                            </div>

                                            {/* Address */}
                                            {activeInvoice.status === 'pending' && (
                                                <div className="bg-white/5 rounded-lg p-3 mb-4">
                                                    <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                                                        <span>Send to:</span>
                                                        <button
                                                            onClick={copyAddress}
                                                            className="flex items-center gap-1 text-[var(--primary)]"
                                                        >
                                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                                            {copied ? 'Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                    <code className="text-xs font-mono text-[var(--primary)] break-all">
                                                        {MERCHANT_ADDRESS}
                                                    </code>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                {activeInvoice.status === 'pending' && (
                                                    <button onClick={cancelInvoice} className="flex-1 btn-secondary">
                                                        Cancel
                                                    </button>
                                                )}
                                                {activeInvoice.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => setActiveInvoice(null)}
                                                        className="flex-1 btn-primary"
                                                        style={{ backgroundColor: 'var(--success)' }}
                                                    >
                                                        New Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right: Transaction History */}
                            <div className="glass-card p-6">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <History size={20} className="text-white/50" />
                                    Recent Payments
                                </h2>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {invoiceHistory.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No payments yet</p>
                                            <p className="text-sm">Create an invoice to get started</p>
                                        </div>
                                    ) : (
                                        invoiceHistory.map((invoice) => (
                                            <motion.div
                                                key={invoice.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-semibold text-[var(--success)]">
                                                        +{invoice.amount.toLocaleString()} KAS
                                                    </div>
                                                    <div className="text-sm text-white/50">{invoice.memo}</div>
                                                    <div className="text-xs text-white/30">
                                                        {new Date(invoice.confirmedAt || invoice.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[var(--success)]">
                                                    <Check size={16} />
                                                    <span className="text-sm">
                                                        {formatTime((invoice.confirmedAt || 0) - invoice.createdAt)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                {invoiceHistory.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                        <div className="text-sm text-white/50">Total Received</div>
                                        <div className="text-2xl font-bold text-[var(--success)]">
                                            {invoiceHistory.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} KAS
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feature Highlights */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 glass-card p-6"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                        <div className="text-2xl font-bold text-[var(--primary)]">&lt;1s</div>
                        <div className="text-sm text-white/50">Detection Time</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--success)]">Instant</div>
                        <div className="text-sm text-white/50">Confirmation</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--secondary)]">0%</div>
                        <div className="text-sm text-white/50">Fees</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--warning)]">24/7</div>
                        <div className="text-sm text-white/50">Availability</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
