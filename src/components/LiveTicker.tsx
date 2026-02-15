'use client';

import { useEffect, useState, useRef } from 'react';
import { getBlueScore } from '@/lib/kaspa-api';

interface TickerMessage {
    id: string;
    text: string;
    type: 'block' | 'shoutbox' | 'system';
    timestamp: number;
}

export function LiveTicker() {
    const [messages, setMessages] = useState<TickerMessage[]>([
        { id: 'sys-1', text: '🚀 Welcome to KasPulse — The Kaspa Super App', type: 'system', timestamp: Date.now() },
        { id: 'sys-2', text: '⚡ Transactions confirm in milliseconds on Kaspa', type: 'system', timestamp: Date.now() },
        { id: 'sys-3', text: '💎 BlockDAG: 32 blocks per second, 10 BPS', type: 'system', timestamp: Date.now() },
        { id: 'sys-4', text: '🔗 Powered by Proof-of-Work with GHOSTDAG consensus', type: 'system', timestamp: Date.now() },
    ]);
    const prevScoreRef = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Listen for new blocks and inject messages
    useEffect(() => {
        const fetchAndAnnounce = async () => {
            try {
                const data = await getBlueScore();
                const score = data.blueScore;
                if (prevScoreRef.current !== 0 && score !== prevScoreRef.current) {
                    const hash = score.toString(16).toUpperCase();
                    const msgs: TickerMessage[] = [];

                    msgs.push({
                        id: `block-${score}`,
                        text: `🧱 New Block #${score.toLocaleString()} — Hash: 0x${hash}...`,
                        type: 'block',
                        timestamp: Date.now(),
                    });

                    // Occasionally add fun shoutbox messages
                    if (score % 5 === 0) {
                        const shouts = [
                            '📢 Hello from the Kaspa network!',
                            'ðŸ† KasPulse — Built for Kaspathon 2026',
                            '⚡ Kaspa: Where 1-second blocks are the norm',
                            'ðŸŒ The fastest L1 blockchain in existence',
                            '🎮 Try KasHunter — Catch blocks in real-time!',
                            '💰 KasPoint: Instant merchant payments',
                            '🔊 Enable Sonic DAG to hear the blockchain!',
                        ];
                        msgs.push({
                            id: `shout-${score}`,
                            text: shouts[score % shouts.length],
                            type: 'shoutbox',
                            timestamp: Date.now(),
                        });
                    }

                    setMessages(prev => [...prev, ...msgs].slice(-30)); // Keep last 30
                }
                prevScoreRef.current = score;
            } catch { /* ignore */ }
        };

        fetchAndAnnounce();
        const interval = setInterval(fetchAndAnnounce, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="live-ticker-bar">
            <div className="live-ticker-badge">
                <span className="live-ticker-dot" />
                LIVE
            </div>
            <div className="live-ticker-track" ref={scrollRef}>
                <div className="live-ticker-content">
                    {messages.map((msg) => (
                        <span key={msg.id} className="live-ticker-item">
                            <span
                                className="live-ticker-indicator"
                                style={{
                                    backgroundColor:
                                        msg.type === 'block' ? '#00ffff' :
                                            msg.type === 'shoutbox' ? '#10b981' :
                                                '#8b5cf6',
                                }}
                            />
                            {msg.text}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {messages.map((msg) => (
                        <span key={`dup-${msg.id}`} className="live-ticker-item">
                            <span
                                className="live-ticker-indicator"
                                style={{
                                    backgroundColor:
                                        msg.type === 'block' ? '#00ffff' :
                                            msg.type === 'shoutbox' ? '#10b981' :
                                                '#8b5cf6',
                                }}
                            />
                            {msg.text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
