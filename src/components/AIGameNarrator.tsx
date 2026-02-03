'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

interface Props {
    score: number;
    blocksCollected: number;
    missedBlocks: number;
    isPlaying: boolean;
    currentBlueScore: number;
    onCommentary?: (text: string) => void;
}

const exclamations = ['🔥', '⚡', '💎', '🚀', '✨', '🎯', '💥', '🌟'];

export function AIGameNarrator({ score, blocksCollected, missedBlocks, isPlaying, currentBlueScore, onCommentary }: Props) {
    const [commentary, setCommentary] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const [lastBlockScore, setLastBlockScore] = useState(0);
    const [streak, setStreak] = useState(0);

    const generateCommentary = useCallback((event: string, data?: Record<string, unknown>) => {
        let text = '';
        const emoji = exclamations[Math.floor(Math.random() * exclamations.length)];

        switch (event) {
            case 'game_start':
                text = `${emoji} Game on! Blocks are spawning from the live Kaspa network!`;
                break;
            case 'block_caught':
                const points = data?.points as number || 10;
                if (streak >= 5) {
                    text = `${emoji} INSANE! ${streak} block streak! You're on FIRE!`;
                } else if (streak >= 3) {
                    text = `${emoji} ${streak} in a row! Keep it up!`;
                } else if (points >= 100) {
                    text = `${emoji} EPIC block! +${points} points!`;
                } else if (points >= 50) {
                    text = `${emoji} Rare catch! +${points}!`;
                } else {
                    text = `+${points}! Nice catch!`;
                }
                break;
            case 'block_missed':
                if (missedBlocks >= 4) {
                    text = `⚠️ Last chance! One more miss and it's over!`;
                } else if (missedBlocks >= 2) {
                    text = `Oops! ${5 - missedBlocks} lives remaining!`;
                }
                break;
            case 'milestone':
                if (blocksCollected === 10) {
                    text = `${emoji} 10 blocks caught! You're getting good!`;
                } else if (blocksCollected === 25) {
                    text = `${emoji} 25 blocks! Network master in the making!`;
                } else if (blocksCollected === 50) {
                    text = `${emoji} 50 BLOCKS! Absolute legend!`;
                }
                break;
            case 'score_milestone':
                if (score >= 1000 && score < 1050) {
                    text = `${emoji} 1,000 points! You're crushing it!`;
                } else if (score >= 2500 && score < 2550) {
                    text = `${emoji} 2,500 points! Hall of fame material!`;
                }
                break;
            case 'network_block':
                text = `⚡ Block #${currentBlueScore.toLocaleString()} just mined!`;
                break;
        }

        if (text) {
            setCommentary(text);
            setIsVisible(true);
            onCommentary?.(text);

            // Hide after 3 seconds
            setTimeout(() => setIsVisible(false), 3000);
        }
    }, [streak, missedBlocks, blocksCollected, score, currentBlueScore, onCommentary]);

    // Track block catches for commentary
    useEffect(() => {
        if (blocksCollected > lastBlockScore && isPlaying) {
            setStreak(prev => prev + 1);
            generateCommentary('block_caught', { points: 10 }); // Simplified
            setLastBlockScore(blocksCollected);

            // Check for milestones
            if ([10, 25, 50, 100].includes(blocksCollected)) {
                setTimeout(() => generateCommentary('milestone'), 500);
            }
        }
    }, [blocksCollected, isPlaying, lastBlockScore, generateCommentary]);

    // Track misses
    useEffect(() => {
        if (missedBlocks > 0 && isPlaying) {
            setStreak(0);
            generateCommentary('block_missed');
        }
    }, [missedBlocks, isPlaying, generateCommentary]);

    // Game start commentary
    useEffect(() => {
        if (isPlaying && blocksCollected === 0 && missedBlocks === 0) {
            generateCommentary('game_start');
        }
    }, [isPlaying, blocksCollected, missedBlocks, generateCommentary]);

    // Score milestones
    useEffect(() => {
        if (score > 0 && score % 500 === 0) {
            generateCommentary('score_milestone');
        }
    }, [score, generateCommentary]);

    if (!isPlaying) return null;

    return (
        <AnimatePresence>
            {isVisible && commentary && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="glass-card px-4 py-2 flex items-center gap-2 border border-[var(--secondary)]/50">
                        <Sparkles size={16} className="text-[var(--secondary)]" />
                        <span className="text-sm font-medium">{commentary}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Simplified narrator for status bar display
export function AIGameStatus({ score, blocksCollected, streak }: { score: number; blocksCollected: number; streak: number }) {
    const getMessage = () => {
        if (streak >= 5) return '🔥 ON FIRE!';
        if (streak >= 3) return '⚡ Streak!';
        if (blocksCollected >= 25) return '🌟 Pro Player';
        if (score >= 500) return '💎 Nice Score';
        return '🎮 Keep Going';
    };

    return (
        <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)]">
            <Sparkles size={12} />
            <span>{getMessage()}</span>
        </div>
    );
}
