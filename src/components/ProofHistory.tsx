'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, FileText, Hash, Clock, Trash2, Download, Search, Check, Copy } from 'lucide-react';

export interface StoredProof {
    id: string;
    hash: string;
    type: 'file' | 'text' | 'batch';
    name: string;
    timestamp: number;
    blueScore: number;
    merkleRoot?: string;
    fileCount?: number;
}

const STORAGE_KEY = 'kaspulse_proofs';

export function useProofHistory() {
    const [proofs, setProofs] = useState<StoredProof[]>([]);

    useEffect(() => {
        // Load from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setProofs(JSON.parse(stored));
                } catch {
                    console.error('Failed to parse stored proofs');
                }
            }
        }
    }, []);

    const addProof = (proof: Omit<StoredProof, 'id'>) => {
        const newProof: StoredProof = {
            ...proof,
            id: crypto.randomUUID()
        };

        setProofs(prev => {
            const updated = [newProof, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const removeProof = (id: string) => {
        setProofs(prev => {
            const updated = prev.filter(p => p.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearAll = () => {
        setProofs([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return { proofs, addProof, removeProof, clearAll };
}

export function ProofHistory() {
    const { proofs, removeProof, clearAll } = useProofHistory();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const filteredProofs = proofs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hash.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const copyHash = async (proof: StoredProof) => {
        await navigator.clipboard.writeText(proof.merkleRoot || proof.hash);
        setCopiedId(proof.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const downloadProof = (proof: StoredProof) => {
        const cert = `
KASPULSE PROOF CERTIFICATE
===========================

Type: ${proof.type.toUpperCase()}
Name: ${proof.name}
${proof.type === 'batch' ? `Files: ${proof.fileCount}` : ''}

Hash: ${proof.hash}
${proof.merkleRoot ? `Merkle Root: ${proof.merkleRoot}` : ''}

Timestamp: ${new Date(proof.timestamp).toISOString()}
Blue Score: ${proof.blueScore.toLocaleString()}

---
Verified by KasPulse
https://kaspulse.app
    `.trim();

        const blob = new Blob([cert], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proof-${proof.hash.slice(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return new Date(timestamp).toLocaleDateString();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'file': return <FileText size={16} />;
            case 'batch': return <History size={16} />;
            default: return <Hash size={16} />;
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="text-[var(--primary)]" size={20} />
                        Proof History
                    </h3>
                    <p className="text-sm text-white/50">
                        {proofs.length} proof{proofs.length !== 1 ? 's' : ''} stored locally
                    </p>
                </div>
                {proofs.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('Delete all stored proofs?')) {
                                clearAll();
                            }
                        }}
                        className="text-xs text-[var(--danger)] hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Search */}
            {proofs.length > 0 && (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or hash..."
                        className="input-glass pl-10 py-2 text-sm"
                    />
                </div>
            )}

            {/* Proof List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                    {filteredProofs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-white/40"
                        >
                            {proofs.length === 0 ? (
                                <>
                                    <Hash size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No proofs yet</p>
                                    <p className="text-sm mt-1">Anchor some data to get started</p>
                                </>
                            ) : (
                                <>
                                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No matching proofs found</p>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        filteredProofs.map((proof, index) => (
                            <motion.div
                                key={proof.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 overflow-hidden flex-1">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${proof.type === 'file' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' :
                                                proof.type === 'batch' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' :
                                                    'bg-[var(--success)]/20 text-[var(--success)]'
                                            }`}>
                                            {getTypeIcon(proof.type)}
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <div className="font-medium truncate">{proof.name}</div>
                                            <div className="text-xs text-white/40 flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDate(proof.timestamp)}
                                                </span>
                                                <span>•</span>
                                                <span>Block {proof.blueScore.toLocaleString()}</span>
                                                {proof.fileCount && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{proof.fileCount} files</span>
                                                    </>
                                                )}
                                            </div>
                                            <code className="text-xs font-mono text-[var(--primary)] mt-2 block truncate">
                                                {proof.merkleRoot || proof.hash}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button
                                            onClick={() => copyHash(proof)}
                                            className="p-2 hover:bg-white/10 rounded"
                                            title="Copy hash"
                                        >
                                            {copiedId === proof.id ? (
                                                <Check size={14} className="text-[var(--success)]" />
                                            ) : (
                                                <Copy size={14} className="text-white/50" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => downloadProof(proof)}
                                            className="p-2 hover:bg-white/10 rounded"
                                            title="Download proof"
                                        >
                                            <Download size={14} className="text-white/50" />
                                        </button>
                                        <button
                                            onClick={() => removeProof(proof.id)}
                                            className="p-2 hover:bg-white/10 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} className="text-[var(--danger)]" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
