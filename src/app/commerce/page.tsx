'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Check, Clock, DollarSign, History, ArrowLeft, Volume2, VolumeX, Copy, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getBlueScore } from '@/lib/kaspa-api';

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

    // Demo merchant address
    const MERCHANT_ADDRESS = 'kaspa:qr0ks9hpvlpz7vz9wkpqxzqmjx8k5qwvw6qj8sfmxp';

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
                // Play detection sound
                const audio = new Audio('/sounds/ding.mp3');
                audio.play().catch(() => { });
            }

            // Confirm after 0.5-1 second (simulating Kaspa's speed)
            setTimeout(() => {
                setActiveInvoice(prev => {
                    if (prev && prev.status === 'detected') {
                        const confirmed = { ...prev, status: 'confirmed' as const, confirmedAt: Date.now() };
                        // Only add to history if not already present
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

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
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
                className="flex items-center justify-between mb-8"
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
                            <span className="text-[var(--success)]">Kas</span>Point
                        </h1>
                        <p className="text-white/50">Instant payment terminal for merchants</p>
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
                className="glass-card p-4 mb-8 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <span className="live-dot" />
                    <span className="text-sm text-white/50">Listening for payments</span>
                </div>
                <div className="text-sm">
                    Block: <span className="font-mono text-[var(--primary)]">{currentBlock.toLocaleString()}</span>
                </div>
            </motion.div>

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
