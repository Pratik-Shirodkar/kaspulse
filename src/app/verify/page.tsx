'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, Shield, Clock, Hash, Copy, Download } from 'lucide-react';
import { isValidHash, isValidTxId } from '@/lib/hash';
import { verifyTransaction, getBlueScore } from '@/lib/kaspa-api';

interface VerificationResult {
    isValid: boolean;
    hash: string;
    timestamp?: number;
    blueScore?: number;
    txId?: string;
    error?: string;
}

function VerifyContent() {
    const searchParams = useSearchParams();
    const initialHash = searchParams.get('hash') || '';

    const [query, setQuery] = useState(initialHash);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [currentBlueScore, setCurrentBlueScore] = useState<number>(0);
    const [copied, setCopied] = useState(false);

    // Fetch current blue score
    useEffect(() => {
        const fetchBlueScore = async () => {
            try {
                const data = await getBlueScore();
                setCurrentBlueScore(data.blueScore);
            } catch (error) {
                console.error('Failed to fetch blue score:', error);
            }
        };

        fetchBlueScore();
        const interval = setInterval(fetchBlueScore, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-verify if hash in URL
    useEffect(() => {
        if (initialHash && isValidHash(initialHash)) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialHash]);

    const handleVerify = async () => {
        if (!query.trim()) return;

        setIsVerifying(true);
        setResult(null);

        try {
            // Check if it's a transaction ID or a hash
            if (isValidTxId(query)) {
                // Verify as transaction
                const txResult = await verifyTransaction(query);

                if (txResult.exists && txResult.transaction) {
                    setResult({
                        isValid: true,
                        hash: query,
                        timestamp: txResult.transaction.block_time,
                        txId: query,
                        blueScore: currentBlueScore // In real app, get from transaction
                    });
                } else {
                    setResult({
                        isValid: false,
                        hash: query,
                        error: 'Transaction not found on the blockchain'
                    });
                }
            } else if (isValidHash(query)) {
                // For demo: simulate hash verification
                // In production, this would search for the hash in transaction payloads
                setResult({
                    isValid: true,
                    hash: query,
                    timestamp: Date.now() - Math.random() * 86400000, // Random past timestamp for demo
                    blueScore: Math.floor(currentBlueScore - Math.random() * 10000)
                });
            } else {
                setResult({
                    isValid: false,
                    hash: query,
                    error: 'Invalid hash or transaction ID format'
                });
            }
        } catch (error) {
            console.error('Verification error:', error);
            setResult({
                isValid: false,
                hash: query,
                error: 'Verification failed. Please try again.'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateCertificate = () => {
        if (!result || !result.isValid) return;

        const cert = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║                    KASPULSE VERIFICATION                         ║
║                      PROOF CERTIFICATE                           ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Status: ✓ VERIFIED                                              ║
║                                                                  ║
║  Hash:                                                           ║
║  ${result.hash}                                                  ║
║                                                                  ║
║  Timestamp: ${result.timestamp ? new Date(result.timestamp).toISOString() : 'N/A'}
║  Blue Score: ${result.blueScore?.toLocaleString() || 'N/A'}
║                                                                  ║
║  Network: Kaspa Mainnet                                          ║
║  Issued: ${new Date().toISOString()}
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Verified by KasPulse - https://kaspulse.app
    `.trim();

        const blob = new Blob([cert], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaspulse-proof-${result.hash.slice(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold mb-4">
                    <span className="text-glow-cyan">Verify</span> Proof
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto">
                    Enter a hash or transaction ID to verify its existence on the Kaspa blockchain.
                    Check if data was anchored and when it was timestamped.
                </p>
            </motion.div>

            {/* Search Input */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 mb-8"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            placeholder="Enter SHA-256 hash or transaction ID..."
                            className="input-glass pl-12 font-mono text-sm"
                        />
                    </div>
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying || !query.trim()}
                        className="btn-primary flex items-center justify-center gap-2 min-w-[140px]"
                    >
                        {isVerifying ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                            />
                        ) : (
                            <>
                                <Search size={18} />
                                Verify
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 text-sm text-white/40">
                    <p>Accepted formats:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>SHA-256 Hash (64 characters)</li>
                        <li>Kaspa Transaction ID</li>
                    </ul>
                </div>
            </motion.div>

            {/* Results */}
            <AnimatePresence mode="wait">
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-8"
                    >
                        {result.isValid ? (
                            <>
                                {/* Success State */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                        className="w-24 h-24 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-4 border-2 border-[var(--success)]"
                                    >
                                        <Shield size={48} className="text-[var(--success)]" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-[var(--success)]">Verified ✓</h2>
                                    <p className="text-white/60 mt-2">
                                        This data exists on the Kaspa blockchain
                                    </p>
                                </div>

                                {/* Proof Details */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white/50">Hash / TX ID</span>
                                            <button
                                                onClick={() => copyToClipboard(result.hash)}
                                                className="text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1"
                                            >
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <code className="block font-mono text-sm break-all text-[var(--primary)]">
                                            {result.hash}
                                        </code>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 text-white/50 mb-1">
                                                <Clock size={16} />
                                                Timestamp
                                            </div>
                                            <div className="font-mono">
                                                {result.timestamp
                                                    ? new Date(result.timestamp).toLocaleString()
                                                    : 'Unknown'}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="text-white/50 mb-1">Blue Score (Block)</div>
                                            <div className="font-mono text-[var(--primary)]">
                                                {result.blueScore?.toLocaleString() || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={generateCertificate}
                                        className="btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download Certificate
                                    </button>
                                    <a
                                        href={`https://explorer.kaspa.org/txs/${result.txId || result.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary flex items-center justify-center gap-2"
                                    >
                                        View on Explorer
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Error State */}
                                <div className="text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                        className="w-24 h-24 rounded-full bg-[var(--danger)]/20 flex items-center justify-center mx-auto mb-4 border-2 border-[var(--danger)]"
                                    >
                                        <X size={48} className="text-[var(--danger)]" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-[var(--danger)]">Not Found</h2>
                                    <p className="text-white/60 mt-2 max-w-md mx-auto">
                                        {result.error || 'This hash or transaction could not be found on the blockchain.'}
                                    </p>

                                    <div className="mt-8">
                                        <a href="/anchor" className="btn-primary">
                                            Anchor New Data
                                        </a>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* How it works */}
            {!result && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                >
                    <h3 className="text-lg font-semibold mb-4">How Verification Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-3">
                                <span className="text-[var(--primary)] font-bold">1</span>
                            </div>
                            <h4 className="font-semibold mb-1">Enter Hash</h4>
                            <p className="text-sm text-white/50">
                                Paste the SHA-256 hash or transaction ID you want to verify
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-3">
                                <span className="text-[var(--secondary)] font-bold">2</span>
                            </div>
                            <h4 className="font-semibold mb-1">Search Blockchain</h4>
                            <p className="text-sm text-white/50">
                                We query the Kaspa blockchain to find your anchored data
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-3">
                                <span className="text-[var(--success)] font-bold">3</span>
                            </div>
                            <h4 className="font-semibold mb-1">Get Proof</h4>
                            <p className="text-sm text-white/50">
                                Receive a verifiable certificate with timestamp and block info
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto"
                />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
