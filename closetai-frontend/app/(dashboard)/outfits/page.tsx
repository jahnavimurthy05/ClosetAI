'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Briefcase,
  FileText,
  Coffee,
  ShoppingBag,
  Music,
  Cake,
  Heart,
  Users,
  Plane,
  Utensils,
  Star,
  Sun,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RecommendationCard } from '@/components/outfits/RecommendationCard';
import { useOutfits } from '@/hooks/useOutfits';
import type { Outfit, WardrobeItem } from '@/types';

interface OccasionOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface RawRecommendation {
  id?: string;
  name?: string | null;
  occasion?: string | null;
  score?: number | null;
  explanation?: Record<string, unknown>;
  items?: Array<
    | { wardrobe_item_id: string; role?: string | null; wardrobe_item?: WardrobeItem }
    | WardrobeItem
  >;
}

const OCCASIONS: OccasionOption[] = [
  { id: 'college', label: 'College', icon: GraduationCap },
  { id: 'office', label: 'Office', icon: Briefcase },
  { id: 'interview', label: 'Interview', icon: FileText },
  { id: 'casual_outing', label: 'Casual Outing', icon: Coffee },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'party', label: 'Party', icon: Music },
  { id: 'birthday', label: 'Birthday', icon: Cake },
  { id: 'wedding', label: 'Wedding', icon: Heart },
  { id: 'family_function', label: 'Family Function', icon: Users },
  { id: 'date', label: 'Date', icon: Heart },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'dinner', label: 'Dinner', icon: Utensils },
  { id: 'festive', label: 'Festive', icon: Star },
  { id: 'daily_wear', label: 'Daily Wear', icon: Sun },
];

function normalizeRecommendation(
  raw: RawRecommendation,
  occasion: string,
  index: number
): Outfit {
  const mappedItems = (raw.items ?? []).map((entry, idx) => {
    if ('wardrobe_item_id' in entry) {
      return {
        id: `rec-item-${index}-${idx}`,
        outfit_id: raw.id || `temp-${index}`,
        wardrobe_item_id: entry.wardrobe_item_id,
        role: entry.role ?? null,
        position_order: idx,
        wardrobe_item: entry.wardrobe_item,
      };
    }
    return {
      id: `rec-item-${index}-${idx}`,
      outfit_id: raw.id || `temp-${index}`,
      wardrobe_item_id: entry.id,
      role: entry.category ?? null,
      position_order: idx,
      wardrobe_item: entry,
    };
  });

  return {
    id: raw.id || `temp-${index}`,
    user_id: '',
    name: raw.name ?? `Look ${index + 1}`,
    occasion: raw.occasion ?? occasion,
    season: null,
    score: raw.score ?? null,
    explanation: raw.explanation ?? {},
    is_favourite: false,
    created_at: '',
    updated_at: '',
    items: mappedItems,
  };
}

export default function OutfitsPage() {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Outfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { saveOutfit, markWorn } = useOutfits();

  const handleGenerate = async () => {
    if (!selectedOccasion) return;
    setIsGenerating(true);
    setError(null);
    setHasGenerated(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/outfits/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: selectedOccasion,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      const rawList: RawRecommendation[] =
        data.outfits ?? data.recommendations ?? [];
      setRecommendations(
        rawList.map((r, idx) => normalizeRecommendation(r, selectedOccasion, idx))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate outfits'
      );
      setRecommendations([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const toSaveItems = (outfit: Outfit) =>
    (outfit.items ?? []).map((i, idx) => ({
      wardrobe_item_id: i.wardrobe_item_id,
      role: i.role,
      position_order: idx,
    }));

  const handleSave = async (outfit: Outfit) => {
    const saved = await saveOutfit({
      name: outfit.name,
      occasion: outfit.occasion || selectedOccasion,
      season: outfit.season,
      score: outfit.score,
      explanation: outfit.explanation,
      items: toSaveItems(outfit),
    });
    if (saved) {
      setStatusMessage(`Saved "${saved.name || 'Outfit'}" to your collection.`);
    }
  };

  const handleMarkWorn = async (outfit: Outfit) => {
    if (outfit.id && !outfit.id.startsWith('temp-')) {
      await markWorn(outfit.id);
    } else {
      const saved = await saveOutfit({
        name: outfit.name,
        occasion: outfit.occasion || selectedOccasion,
        score: outfit.score,
        explanation: outfit.explanation,
        items: toSaveItems(outfit),
      });
      if (saved) await markWorn(saved.id);
    }
    setStatusMessage('Outfit logged as worn today.');
  };

  const handleFeedback = async (outfit: Outfit, type: 'like' | 'dislike') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_id: outfit.id,
          feedback_type: type,
          context: { occasion: selectedOccasion },
        }),
      });
    } catch {
      // Feedback is best-effort
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">
            Outfit Recommendations
          </h1>
          <p className="text-sm text-taupe mt-1">
            Select an occasion and let ClosetAI curate looks from your wardrobe.
          </p>
        </div>
        {statusMessage && (
          <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Occasion Selector Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-taupe">
          Choose an Occasion
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {OCCASIONS.map((occ) => {
            const Icon = occ.icon;
            const isSelected = selectedOccasion === occ.id;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => setSelectedOccasion(occ.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all duration-150 ${
                  isSelected
                    ? 'bg-charcoal text-white border-charcoal shadow-sm'
                    : 'bg-white text-charcoal border-[#E8DFD3] hover:border-taupe hover:bg-ivory'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isSelected ? 'text-rose' : 'text-taupe'}`}
                />
                <span className="text-xs font-medium leading-tight">
                  {occ.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedOccasion && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-taupe transition-colors duration-150 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-rose" />
              {isGenerating ? 'Styling Outfits...' : 'Generate Outfits'}
            </button>
          </motion.div>
        )}
      </section>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl shadow-sm p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-[#E8DFD3]/60 rounded" />
                <div className="h-5 w-16 bg-[#E8DFD3]/60 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-28 bg-ivory rounded-lg" />
                <div className="h-28 bg-ivory rounded-lg" />
                <div className="h-24 bg-ivory rounded-lg" />
                <div className="h-24 bg-ivory rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-[#E8DFD3]/50 rounded" />
                <div className="h-3 w-4/5 bg-[#E8DFD3]/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isGenerating && recommendations.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-charcoal">
            Curated Looks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((outfit, idx) => (
              <RecommendationCard
                key={outfit.id || idx}
                outfit={outfit}
                index={idx}
                onSave={handleSave}
                onMarkWorn={handleMarkWorn}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State after Generation */}
      {!isGenerating && hasGenerated && !error && recommendations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-taupe mx-auto" />
          <p className="font-serif text-xl text-charcoal">
            No matching outfits found
          </p>
          <p className="text-sm text-taupe max-w-md mx-auto">
            Try adding a few more tops, bottoms, or dresses to your wardrobe so
            ClosetAI can build combinations for this occasion.
          </p>
        </div>
      )}
    </motion.div>
  );
}
