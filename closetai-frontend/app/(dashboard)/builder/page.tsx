'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useWardrobe } from '@/hooks/useWardrobe';
import { useOutfits } from '@/hooks/useOutfits';
import { getCompatibleItems } from '@/lib/fashion/compatibility';
import { OutfitSlot, type BuilderSlotKey } from '@/components/builder/OutfitSlot';
import { WardrobeSelector } from '@/components/builder/WardrobeSelector';
import { OutfitBoard } from '@/components/builder/OutfitBoard';
import type { WardrobeItem } from '@/types';

const SLOT_CONFIG: { key: BuilderSlotKey; label: string; required?: boolean }[] = [
  { key: 'top', label: 'Top', required: true },
  { key: 'bottom', label: 'Bottom' },
  { key: 'dress', label: 'Dress (Alternative to Top + Bottom)' },
  { key: 'footwear', label: 'Footwear' },
  { key: 'bag', label: 'Bag' },
  { key: 'jewellery', label: 'Jewellery' },
  { key: 'outerwear', label: 'Outerwear' },
];

const INITIAL_SLOTS: Record<BuilderSlotKey, WardrobeItem | null> = {
  top: null,
  bottom: null,
  dress: null,
  footwear: null,
  bag: null,
  jewellery: null,
  outerwear: null,
};

export default function BuilderPage() {
  const { items, isLoading, error } = useWardrobe();
  const { saveOutfit } = useOutfits();

  const [slots, setSlots] = useState<Record<BuilderSlotKey, WardrobeItem | null>>(
    INITIAL_SLOTS
  );
  const [activeSlot, setActiveSlot] = useState<BuilderSlotKey | null>(null);
  const [outfitName, setOutfitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [matchAnchor, setMatchAnchor] = useState<WardrobeItem | null>(null);

  const compatibleMatches = useMemo(() => {
    if (!matchAnchor) return [];
    return getCompatibleItems(matchAnchor, items);
  }, [matchAnchor, items]);

  const compatibleIds = useMemo(
    () => new Set(compatibleMatches.map((m) => m.item.id)),
    [compatibleMatches]
  );

  const handleSelectItem = (item: WardrobeItem) => {
    if (!activeSlot) return;
    setSlots((prev) => {
      const next = { ...prev, [activeSlot]: item };
      if (activeSlot === 'dress') {
        next.top = null;
        next.bottom = null;
      } else if (activeSlot === 'top' || activeSlot === 'bottom') {
        next.dress = null;
      }
      return next;
    });
  };

  const handleSaveOutfit = async () => {
    const chosen = Object.entries(slots).filter(
      (entry): entry is [BuilderSlotKey, WardrobeItem] => entry[1] !== null
    );
    if (chosen.length === 0) return;

    setIsSaving(true);
    setSaveBanner(null);
    const saved = await saveOutfit({
      name: outfitName.trim() || 'Custom Outfit',
      occasion: 'casual_outing',
      items: chosen.map(([role, item], idx) => ({
        wardrobe_item_id: item.id,
        role,
        position_order: idx,
      })),
      item_ids: chosen.map(([, item]) => item.id),
    });
    setIsSaving(false);

    if (saved) {
      setSaveBanner(`Saved "${saved.name || 'Custom Outfit'}" to your outfits.`);
      setOutfitName('');
    }
  };

  const activeSlotLabel =
    SLOT_CONFIG.find((s) => s.key === activeSlot)?.label ?? '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">
            Virtual Outfit Builder
          </h1>
          <p className="text-sm text-taupe mt-1">
            Mix and match pieces from your wardrobe on an interactive flat-lay board.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSlots(INITIAL_SLOTS);
            setMatchAnchor(null);
            setSaveBanner(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8DFD3] bg-white text-xs font-medium text-charcoal hover:bg-ivory transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Board
        </button>
      </div>

      {saveBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          {saveBanner}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* What Goes With This Highlight Bar */}
      {matchAnchor && (
        <div className="bg-white rounded-xl shadow-sm border border-rose p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <Sparkles className="w-4 h-4 text-taupe" />
              <span>
                What goes with{' '}
                <strong>{matchAnchor.name || matchAnchor.category}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMatchAnchor(null)}
              className="text-xs text-taupe hover:text-charcoal underline"
            >
              Clear highlight
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {compatibleMatches.slice(0, 6).map(({ item, score, reason }) => {
              const thumb =
                item.processed_image_url ||
                item.thumbnail_url ||
                item.original_image_url;
              return (
                <div
                  key={item.id}
                  className="min-w-[140px] rounded-lg bg-ivory p-2.5 border border-[#E8DFD3]/70 shrink-0"
                >
                  <div className="h-16 bg-white rounded flex items-center justify-center mb-1.5 overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name || item.category}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-taupe">{item.category}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-charcoal truncate">
                    {item.name || item.category}
                  </p>
                  <p className="text-[10px] text-taupe truncate">
                    {score}% · {reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-7 h-[420px] bg-white rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Slots */}
          <div className="lg:col-span-5 space-y-3">
            {SLOT_CONFIG.map((slot) => {
              const hasDress = Boolean(slots.dress);
              const isDisabled =
                hasDress && (slot.key === 'top' || slot.key === 'bottom');
              return (
                <OutfitSlot
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  required={slot.required && !hasDress}
                  disabled={isDisabled}
                  item={slots[slot.key]}
                  onChoose={() => setActiveSlot(slot.key)}
                  onClear={() =>
                    setSlots((prev) => ({ ...prev, [slot.key]: null }))
                  }
                  onFindCompatible={(item) => setMatchAnchor(item)}
                />
              );
            })}
          </div>

          {/* Right Panel: Preview Board */}
          <div className="lg:col-span-7">
            <OutfitBoard
              slots={slots}
              outfitName={outfitName}
              onOutfitNameChange={setOutfitName}
              onSave={handleSaveOutfit}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      <WardrobeSelector
        isOpen={Boolean(activeSlot)}
        slotKey={activeSlot}
        slotLabel={activeSlotLabel}
        items={items}
        compatibleIds={compatibleIds}
        onSelect={handleSelectItem}
        onClose={() => setActiveSlot(null)}
      />
    </motion.div>
  );
}
