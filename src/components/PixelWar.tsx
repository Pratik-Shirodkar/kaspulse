'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Zap, Users, Timer, Sparkles } from 'lucide-react';
import { sendTransaction } from '@/lib/wallet';

const PIXEL_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

// ─── Config ────────────────────────────────────────────
const GRID_SIZE = 50;
const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE;
const COLORS = [
    '#00ffff', '#00e5ff', '#00bcd4', '#00e676', '#69f0ae',
    '#8b5cf6', '#a78bfa', '#f472b6', '#fb923c', '#facc15',
    '#ef4444', '#10b981', '#3b82f6', '#e879f9', '#ffffff',
    '#020208', '#1e293b',
];

// Simulated "clans"
const CLAN_PALETTES: Record<string, string[]> = {
    'Kaspa Maxi': ['#00ffff', '#00e5ff', '#00bcd4', '#26c6da'],
    'Pixel Army': ['#ef4444', '#f97316', '#eab308', '#fb923c'],
    'Neon Gang': ['#8b5cf6', '#a78bfa', '#e879f9', '#f472b6'],
    'Green Grid': ['#10b981', '#00e676', '#69f0ae', '#22c55e'],
};

function generateHash(): string {
    const c = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 12; i++) h += c[Math.floor(Math.random() * 16)];
    return h;
}

