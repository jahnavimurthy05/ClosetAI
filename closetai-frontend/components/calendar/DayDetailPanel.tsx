'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CloudSun,
  Sparkles,
  CheckCircle2,
  SkipForward,
  Shirt,
} from 'lucide-react';
import type { Outfit, OutfitCalendarEntry, WeatherData } from '@/types';

const OCCASION_OPTIONS = [
  'daily_wear',
  'college',
  'office',
  'interview',
  'casual_outing',
  'party',
  'dinner',
  'date',
  'wedding',
  'family_function',
  'travel',
  'festive',
];

interface DayDetailPanelProps {
  date: Date | null;
  entry?: OutfitCalendarEntry;
  outfits: Outfit[];
  weather: WeatherData | null;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    date: string;
    event_name: string;
    occasion: string;
    outfit_id: string | null;
    status: 'planned' | 'worn' | 'skipped';
  }) => Promise<void>;
  onGetRecommendation: (occasion: string, dateStr: string) => Promise<Outfit | null>;
}

export function DayDetailPanel({
  date,
  entry,
  outfits,
  weather,
  onClose,
  onSave,
  onGetRecommendation,
}: DayDetailPanelProps) {
  const [eventName, setEventName] = useState('');
  const [occasion, setOccasion] = useState('daily_wear');
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    setEventName(entry?.event_name ?? '');
    setOccasion(entry?.occasion ?? 'daily_wear');
    setSelectedOutfitId(entry?.outfit_id ?? '');
  }, [entry, date]);

  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const activeOutfit =
    outfits.find((o) => o.id === selectedOutfitId) ?? entry?.outfit ?? null;

  const handleRecommend = async () => {
    if (!date) return;
    setIsRecommending(true);
    const rec = await onGetRecommendation(occasion, dateStr);
    if (rec?.id) {
      setSelectedOutfitId(rec.id);
    }
    setIsRecommending(false);
  };

  const handleSubmit = async (status: 'planned' | 'worn' | 'skipped') => {
    if (!date) return;
    setIsSaving(true);
    await onSave({
      id: entry?.id,
      date: dateStr,
      event_name: eventName,
      occasion,
      outfit_id: selectedOutfitId || null,
      status,
    });
    setIsSaving(false);
  };

  return (
    <AnimatePresence>
      {date && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E8DFD3] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-taupe">
                  {format(date, 'EEEE')}
                </p>
                <h2 className="font-serif text-2xl font-semibold text-charcoal">
                  {format(date, 'MMMM d, yyyy')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-taupe hover:bg-ivory hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Weather Display */}
              <div className="p-3.5 rounded-xl bg-ivory flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudSun className="w-5 h-5 text-taupe" />
                  <div>
                    <p className="text-xs font-medium text-charcoal">
                      {weather
                        ? `${weather.temperature_c}°C · ${weather.condition}`
                        : 'Weather Forecast'}
                    </p>
                    <p className="text-[11px] text-taupe">
                      {weather
                        ? `${weather.city} · Feels like ${weather.feels_like_c}°C`
                        : 'Connect OpenWeather API for live forecast'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Name */}
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1.5">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Client Presentation, Brunch"
                  className="w-full rounded-lg border border-[#E8DFD3] px-3.5 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-taupe"
                />
              </div>

              {/* Occasion Selector */}
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1.5">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full rounded-lg border border-[#E8DFD3] px-3.5 py-2 text-sm text-charcoal bg-white capitalize focus:outline-none focus:ring-2 focus:ring-taupe"
                >
                  {OCCASION_OPTIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recommend Button */}
              <button
                type="button"
                onClick={handleRecommend}
                disabled={isRecommending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose/30 text-charcoal text-sm font-medium hover:bg-rose/50 transition-colors duration-150 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-charcoal" />
                {isRecommending
                  ? 'Finding Best Look...'
                  : 'Get Outfit Recommendation'}
              </button>

              {/* Change / Select Saved Outfit */}
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1.5">
                  Assigned Outfit
                </label>
                <select
                  value={selectedOutfitId}
                  onChange={(e) => setSelectedOutfitId(e.target.value)}
                  className="w-full rounded-lg border border-[#E8DFD3] px-3.5 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-taupe"
                >
                  <option value="">-- Select a saved outfit --</option>
                  {outfits.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || 'Untitled Outfit'}{' '}
                      {o.occasion ? `(${o.occasion.replace(/_/g, ' ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Outfit Preview */}
              {activeOutfit ? (
                <div className="p-4 rounded-xl bg-ivory border border-[#E8DFD3]/70 space-y-2">
                  <p className="text-xs font-semibold text-charcoal">
                    {activeOutfit.name || 'Selected Outfit'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(activeOutfit.items ?? []).slice(0, 3).map((oi, idx) => {
                      const item = oi.wardrobe_item;
                      const src =
                        item?.thumbnail_url ||
                        item?.processed_image_url ||
                        item?.original_image_url;
                      return (
                        <div
                          key={oi.id || idx}
                          className="h-20 rounded-lg bg-white p-1.5 flex items-center justify-center"
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={item?.name || 'Item'}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Shirt className="w-5 h-5 text-taupe" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-[#E8DFD3] text-center text-xs text-taupe">
                  No outfit assigned yet
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#E8DFD3] space-y-2.5 bg-ivory/40">
              <button
                type="button"
                onClick={() => handleSubmit('planned')}
                disabled={isSaving}
                className="w-full py-2.5 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-taupe transition-colors duration-150 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Plan'}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSubmit('worn')}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Worn
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('skipped')}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#E8DFD3] bg-white text-taupe text-xs font-medium hover:bg-ivory transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Mark Skipped
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
