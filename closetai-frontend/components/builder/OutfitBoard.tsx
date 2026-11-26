'use client';

import { motion } from 'framer-motion';
import { Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { WardrobeItem } from '@/types';
import type { BuilderSlotKey } from '@/components/builder/OutfitSlot';
import { checkOutfitCompatibility } from '@/lib/fashion/compatibility';

interface OutfitBoardProps {
  slots: Record<BuilderSlotKey, WardrobeItem | null>;
  outfitName: string;
  onOutfitNameChange: (name: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function OutfitBoard({
  slots,
  outfitName,
  onOutfitNameChange,
  onSave,
  isSaving,
}: OutfitBoardProps) {
  const selectedItems = Object.entries(slots)
    .filter((entry): entry is [BuilderSlotKey, WardrobeItem] => entry[1] !== null);

  const itemsList = selectedItems.map(([, item]) => item);
  const compatibility = checkOutfitCompatibility(itemsList);

  const scoreBadge =
    compatibility.score >= 75
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : compatibility.score >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/70 p-6 flex flex-col gap-5 sticky top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-charcoal">
            Outfit Flat-Lay Board
          </h2>
          <p className="text-xs text-taupe">
            {itemsList.length} piece{itemsList.length === 1 ? '' : 's'} selected
          </p>
        </div>

        {itemsList.length > 0 && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${scoreBadge}`}
          >
            Compatibility: {compatibility.score}%
          </span>
        )}
      </div>

      <input
        type="text"
        value={outfitName}
        onChange={(e) => onOutfitNameChange(e.target.value)}
        placeholder="Name this outfit (e.g. Friday Smart Casual)"
        className="w-full rounded-lg border border-[#E8DFD3] px-3.5 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-taupe"
      />

      {/* Flat-lay Canvas */}
      <div className="min-h-[320px] rounded-xl bg-ivory p-4 border border-[#E8DFD3]/60">
        {selectedItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selectedItems.map(([slotKey, item]) => {
              const thumb =
                item.processed_image_url ||
                item.thumbnail_url ||
                item.original_image_url;
              return (
                <motion.div
                  key={slotKey}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-3 shadow-sm border border-[#E8DFD3]/50 flex flex-col items-center"
                >
                  <span className="text-[10px] uppercase tracking-wider text-taupe mb-1.5">
                    {slotKey}
                  </span>
                  <div className="w-full h-28 flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name || slotKey}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Layers className="w-6 h-6 text-taupe" />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-charcoal truncate w-full text-center">
                    {item.name || item.category}
                  </p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-center text-taupe gap-2">
            <Layers className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium text-charcoal">
              Your flat-lay board is empty
            </p>
            <p className="text-xs max-w-xs">
              Select items from the slots on the left to preview how they pair
              together.
            </p>
          </div>
        )}
      </div>

      {/* Compatibility Feedback */}
      {itemsList.length > 0 && (
        <div className="space-y-2 text-xs">
          {compatibility.issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
          {compatibility.suggestions.map((sug, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-charcoal/80 bg-ivory px-3 py-2 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-taupe shrink-0" />
              <span>{sug}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={itemsList.length === 0 || isSaving}
        className="w-full py-3 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-taupe transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving Outfit...' : 'Save Outfit'}
      </button>
    </div>
  );
}
