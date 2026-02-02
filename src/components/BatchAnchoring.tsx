'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, Loader, Hash, FolderTree } from 'lucide-react';
import { hashFile } from '@/lib/hash';
import CryptoJS from 'crypto-js';

interface FileWithHash {
    file: File;
    hash: string | null;
    status: 'pending' | 'hashing' | 'done' | 'error';
}

interface BatchResult {
    files: { name: string; hash: string }[];
    merkleRoot: string;
    timestamp: number;
    blueScore: number;
}

export function BatchAnchoring({ onComplete }: { onComplete?: (result: BatchResult) => void }) {
    const [files, setFiles] = useState<FileWithHash[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<BatchResult | null>(null);
    const [dragActive, setDragActive] = useState(false);

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

        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).map(file => ({
                file,
                hash: null,
                status: 'pending' as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                hash: null,
                status: 'pending' as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate Merkle root from hashes
    const calculateMerkleRoot = (hashes: string[]): string => {
        if (hashes.length === 0) return '';
        if (hashes.length === 1) return hashes[0];

        const nextLevel: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left; // Duplicate last if odd
            const combined = CryptoJS.SHA256(left + right).toString();
            nextLevel.push(combined);
        }

        return calculateMerkleRoot(nextLevel);
    };

    const processFiles = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        const updatedFiles = [...files];
        const hashes: string[] = [];

        for (let i = 0; i < updatedFiles.length; i++) {
            updatedFiles[i].status = 'hashing';
            setFiles([...updatedFiles]);

            try {
                const hash = await hashFile(updatedFiles[i].file);
                updatedFiles[i].hash = hash;
                updatedFiles[i].status = 'done';
                hashes.push(hash);
            } catch {
                updatedFiles[i].status = 'error';
            }

            setFiles([...updatedFiles]);
        }

        // Calculate Merkle root
        const merkleRoot = calculateMerkleRoot(hashes);

        const batchResult: BatchResult = {
            files: updatedFiles
                .filter(f => f.hash)
                .map(f => ({ name: f.file.name, hash: f.hash! })),
            merkleRoot,
            timestamp: Date.now(),
            blueScore: Math.floor(Math.random() * 100000) + 85000000 // Mock for demo
        };

        setResult(batchResult);
        onComplete?.(batchResult);
        setIsProcessing(false);
    };

    const reset = () => {
        setFiles([]);
        setResult(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="glass-card p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <FolderTree className="text-[var(--secondary)]" size={20} />
                    Batch Anchoring
                </h3>
                <p className="text-sm text-white/50">
                    Anchor multiple files at once with a single Merkle root proof
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Drop Zone */}
                        <div
                            className={`dropzone mb-4 ${dragActive ? 'active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="batch-upload"
                                multiple
                            />
                            <label htmlFor="batch-upload" className="cursor-pointer block">
                                <Upload size={36} className="mx-auto mb-3 text-[var(--secondary)] opacity-50" />
                                <p className="text-sm">
                                    Drop files here or <span className="text-[var(--secondary)]">browse</span>
                                </p>
                                <p className="text-xs text-white/40 mt-1">
                                    Multiple files supported • All hashed locally
                                </p>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                <AnimatePresence>
                                    {files.map((f, index) => (
                                        <motion.div
                                            key={`${f.file.name}-${index}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileText size={18} className="text-white/40 flex-shrink-0" />
                                                <div className="truncate">
                                                    <div className="text-sm truncate">{f.file.name}</div>
                                                    <div className="text-xs text-white/40">
                                                        {formatFileSize(f.file.size)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {f.status === 'pending' && (
                                                    <span className="text-xs text-white/40">Pending</span>
                                                )}
                                                {f.status === 'hashing' && (
                                                    <Loader size={16} className="animate-spin text-[var(--secondary)]" />
                                                )}
                                                {f.status === 'done' && (
                                                    <Check size={16} className="text-[var(--success)]" />
                                                )}
                                                {f.status === 'error' && (
                                                    <X size={16} className="text-[var(--danger)]" />
                                                )}
                                                {!isProcessing && (
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="p-1 hover:bg-white/10 rounded"
                                                    >
                                                        <X size={14} className="text-white/40" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Summary & Actions */}
                        {files.length > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/50">
                                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={reset}
                                        className="btn-secondary text-sm py-2"
                                        disabled={isProcessing}
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={processFiles}
                                        disabled={isProcessing || files.length === 0}
                                        className="btn-primary text-sm py-2 flex items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader size={16} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Hash size={16} />
                                                Create Batch Proof
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {/* Success */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className="w-16 h-16 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-3"
                            >
                                <Check size={32} className="text-[var(--success)]" />
                            </motion.div>
                            <h4 className="text-lg font-semibold text-[var(--success)]">
                                {result.files.length} Files Anchored!
                            </h4>
                        </div>

                        {/* Merkle Root */}
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FolderTree size={16} className="text-[var(--secondary)]" />
                                <span className="text-sm font-medium">Merkle Root</span>
                            </div>
                            <code className="text-xs font-mono text-[var(--secondary)] break-all">
                                {result.merkleRoot}
                            </code>
                            <p className="text-xs text-white/40 mt-2">
                                This single hash represents all {result.files.length} files
                            </p>
                        </div>

                        {/* File Hashes */}
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">Individual Files</div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {result.files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs p-2 bg-white/5 rounded">
                                        <FileText size={14} className="text-white/40" />
                                        <span className="truncate flex-1">{f.name}</span>
                                        <code className="text-[var(--primary)] font-mono">
                                            {f.hash.slice(0, 8)}...
                                        </code>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={reset} className="w-full btn-secondary">
                            Anchor More Files
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
