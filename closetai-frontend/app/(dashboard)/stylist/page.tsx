'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ChatMessage } from '@/components/stylist/ChatMessage';
import { QuickActions } from '@/components/stylist/QuickActions';
import { ChatInput } from '@/components/stylist/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/types';

interface EnrichedChatMessage extends ChatMessageType {
  referencedItems?: string[];
}

const INITIAL_MESSAGE: EnrichedChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your personal ClosetAI stylist. Ask me what to wear for an upcoming event, how to style a specific piece, or let me plan outfits for a trip.",
  created_at: '2026-01-01T00:00:00.000Z',
};

export default function StylistPage() {
  const [messages, setMessages] = useState<EnrichedChatMessage[]>([
    INITIAL_MESSAGE,
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    setError(null);
    const userMsg: EnrichedChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_history: nextHistory.slice(-10).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get stylist response');
      }

      const aiMsg: EnrichedChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          data.response ||
          data.message ||
          'Here are a few styling ideas based on your wardrobe.',
        referencedItems: Array.isArray(data.suggested_items)
          ? data.suggested_items
          : Array.isArray(data.referenced_items)
          ? data.referenced_items
          : [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reach AI stylist'
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-4xl mx-auto p-4 md:p-8"
    >
      {/* Header */}
      <div className="pb-4 border-b border-[#E8DFD3] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-charcoal text-rose flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">
            AI Personal Stylist
          </h1>
          <p className="text-xs text-taupe">
            Tailored advice using your wardrobe, colours, and style profile
          </p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            referencedItems={msg.referencedItems}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-charcoal text-rose flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border-l-4 border-rose shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-taupe animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-taupe animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-taupe animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Actions & Input */}
      <div className="pt-3 border-t border-[#E8DFD3] space-y-3">
        <QuickActions onSelect={sendMessage} disabled={isTyping} />
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </div>
    </motion.div>
  );
}
