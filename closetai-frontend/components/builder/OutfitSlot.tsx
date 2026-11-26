'use client';

import { Plus, X, Sparkles } from 'lucide-react';
import type { WardrobeItem } from '@/types';

export type BuilderSlotKey =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'footwear'
  | 'bag'
  | 'jewellery'
  | 'outerwear';

interface OutfitSlotProps {
  slotKey: BuilderSlotKey;
  label: string;
  required?: boolean;
  disabled?: boolean;
  item: WardrobeItem | null;
  onChoose: () => void;
  onClear: () => void;
  onFindCompatible: (item: WardrobeItem) => void;
}

export function OutfitSlot({
  label,
  required = false,
  disabled = false,
  item,
  onChoose,
  onClear,
  onFindCompatible,
}: OutfitSlotProps) {
  const thumb =
    item?.processed_image_url ||
    item?.thumbnail_url ||
    item?.original_image_url;

  return (
    <div
      className={`rounded-xl border p-3.5 transition-all duration-150 ${
        disabled
          ? 'bg-ivory/50 border-[#E8DFD3]/40 opacity-50'
          : 'bg-white border-[#E8DFD3]/80 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-charcoal">{label}</span>
          {required && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose/30 text-charcoal font-medium">
              Required
            </span>
          )}
        </div>
        {item && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onFindCompatible(item)}
              className="inline-flex items-center gap-1 text-[11px] text-taupe hover:text-charcoal transition-colors"
              title="What goes with this?"
            >
              <Sparkles className="w-3 h-3" />
              Match
            </button>
            <button
              type="button"
              onClick={onClear}
              aria-label={`Remove ${label}`}
              className="p-1 rounded-md text-taupe hover:bg-ivory hover:text-charcoal transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {item ? (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-ivory overflow-hidden flex items-center justify-center shrink-0">
            {thumb ? (
              <img
                src={thumb}
                alt={item.name || label}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-taupe">{label}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-charcoal truncate">
              {item.name || item.subcategory || item.category}
            </p>
            <p className="text-xs text-taupe capitalize truncate">
              {[item.primary_colour, item.formality?.replace(/_/g, ' ')]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onChoose}
            disabled={disabled}
            className="text-xs text-taupe hover:text-charcoal underline shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onChoose}
          disabled={disabled}
          className="w-full py-2.5 rounded-lg border border-dashed border-[#A99B8C]/60 text-xs font-medium text-taupe hover:border-charcoal hover:text-charcoal hover:bg-ivory/60 transition-colors duration-150 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Choose from wardrobe
        </button>
      )}
    </div>
  );
}
