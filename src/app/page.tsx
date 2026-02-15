'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CreditCard, Gamepad2, Database, Zap, ArrowRight, Sparkles,
  Shield, Brain, Gauge, Blocks, Tv, Grid3x3, ChevronDown,
  Globe, Cpu, TrendingUp, Timer, Wallet, Award, Users,
  BarChart3, Lock, Radio, MousePointer, Play, Vote, FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getBlueScore, getPrice, getHashrate } from '@/lib/kaspa-api';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DATA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const apps = [
  {
    id: 'data',
    name: 'KasPulse Live',
    tagline: 'Real-Time Network Analytics',
    description: 'Live blockchain stats, interactive 3D DAG visualizer, Sonic DAG audio experience, AI-powered network insights, and block time racing.',
    icon: Database,
    href: '/dashboard',
    color: '#00ffff',
    gradient: ['#00ffff', '#0891b2'],
    track: 'Real-Time Data',
    features: ['Live Stats', '3D DAG Visualizer', 'Sonic DAG', 'Block Time Race', 'AI Insights'],
    preview: '📊',
  },
  {
    id: 'commerce',
    name: 'KasPulse Commerce',
    tagline: 'Payments, Ticketing & IoT',
    description: 'Accept Kaspa payments with QR invoices, run sub-second ticket sales with FlashTix, and demo IoT vending machines.',
    icon: CreditCard,
    href: '/commerce',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
    track: 'Payments & Commerce',
    features: ['QR Invoices', 'Flash Tix', 'Vending Machine', 'Speed Benchmark'],
    preview: '💳',
  },
  {
    id: 'game',
    name: 'KasHunter',
    tagline: 'Blockchain-Powered Arcade',
    description: 'Real blockchain events drive gameplay - catch blocks, dodge forks, pay-to-revive with real KAS, and nuke the board.',
    icon: Gamepad2,
    href: '/game',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
    track: 'Gaming & Interactive',
    features: ['Live Block Events', 'Pay-to-Revive', 'Nuke (1 KAS)', 'Leaderboard'],
    preview: '🎮',
  },
  {
    id: 'kasstream',
    name: 'KasStream',
    tagline: 'Content Creator Platform',
    description: 'Creators publish pay-per-second video content. Viewers pay directly to the creator\'s wallet — no middleman. Shareable links, earnings dashboard, and instant 1s finality.',
    icon: Tv,
    href: '/kasstream',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
    track: 'Streaming Payments',
    features: ['Creator Platform', 'Pay-Per-Second', 'Direct Wallet Pay', 'Shareable Links', 'Earnings Dashboard'],
    preview: '📺',
  },
  {
    id: 'pixelwar',
    name: 'PixelDAG',
    tagline: 'Collaborative Pixel War',
    description: 'A 50×50 collaborative canvas. Each pixel is a 1 KAS transaction. Form clans, paint your mark on the DAG.',
    icon: Grid3x3,
    href: '/pixelwar',
    color: '#e879f9',
    gradient: ['#e879f9', '#c026d3'],
    track: 'Community & Data',
    features: ['Live Grid', 'Clan Wars', 'TX Feed', 'Throughput Proof'],
    preview: '🎨',
  },
  {
    id: 'poll',
    name: 'Pulse Poll',
    tagline: 'On-Chain Governance & Voting',
    description: 'Community votes are real Kaspa transactions. Transparent, immutable, instant results with 1-second finality. Decentralized governance in action.',
    icon: Vote,
    href: '/poll',
    color: '#f97316',
    gradient: ['#f97316', '#ea580c'],
    track: 'Governance',
    features: ['On-Chain Votes', 'Real-Time Results', 'TX-Based Polling', 'Wallet Auth'],
    preview: '🗳️',
  },
  {
    id: 'anchor',
    name: 'Data Anchor',
    tagline: 'Blockchain Proof & Verification',
    description: 'Hash any file or text with SHA-256 and anchor it to Kaspa. On-chain proofs, batch anchoring, Merkle trees, and AI document analysis.',
    icon: FileCheck,
    href: '/anchor',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    track: 'Data Integrity',
    features: ['SHA-256 Hashing', 'On-Chain Proofs', 'Batch Anchoring', 'AI Doc Analysis'],
    preview: '🔏',
  },
];

