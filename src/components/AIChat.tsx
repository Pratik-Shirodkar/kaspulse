'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm KasBot 🤖 - your AI guide to Kaspa. Ask me anything about the network, blocks, transactions, or addresses!",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message || 'Sorry, I encountered an error.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Sorry, I'm having trouble connecting right now. Please try again!",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const suggestedQuestions = [
        "What's the current block height?",
        "How fast is Kaspa?",
        "What's the KAS price?",
        "Explain BlockDAG",
    ];

    return (
        <>
            {/* Chat Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30"
                    >
                        <MessageCircle size={24} className="text-black" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--success)] rounded-full flex items-center justify-center">
                            <Sparkles size={10} className="text-black" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? 'auto' : 500,
                        }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] glass-card overflow-hidden flex flex-col"
                        style={{ border: '1px solid var(--primary)' }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                    <Bot size={20} className="text-black" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--primary)]">KasBot</h3>
                                    <p className="text-xs text-white/50">AI-Powered by AWS Bedrock</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 320 }}>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === 'user'
                                                        ? 'bg-[var(--secondary)]'
                                                        : 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]'
                                                    }`}
                                            >
                                                {message.role === 'user' ? (
                                                    <User size={14} className="text-black" />
                                                ) : (
                                                    <Bot size={14} className="text-black" />
                                                )}
                                            </div>
                                            <div
                                                className={`max-w-[75%] p-3 rounded-2xl text-sm ${message.role === 'user'
                                                        ? 'bg-[var(--secondary)]/20 text-white rounded-br-none'
                                                        : 'bg-white/5 text-white/90 rounded-bl-none'
                                                    }`}
                                            >
                                                {message.content}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                <Bot size={14} className="text-black" />
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none">
                                                <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Suggested Questions */}
                                {messages.length <= 2 && (
                                    <div className="px-4 pb-2">
                                        <p className="text-xs text-white/40 mb-2">Try asking:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestedQuestions.map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => setInput(q)}
                                                    className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input */}
                                <div className="p-4 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask about Kaspa..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                            disabled={isLoading}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary)]/80 transition-colors"
                                        >
                                            <Send size={16} className="text-black" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
