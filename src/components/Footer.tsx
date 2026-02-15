'use client';

import { Zap, Database, CreditCard, Gamepad2, FileCheck, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const footerLinks = [
    { href: '/dashboard', label: 'Data Analytics', icon: Database },
    { href: '/commerce', label: 'Payments', icon: CreditCard },
    { href: '/game', label: 'Gaming', icon: Gamepad2 },
    { href: '/anchor', label: 'Data Anchoring', icon: FileCheck },
    { href: '/verify', label: 'Verification', icon: Shield },
];

export function Footer() {
    return (
        <footer className="relative z-10 mt-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                <Zap className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-glow-cyan">KasPulse</h3>
                                <p className="text-[10px] text-white/40">The Super App for Kaspa</p>
                            </div>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed">
                            Experience the world's fastest PoW blockchain through real-time analytics,
                            instant payments, and blockchain-powered gaming.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Ecosystem</h4>
                        <div className="space-y-3">
                            {footerLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-2 text-sm text-white/40 hover:text-[var(--primary)] transition-colors"
                                >
                                    <Icon size={14} />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Resources</h4>
                        <div className="space-y-3">
                            <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-white/40 hover:text-[var(--primary)] transition-colors">
                                <ExternalLink size={14} />
                                Kaspa.org
                            </a>
                            <a href="https://explorer.kaspa.org" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-white/40 hover:text-[var(--primary)] transition-colors">
                                <ExternalLink size={14} />
                                Block Explorer
                            </a>
                            <a href="https://api.kaspa.org" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-white/40 hover:text-[var(--primary)] transition-colors">
                                <ExternalLink size={14} />
                                Kaspa REST API
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="section-divider" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="live-dot" />
                        <span className="text-xs text-white/40">Connected to Kaspa Mainnet</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                    >
                        <Zap size={14} className="text-[var(--primary)]" />
                        <span className="text-xs text-white/50">Built for <span className="text-[var(--primary)] font-semibold">Kaspathon 2026</span></span>
                    </motion.div>

                    <p className="text-xs text-white/30">
                        © 2026 KasPulse. Powered by Kaspa BlockDAG
                    </p>
                </div>
            </div>
        </footer>
    );
}