const statCounters = [
  { label: 'Track Categories', value: 7, suffix: '', color: '#00ffff', icon: Award },
  { label: 'Interactive Modules', value: 15, suffix: '+', color: '#8b5cf6', icon: MousePointer },
  { label: 'Block Time', value: 1, suffix: 's', color: '#10b981', icon: Timer },
  { label: 'AI Modules', value: 4, suffix: '', color: '#f59e0b', icon: Brain },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HERO PARTICLE CANVAS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number; life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 80;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.7 ? 270 : 180, // cyan or purple
        life: Math.random() * 1000,
        maxLife: 800 + Math.random() * 400,
      });
    }

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw floating orb backgrounds
      const orbX1 = canvas.width * 0.3 + Math.sin(time * 0.5) * 100;
      const orbY1 = canvas.height * 0.3 + Math.cos(time * 0.3) * 80;
      const grad1 = ctx.createRadialGradient(orbX1, orbY1, 0, orbX1, orbY1, 350);
      grad1.addColorStop(0, 'rgba(0, 255, 255, 0.06)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orbX2 = canvas.width * 0.7 + Math.cos(time * 0.4) * 120;
      const orbY2 = canvas.height * 0.4 + Math.sin(time * 0.6) * 60;
      const grad2 = ctx.createRadialGradient(orbX2, orbY2, 0, orbX2, orbY2, 300);
      grad2.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
        const alpha = p.opacity * (0.6 + 0.4 * pulse);

        // Particle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * 0.15})`;
        ctx.fill();

        // Particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 60%, ${0.05 * (1 - dist / 160)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.7 }} />;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LIVE STATS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function useLiveStats() {
  const [stats, setStats] = useState({ blueScore: 0, price: 0, hashrate: 0 });
  const [prevBlueScore, setPrevBlueScore] = useState(0);
  const [blockFlash, setBlockFlash] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bs, pr, hr] = await Promise.all([getBlueScore(), getPrice(), getHashrate()]);
        setStats(prev => {
          if (bs.blueScore !== prev.blueScore && prev.blueScore > 0) {
            setBlockFlash(true);
            setTimeout(() => setBlockFlash(false), 300);
          }
          return { blueScore: bs.blueScore, price: pr.price, hashrate: hr.hashrate };
        });
      } catch { }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return { stats, blockFlash };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANIMATED COUNTER
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AnimatedNum({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value === 0 || hasAnimated.current) return;
    hasAnimated.current = true;
    const steps = 50;
    const inc = value / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(cur);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()}{suffix}</>;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function LauncherPage() {
  const { stats, blockFlash } = useLiveStats();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="landing-page">
      <HeroCanvas />

      {/* â•â•â•â•â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
        {/* Hackathon badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lp-badge"
        >
          <span className="lp-badge-dot" />
          <span>Built for Kaspathon 2026</span>
          <Sparkles size={14} className="text-[var(--primary)]" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <h1 className="lp-title">
            <span className="lp-title-kas">Kas</span>
            <span className="lp-title-pulse">Pulse</span>
          </h1>
          <div className="lp-title-glow" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lp-tagline"
        >
          The Super App for{' '}
          <span className="gradient-text font-bold">Kaspa</span>
        </motion.p>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lp-subdesc"
        >
          Real-time analytics &middot; Instant payments &middot; Blockchain gaming &middot; Streaming micropayments &middot; AI insights
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 mt-8 flex-wrap justify-center"
        >
          <Link href="/dashboard" className="lp-btn-primary group">
            <Zap size={18} />
            Launch Dashboard
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/game" className="lp-btn-ghost group">
            <Play size={16} />
            Play KasHunter
          </Link>
        </motion.div>

        {/* ─── Live network strip ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="lp-live-strip"
        >
          <div className="flex items-center gap-2">
            <span className="lp-live-dot" />
            <span className="text-xs font-bold text-cyan-400 tracking-wider">TESTNET LIVE</span>
          </div>

          {stats.blueScore > 0 && (
            <div className={`lp-live-chip ${blockFlash ? 'lp-live-flash' : ''}`}>
              <Blocks size={13} className="text-[var(--primary)]" />
              <span className="lp-live-label">Block</span>
              <span className="lp-live-value text-[var(--primary)]">
                {stats.blueScore.toLocaleString()}
              </span>
            </div>
          )}

          {stats.price > 0 && (
            <div className="lp-live-chip">
              <TrendingUp size={13} className="text-[var(--success)]" />
              <span className="lp-live-label">KAS</span>
              <span className="lp-live-value text-[var(--success)]">
                ${stats.price.toFixed(4)}
              </span>
            </div>
          )}

          {stats.hashrate > 0 && (
            <div className="lp-live-chip">
              <Cpu size={13} className="text-[var(--warning)]" />
              <span className="lp-live-label">Hashrate</span>
              <span className="lp-live-value text-[var(--warning)]">
                {(stats.hashrate / 1000).toFixed(2)} PH/s
              </span>
            </div>
          )}
        </motion.div>

        {/* Scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â• WHAT IT IS â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="lp-what-grid"
        >
          {/* Left — Text */}
          <div className="lp-what-text">
            <span className="lp-section-badge">WHAT IS KASPULSE?</span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mt-3 mb-4">
              Seven modules that prove Kaspa is{' '}
              <span className="gradient-text">production-ready</span>
            </h2>
            <p className="text-white/40 leading-relaxed mb-6">
              KasPulse is not a single dApp &mdash; it&apos;s a full platform spanning real-time data,
              commerce, gaming, streaming, and community. Every user action triggers a real
              Kaspa testnet transaction. No mocks. No simulations.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="lp-pill"><Lock size={14} /> Real Testnet TX</div>
              <div className="lp-pill"><Wallet size={14} /> Kasware / KaspaWallet</div>
              <div className="lp-pill"><Brain size={14} /> AI Analysis</div>
              <div className="lp-pill"><Radio size={14} /> Live WebSocket Data</div>
            </div>
          </div>

          {/* Right — Stats counters */}
          <div className="lp-what-stats">
            {statCounters.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="lp-stat-card"
              >
                <div className="lp-stat-icon" style={{ background: `${s.color}12` }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div className="lp-stat-number" style={{ color: s.color }}>
                  <AnimatedNum value={s.value} suffix={s.suffix} />
                </div>
                <div className="lp-stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ——————————— APP SHOWCASE ——————————— */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12" id="apps">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="lp-section-badge">THE PLATFORM</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-3">
            Seven Apps. <span className="gradient-text">One Vision.</span>
          </h2>
          <p className="text-white/35 max-w-lg mx-auto text-sm">
            Each module is a fully functional dApp powered by real Kaspa transactions.
          </p>
        </motion.div>

        {/* App cards */}
        <div className="lp-apps-grid">
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 }}
              className={`lp-app-card ${i === 0 ? 'lp-app-card-hero' : ''}`}
              style={{ '--ac': app.color, '--ac2': app.gradient[1] } as React.CSSProperties}
            >
              <Link href={app.href} className="lp-app-inner group">
                {/* Gradient corner glow */}
                <div className="lp-app-glow" />

                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="lp-app-icon" style={{ background: `${app.color}15` }}>
                    <app.icon size={24} style={{ color: app.color }} />
                  </div>
                  <span className="lp-app-track" style={{ color: app.color, background: `${app.color}10`, borderColor: `${app.color}20` }}>
                    {app.track}
                  </span>
                </div>

                {/* Preview emoji */}
                <div className="text-3xl mb-3 opacity-80">{app.preview}</div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-1" style={{ color: app.color }}>
                  {app.name}
                </h3>
                <p className="text-sm text-white/55 font-medium mb-2">{app.tagline}</p>
                <p className="text-xs text-white/30 leading-relaxed mb-4">{app.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                  {app.features.map(f => (
                    <span key={f} className="lp-feature-chip">{f}</span>
                  ))}
                </div>

                {/* Launch CTA */}
                <div className="lp-app-cta" style={{ color: app.color }}>
                  <span>Launch</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ——————————— WHY KASPULSE ——————————— */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-16">
        <div className="section-divider mb-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="lp-section-badge">WHY KASPULSE</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-3">
            Three Pillars of <span className="gradient-text">Innovation</span>
          </h2>
        </motion.div>

        <div className="lp-pillars">
          {[
            {
              icon: Gauge, title: 'Unmatched Speed', color: '#00ffff',
              desc: '1 block per second — 600x faster than Bitcoin. Every transaction, vote, and pixel confirms in real-time on Kaspa\'s BlockDAG.',
              stat: '1s', statLabel: 'Block Time', extra: '32 blocks/sec theoretical max'
            },
            {
              icon: Shield, title: 'Cryptographic Proofs', color: '#10b981',
              desc: 'Anchor documents, votes, and events on-chain with SHA-256 hashes and Merkle proofs. Verifiable forever.',
              stat: 'SHA-256', statLabel: 'Hash Standard', extra: 'On-chain anchoring included'
            },
            {
              icon: Brain, title: 'AI-Powered Analysis', color: '#8b5cf6',
              desc: 'GPT-4o analyzes network patterns, document integrity, DAG architecture, and even provides live game commentary.',
              stat: 'GPT-4o', statLabel: 'AI Engine', extra: '4 AI modules integrated'
            },
          ].map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="lp-pillar"
            >
              <div className="lp-pillar-icon" style={{ background: `${p.color}10` }}>
                <p.icon size={28} style={{ color: p.color }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: p.color }}>{p.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{p.desc}</p>

              <div className="lp-pillar-stat">
                <span className="lp-pillar-stat-val" style={{ color: p.color }}>{p.stat}</span>
                <span className="lp-pillar-stat-label">{p.statLabel}</span>
              </div>
              <p className="text-[10px] text-white/20 mt-2">{p.extra}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â• TECH STACK STRIP â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="lp-tech-strip"
        >
          {[
            { label: 'Next.js 15', sub: 'Framework' },
            { label: 'Kaspa Testnet', sub: 'Network' },
            { label: 'Framer Motion', sub: 'Animations' },
            { label: 'Three.js', sub: '3D Rendering' },
            { label: 'OpenAI GPT-4o', sub: 'AI Engine' },
            { label: 'Kasware', sub: 'Wallet' },
          ].map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="lp-tech-chip"
            >
              <span className="text-xs font-bold text-white/70">{t.label}</span>
              <span className="text-[10px] text-white/30">{t.sub}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>


    </div>
  );
}
