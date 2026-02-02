'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Block {
    id: string;
    x: number;
    y: number;
    parents: string[];
    timestamp: number;
    isNew?: boolean;
}

export function DAGVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Generate initial DAG structure
    useEffect(() => {
        const initialBlocks: Block[] = [];
        const cols = 8;
        const rows = 6;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = `block-${row}-${col}`;
                const parents: string[] = [];

                // Connect to parents in previous row
                if (row > 0) {
                    // DAG structure: connect to 1-3 parents
                    const numParents = Math.min(3, Math.floor(Math.random() * 3) + 1);
                    for (let i = 0; i < numParents; i++) {
                        const parentCol = Math.max(0, Math.min(cols - 1, col + Math.floor(Math.random() * 3) - 1));
                        parents.push(`block-${row - 1}-${parentCol}`);
                    }
                }

                initialBlocks.push({
                    id,
                    x: 80 + col * 90 + (row % 2 === 0 ? 45 : 0),
                    y: 60 + row * 70,
                    parents: [...new Set(parents)],
                    timestamp: Date.now() - (rows - row) * 1000
                });
            }
        }

        setBlocks(initialBlocks);
    }, []);

    // Add new blocks periodically
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setBlocks(prev => {
                // Remove oldest row
                const newBlocks = prev.filter(b => !b.id.startsWith('block-0-'));

                // Shift all blocks up
                const shifted = newBlocks.map(b => ({
                    ...b,
                    id: b.id.replace(/block-(\d+)-/, (_, row) => `block-${parseInt(row) - 1}-`),
                    y: b.y - 70,
                    parents: b.parents.map(p => p.replace(/block-(\d+)-/, (_, row) => `block-${parseInt(row) - 1}-`)),
                    isNew: false
                }));

                // Add new row at bottom
                const cols = 8;
                const row = 5;
                const newRow: Block[] = [];

                for (let col = 0; col < cols; col++) {
                    const id = `block-${row}-${col}`;
                    const parents: string[] = [];

                    const numParents = Math.min(3, Math.floor(Math.random() * 3) + 1);
                    for (let i = 0; i < numParents; i++) {
                        const parentCol = Math.max(0, Math.min(cols - 1, col + Math.floor(Math.random() * 3) - 1));
                        parents.push(`block-${row - 1}-${parentCol}`);
                    }

                    newRow.push({
                        id,
                        x: 80 + col * 90 + (row % 2 === 0 ? 45 : 0),
                        y: 60 + row * 70,
                        parents: [...new Set(parents)],
                        timestamp: Date.now(),
                        isNew: true
                    });
                }

                return [...shifted, ...newRow];
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    // Draw DAG on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections first (behind blocks)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        blocks.forEach(block => {
            block.parents.forEach(parentId => {
                const parent = blocks.find(b => b.id === parentId);
                if (parent) {
                    ctx.beginPath();
                    ctx.moveTo(block.x, block.y);
                    ctx.lineTo(parent.x, parent.y);
                    ctx.stroke();
                }
            });
        });

        // Draw blocks
        blocks.forEach(block => {
            const isHovered = hoveredBlock?.id === block.id;
            const isNew = block.isNew;

            // Block glow
            if (isNew || isHovered) {
                ctx.shadowColor = isNew ? '#00ffff' : '#8b5cf6';
                ctx.shadowBlur = 15;
            }

            // Block shape
            ctx.fillStyle = isNew
                ? 'rgba(0, 255, 255, 0.8)'
                : isHovered
                    ? 'rgba(139, 92, 246, 0.8)'
                    : 'rgba(30, 30, 40, 0.9)';

            ctx.beginPath();
            ctx.roundRect(block.x - 20, block.y - 15, 40, 30, 6);
            ctx.fill();

            // Block border
            ctx.strokeStyle = isNew
                ? '#00ffff'
                : isHovered
                    ? '#8b5cf6'
                    : 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = isNew || isHovered ? 2 : 1;
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Block text
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(block.id.split('-').slice(1).join(':'), block.x, block.y + 4);
        });
    }, [blocks, hoveredBlock]);

    // Handle mouse hover
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hovered = blocks.find(block =>
            Math.abs(block.x - x) < 20 && Math.abs(block.y - y) < 15
        );

        setHoveredBlock(hovered || null);
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        BlockDAG Visualizer
                    </h3>
                    <p className="text-sm text-white/50">
                        Watch Kaspa's DAG structure grow in real-time
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded bg-[var(--primary)]" />
                        New Block
                    </span>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-3 py-1 rounded text-sm ${isPaused ? 'bg-[var(--success)] text-black' : 'bg-white/10'
                            }`}
                    >
                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                </div>
            </div>

            <div className="relative bg-black/30 rounded-lg overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredBlock(null)}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: '400px' }}
                />

                {/* Tooltip */}
                {hoveredBlock && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 glass-card p-3 text-sm"
                    >
                        <div className="font-mono text-[var(--primary)]">{hoveredBlock.id}</div>
                        <div className="text-white/50 mt-1">
                            Parents: {hoveredBlock.parents.length}
                        </div>
                        <div className="text-white/50">
                            {new Date(hoveredBlock.timestamp).toLocaleTimeString()}
                        </div>
                    </motion.div>
                )}
            </div>

            <p className="text-xs text-white/40 mt-4 text-center">
                Unlike linear blockchains, Kaspa's DAG allows multiple blocks to be created simultaneously,
                enabling 1 block per second throughput.
            </p>
        </div>
    );
}
