'use client';

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white rounded-xl border border-[#E8DFD3] p-2 shadow-sm"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask your AI stylist anything..."
        disabled={disabled}
        className="flex-1 px-3 py-2 text-sm text-charcoal bg-transparent focus:outline-none placeholder:text-taupe"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-charcoal text-white hover:bg-taupe transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
