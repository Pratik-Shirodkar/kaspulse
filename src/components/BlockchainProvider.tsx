'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getBlueScore } from '@/lib/kaspa-api';
import { Code, X } from 'lucide-react';

// ========== Matrix Mode Context ==========
interface MatrixContextType {
    matrixMode: boolean;
    toggleMatrix: () => void;
    blueScore: number;
    blockLatency: number;
    wsStatus: string;
    frameTime: number;
}

const MatrixContext = createContext<MatrixContextType>({
    matrixMode: false,
    toggleMatrix: () => { },
    blueScore: 0,
    blockLatency: 0,
    wsStatus: 'polling',
    frameTime: 16,
});

export const useMatrixMode = () => useContext(MatrixContext);

// ========== Block Pulse Context ==========
interface BlockPulseContextType {
    isPulsing: boolean;
}

const BlockPulseContext = createContext<BlockPulseContextType>({ isPulsing: false });
export const useBlockPulse = () => useContext(BlockPulseContext);

// ========== Combined Provider ==========
export function BlockchainProvider({ children }: { children: ReactNode }) {
    const [matrixMode, setMatrixMode] = useState(false);
    const [blueScore, setBlueScore] = useState(0);
    const [blockLatency, setBlockLatency] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);
    const [frameTime, setFrameTime] = useState(16);
    const prevScoreRef = useRef(0);
    const lastFetchRef = useRef(Date.now());
    const frameRef = useRef(0);
    const lastFrameRef = useRef(performance.now());

    // Track frame time
    useEffect(() => {
        if (!matrixMode) return;

        const measure = () => {
            const now = performance.now();
            setFrameTime(Math.round(now - lastFrameRef.current));
            lastFrameRef.current = now;
            frameRef.current = requestAnimationFrame(measure);
        };
        frameRef.current = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(frameRef.current);
    }, [matrixMode]);

    // Fetch blue score, detect changes, trigger pulse
    useEffect(() => {
        const fetchBlock = async () => {
            const before = Date.now();
            try {
                const data = await getBlueScore();
                const latency = Date.now() - before;
                setBlockLatency(latency);
                setBlueScore(data.blueScore);

                if (prevScoreRef.current !== 0 && data.blueScore !== prevScoreRef.current) {
                    // New block! Pulse!
                    setIsPulsing(true);
                    setTimeout(() => setIsPulsing(false), 200);
                }
                prevScoreRef.current = data.blueScore;
            } catch {
                setBlockLatency(-1);
            }
            lastFetchRef.current = Date.now();
        };

        fetchBlock();
        const interval = setInterval(fetchBlock, 1500);
        return () => clearInterval(interval);
    }, []);

    const toggleMatrix = () => setMatrixMode(prev => !prev);

    return (
        <MatrixContext.Provider value={{
            matrixMode,
            toggleMatrix,
            blueScore,
            blockLatency,
            wsStatus: 'polling',
            frameTime,
        }}>
            <BlockPulseContext.Provider value={{ isPulsing }}>
                <div className={`kaspa-glow-wrapper min-h-screen ${isPulsing ? 'pulse' : ''}`}>
                    {children}
                </div>

                {/* Matrix Mode Toggle Button */}
                <button
                    onClick={toggleMatrix}
                    className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all"
                    style={{
                        background: matrixMode
                            ? 'linear-gradient(135deg, rgba(0,255,0,0.2), rgba(0,200,0,0.1))'
                            : 'rgba(255,255,255,0.05)',
                        border: matrixMode
                            ? '1px solid rgba(0,255,0,0.4)'
                            : '1px solid rgba(255,255,255,0.1)',
                        color: matrixMode ? '#00ff00' : 'rgba(255,255,255,0.4)',
                    }}
                    title={matrixMode ? 'Disable Matrix Mode' : 'Enable Matrix Mode – Under the Hood'}
                >
                    <Code size={14} />
                    {matrixMode ? 'MATRIX ON' : 'Dev Mode'}
                </button>

                {/* Matrix Mode Debug Overlay */}
                {matrixMode && (
                    <div className="matrix-overlay">
                        <h4>⬡ Under The Hood</h4>
                        <div className="matrix-stat">
                            <span className="label">Blue Score</span>
                            <span className="value">{blueScore.toLocaleString()}</span>
                        </div>
                        <div className="matrix-stat">
                            <span className="label">API Latency</span>
                            <span className="value">{blockLatency >= 0 ? `${blockLatency}ms` : 'ERR'}</span>
                        </div>
                        <div className="matrix-stat">
                            <span className="label">Frame Time</span>
                            <span className="value">{frameTime}ms</span>
                        </div>
                        <div className="matrix-stat">
                            <span className="label">Data Source</span>
                            <span className="value">REST Poll 1.5s</span>
                        </div>
                        <div className="matrix-stat">
                            <span className="label">Glow Pulse</span>
                            <span className="value">{isPulsing ? '🟢 ACTIVE' : '⚫ IDLE'}</span>
                        </div>
                        <div className="matrix-stat">
                            <span className="label">Render</span>
                            <span className="value">Next.js 16 + Turbopack</span>
                        </div>
                    </div>
                )}
            </BlockPulseContext.Provider>
        </MatrixContext.Provider>
    );
}
