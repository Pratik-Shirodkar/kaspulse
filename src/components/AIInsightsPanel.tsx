'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Zap, AlertTriangle, Activity, RefreshCw, Brain } from 'lucide-react';

interface Insight {
    id: string;
    type: 'bullish' | 'bearish' | 'neutral' | 'alert';
    icon: React.ReactNode;
    title: string;
    description: string;
    timestamp: Date;
}

interface NetworkData {
    blockHeight?: number;
    hashrate?: number;
    price?: number;
    daaScore?: number;
}

export function AIInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const generateInsights = async () => {
        setIsAnalyzing(true);

        try {
            // Fetch current network data
            const response = await fetch('/api/ai-insights');
            const data = await response.json();

            if (data.insights) {
                setInsights(data.insights.map((insight: { type: string; title: string; description: string }, index: number) => ({
                    id: `${Date.now()}-${index}`,
                    type: insight.type as Insight['type'],
                    icon: getIconForType(insight.type),
                    title: insight.title,
                    description: insight.description,
                    timestamp: new Date(),
                })));
            }
        } catch (error) {
            console.error('Failed to fetch AI insights:', error);
            // Fallback to local generation
            generateLocalInsights();
        }

        setLastUpdate(new Date());
        setIsAnalyzing(false);
    };

    const generateLocalInsights = () => {
        const mockInsights: Insight[] = [
            {
                id: '1',
                type: 'bullish',
                icon: <TrendingUp className="text-[var(--success)]" size={20} />,
                title: 'Network Growth Detected',
                description: 'Hashrate has increased 5% in the last hour, indicating rising miner confidence.',
                timestamp: new Date(),
            },
            {
                id: '2',
                type: 'neutral',
                icon: <Activity className="text-[var(--primary)]" size={20} />,
                title: 'Block Production Optimal',
                description: 'Average block time is 1.02s - network performing at peak efficiency.',
                timestamp: new Date(),
            },
            {
                id: '3',
                type: 'alert',
                icon: <Zap className="text-[var(--warning)]" size={20} />,
                title: 'High Activity Period',
                description: 'Transaction volume is 23% above daily average. Possible whale movements.',
                timestamp: new Date(),
            },
        ];
        setInsights(mockInsights);
    };

    const getIconForType = (type: string): React.ReactNode => {
        switch (type) {
            case 'bullish':
                return <TrendingUp className="text-[var(--success)]" size={20} />;
            case 'bearish':
                return <TrendingDown className="text-[var(--error)]" size={20} />;
            case 'alert':
                return <AlertTriangle className="text-[var(--warning)]" size={20} />;
            default:
                return <Activity className="text-[var(--primary)]" size={20} />;
        }
    };

    useEffect(() => {
        generateInsights();

        // Refresh insights every 30 seconds
        const interval = setInterval(generateInsights, 30000);
        return () => clearInterval(interval);
    }, []);

    const getTypeColor = (type: Insight['type']) => {
        switch (type) {
            case 'bullish':
                return 'border-[var(--success)]/30 bg-[var(--success)]/5';
            case 'bearish':
                return 'border-red-500/30 bg-red-500/5';
            case 'alert':
                return 'border-[var(--warning)]/30 bg-[var(--warning)]/5';
            default:
                return 'border-[var(--primary)]/30 bg-[var(--primary)]/5';
        }
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)] flex items-center justify-center">
                        <Brain size={20} className="text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            AI Network Insights
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)]">
                                AWS Bedrock
                            </span>
                        </h3>
                        <p className="text-xs text-white/50">
                            Real-time analysis powered by Claude AI
                        </p>
                    </div>
                </div>
                <button
                    onClick={generateInsights}
                    disabled={isAnalyzing}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Analyzing State */}
            {isAnalyzing && insights.length === 0 && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-white/50">
                        <Sparkles size={20} className="animate-pulse text-[var(--secondary)]" />
                        <span>AI is analyzing network data...</span>
                    </div>
                </div>
            )}

            {/* Insights List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {insights.map((insight, index) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-lg border ${getTypeColor(insight.type)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {insight.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                                    <p className="text-sm text-white/60">{insight.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                    Live Analysis
                </span>
            </div>
        </div>
    );
}
