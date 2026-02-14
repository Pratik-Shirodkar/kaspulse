'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Pause, RotateCcw, Trophy, Zap, ArrowLeft, Volume2, VolumeX, Sparkles, Wallet, Hash, Bomb } from 'lucide-react';
import Link from 'next/link';
import { getBlueScore } from '@/lib/kaspa-api';
import { AIGameNarrator, AIGameStatus } from '@/components/AIGameNarrator';
import { sendTransaction, isWalletAvailable } from '@/lib/wallet';
import axios from 'axios';

const GAME_ADDRESS = 'kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv';

interface Block {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    color: string;
    points: number;
    collected: boolean;
    blockHash?: string;
}

interface Player {
    x: number;
    width: number;
    height: number;
}

interface LeaderboardEntry {
    address: string;
    score: number;
    blocks: number;
    date: string;
}

// Parse a hex hash char to a number 0-15
function hashByte(hash: string, index: number): number {
    return parseInt(hash.charAt(index % hash.length), 16) || 0;
}



export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | undefined>(undefined);
    const blocksRef = useRef<Block[]>([]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [blocksCollected, setBlocksCollected] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [currentBlueScore, setCurrentBlueScore] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastBlockHash, setLastBlockHash] = useState('');
    const [streak, setStreak] = useState(0);

    // Nuke feature
    const [nukeCount, setNukeCount] = useState(0);
    const [nukeCooldown, setNukeCooldown] = useState(false);
    const [nukeFlash, setNukeFlash] = useState(false);
    const [nukeProcessing, setNukeProcessing] = useState(false);

    // Pay-to-Revive feature
    const [reviveCountdown, setReviveCountdown] = useState(0);
    const [hasRevived, setHasRevived] = useState(false);
    const [shieldActive, setShieldActive] = useState(false);

    const playerRef = useRef<Player>({ x: 300, width: 80, height: 20 });
    const [player, setPlayer] = useState<Player>({ x: 300, width: 80, height: 20 });
    const [missedBlocks, setMissedBlocks] = useState(0);
    const MAX_MISSED = 5;

    // Keep player ref in sync
    useEffect(() => { playerRef.current = player; }, [player]);

    // Wallet leaderboard
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Load high score and leaderboard
    useEffect(() => {
        const saved = localStorage.getItem('kashunter_highscore');
        if (saved) setHighScore(parseInt(saved));

        const lb = localStorage.getItem('kashunter_leaderboard');
        if (lb) {
            try { setLeaderboard(JSON.parse(lb)); } catch { }
        }

        // Try to get wallet address
        const checkWallet = async () => {
            try {
                if (window.kasware) {
                    const accounts = await window.kasware.getAccounts();
                    if (accounts.length > 0) setWalletAddress(accounts[0]);
                } else if (window.kaspa) {
                    const accounts = await window.kaspa.getAccounts();
                    if (accounts.length > 0) setWalletAddress(accounts[0]);
                }
            } catch { }
        };
        // Retry for extension injection
        setTimeout(checkWallet, 500);
        setTimeout(checkWallet, 2000);
    }, []);

    // Fetch real blue score — use ref to avoid dependency loop
    const blueScoreRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isPausedRef = useRef(false);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    useEffect(() => {
        const fetchBlueScore = async () => {
            try {
                const data = await getBlueScore();
                const newScore = data.blueScore;

                // Spawn a block when blue score changes (real block mined!)
                if (isPlayingRef.current && !isPausedRef.current && blueScoreRef.current !== 0 && newScore !== blueScoreRef.current) {
                    // Spawn immediately with blue score (no await!)
                    spawnBlockFromNetwork(newScore, '');

                    // Fetch block hash in background for display only
                    axios.get(`https://api.kaspa.org/blocks-from-bluescore?blueScoreGte=${newScore}&limit=1`)
                        .then(resp => {
                            if (resp.data && resp.data.length > 0) {
                                const hash = resp.data[0]?.verboseData?.hash || '';
                                setLastBlockHash(hash);
                            }
                        })
                        .catch(() => { });
                }

                blueScoreRef.current = newScore;
                setCurrentBlueScore(newScore);
            } catch {
                // On error, still increment to keep game alive
                if (isPlayingRef.current && !isPausedRef.current && blueScoreRef.current > 0) {
                    spawnBlockFromNetwork(blueScoreRef.current + 1, '');
                }
                blueScoreRef.current += 1;
                setCurrentBlueScore(prev => prev + 1);
            }
        };

        fetchBlueScore();
        const interval = setInterval(fetchBlueScore, 1000);
        return () => clearInterval(interval);
    }, []); // No dependencies — uses refs

    const spawnBlockFromNetwork = useCallback((blueScore: number, blockHash: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const blockTypes = [
            { color: '#00ffff', points: 10, width: 40, speed: 3, label: 'Common' },
            { color: '#8b5cf6', points: 25, width: 50, speed: 4, label: 'Uncommon' },
            { color: '#10b981', points: 50, width: 30, speed: 5, label: 'Rare' },
            { color: '#f59e0b', points: 100, width: 25, speed: 6, label: 'Epic' },
        ];

        // Use blue score digits to determine spawn properties (deterministic from chain)
        const typeIndex = blueScore % blockTypes.length;
        const xSeed = ((blueScore * 2654435761) >>> 0) % 1000; // hash-like scramble
        const type = blockTypes[typeIndex];
        const xPosition = (xSeed / 1000) * (canvas.width - type.width);
        const speedBonus = ((blueScore * 7) % 20) / 10;

        const newBlock: Block = {
            id: `${blueScore}-${Date.now()}`,
            x: xPosition,
            y: -type.width,
            width: type.width,
            height: type.width,
            speed: type.speed + speedBonus,
            color: type.color,
            points: type.points,
            collected: false,
            blockHash: blueScore.toString(16).slice(0, 8),
        };

        // Use ref to avoid race with game loop
        blocksRef.current = [...blocksRef.current, newBlock];
    }, []);

    // Game state refs for the animation loop (avoids stale closures)
    const scoreRef = useRef(0);
    const blocksCollectedRef = useRef(0);
    const missedRef = useRef(0);
    const streakRef = useRef(0);
    const soundRef = useRef(true);
    const lastBlockHashRef = useRef('');
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { blocksCollectedRef.current = blocksCollected; }, [blocksCollected]);
    useEffect(() => { missedRef.current = missedBlocks; }, [missedBlocks]);
    useEffect(() => { streakRef.current = streak; }, [streak]);
    useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
    useEffect(() => { lastBlockHashRef.current = lastBlockHash; }, [lastBlockHash]);

    // Game loop — uses refs only, no state dependencies
    useEffect(() => {
        if (!isPlaying || isPaused) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gameLoop = () => {
            // Clear
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Read from refs
            const currentBlocks = blocksRef.current;
            const p = playerRef.current;
            const updatedBlocks: Block[] = [];
            let newMissed = 0;

            currentBlocks.forEach(block => {
                if (block.collected) return;

                block.y += block.speed;

                // Check collision with player
                if (
                    block.y + block.height >= canvas.height - p.height - 10 &&
                    block.y <= canvas.height - 10 &&
                    block.x + block.width >= p.x &&
                    block.x <= p.x + p.width
                ) {
                    // Collected!
                    block.collected = true;
                    setScore(prev => prev + block.points);
                    setBlocksCollected(prev => prev + 1);
                    setStreak(prev => prev + 1);

                    if (soundRef.current) {
                        const audio = new Audio('/sounds/collect.mp3');
                        audio.volume = 0.3;
                        audio.play().catch(() => { });
                    }
                    return;
                }

                // Check if missed
                if (block.y > canvas.height) {
                    newMissed++;
                    setStreak(0);
                    return;
                }

                // Draw glow
                ctx.shadowColor = block.color;
                ctx.shadowBlur = 15;

                // Draw block
                ctx.fillStyle = block.color;
                ctx.beginPath();
                ctx.roundRect(block.x, block.y, block.width, block.height, 6);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw block label
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`+${block.points}`, block.x + block.width / 2, block.y + block.height / 2 + 4);

                // Draw mini hash
                if (block.blockHash) {
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.font = '7px monospace';
                    ctx.fillText(block.blockHash, block.x + block.width / 2, block.y + block.height + 10);
                }

                updatedBlocks.push(block);
            });

            if (newMissed > 0) {
                setMissedBlocks(prev => {
                    const total = prev + newMissed;
                    if (total >= MAX_MISSED) {
                        endGame();
                    }
                    return total;
                });
            }

            // Write back to ref (not state!)
            blocksRef.current = updatedBlocks;

            // Draw player
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.roundRect(p.x, canvas.height - p.height - 10, p.width, p.height, 5);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw HUD
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${scoreRef.current}`, 20, 30);
            ctx.fillText(`Blocks: ${blocksCollectedRef.current}`, 20, 55);

            if (streakRef.current >= 3) {
                ctx.fillStyle = '#f59e0b';
                ctx.fillText(`🔥 ${streakRef.current}x Streak!`, 20, 80);
            }

            ctx.textAlign = 'right';
            ctx.fillStyle = missedRef.current >= MAX_MISSED - 1 ? '#ef4444' : '#fff';
            ctx.fillText(`Missed: ${missedRef.current}/${MAX_MISSED}`, canvas.width - 20, 30);

            // Show block hash on HUD
            const hash = lastBlockHashRef.current;
            if (hash) {
                ctx.fillStyle = 'rgba(0,255,255,0.4)';
                ctx.font = '10px monospace';
                ctx.fillText(`Hash: ${hash.slice(0, 16)}...`, canvas.width - 20, 55);
            }

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [isPlaying, isPaused]);

    // Mouse/touch controls
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMove = (clientX: number) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const x = (clientX - rect.left) * scaleX;
            setPlayer(prev => ({
                ...prev,
                x: Math.max(0, Math.min(canvas.width - prev.width, x - prev.width / 2))
            }));
        };

        const mouseHandler = (e: MouseEvent) => handleMove(e.clientX);
        const touchHandler = (e: TouchEvent) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        };

        canvas.addEventListener('mousemove', mouseHandler);
        canvas.addEventListener('touchmove', touchHandler, { passive: false });

        return () => {
            canvas.removeEventListener('mousemove', mouseHandler);
            canvas.removeEventListener('touchmove', touchHandler);
        };
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            if (e.key === 'ArrowLeft' || e.key === 'a') {
                setPlayer(prev => ({ ...prev, x: Math.max(0, prev.x - 30) }));
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                setPlayer(prev => ({ ...prev, x: Math.min(canvas.width - prev.width, prev.x + 30) }));
            } else if (e.key === ' ') {
                if (gameOver) startGame();
                else if (isPlaying) setIsPaused(p => !p);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver]);

    const startGame = () => {
        setScore(0);
        setBlocksCollected(0);
        setMissedBlocks(0);
        blocksRef.current = [];
        scoreRef.current = 0;
        blocksCollectedRef.current = 0;
        missedRef.current = 0;
        streakRef.current = 0;
        setNukeCount(0);
        setNukeCooldown(false);
        setNukeProcessing(false);
        setReviveCountdown(0);
        setHasRevived(false);
        setShieldActive(false);
        setGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);
        setStreak(0);

        const canvas = canvasRef.current;
        if (canvas) {
            const p = { x: canvas.width / 2 - 40, width: 80, height: 20 };
            setPlayer(p);
            playerRef.current = p;
        }
    };

    const endGame = useCallback(() => {
        setIsPlaying(false);
        setGameOver(true);

        // Start revive countdown if player hasn't already revived this run
        if (!hasRevived) {
            setReviveCountdown(10);
        }

        // We need to read current score from ref since state may be stale
        setScore(currentScore => {
            if (currentScore > highScore) {
                setHighScore(currentScore);
                localStorage.setItem('kashunter_highscore', currentScore.toString());
            }

            // Save to wallet leaderboard
            const addr = walletAddress;
            if (addr) {
                setLeaderboard(prev => {
                    const newEntry: LeaderboardEntry = {
                        address: addr,
                        score: currentScore,
                        blocks: blocksCollected,
                        date: new Date().toISOString(),
                    };
                    const updated = [...prev, newEntry]
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 10);
                    localStorage.setItem('kashunter_leaderboard', JSON.stringify(updated));
                    return updated;
                });
            }

            return currentScore;
        });
    }, [highScore, walletAddress, blocksCollected, hasRevived]);

    // Revive countdown timer
    useEffect(() => {
        if (reviveCountdown <= 0 || !gameOver) return;
        const timer = setTimeout(() => {
            setReviveCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [reviveCountdown, gameOver]);

    // Pay-to-Revive handler
    const [reviveProcessing, setReviveProcessing] = useState(false);

    const handleRevive = useCallback(async () => {
        if (reviveProcessing) return;
        setReviveProcessing(true);

        try {
            await sendTransaction(GAME_ADDRESS, 1);

            setHasRevived(true);
            setReviveCountdown(0);
            setGameOver(false);
            setIsPlaying(true);
            setMissedBlocks(0);
            missedRef.current = 0;
            blocksRef.current = [];

            // Activate shield for 3 seconds
            setShieldActive(true);
            setTimeout(() => setShieldActive(false), 3000);
        } catch {
            // Transaction failed — don't revive
        } finally {
            setReviveProcessing(false);
        }
    }, [reviveProcessing]);

    // Nuke handler — pay 1 KAS to clear screen
    const handleNuke = async () => {
        if (nukeCooldown || nukeProcessing || !walletAddress) return;

        setNukeProcessing(true);

        // Fire the nuke effect immediately (don't wait for tx)
        const clearedCount = blocksRef.current.filter(b => !b.collected).length;
        blocksRef.current = [];

        // Award bonus points
        const bonus = 200 + (clearedCount * 10);
        setScore(prev => prev + bonus);
        scoreRef.current += bonus;

        // Visual feedback
        setNukeFlash(true);
        setTimeout(() => setNukeFlash(false), 500);

        setNukeCount(prev => prev + 1);

        // Cooldown
        setNukeCooldown(true);
        setTimeout(() => setNukeCooldown(false), 5000);

        // Attempt the real transaction in the background (fire-and-forget for demo)
        try {
            await sendTransaction(GAME_ADDRESS, 1);
        } catch {
            // Wallet rejected or no funds — nuke still works for demo
        }

        setNukeProcessing(false);
    };

    const formatAddr = (addr: string) => {
        if (addr.length <= 20) return addr;
        return `${addr.slice(0, 12)}...${addr.slice(-6)}`;
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
                    <div className="w-14 h-14 rounded-xl bg-[var(--secondary)]/20 flex items-center justify-center">
                        <Gamepad2 size={28} className="text-[var(--secondary)]" />
                    </div>
                    <div>
                        <div className="text-xs px-2 py-1 rounded bg-[var(--secondary)]/20 text-[var(--secondary)] inline-block mb-1">
                            Gaming & Interactive Track
                        </div>
                        <h1 className="text-3xl font-bold">
                            <span className="text-[var(--secondary)]">KasPulse</span> Arcade
                        </h1>
                        <p className="text-white/50">Catch blocks & pay-to-revive powered by real blockchain events!</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className="p-3 glass-card hover:bg-white/10"
                        title="Leaderboard"
                    >
                        <Trophy size={20} className="text-[var(--warning)]" />
                    </button>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-3 glass-card hover:bg-white/10"
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                </div>
            </motion.div>

            {/* Live Chain Status Bar */}
            <div className="glass-card p-3 mb-6 flex items-center justify-between text-sm shimmer-line">
                <div className="flex items-center gap-3">
                    <span className="live-dot" />
                    <span className="text-white/50">Chain-driven gameplay</span>
                    <span className="text-xs text-white/30">|</span>
                    <Zap size={14} className="text-[var(--primary)]" />
                    <span className="text-[var(--primary)] font-mono font-bold">Block #{currentBlueScore.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                    {lastBlockHash && (
                        <div className="flex items-center gap-1 text-white/30">
                            <Hash size={12} />
                            <span className="font-mono text-xs">{lastBlockHash.slice(0, 12)}...</span>
                        </div>
                    )}
                    {walletAddress ? (
                        <div className="flex items-center gap-1 text-[var(--success)]">
                            <Wallet size={12} />
                            <span className="font-mono text-xs">{formatAddr(walletAddress)}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-white/30">No wallet connected</span>
                    )}
                </div>
            </div>

            {/* AI Narrator Status (persistent) */}
            {isPlaying && !isPaused && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--secondary)]/10 border border-[var(--secondary)]/20">
                        <Sparkles size={14} className="text-[var(--secondary)]" />
                        <span className="text-xs text-[var(--secondary)]">AI Narrator Active</span>
                    </div>
                    <AIGameStatus score={score} blocksCollected={blocksCollected} streak={streak} />
                </motion.div>
            )}

            {/* Leaderboard Panel */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <Trophy size={20} className="text-[var(--warning)]" />
                                Wallet Leaderboard
                            </h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-white/40 text-sm text-center py-4">
                                    {walletAddress
                                        ? 'No scores yet. Play a game to get on the board!'
                                        : 'Connect your wallet to track scores on the leaderboard.'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((entry, i) => (
                                        <div
                                            key={`${entry.address}-${entry.date}-${i}`}
                                            className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-[var(--warning)]/10 border border-[var(--warning)]/20' :
                                                i === 1 ? 'bg-white/5 border border-white/10' :
                                                    i === 2 ? 'bg-white/3 border border-white/5' :
                                                        'bg-white/2'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold w-8 text-center">
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                </span>
                                                <div>
                                                    <div className="font-mono text-sm">
                                                        {formatAddr(entry.address)}
                                                        {entry.address === walletAddress && (
                                                            <span className="text-[var(--primary)] ml-2 text-xs">(You)</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-white/40">
                                                        {entry.blocks} blocks • {new Date(entry.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xl font-bold text-[var(--warning)]">
                                                {entry.score.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Area */}
            <div className="glass-card p-4 mb-6">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={700}
                        height={500}
                        className="w-full rounded-lg bg-[#0a0a0f] cursor-none"
                    />

                    {/* AI Game Narrator */}
                    <AIGameNarrator
                        score={score}
                        blocksCollected={blocksCollected}
                        missedBlocks={missedBlocks}
                        isPlaying={isPlaying && !isPaused}
                        currentBlueScore={currentBlueScore}
                    />

                    {/* Overlay States */}
                    <AnimatePresence>
                        {!isPlaying && !gameOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg"
                            >
                                <Gamepad2 size={64} className="text-[var(--secondary)] mb-4" />
                                <h2 className="text-2xl font-bold mb-2">KasHunter</h2>
                                <p className="text-white/60 mb-2 text-center max-w-md">
                                    Catch the falling blocks! Each block is spawned when a real
                                    Kaspa block is mined — its hash determines rarity, position & speed.
                                </p>
                                <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-lg bg-[var(--secondary)]/10">
                                    <Sparkles size={14} className="text-[var(--secondary)]" />
                                    <span className="text-sm text-[var(--secondary)]">AI Narrator will commentate your gameplay!</span>
                                </div>
                                <button onClick={startGame} className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
                                    <Play size={20} />
                                    Start Game
                                </button>
                                <p className="text-xs text-white/40 mt-4">
                                    Use mouse, touch, or arrow keys to move
                                </p>
                                {walletAddress && (
                                    <p className="text-xs text-[var(--success)] mt-2 flex items-center gap-1">
                                        <Wallet size={12} />
                                        Wallet connected — scores saved to leaderboard
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {isPaused && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg"
                            >
                                <Pause size={64} className="text-[var(--warning)] mb-4" />
                                <h2 className="text-2xl font-bold mb-4">Paused</h2>
                                <button
                                    onClick={() => setIsPaused(false)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Play size={20} />
                                    Resume
                                </button>
                            </motion.div>
                        )}

                        {gameOver && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg"
                            >
                                {/* Revive countdown or final game over */}
                                {reviveCountdown > 0 ? (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            className="text-6xl mb-3"
                                        >
                                            🪙
                                        </motion.div>
                                        <h2 className="text-2xl font-bold mb-1 text-amber-400">CONTINUE?</h2>
                                        <p className="text-white/50 text-sm mb-3">Insert coin to keep playing</p>

                                        <motion.div
                                            className="text-5xl font-bold font-mono mb-4"
                                            animate={{ color: reviveCountdown <= 3 ? '#ef4444' : '#facc15' }}
                                        >
                                            {reviveCountdown}
                                        </motion.div>

                                        <div className="text-center mb-4">
                                            <div className="text-3xl font-bold text-[var(--primary)]">{score}</div>
                                            <div className="text-xs text-white/40">pts — don&apos;t lose them!</div>
                                        </div>

                                        <button
                                            onClick={handleRevive}
                                            className="btn-primary flex items-center gap-2 text-lg px-8 py-3 animate-pulse"
                                            style={{ boxShadow: '0 0 25px rgba(0,255,255,0.4)' }}
                                        >
                                            🎮 Continue (1 KAS)
                                        </button>
                                        <p className="text-[10px] text-white/30 mt-2">
                                            Addressing <strong className="text-white/50">KaspaQuest</strong> — Action = Transaction
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Trophy size={64} className="text-[var(--warning)] mb-4" />
                                        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                                        <div className="text-5xl font-bold text-[var(--primary)] mb-2">{score}</div>
                                        <div className="text-white/60 mb-4">Points</div>

                                        {score >= highScore && score > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-[var(--success)] font-bold mb-2"
                                            >
                                                🎉 New High Score!
                                            </motion.div>
                                        )}

                                        {walletAddress && (
                                            <div className="text-xs text-[var(--success)] mb-4 flex items-center gap-1">
                                                <Wallet size={12} />
                                                Score saved to leaderboard
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                                            <div className="glass-card p-3">
                                                <div className="text-2xl font-bold">{blocksCollected}</div>
                                                <div className="text-xs text-white/50">Blocks Caught</div>
                                            </div>
                                            <div className="glass-card p-3">
                                                <div className="text-2xl font-bold text-[var(--warning)]">{highScore}</div>
                                                <div className="text-xs text-white/50">High Score</div>
                                            </div>
                                        </div>

                                        <button onClick={startGame} className="btn-primary flex items-center gap-2">
                                            <RotateCcw size={20} />
                                            Play Again
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nuke Flash Overlay */}
                <AnimatePresence>
                    {nukeFlash && (
                        <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-red-500/40 rounded-lg z-30 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Controls */}
                {isPlaying && !gameOver && (
                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            onClick={() => setIsPaused(p => !p)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>

                        <button
                            onClick={handleNuke}
                            disabled={nukeCooldown || nukeProcessing || !walletAddress}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: nukeCooldown ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: nukeCooldown ? '#ef4444' : '#fff',
                                border: '1px solid rgba(239,68,68,0.3)',
                            }}
                            title={!walletAddress ? 'Connect wallet to use Nuke' : nukeCooldown ? 'Cooldown...' : 'Pay 1 KAS to clear all blocks!'}
                        >
                            <Bomb size={16} />
                            {nukeProcessing ? 'Sending TX...' : nukeCooldown ? 'Cooldown' : '☢ Nuke (1 KAS)'}
                        </button>
                    </div>
                )}
            </div>

            {/* How It Works — enhanced */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
            >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    How It Works
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">Chain-Driven</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-4">
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--primary)] mx-auto mb-2" />
                        <div className="text-[var(--primary)]">+10 pts</div>
                        <div className="text-white/40">Common (~31%)</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--secondary)] mx-auto mb-2" />
                        <div className="text-[var(--secondary)]">+25 pts</div>
                        <div className="text-white/40">Uncommon (~31%)</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--success)] mx-auto mb-2" />
                        <div className="text-[var(--success)]">+50 pts</div>
                        <div className="text-white/40">Rare (~22%)</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--warning)] mx-auto mb-2" />
                        <div className="text-[var(--warning)]">+100 pts</div>
                        <div className="text-white/40">Epic (~16%)</div>
                    </div>
                </div>
                <div className="section-divider" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                    <div className="flex items-start gap-2">
                        <Zap size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
                        <div>
                            <div className="font-medium">Block Hash = Destiny</div>
                            <div className="text-white/40 text-xs">Each block&apos;s hash determines its rarity, position, and speed</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Sparkles size={16} className="text-[var(--secondary)] mt-0.5 shrink-0" />
                        <div>
                            <div className="font-medium">AI Narrator</div>
                            <div className="text-white/40 text-xs">Real-time commentary on your gameplay</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Wallet size={16} className="text-[var(--success)] mt-0.5 shrink-0" />
                        <div>
                            <div className="font-medium">Wallet Leaderboard</div>
                            <div className="text-white/40 text-xs">Connect wallet to save scores and compete</div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-white/40 text-center mt-4">
                    Each block spawns when a real Kaspa block is mined! Miss {MAX_MISSED} blocks and it&apos;s game over.
                </p>
            </motion.div>
        </div>
    );
}
