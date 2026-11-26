'use client';

import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  referencedItems?: string[];
}

export function ChatMessage({ message, referencedItems = [] }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-taupe text-white' : 'bg-charcoal text-rose'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-taupe text-white rounded-tr-none'
            : 'bg-white text-charcoal border-l-4 border-rose rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && referencedItems.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-ivory flex flex-wrap gap-1.5">
            {referencedItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose/25 text-charcoal"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
