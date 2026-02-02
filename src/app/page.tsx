'use client';

import { motion } from 'framer-motion';
import { Activity, CreditCard, Gamepad2, Database, Zap, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const apps = [
  {
    id: 'data',
    name: 'KasPulse Data',
    tagline: 'Real-Time Network Analytics',
    description: 'Live blockchain stats, DAG visualization, data anchoring with Merkle proofs',
    icon: Database,
    href: '/dashboard',
    color: '#00ffff',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    track: 'Real-Time Data Track',
    features: ['Live Stats', 'DAG Visualizer', 'Data Anchoring', 'Batch Proofs']
  },
  {
    id: 'commerce',
    name: 'KasPoint',
    tagline: 'Instant Payment Terminal',
    description: 'Accept Kaspa payments with sub-second confirmations. Perfect for merchants.',
    icon: CreditCard,
    href: '/commerce',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-green-500/20',
    track: 'Payments & Commerce Track',
    features: ['QR Invoices', 'Instant Detection', 'Receipt Generation', 'Payment History']
  },
  {
    id: 'game',
    name: 'KasHunter',
    tagline: 'Blockchain-Powered Arcade',
    description: 'An interactive game where real blockchain events drive the gameplay.',
    icon: Gamepad2,
    href: '/game',
    color: '#8b5cf6',
    gradient: 'from-purple-500/20 to-pink-500/20',
    track: 'Gaming & Interactive Track',
    features: ['Live Block Events', 'Real-Time Action', 'Leaderboard', 'Wallet Scores']
  }
];

export default function LauncherPage() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 md:py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
        >
          <Sparkles size={16} className="text-[var(--primary)]" />
          <span className="text-sm">Built for Kaspathon 2026</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-glow-cyan">Kas</span>
          <span className="text-glow-purple">Pulse</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-4">
          The <span className="text-[var(--primary)]">Super App</span> for Kaspa
        </p>

        <p className="text-white/40 max-w-2xl mx-auto">
          Experience the world's fastest PoW blockchain through real-time analytics,
          instant payments, and blockchain-powered gaming.
        </p>

        {/* Live Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <span className="live-dot" />
          <span className="text-sm text-white/50">Connected to Kaspa Mainnet</span>
          <span className="flex items-center gap-1 text-[var(--primary)] text-sm">
            <Zap size={14} />
            1 block/second
          </span>
        </motion.div>
      </motion.div>

      {/* App Cards */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
            >
              <Link href={app.href} className="block group">
                <div
                  className={`glass-card p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:border-opacity-50 relative overflow-hidden`}
                  style={{ borderColor: app.color }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${app.color}20` }}
                    >
                      <app.icon size={28} style={{ color: app.color }} />
                    </div>

                    {/* Track Badge */}
                    <div
                      className="inline-block px-2 py-1 rounded text-xs font-medium mb-3"
                      style={{ backgroundColor: `${app.color}20`, color: app.color }}
                    >
                      {app.track}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-1" style={{ color: app.color }}>
                      {app.name}
                    </h2>
                    <p className="text-white/70 font-medium mb-3">{app.tagline}</p>
                    <p className="text-sm text-white/50 mb-4">{app.description}</p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {app.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded bg-white/5 text-white/60"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div
                      className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
                      style={{ color: app.color }}
                    >
                      Launch App
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 glass-card p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[var(--primary)]">3</div>
              <div className="text-sm text-white/50">Track Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--secondary)]">1s</div>
              <div className="text-sm text-white/50">Block Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--success)]">10+</div>
              <div className="text-sm text-white/50">Components</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--warning)]">∞</div>
              <div className="text-sm text-white/50">Possibilities</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
