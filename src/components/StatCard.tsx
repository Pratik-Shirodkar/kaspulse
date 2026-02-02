'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function AnimatedNumber({
    value,
    duration = 0.5,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef(value);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const diff = endValue - startValue;

        if (diff === 0) return;

        const startTime = performance.now();
        const durationMs = duration * 1000;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = startValue + diff * eased;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    const formattedValue = displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    isLive?: boolean;
}

export function StatCard({
    label,
    value,
    prefix = '',
    suffix = '',
    decimals = 0,
    icon,
    trend,
    isLive = false
}: StatCardProps) {
    const [flash, setFlash] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            setFlash(true);
            prevValue.current = value;
            const timer = setTimeout(() => setFlash(false), 500);
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <motion.div
            className={`glass-card p-6 relative overflow-hidden ${flash ? 'border-[var(--primary)]' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Flash effect on update */}
            <AnimatePresence>
                {flash && (
                    <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-[var(--primary)]"
                    />
                )}
            </AnimatePresence>

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-white/50">{label}</span>
                        {isLive && (
                            <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                                <span className="live-dot" />
                                LIVE
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-glow-cyan">
                        <AnimatedNumber
                            value={value}
                            prefix={prefix}
                            suffix={suffix}
                            decimals={decimals}
                        />
                    </div>
                    {trend && (
                        <div className={`text-xs mt-1 ${trend === 'up' ? 'text-[var(--success)]' :
                                trend === 'down' ? 'text-[var(--danger)]' :
                                    'text-white/40'
                            }`}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}
                            {trend === 'up' ? ' Increasing' : trend === 'down' ? ' Decreasing' : ' Stable'}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="text-[var(--primary)] opacity-50">
                        {icon}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
