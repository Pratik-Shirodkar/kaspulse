'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Pause, RotateCcw, Trophy, Zap, ArrowLeft, Volume2, VolumeX, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getBlueScore } from '@/lib/kaspa-api';
import { AIGameNarrator, AIGameStatus } from '@/components/AIGameNarrator';

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
}

interface Player {
    x: number;
    width: number;
    height: number;
}

export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | undefined>(undefined);
    const lastBlockTimeRef = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [blocksCollected, setBlocksCollected] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [currentBlueScore, setCurrentBlueScore] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [player, setPlayer] = useState<Player>({ x: 300, width: 80, height: 20 });
    const [missedBlocks, setMissedBlocks] = useState(0);
    const MAX_MISSED = 5;

    // Load high score
    useEffect(() => {
        const saved = localStorage.getItem('kashunter_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    // Fetch real blue score for spawning blocks
    useEffect(() => {
        const fetchBlueScore = async () => {
            try {
                const data = await getBlueScore();
                const newScore = data.blueScore;

                // Spawn a block when blue score changes (real block mined!)
                if (isPlaying && !isPaused && currentBlueScore !== 0 && newScore !== currentBlueScore) {
                    spawnBlockFromNetwork(newScore);
                }

                setCurrentBlueScore(newScore);
            } catch {
                setCurrentBlueScore(prev => prev + 1);
            }
        };

        fetchBlueScore();
        const interval = setInterval(fetchBlueScore, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, isPaused, currentBlueScore]);

    const spawnBlockFromNetwork = useCallback((blueScore: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const blockTypes = [
            { color: '#00ffff', points: 10, width: 40, speed: 3 },
            { color: '#8b5cf6', points: 25, width: 50, speed: 4 },
            { color: '#10b981', points: 50, width: 30, speed: 5 },
            { color: '#f59e0b', points: 100, width: 25, speed: 6 },
        ];

        // Use blue score to determine block type
        const typeIndex = blueScore % blockTypes.length;
        const type = blockTypes[typeIndex];

        const newBlock: Block = {
            id: `${blueScore}-${Date.now()}`,
            x: Math.random() * (canvas.width - type.width),
            y: -type.width,
            width: type.width,
            height: type.width,
            speed: type.speed + Math.random() * 2,
            color: type.color,
            points: type.points,
            collected: false
        };

        setBlocks(prev => [...prev, newBlock]);
    }, []);

    // Game loop
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

            // Update and draw blocks
            const updatedBlocks: Block[] = [];
            let newMissed = 0;

            blocks.forEach(block => {
                if (block.collected) return;

                block.y += block.speed;

                // Check collision with player
                if (
                    block.y + block.height >= canvas.height - player.height - 10 &&
                    block.y <= canvas.height - 10 &&
                    block.x + block.width >= player.x &&
                    block.x <= player.x + player.width
                ) {
                    // Collected!
                    setScore(prev => prev + block.points);
                    setBlocksCollected(prev => prev + 1);
                    block.collected = true;

                    if (soundEnabled) {
                        const audio = new Audio('/sounds/collect.mp3');
                        audio.volume = 0.3;
                        audio.play().catch(() => { });
                    }
                    return;
                }

                // Check if missed
                if (block.y > canvas.height) {
                    newMissed++;
                    return;
                }

                // Draw block
                ctx.shadowColor = block.color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                ctx.shadowBlur = 0;

                // Draw block label
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`+${block.points}`, block.x + block.width / 2, block.y + block.height / 2 + 4);

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

            setBlocks(updatedBlocks);

            // Draw player
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.roundRect(player.x, canvas.height - player.height - 10, player.width, player.height, 5);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw HUD
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${score}`, 20, 30);
            ctx.fillText(`Blocks: ${blocksCollected}`, 20, 55);

            ctx.textAlign = 'right';
            ctx.fillStyle = missedBlocks >= MAX_MISSED - 1 ? '#ef4444' : '#fff';
            ctx.fillText(`Missed: ${missedBlocks}/${MAX_MISSED}`, canvas.width - 20, 30);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [isPlaying, isPaused, blocks, player, score, blocksCollected, missedBlocks, soundEnabled]);

    // Mouse/touch controls
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMove = (clientX: number) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
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
        setBlocks([]);
        setGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);

        const canvas = canvasRef.current;
        if (canvas) {
            setPlayer({ x: canvas.width / 2 - 40, width: 80, height: 20 });
        }
    };

    const endGame = () => {
        setIsPlaying(false);
        setGameOver(true);

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('kashunter_highscore', score.toString());
        }
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
                            <span className="text-[var(--secondary)]">Kas</span>Hunter
                        </h1>
                        <p className="text-white/50">Catch blocks powered by real blockchain events!</p>
                    </div>
                </div>
                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 glass-card hover:bg-white/10"
                >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </motion.div>

            {/* Live Block Indicator */}
            <div className="glass-card p-3 mb-6 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="text-white/50">Blocks spawn from real network events</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Zap size={14} />
                    Block: {currentBlueScore.toLocaleString()}
                </div>
            </div>

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
                                <p className="text-white/60 mb-6 text-center max-w-md">
                                    Catch the falling blocks! Each block is spawned when a real
                                    Kaspa block is mined on the network.
                                </p>
                                <button onClick={startGame} className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
                                    <Play size={20} />
                                    Start Game
                                </button>
                                <p className="text-xs text-white/40 mt-4">
                                    Use mouse, touch, or arrow keys to move
                                </p>
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
                                <Trophy size={64} className="text-[var(--warning)] mb-4" />
                                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                                <div className="text-5xl font-bold text-[var(--primary)] mb-2">{score}</div>
                                <div className="text-white/60 mb-4">Points</div>

                                {score >= highScore && score > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-[var(--success)] font-bold mb-4"
                                    >
                                        🎉 New High Score!
                                    </motion.div>
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
                    </div>
                )}
            </div>

            {/* How It Works */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
            >
                <h3 className="font-semibold mb-4">How It Works</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--primary)] mx-auto mb-2" />
                        <div className="text-[var(--primary)]">+10 pts</div>
                        <div className="text-white/40">Common</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--secondary)] mx-auto mb-2" />
                        <div className="text-[var(--secondary)]">+25 pts</div>
                        <div className="text-white/40">Uncommon</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--success)] mx-auto mb-2" />
                        <div className="text-[var(--success)]">+50 pts</div>
                        <div className="text-white/40">Rare</div>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded bg-[var(--warning)] mx-auto mb-2" />
                        <div className="text-[var(--warning)]">+100 pts</div>
                        <div className="text-white/40">Epic</div>
                    </div>
                </div>
                <p className="text-xs text-white/40 text-center mt-4">
                    Each block spawns when a real Kaspa block is mined! Miss {MAX_MISSED} blocks and it's game over.
                </p>
            </motion.div>
        </div>
    );
}
