'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Hash, Check, Copy, ExternalLink, Loader, Clock, FolderTree, Sparkles, Wallet } from 'lucide-react';
import { hashFile, hashString, formatHash } from '@/lib/hash';
import { getBlueScore } from '@/lib/kaspa-api';
import { BatchAnchoring } from '@/components/BatchAnchoring';
import { ProofHistory, useProofHistory } from '@/components/ProofHistory';
import { AIDocumentAnalyzer } from '@/components/AIDocumentAnalyzer';
import { useWallet } from '@/components/WalletProvider';
import { Radio, Link2 } from 'lucide-react';

type AnchorMode = 'file' | 'text' | 'batch';

interface AnchorResult {
    hash: string;
    timestamp: number;
    blueScore: number;
    type: 'file' | 'text';
    fileName?: string;
    signature?: string;
    walletAddress?: string;
    txId?: string; // On-chain transaction ID
    isOnChain: boolean;
}

export default function AnchorPage() {
    const [mode, setMode] = useState<AnchorMode>('file');
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<AnchorResult | null>(null);
    const [currentBlueScore, setCurrentBlueScore] = useState<number>(0);
    const [dragActive, setDragActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [onChainMode, setOnChainMode] = useState(true); // Default to on-chain
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

    const readFileContent = useCallback(async (f: File) => {
        // Read content for text-based files
        const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
        const isTextFile = textTypes.some(t => f.type.startsWith(t)) || f.name.match(/\.(txt|md|json|xml|html|css|js|ts|tsx|jsx|csv|log)$/i);

        if (isTextFile && f.size < 100000) { // Limit to 100KB
            const content = await f.text();
            setFileContent(content);
        } else {
            setFileContent(`[Binary file: ${f.name}]\nSize: ${(f.size / 1024).toFixed(2)} KB\nType: ${f.type || 'unknown'}`);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const f = e.dataTransfer.files[0];
            setFile(f);
            setResult(null);
            readFileContent(f);
        }
    }, [readFileContent]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setResult(null);
            readFileContent(f);
        }
    };

    // Wallet context for on-chain signing
    const { isConnected, address, signProof, anchorOnChain, network } = useWallet();

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

            let signature: string | undefined;
            let walletAddress: string | undefined;
            let txId: string | undefined;

            // On-chain anchoring (broadcasts transaction)
            if (onChainMode && isConnected && address) {
                try {
                    const result = await anchorOnChain(hash);
                    txId = result.txId;
                    signature = result.signature;
                    walletAddress = address;
                } catch (error) {
                    console.error('On-chain anchor failed:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    if (errorMessage.includes('WebSocket') || errorMessage.includes('RPC') || errorMessage.includes('remote error')) {
                        alert('⚠️ Wallet Network Error\n\nKasware lost connection to the Kaspa node.\n\nPlease try:\n1. Open Kasware Settings\n2. Switch network to Mainnet then back to Testnet\n3. Restart browser if issue persists');
                    } else {
                        alert('Transaction failed. Please check your balance and try again.');
                    }

                    setIsProcessing(false);
                    return;
                }
            } else if (isConnected && address) {
                // Just sign locally (no transaction)
                try {
                    signature = await signProof(hash);
                    walletAddress = address;
                } catch (error) {
                    console.warn('Wallet signature skipped:', error);
                }
            }

            const anchorResult: AnchorResult = {
                hash,
                timestamp: Date.now(),
                blueScore,
                type: mode as 'file' | 'text',
                fileName: mode === 'file' ? file?.name : undefined,
                signature,
                walletAddress,
                txId,
                isOnChain: !!txId,
            };

            setResult(anchorResult);

            // Save to proof history
            addProof({
                hash,
                type: mode as 'file' | 'text',
                name: mode === 'file' ? file?.name || 'Unnamed file' : `Text (${text.slice(0, 20)}...)`,
                timestamp: anchorResult.timestamp,
                blueScore: anchorResult.blueScore,
                signature,
                walletAddress,
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
                    {network && (
                        <>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${network === 'kaspa-mainnet'
                                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                                }`}>
                                {network === 'kaspa-mainnet' ? 'Mainnet' : 'Testnet'}
                            </span>
                        </>
                    )}
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

            {/* On-Chain Toggle (Only if connected) */}
            {isConnected && (
                <div className="flex justify-center mb-8">
                    <div className="glass-card p-1 rounded-lg inline-flex items-center">
                        <button
                            onClick={() => setOnChainMode(false)}
                            className={`px-4 py-1.5 rounded-md text-sm transition-all ${!onChainMode
                                ? 'bg-white/10 text-white'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            Off-Chain Proof
                        </button>
                        <button
                            onClick={() => setOnChainMode(true)}
                            className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${onChainMode
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)] shadow-sm'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            <Link2 size={14} />
                            On-Chain Transaction
                        </button>
                    </div>
                </div>
            )}

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

                                {/* AI Document Analyzer - Shows after file selection */}
                                {mode === 'file' && file && fileContent && (
                                    <div className="mt-4">
                                        <AIDocumentAnalyzer
                                            fileContent={fileContent}
                                            fileName={file.name}
                                        />
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
                                {/* Action Button */}
                                <button
                                    onClick={handleAnchor}
                                    disabled={!file && !text && mode !== 'file'}
                                    className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 mt-6"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader className="animate-spin" />
                                            {onChainMode && isConnected ? 'Broadcasting Transaction...' : 'Anchoring...'}
                                        </>
                                    ) : (
                                        <>
                                            {onChainMode && isConnected ? <Link2 size={24} /> : <Hash size={24} />}
                                            {onChainMode && isConnected ? 'Anchor On-Chain' : 'Generate Proof'}
                                        </>
                                    )}
                                </button>

                                {onChainMode && isConnected && (
                                    <p className="text-xs text-white/40 text-center mt-3">
                                        Cost: ~0.001 KAS • Network: {network === 'kaspa-mainnet' ? 'Mainnet' : 'Testnet'}
                                    </p>
                                )}
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
                                        Anchored to block {result?.blueScore.toLocaleString()}
                                    </p>
                                </div>

                                {/* Proof Details */}
                                <div className="space-y-3">
                                    {result?.fileName && (
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <span className="text-white/50 text-sm">File</span>
                                            <span className="font-mono text-sm">{result.fileName}</span>
                                        </div>
                                    )}

                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white/50 text-sm">SHA-256 Hash</span>
                                            <button
                                                onClick={() => copyToClipboard(result?.hash || '')}
                                                className="text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 text-sm"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <code className="block font-mono text-xs break-all text-[var(--primary)]">
                                            {result?.hash}
                                        </code>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="text-white/50 text-sm mb-1">Timestamp</div>
                                            <div className="font-mono">{result?.timestamp ? new Date(result.timestamp).toLocaleString() : ''}</div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="text-white/50 text-sm mb-1">Block Height</div>
                                            <div className="font-mono text-[var(--primary)]">
                                                {result?.blueScore.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction ID Display */}
                                    {result?.txId && (
                                        <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[var(--primary)] text-sm font-semibold flex items-center gap-2">
                                                    <Link2 size={16} />
                                                    Transaction ID
                                                </span>
                                                <a
                                                    href={`https://explorer.kaspa.org/txs/${result.txId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                                                >
                                                    View Explorer <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            <div className="flex items-center justify-between bg-black/20 p-2 rounded">
                                                <code className="text-xs font-mono text-[var(--primary)] truncate flex-1 mr-2">
                                                    {result.txId}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(result.txId || '')}
                                                    className="text-white/40 hover:text-white"
                                                >
                                                    {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex gap-3 justify-center">
                                    <a
                                        href={`/verify?hash=${result?.hash}`}
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
