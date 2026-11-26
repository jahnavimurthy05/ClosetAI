'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bookmark,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Palette,
  Calendar,
  Award,
} from 'lucide-react';
import type { Outfit, WardrobeItem } from '@/types';

interface RecommendationCardProps {
  outfit: Outfit;
  index: number;
  onSave: (outfit: Outfit) => Promise<void> | void;
  onMarkWorn: (outfit: Outfit) => Promise<void> | void;
  onFeedback: (outfit: Outfit, type: 'like' | 'dislike') => Promise<void> | void;
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function getExplanationText(
  explanation: Record<string, unknown>,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    const val = explanation[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
  }
  return fallback;
}

export function RecommendationCard({
  outfit,
  index,
  onSave,
  onMarkWorn,
  onFeedback,
}: RecommendationCardProps) {
  const [saved, setSaved] = useState(false);
  const [worn, setWorn] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const score = Math.round(outfit.score ?? 80);
  const items: WardrobeItem[] = (outfit.items ?? [])
    .map((oi) => oi.wardrobe_item)
    .filter((w): w is WardrobeItem => Boolean(w));

  const explanation = outfit.explanation ?? {};
  const colourNote = getExplanationText(
    explanation,
    ['colour_note', 'color_note', 'colour'],
    'Balanced colour harmony tailored to your wardrobe palette.'
  );
  const occasionNote = getExplanationText(
    explanation,
    ['occasion_note', 'occasion'],
    `Curated for ${outfit.occasion?.replace(/_/g, ' ') || 'your occasion'}.`
  );
  const formalityNote = getExplanationText(
    explanation,
    ['formality_note', 'formality'],
    'Cohesive formality level across all pieces.'
  );

  const handleSave = async () => {
    setBusyAction('save');
    await onSave(outfit);
    setSaved(true);
    setBusyAction(null);
  };

  const handleWorn = async () => {
    setBusyAction('worn');
    await onMarkWorn(outfit);
    setWorn(true);
    setBusyAction(null);
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    setFeedback(type);
    await onFeedback(outfit, type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/70 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F8F6F2] flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-charcoal">
            {outfit.name || `Look ${index + 1}`}
          </h3>
          {outfit.occasion && (
            <p className="text-xs text-taupe capitalize mt-0.5">
              {outfit.occasion.replace(/_/g, ' ')}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBadgeClasses(score)}`}
        >
          {score} / 100
        </span>
      </div>

      {/* Fashion Board Collage */}
      <div className="p-4 bg-ivory/60">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {items.slice(0, 6).map((item, idx) => {
              const imgUrl =
                item.processed_image_url ||
                item.thumbnail_url ||
                item.original_image_url;
              return (
                <div
                  key={item.id || idx}
                  className={`relative rounded-lg bg-white border border-[#E8DFD3]/60 overflow-hidden flex flex-col items-center justify-center p-2 ${
                    idx === 0 && items.length >= 3 ? 'sm:row-span-2 min-h-[160px]' : 'h-28'
                  }`}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.name || item.category}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Sparkles className="w-6 h-6 text-taupe" />
                  )}
                  <span className="mt-1 text-[11px] text-charcoal/80 truncate w-full text-center capitalize">
                    {item.name || item.category}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 rounded-lg bg-white border border-dashed border-[#E8DFD3] flex items-center justify-center text-xs text-taupe">
            No item previews available
          </div>
        )}
      </div>

      {/* Explanation Notes */}
      <div className="px-5 py-4 space-y-2.5 flex-1">
        <div className="flex items-start gap-2.5 text-xs text-charcoal/85">
          <Palette className="w-4 h-4 text-taupe shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-charcoal">Colour Note: </span>
            {colourNote}
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-charcoal/85">
          <Calendar className="w-4 h-4 text-taupe shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-charcoal">Occasion Note: </span>
            {occasionNote}
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-charcoal/85">
          <Award className="w-4 h-4 text-taupe shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-charcoal">Formality Note: </span>
            {formalityNote}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3.5 border-t border-[#F8F6F2] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved || busyAction === 'save'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-charcoal text-white hover:bg-taupe'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {saved ? 'Saved' : busyAction === 'save' ? 'Saving...' : 'Save Outfit'}
          </button>
          <button
            type="button"
            onClick={handleWorn}
            disabled={worn || busyAction === 'worn'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150 ${
              worn
                ? 'bg-rose/30 text-charcoal border-rose'
                : 'border-[#E8DFD3] text-charcoal hover:bg-ivory'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {worn ? 'Worn' : busyAction === 'worn' ? 'Logging...' : 'Mark as Worn'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Thumbs up"
            onClick={() => handleFeedback('like')}
            className={`p-1.5 rounded-lg transition-colors duration-150 ${
              feedback === 'like'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-taupe hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Thumbs down"
            onClick={() => handleFeedback('dislike')}
            className={`p-1.5 rounded-lg transition-colors duration-150 ${
              feedback === 'dislike'
                ? 'bg-red-100 text-red-700'
                : 'text-taupe hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
