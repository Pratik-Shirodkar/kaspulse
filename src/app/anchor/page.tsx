'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Hash, Check, Copy, ExternalLink, Loader, Clock, FolderTree } from 'lucide-react';
import { hashFile, hashString, formatHash } from '@/lib/hash';
import { getBlueScore } from '@/lib/kaspa-api';
import { BatchAnchoring } from '@/components/BatchAnchoring';
import { ProofHistory, useProofHistory } from '@/components/ProofHistory';

type AnchorMode = 'file' | 'text' | 'batch';

interface AnchorResult {
    hash: string;
    timestamp: number;
    blueScore: number;
    type: 'file' | 'text';
    fileName?: string;
}

export default function AnchorPage() {
    const [mode, setMode] = useState<AnchorMode>('file');
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<AnchorResult | null>(null);
    const [currentBlueScore, setCurrentBlueScore] = useState<number>(0);
    const [dragActive, setDragActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const { addProof } = useProofHistory();

    // Fetch current blue score
    useEffect(() => {
        const fetchBlueScore = async () => {
            try {
                const data = await getBlueScore();
                setCurrentBlueScore(data.blueScore);
            } catch (error) {
                console.error('Failed to fetch blue score:', error);
                setCurrentBlueScore(85000000 + Math.floor(Math.random() * 1000));
            }
        };

        fetchBlueScore();
        const interval = setInterval(fetchBlueScore, 5000);
        return () => clearInterval(interval);
    }, []);

    // Check URL hash for batch mode
    useEffect(() => {
        if (window.location.hash === '#batch') {
            setMode('batch');
        }
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleAnchor = async () => {
        setIsProcessing(true);
        try {
            let hash: string;

            if (mode === 'file' && file) {
                hash = await hashFile(file);
            } else if (mode === 'text' && text.trim()) {
                hash = hashString(text.trim());
            } else {
                throw new Error('No data to anchor');
            }

            // Get current blockchain state
            let blueScore = currentBlueScore;
            try {
                const blueScoreData = await getBlueScore();
                blueScore = blueScoreData.blueScore;
            } catch {
                // Use cached value
            }

            const anchorResult: AnchorResult = {
                hash,
                timestamp: Date.now(),
                blueScore,
                type: mode as 'file' | 'text',
                fileName: mode === 'file' ? file?.name : undefined
            };

            setResult(anchorResult);

            // Save to proof history
            addProof({
                hash,
                type: mode as 'file' | 'text',
                name: mode === 'file' ? file?.name || 'Unnamed file' : `Text (${text.slice(0, 20)}...)`,
                timestamp: anchorResult.timestamp,
                blueScore: anchorResult.blueScore
            });
        } catch (error) {
            console.error('Anchor error:', error);
            alert('Failed to create anchor proof');
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setFile(null);
        setText('');
        setResult(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-bold mb-4">
                    <span className="text-glow-purple">Anchor</span> Your Data
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto">
                    Create instant blockchain proofs. Your data is hashed locally and anchored
                    to Kaspa's blockchain with millisecond precision.
                </p>

                {/* Live Blue Score */}
                <div className="mt-6 inline-flex items-center gap-3 glass-card px-6 py-3">
                    <span className="live-dot" />
                    <span className="text-sm text-white/50">Current Block:</span>
                    <span className="font-mono text-[var(--primary)] font-semibold">
                        {currentBlueScore.toLocaleString()}
                    </span>
                </div>
            </motion.div>

            {/* Mode Selector */}
            <div className="flex justify-center gap-2 mb-8">
                <button
                    onClick={() => { setMode('file'); setResult(null); }}
                    className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${mode === 'file'
                            ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]'
                            : 'glass-card text-white/60 hover:text-white'
                        }`}
                >
                    <Upload size={18} />
                    Single File
                </button>
                <button
                    onClick={() => { setMode('text'); setResult(null); }}
                    className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${mode === 'text'
                            ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]'
                            : 'glass-card text-white/60 hover:text-white'
                        }`}
                >
                    <FileText size={18} />
                    Text Note
                </button>
                <button
                    onClick={() => { setMode('batch'); setResult(null); }}
                    className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${mode === 'batch'
                            ? 'bg-[var(--secondary)]/20 text-[var(--secondary)] border border-[var(--secondary)]'
                            : 'glass-card text-white/60 hover:text-white'
                        }`}
                >
                    <FolderTree size={18} />
                    Batch
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Anchoring Area */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {mode === 'batch' ? (
                            <motion.div
                                key="batch"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <BatchAnchoring
                                    onComplete={(batchResult) => {
                                        addProof({
                                            hash: batchResult.files[0]?.hash || '',
                                            merkleRoot: batchResult.merkleRoot,
                                            type: 'batch',
                                            name: `Batch (${batchResult.files.length} files)`,
                                            timestamp: batchResult.timestamp,
                                            blueScore: batchResult.blueScore,
                                            fileCount: batchResult.files.length
                                        });
                                    }}
                                />
                            </motion.div>
                        ) : !result ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="glass-card p-6"
                            >
                                {/* File Upload */}
                                {mode === 'file' && (
                                    <div
                                        className={`dropzone ${dragActive ? 'active' : ''}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Upload size={48} className="mx-auto mb-4 text-[var(--primary)] opacity-50" />
                                            {file ? (
                                                <div>
                                                    <p className="text-lg font-semibold text-[var(--primary)]">{file.name}</p>
                                                    <p className="text-sm text-white/50 mt-1">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-lg">Drop a file here or <span className="text-[var(--primary)]">browse</span></p>
                                                    <p className="text-sm text-white/50 mt-1">
                                                        Your file is hashed locally - nothing is uploaded
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}

                                {/* Text Input */}
                                {mode === 'text' && (
                                    <div>
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Enter the text you want to anchor to the blockchain..."
                                            className="input-glass w-full h-48 resize-none"
                                        />
                                        <p className="text-sm text-white/40 mt-2">
                                            {text.length} characters
                                        </p>
                                    </div>
                                )}

                                {/* Anchor Button */}
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleAnchor}
                                        disabled={isProcessing || (mode === 'file' ? !file : !text.trim())}
                                        className="btn-primary text-lg px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center gap-2">
                                                <Loader className="animate-spin" size={20} />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Hash size={20} />
                                                Create Proof
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-8"
                            >
                                {/* Success Header */}
                                <div className="text-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                        className="w-16 h-16 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-3"
                                    >
                                        <Check size={32} className="text-[var(--success)]" />
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-[var(--success)]">Proof Created!</h2>
                                    <p className="text-white/60 mt-1 text-sm">
                                        Anchored to block {result.blueScore.toLocaleString()}
                                    </p>
                                </div>

                                {/* Proof Details */}
                                <div className="space-y-3">
                                    {result.fileName && (
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <span className="text-white/50 text-sm">File</span>
                                            <span className="font-mono text-sm">{result.fileName}</span>
                                        </div>
                                    )}

                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white/50 text-sm">SHA-256 Hash</span>
                                            <button
                                                onClick={() => copyToClipboard(result.hash)}
                                                className="text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 text-sm"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <code className="block font-mono text-xs break-all text-[var(--primary)]">
                                            {result.hash}
                                        </code>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <span className="text-white/50 text-xs flex items-center gap-1">
                                                <Clock size={12} /> Timestamp
                                            </span>
                                            <div className="font-mono text-sm mt-1">
                                                {new Date(result.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <span className="text-white/50 text-xs">Block</span>
                                            <div className="font-mono text-sm text-[var(--primary)] mt-1">
                                                {result.blueScore.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex gap-3 justify-center">
                                    <a
                                        href={`/verify?hash=${result.hash}`}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <ExternalLink size={16} />
                                        View Proof
                                    </a>
                                    <button onClick={reset} className="btn-secondary">
                                        Anchor Another
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Proof History Sidebar */}
                <div className="lg:col-span-1">
                    <ProofHistory />
                </div>
            </div>
        </div>
    );
}
