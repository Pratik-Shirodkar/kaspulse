'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, VolumeX } from 'lucide-react';

interface SonicDAGProps {
    blueScore: number;
}

export default function SonicDAG({ blueScore }: SonicDAGProps) {
    const [enabled, setEnabled] = useState(false);
    const [lastPing, setLastPing] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const prevScoreRef = useRef(0);
    const initialized = useRef(false);

    // Initialize AudioContext on user interaction
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    // Play a synth ping
    const playBlockSound = useCallback((score: number) => {
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') return;

        // Create oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Map blue score to frequency: use last 2 digits for variation
        const baseFreq = 300;
        const variation = (score % 100) / 100; // 0-1
        const isRare = score % 10 === 0; // Every 10th block = deeper sound

        if (isRare) {
            // Deep bass for "full" blocks
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq * 0.5 + variation * 50, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } else {
            // Light ping for regular blocks
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq + variation * 400, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);

        setLastPing(Date.now());
    }, []);

    // Toggle sound
    const toggle = () => {
        const next = !enabled;
        setEnabled(next);
        if (next) {
            initAudio();
            initialized.current = true;
        }
    };

    // Play sound on blue score change
    useEffect(() => {
        if (!enabled || !initialized.current) return;
        if (prevScoreRef.current !== 0 && blueScore !== prevScoreRef.current) {
            playBlockSound(blueScore);
        }
        prevScoreRef.current = blueScore;
    }, [blueScore, enabled, playBlockSound]);

    const isPinging = Date.now() - lastPing < 300;

    return (
        <motion.button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
                background: enabled
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.15))'
                    : 'rgba(255,255,255,0.05)',
                border: enabled
                    ? '1px solid rgba(139,92,246,0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                color: enabled ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={enabled ? 'Disable Sonic DAG' : 'Enable Sonic DAG — hear the blockchain!'}
        >
            {enabled ? (
                <>
                    <motion.span
                        animate={isPinging ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        <Music size={14} />
                    </motion.span>
                    <span>♪ Sonic DAG</span>
                    {isPinging && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-2 h-2 rounded-full bg-purple-400"
                        />
                    )}
                </>
            ) : (
                <>
                    <VolumeX size={14} />
                    <span>Sonic DAG</span>
                </>
            )}
        </motion.button>
    );
}
