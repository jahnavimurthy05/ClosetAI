'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles } from 'lucide-react';
import type { WardrobeItem } from '@/types';
import type { BuilderSlotKey } from '@/components/builder/OutfitSlot';

const SLOT_CATEGORY_MAP: Record<BuilderSlotKey, string[]> = {
  top: ['tops', 'activewear'],
  bottom: ['bottoms', 'activewear'],
  dress: ['dresses'],
  footwear: ['footwear'],
  bag: ['bags', 'accessories'],
  jewellery: ['accessories'],
  outerwear: ['outerwear'],
};

interface WardrobeSelectorProps {
  isOpen: boolean;
  slotKey: BuilderSlotKey | null;
  slotLabel: string;
  items: WardrobeItem[];
  compatibleIds: Set<string>;
  onSelect: (item: WardrobeItem) => void;
  onClose: () => void;
}

export function WardrobeSelector({
  isOpen,
  slotKey,
  slotLabel,
  items,
  compatibleIds,
  onSelect,
  onClose,
}: WardrobeSelectorProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const allowedCategories = slotKey ? SLOT_CATEGORY_MAP[slotKey] : [];
    return items.filter((item) => {
      if (!item.is_available) return false;
      const matchesCategory =
        showAll ||
        allowedCategories.length === 0 ||
        allowedCategories.includes(item.category);
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.name ?? '').toLowerCase().includes(q) ||
        (item.primary_colour ?? '').toLowerCase().includes(q) ||
        (item.subcategory ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, slotKey, search, showAll]);

  return (
    <AnimatePresence>
      {isOpen && slotKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[82vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8DFD3] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-charcoal">
                  Select {slotLabel}
                </h3>
                <p className="text-xs text-taupe">
                  Choose an item from your wardrobe
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-taupe hover:bg-ivory hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Toggle */}
            <div className="px-6 py-3 bg-ivory/60 border-b border-[#E8DFD3]/60 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-taupe absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or colour..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DFD3] bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-taupe"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  showAll
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-charcoal border-[#E8DFD3] hover:bg-ivory'
                }`}
              >
                {showAll ? 'Showing All Categories' : 'Show All Categories'}
              </button>
            </div>

            {/* Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filtered.map((item) => {
                const thumb =
                  item.processed_image_url ||
                  item.thumbnail_url ||
                  item.original_image_url;
                const isHighlighted = compatibleIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className={`group rounded-xl border p-2.5 text-left transition-all duration-150 ${
                      isHighlighted
                        ? 'border-rose ring-2 ring-rose/40 bg-rose/10'
                        : 'border-[#E8DFD3] bg-white hover:border-charcoal'
                    }`}
                  >
                    <div className="relative h-28 rounded-lg bg-ivory overflow-hidden flex items-center justify-center mb-2">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.name || item.category}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
                        />
                      ) : (
                        <span className="text-xs text-taupe capitalize">
                          {item.category}
                        </span>
                      )}
                      {isHighlighted && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-charcoal text-white text-[10px]">
                          <Sparkles className="w-2.5 h-2.5 text-rose" />
                          Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-charcoal truncate">
                      {item.name || item.subcategory || item.category}
                    </p>
                    <p className="text-[11px] text-taupe capitalize truncate">
                      {item.primary_colour || item.category}
                    </p>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-taupe">
                  No matching wardrobe items found.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
