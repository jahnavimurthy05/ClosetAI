'use client';

const QUICK_PROMPTS = [
  'What should I wear tomorrow?',
  'Suggest a party outfit',
  'Style my black jeans',
  'Outfit for a family function',
  '5 outfits for a 3-day trip',
];

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="px-3 py-1.5 rounded-full bg-white border border-[#E8DFD3] text-xs text-charcoal hover:border-taupe hover:bg-ivory transition-colors duration-150 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
