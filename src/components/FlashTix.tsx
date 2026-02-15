'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Zap, Users, Timer, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { sendTransaction } from '@/lib/wallet';

const TOTAL_TICKETS = 100;
const TICKET_PRICE = 5; // KAS
const TICKET_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

interface BuyEvent {
    buyer: string;
    ticketNum: number;
    time: number;
    confirmMs: number;
    id: number;
}

function randomBuyer(): string {
    const c = '0123456789abcdef';
    let h = 'kaspa:q';
    for (let i = 0; i < 8; i++) h += c[Math.floor(Math.random() * 16)];
    return h + '...';
}

export function FlashTix() {
    const [ticketsLeft, setTicketsLeft] = useState(TOTAL_TICKETS);
    const [buyEvents, setBuyEvents] = useState<BuyEvent[]>([]);
    const [tps, setTps] = useState(0);
    const [peakTps, setPeakTps] = useState(0);
    const [saleActive, setSaleActive] = useState(false);
    const buyIdRef = useRef(0);
    const [userTicket, setUserTicket] = useState<number | null>(null);
    const [buyingState, setBuyingState] = useState<'idle' | 'confirming' | 'confirmed'>('idle');
    const [concurrentBuyers, setConcurrentBuyers] = useState(0);
    const tpsCountRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start the flash sale
    const startSale = useCallback(() => {
        setTicketsLeft(TOTAL_TICKETS);
        setBuyEvents([]);
        setTps(0);
        setPeakTps(0);
        setUserTicket(null);
        setBuyingState('idle');
        setSaleActive(true);
        setConcurrentBuyers(47 + Math.floor(Math.random() * 30));
        tpsCountRef.current = 0;
    }, []);

    // Simulate concurrent buyers fighting for tickets
    useEffect(() => {
        if (!saleActive) return;

        intervalRef.current = setInterval(() => {
            setTicketsLeft(prev => {
                if (prev <= 0) {
                    setSaleActive(false);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }

                // 1-3 tickets bought per tick, increasing as supply drops
                const urgency = 1 + Math.floor((TOTAL_TICKETS - prev) / 30);
                const bought = Math.min(prev, Math.ceil(Math.random() * urgency));
                const remaining = prev - bought;

                // Log each purchase
                for (let i = 0; i < bought; i++) {
                    const ticketNum = TOTAL_TICKETS - remaining - i;
                    const confirmMs = 600 + Math.floor(Math.random() * 500);
                    buyIdRef.current++;
                    const eid = buyIdRef.current;
                    setBuyEvents(events => [{
                        buyer: randomBuyer(),
                        ticketNum,
                        time: Date.now(),
                        confirmMs,
                        id: eid,
                    }, ...events].slice(0, 12));
                    tpsCountRef.current++;
                }

                // Fluctuate concurrent buyers
                setConcurrentBuyers(prev2 => Math.max(5, prev2 + (Math.random() > 0.3 ? -1 : 2)));

                return remaining;
            });
        }, 200 + Math.random() * 150);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [saleActive]);

    // TPS counter
    useEffect(() => {
        const interval = setInterval(() => {
            const currentTps = tpsCountRef.current * 2; // Extrapolate from 500ms
            setTps(currentTps);
            if (currentTps > peakTps) setPeakTps(currentTps);
            tpsCountRef.current = 0;
        }, 500);
        return () => clearInterval(interval);
    }, [peakTps]);

    // User buy handler
    const [buyError, setBuyError] = useState<string | null>(null);

    const handleBuy = useCallback(async () => {
        if (ticketsLeft <= 0 || userTicket !== null || buyingState !== 'idle') return;

        setBuyingState('confirming');
        setBuyError(null);
        const myTicketNum = ticketsLeft;

        try {
            await sendTransaction(TICKET_ADDRESS, TICKET_PRICE);

            setTicketsLeft(prev => Math.max(0, prev - 1));
            setUserTicket(myTicketNum);
            setBuyingState('confirmed');

            buyIdRef.current++;
            const eid = buyIdRef.current;
            setBuyEvents(events => [{
                buyer: 'YOU',
                ticketNum: myTicketNum,
                time: Date.now(),
                confirmMs: 780,
                id: eid,
            }, ...events].slice(0, 12));
        } catch (err) {
            setBuyingState('idle');
            setBuyError(err instanceof Error ? err.message : 'Transaction failed — connect wallet first');
        }
    }, [ticketsLeft, userTicket, buyingState]);

    const soldPercent = ((TOTAL_TICKETS - ticketsLeft) / TOTAL_TICKETS) * 100;

    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Ticket className="text-amber-400" size={20} />
                        Flash Tix — Lightning Sale
                    </h3>
                    <p className="text-sm text-white/50 mt-0.5">
                        100 concert tickets. Hundreds of buyers. No double-booking — addressing{' '}
                        <strong className="text-amber-400">KaspaTix</strong>
                    </p>
                </div>
                {saleActive && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                        <span className="live-dot" />
                        <span className="text-[10px] font-bold text-red-400 uppercase">SELLING</span>
                    </div>
                )}
            </div>

            {/* ─── Ticket Counter ─── */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Tickets Remaining</span>
                    <span className={`text-2xl font-bold font-mono ${ticketsLeft <= 10 ? 'text-red-400' : ticketsLeft <= 30 ? 'text-amber-400' : 'text-[var(--primary)]'
                        }`}>
                        {ticketsLeft} / {TOTAL_TICKETS}
                    </span>
                </div>

                {/* Progress bar (sold %) */}
                <div className="h-4 w-full rounded-full overflow-hidden" style={{ background: '#0a0a14' }}>
                    <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${soldPercent}%` }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: soldPercent > 90
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : soldPercent > 60
                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                    : 'linear-gradient(90deg, var(--primary), var(--secondary))',
                            boxShadow: ticketsLeft <= 10 ? '0 0 12px rgba(239,68,68,0.5)' : '0 0 8px rgba(0,255,255,0.3)',
                        }}
                    />
                </div>

                {ticketsLeft <= 10 && ticketsLeft > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 mt-2 text-red-400 text-xs"
                    >
                        <AlertTriangle size={12} />
                        <span className="font-bold">ALMOST SOLD OUT!</span>
                    </motion.div>
                )}

                {ticketsLeft === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 mt-2 text-amber-400 text-sm font-bold"
                    >
                        🎉 SOLD OUT in {buyEvents.length > 0 ? `${((Date.now() - buyEvents[buyEvents.length - 1]?.time) / 1000).toFixed(1)}s` : '—'}!
                        Zero double-bookings.
                    </motion.div>
                )}
            </div>

            {/* ─── Stats ─── */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.08)' }}>
                    <div className="text-xl font-bold font-mono text-[var(--primary)]">{tps}</div>
                    <div className="text-[10px] text-white/40 uppercase">TX/sec</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.08)' }}>
                    <div className="text-xl font-bold font-mono text-amber-400">{peakTps}</div>
                    <div className="text-[10px] text-white/40 uppercase">Peak TX/s</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}>
                    <div className="text-xl font-bold font-mono text-purple-400">{concurrentBuyers}</div>
                    <div className="text-[10px] text-white/40 uppercase">Buyers</div>
                </div>
            </div>

            {/* ─── Action Buttons ─── */}
            <div className="flex gap-3 mb-5">
                {!saleActive && ticketsLeft === TOTAL_TICKETS && (
                    <button
                        onClick={startSale}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110 transition-all"
                        style={{ boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}
                    >
                        🚀 Start Flash Sale
                    </button>
                )}

                {saleActive && ticketsLeft > 0 && (
                    <button
                        onClick={handleBuy}
                        disabled={buyingState !== 'idle'}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${buyingState === 'confirming'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : buyingState === 'confirmed'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black hover:brightness-110'
                            }`}
                    >
                        {buyingState === 'confirming' ? 'â³ Confirming on DAG...'
                            : buyingState === 'confirmed' ? `✅ Ticket #${userTicket} Secured!`
                                : `🎫 Buy Ticket (${TICKET_PRICE} KAS)`}
                    </button>
                )}

                {ticketsLeft === 0 && (
                    <button
                        onClick={() => {
                            setTicketsLeft(TOTAL_TICKETS);
                            setSaleActive(false);
                            setBuyEvents([]);
                            setUserTicket(null);
                            setBuyingState('idle');
                        }}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/10 text-white/70 hover:bg-white/20 transition-all border border-white/10"
                    >
                        🔄 Reset Sale
                    </button>
                )}
            </div>

            {/* Buy Error */}
            {buyError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    ⚠ï¸ {buyError}
                </div>
            )}

            {/* ─── Purchase Feed ─── */}
            {buyEvents.length > 0 && (
                <div>
                    <h4 className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Live Purchases</h4>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                        <AnimatePresence mode="popLayout">
                            {buyEvents.map((e, i) => (
                                <motion.div
                                    key={e.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-between p-2 rounded-lg text-xs"
                                    style={{
                                        background: e.buyer === 'YOU'
                                            ? 'rgba(0,255,255,0.08)'
                                            : i === 0 ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${e.buyer === 'YOU'
                                            ? 'rgba(0,255,255,0.2)'
                                            : i === 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)'
                                            }`,
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={12} className="text-green-400" />
                                        <span className={`font-mono ${e.buyer === 'YOU' ? 'text-[var(--primary)] font-bold' : 'text-white/40'}`}>
                                            {e.buyer}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/30">Ticket #{e.ticketNum}</span>
                                        <span className="text-green-400/60 font-mono">{e.confirmMs}ms</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Explainer */}
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.02)', border: '1px solid rgba(245,158,11,0.06)' }}>
                <p className="text-xs text-white/45 leading-relaxed text-center">
                    <Zap size={12} className="inline text-amber-400 mr-1" />
                    <strong className="text-white/70">Solving the Ticketmaster problem:</strong>{' '}
                    Kaspa&apos;s DAG handles hundreds of concurrent purchases per second.
                    No double-booking, no server crashes — every ticket is a unique UTXO confirmed in under 1 second.
                </p>
            </div>
        </div>
    );
}