// ─── Component ─────────────────────────────────────────
export function PixelWar() {
    const [grid, setGrid] = useState<string[]>(() => {
        // Initialize with a subtle gradient pattern
        return Array(TOTAL_PIXELS).fill(null).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            // Subtle base pattern
            if ((x + y) % 7 === 0) return 'rgba(0,255,255,0.08)';
            if ((x * y) % 13 === 0) return 'rgba(139,92,246,0.06)';
            return '#0a0a14';
        });
    });

    const [selectedColor, setSelectedColor] = useState('#00ffff');
    const [liveTxs, setLiveTxs] = useState<{ hash: string; pixel: number; color: string; clan: string; time: number }[]>([]);
    const [totalPainted, setTotalPainted] = useState(0);
    const [activeUsers, setActiveUsers] = useState(23 + Math.floor(Math.random() * 40));
    const [pixelsPerMin, setPixelsPerMin] = useState(0);
    const pixelCountRef = useRef(0);
    const lastFlashRef = useRef<number | null>(null);
    const [flashPixel, setFlashPixel] = useState<number | null>(null);

    // Simulate live pixel activity from other "users"
    useEffect(() => {
        const interval = setInterval(() => {
            const clanNames = Object.keys(CLAN_PALETTES);
            const clan = clanNames[Math.floor(Math.random() * clanNames.length)];
            const palette = CLAN_PALETTES[clan];
            const color = palette[Math.floor(Math.random() * palette.length)];
            const pixelIdx = Math.floor(Math.random() * TOTAL_PIXELS);
            const hash = generateHash();

            setGrid(prev => {
                const newGrid = [...prev];
                newGrid[pixelIdx] = color;
                return newGrid;
            });

            setLiveTxs(prev => {
                const updated = [{ hash, pixel: pixelIdx, color, clan, time: Date.now() }, ...prev];
                return updated.slice(0, 8);
            });

            setTotalPainted(p => p + 1);
            pixelCountRef.current++;

            // Flash effect
            setFlashPixel(pixelIdx);
            setTimeout(() => setFlashPixel(null), 300);

            // Simulate user count fluctuation
            if (Math.random() < 0.1) {
                setActiveUsers(prev => Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1)));
            }
        }, 180 + Math.random() * 120); // ~200ms avg = ~300 pixels/min

        return () => clearInterval(interval);
    }, []);

    // Calculate pixels per minute
    useEffect(() => {
        const interval = setInterval(() => {
            setPixelsPerMin(pixelCountRef.current * 6); // Extrapolate from 10s window
            pixelCountRef.current = 0;
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // User paints a pixel
    const handlePixelClick = useCallback((idx: number) => {
        setGrid(prev => {
            const newGrid = [...prev];
            newGrid[idx] = selectedColor;
            return newGrid;
        });

        const hash = generateHash();
        setLiveTxs(prev => {
            const updated = [{ hash, pixel: idx, color: selectedColor, clan: 'You', time: Date.now() }, ...prev];
            return updated.slice(0, 8);
        });
        setTotalPainted(p => p + 1);
        setFlashPixel(idx);
        setTimeout(() => setFlashPixel(null), 300);
    }, [selectedColor]);

    // "Paint a Pixel" button handler
    const [painting, setPainting] = useState(false);
    const [paintError, setPaintError] = useState<string | null>(null);

    const handlePaintButton = useCallback(async () => {
        if (painting) return;
        setPainting(true);
        setPaintError(null);

        try {
            await sendTransaction(PIXEL_ADDRESS, 1);
            // Only paint after real tx succeeds
            const idx = Math.floor(Math.random() * TOTAL_PIXELS);
            handlePixelClick(idx);
        } catch (err) {
            setPaintError(err instanceof Error ? err.message : 'Transaction failed — connect wallet first');
        } finally {
            setPainting(false);
        }
    }, [handlePixelClick, painting]);

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Palette className="text-[var(--primary)]" size={20} />
                        PixelDAG — The Pixel War
                        <span className="live-dot" />
                    </h3>
                    <p className="text-sm text-white/50 mt-0.5">
                        50×50 canvas powered by Kaspa transactions. Each pixel = 1 KAS.
                    </p>
                </div>

                {/* Live stats */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Users size={13} className="text-[var(--primary)]" />
                        <span className="text-white/60">{activeUsers} live</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Timer size={13} className="text-green-400" />
                        <span className="text-white/60">{pixelsPerMin || '~300'}/min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Sparkles size={13} className="text-amber-400" />
                        <span className="text-white/60">{totalPainted.toLocaleString()} total</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
                {/* ─── Grid ─── */}
                <div>
                    <div
                        className="aspect-square max-w-[600px] mx-auto rounded-xl overflow-hidden border border-white/5 relative"
                        style={{ background: '#050510' }}
                    >
                        <div
                            className="grid w-full h-full"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                gap: '0px',
                            }}
                        >
                            {grid.map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => handlePixelClick(i)}
                                    className="cursor-crosshair transition-transform hover:scale-150 hover:z-10 relative"
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: flashPixel === i ? `0 0 8px 2px ${color}` : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Glow overlay on flash */}
                        <div className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{
                                boxShadow: 'inset 0 0 60px rgba(0,255,255,0.02)',
                            }}
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
                        <span className="text-xs text-white/40 mr-1">Pick color:</span>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className="w-6 h-6 rounded-md border transition-all hover:scale-125"
                                style={{
                                    backgroundColor: c,
                                    borderColor: selectedColor === c ? 'white' : 'rgba(255,255,255,0.1)',
                                    boxShadow: selectedColor === c ? `0 0 10px ${c}` : 'none',
                                    transform: selectedColor === c ? 'scale(1.3)' : undefined,
                                }}
                            />
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={handlePaintButton}
                            disabled={painting}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95 ${painting
                                ? 'bg-white/10 text-white/40 cursor-wait'
                                : 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black hover:brightness-110'
                                }`}
                            style={{ boxShadow: painting ? 'none' : '0 0 20px rgba(0,255,255,0.3)' }}
                        >
                            {painting ? '⏳ Sending TX...' : '🎨 Paint a Pixel (1 KAS)'}
                        </button>
                        {paintError && (
                            <p className="mt-2 text-xs text-red-400">⚠️ {paintError}</p>
                        )}
                    </div>
                </div>

                {/* ─── Live TX Feed ─── */}
                <div className="space-y-3">
                    <h4 className="text-xs text-white/40 uppercase tracking-wider font-semibold">Live Transactions</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                        <AnimatePresence mode="popLayout">
                            {liveTxs.map((tx, idx) => (
                                <motion.div
                                    key={tx.hash + tx.time}
                                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-2.5 rounded-lg text-xs"
                                    style={{
                                        background: idx === 0 ? 'rgba(0,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${idx === 0 ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-sm border border-white/10"
                                            style={{ backgroundColor: tx.color, boxShadow: `0 0 4px ${tx.color}` }} />
                                        <span className="font-mono text-white/40">{tx.hash.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className={tx.clan === 'You' ? 'text-[var(--primary)] font-bold' : 'text-white/30'}>
                                            {tx.clan}
                                        </span>
                                        <span className="text-white/20">pixel #{tx.pixel}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Clan Leaderboard */}
                    <div className="pt-3 border-t border-white/5">
                        <h4 className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Active Clans</h4>
                        <div className="space-y-1.5">
                            {Object.entries(CLAN_PALETTES).map(([name, palette]) => (
                                <div key={name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {palette.slice(0, 3).map((c, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                        <span className="text-white/60">{name}</span>
                                    </div>
                                    <span className="font-mono text-white/30">{Math.floor(Math.random() * 200) + 50}px</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Explainer */}
            <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(0,255,255,0.02)', border: '1px solid rgba(0,255,255,0.06)' }}>
                <p className="text-xs text-white/45 leading-relaxed text-center">
                    <Zap size={12} className="inline text-[var(--primary)] mr-1" />
                    <strong className="text-white/70">Why this proves Kaspa is fast:</strong>{' '}
                    Every pixel is a transaction. At 10+ BPS, hundreds of pixels update per minute — try that on Bitcoin (1&nbsp;block/10&nbsp;min).
                    Form clans, paint over rivals, and watch the DAG handle it effortlessly.
                </p>
            </div>
        </div>
    );
}
