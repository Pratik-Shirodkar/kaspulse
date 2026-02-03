'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Tag, Calendar, User, Building, Loader2, CheckCircle2, Brain } from 'lucide-react';

interface AnalysisResult {
    summary: string;
    entities: Array<{ type: string; value: string }>;
    suggestedTags: string[];
    documentType: string;
    confidence: number;
}

interface Props {
    fileContent: string;
    fileName: string;
    onAnalysisComplete?: (result: AnalysisResult) => void;
}

export function AIDocumentAnalyzer({ fileContent, fileName, onAnalysisComplete }: Props) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeDocument = async () => {
        if (!fileContent) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: fileContent.slice(0, 5000), // Limit content size
                    fileName,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResult(data);
            onAnalysisComplete?.(data);
        } catch (err) {
            console.error('Document analysis error:', err);
            setError('Failed to analyze document. Using basic analysis.');

            // Fallback to basic analysis
            const basicResult: AnalysisResult = {
                summary: `Document "${fileName}" ready for blockchain anchoring. This creates an immutable proof of existence.`,
                entities: [],
                suggestedTags: ['document', 'proof', fileName.split('.').pop() || 'file'],
                documentType: 'General Document',
                confidence: 0.7,
            };
            setResult(basicResult);
            onAnalysisComplete?.(basicResult);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'date':
                return <Calendar size={14} className="text-[var(--primary)]" />;
            case 'person':
                return <User size={14} className="text-[var(--secondary)]" />;
            case 'organization':
                return <Building size={14} className="text-[var(--success)]" />;
            default:
                return <Tag size={14} className="text-white/50" />;
        }
    };

    return (
        <div className="glass-card p-4 border border-[var(--secondary)]/30">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)] flex items-center justify-center">
                    <Brain size={16} className="text-black" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        AI Document Analyzer
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)]/20 text-[var(--secondary)]">
                            Bedrock
                        </span>
                    </h4>
                    <p className="text-xs text-white/40">Extract metadata before anchoring</p>
                </div>
            </div>

            {/* Analyze Button */}
            {!result && !isAnalyzing && (
                <button
                    onClick={analyzeDocument}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--secondary)]/20 to-[var(--primary)]/20 border border-[var(--secondary)]/30 hover:border-[var(--secondary)]/60 transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} className="text-[var(--secondary)]" />
                    <span>Analyze with AI</span>
                </button>
            )}

            {/* Analyzing State */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3 py-6"
                    >
                        <Loader2 size={20} className="animate-spin text-[var(--secondary)]" />
                        <span className="text-sm text-white/60">AI is analyzing document...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Success Indicator */}
                        <div className="flex items-center gap-2 text-[var(--success)] text-sm">
                            <CheckCircle2 size={16} />
                            <span>Analysis Complete ({Math.round(result.confidence * 100)}% confidence)</span>
                        </div>

                        {/* Summary */}
                        <div className="p-3 rounded-lg bg-white/5">
                            <h5 className="text-xs text-white/40 mb-1">AI Summary</h5>
                            <p className="text-sm">{result.summary}</p>
                        </div>

                        {/* Document Type */}
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-white/40" />
                            <span className="text-sm text-white/60">Type:</span>
                            <span className="text-sm font-medium text-[var(--primary)]">{result.documentType}</span>
                        </div>

                        {/* Entities */}
                        {result.entities.length > 0 && (
                            <div>
                                <h5 className="text-xs text-white/40 mb-2">Extracted Entities</h5>
                                <div className="flex flex-wrap gap-2">
                                    {result.entities.slice(0, 5).map((entity, i) => (
                                        <span
                                            key={i}
                                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10"
                                        >
                                            {getEntityIcon(entity.type)}
                                            {entity.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Tags */}
                        <div>
                            <h5 className="text-xs text-white/40 mb-2">Suggested Tags</h5>
                            <div className="flex flex-wrap gap-2">
                                {result.suggestedTags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)]"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Re-analyze */}
                        <button
                            onClick={analyzeDocument}
                            className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                            ↻ Re-analyze
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <p className="text-xs text-[var(--warning)] mt-2">{error}</p>
            )}
        </div>
    );
}
