'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Server, Wifi } from 'lucide-react';

interface HealthMetric {
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    history: number[];
}

export function NetworkHealthMonitor() {
    const [metrics, setMetrics] = useState<HealthMetric[]>([
        {
            name: 'Block Rate',
            value: 1.0,
            unit: 'blocks/sec',
            status: 'good',
            trend: 'stable',
            history: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        },
        {
            name: 'Transaction Throughput',
            value: 285,
            unit: 'tx/sec',
            status: 'good',
            trend: 'up',
            history: [250, 260, 270, 280, 275, 290, 285, 295, 280, 285]
        },
        {
            name: 'Network Latency',
            value: 45,
            unit: 'ms',
            status: 'good',
            trend: 'stable',
            history: [50, 48, 52, 45, 47, 43, 46, 44, 48, 45]
        },
        {
            name: 'Node Count',
            value: 1247,
            unit: 'nodes',
            status: 'good',
            trend: 'up',
            history: [1200, 1210, 1220, 1225, 1230, 1235, 1240, 1242, 1245, 1247]
        },
        {
            name: 'Mempool Size',
            value: 128,
            unit: 'tx',
            status: 'good',
            trend: 'stable',
            history: [100, 120, 150, 130, 140, 125, 135, 120, 125, 128]
        },
        {
            name: 'Orphan Rate',
            value: 0.2,
            unit: '%',
            status: 'good',
            trend: 'down',
            history: [0.5, 0.4, 0.35, 0.3, 0.28, 0.25, 0.22, 0.21, 0.2, 0.2]
        }
    ]);

    const [alerts, setAlerts] = useState<{ message: string; type: 'info' | 'warning' | 'success' }[]>([
        { message: 'Network operating normally', type: 'success' },
        { message: 'Hashrate increased 5% in last hour', type: 'info' }
    ]);

    // Simulate metric updates
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => prev.map(metric => {
                const change = (Math.random() - 0.5) * 0.1 * metric.value;
                const newValue = Math.max(0, metric.value + change);
                const newHistory = [...metric.history.slice(1), newValue];

                return {
                    ...metric,
                    value: parseFloat(newValue.toFixed(metric.value < 10 ? 2 : 0)),
                    history: newHistory,
                    trend: newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable'
                };
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'var(--success)';
            case 'warning': return 'var(--warning)';
            case 'critical': return 'var(--danger)';
            default: return 'var(--foreground)';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp size={14} className="text-[var(--success)]" />;
            case 'down': return <TrendingDown size={14} className="text-[var(--danger)]" />;
            default: return <Activity size={14} className="text-white/40" />;
        }
    };

    // Mini sparkline component
    const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const height = 30;
        const width = 80;

        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((v - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width={width} height={height} className="opacity-60">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    points={points}
                />
            </svg>
        );
    };

    const overallHealth = metrics.every(m => m.status === 'good') ? 'Healthy' :
        metrics.some(m => m.status === 'critical') ? 'Critical' : 'Warning';

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Server className="text-[var(--primary)]" size={20} />
                        Network Health Monitor
                    </h3>
                    <p className="text-sm text-white/50">Real-time network status and metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Wifi size={16} className="text-[var(--success)] animate-pulse" />
                    <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: overallHealth === 'Healthy' ? 'rgba(16, 185, 129, 0.2)' :
                                overallHealth === 'Warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: overallHealth === 'Healthy' ? 'var(--success)' :
                                overallHealth === 'Warning' ? 'var(--warning)' : 'var(--danger)'
                        }}
                    >
                        {overallHealth === 'Healthy' && <CheckCircle size={14} className="inline mr-1" />}
                        {overallHealth === 'Warning' && <AlertTriangle size={14} className="inline mr-1" />}
                        {overallHealth}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/50">{metric.name}</span>
                            {getTrendIcon(metric.trend)}
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <span
                                    className="text-xl font-bold"
                                    style={{ color: getStatusColor(metric.status) }}
                                >
                                    {metric.value.toLocaleString()}
                                </span>
                                <span className="text-xs text-white/40 ml-1">{metric.unit}</span>
                            </div>
                            <Sparkline data={metric.history} color={getStatusColor(metric.status)} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Alerts */}
            <div className="border-t border-white/10 pt-4">
                <div className="text-xs text-white/50 mb-2">Recent Alerts</div>
                <AnimatePresence>
                    {alerts.map((alert, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`flex items-center gap-2 p-2 rounded text-sm mb-1 ${alert.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                                    alert.type === 'warning' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
                                        'bg-[var(--primary)]/10 text-[var(--primary)]'
                                }`}
                        >
                            {alert.type === 'success' && <CheckCircle size={14} />}
                            {alert.type === 'warning' && <AlertTriangle size={14} />}
                            {alert.type === 'info' && <Activity size={14} />}
                            {alert.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
