'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { Activity, FileCheck, Shield, Zap, Home, CreditCard, Gamepad2, Blocks, Tv, Grid3x3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getBlueScore } from '@/lib/kaspa-api';

const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Data', icon: Activity },
    { href: '/commerce', label: 'Pay', icon: CreditCard },
    { href: '/game', label: 'Play', icon: Gamepad2 },
    { href: '/kasstream', label: 'Stream', icon: Tv },
    { href: '/pixelwar', label: 'Pixels', icon: Grid3x3 },
    { href: '/anchor', label: 'Anchor', icon: FileCheck },
    { href: '/verify', label: 'Verify', icon: Shield },
];

export function Header() {
    const pathname = usePathname();
    const [blueScore, setBlueScore] = useState<number | null>(null);
    const [tick, setTick] = useState(false);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const data = await getBlueScore();
                setBlueScore(data.blueScore);
                setTick(true);
                setTimeout(() => setTick(false), 300);
            } catch { }
        };
        fetchScore();
        const interval = setInterval(fetchScore, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="fixed top-8 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl" style={{ borderBottom: '1px solid rgba(0, 255, 255, 0.06)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center"
                        >
                            <Zap className="w-6 h-6 text-black" />
                        </motion.div>
                        <div>
                            <h1 className="text-xl font-bold text-glow-cyan">KasPulse</h1>
                            <p className="text-[10px] text-white/40 -mt-1">The Super App for Kaspa</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${isActive
                                        ? 'text-[var(--primary)]'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-medium">{label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg -z-10"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Block Height + Wallet */}
                    <div className="flex items-center gap-3">
                        {blueScore !== null && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                            >
                                <Blocks size={14} className="text-[var(--primary)]" />
                                <span className="text-xs text-white/40">Block</span>
                                <span className={`text-sm font-mono font-bold text-[var(--primary)] transition-transform ${tick ? 'scale-110' : 'scale-100'}`}>
                                    {blueScore.toLocaleString()}
                                </span>
                            </motion.div>
                        )}
                        <WalletButton />
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-white/5">
                <nav className="flex justify-around py-2">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive ? 'text-[var(--primary)]' : 'text-white/50'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="text-xs">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Gradient bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
        </header>
    );
}
