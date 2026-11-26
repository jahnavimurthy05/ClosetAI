'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { useOutfits } from '@/hooks/useOutfits';
import { useWeather } from '@/hooks/useWeather';
import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { DayDetailPanel } from '@/components/calendar/DayDetailPanel';
import type { Outfit, OutfitCalendarEntry, WardrobeItem } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function normalizeRecommendedOutfit(
  raw: RawRecommendation,
  occasion: string,
  index: number
): Outfit {
  const mappedItems = (raw.items ?? []).map((entry, idx) => {
    if ('wardrobe_item_id' in entry) {
      return {
        id: `rec-item-${idx}`,
        outfit_id: raw.id || `temp-${index}`,
        wardrobe_item_id: entry.wardrobe_item_id,
        role: entry.role ?? null,
        position_order: idx,
        wardrobe_item: entry.wardrobe_item,
      };
    }
    return {
      id: `rec-item-${idx}`,
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
    name: raw.name ?? `${occasion.replace(/_/g, ' ')} Look`,
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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const { entries, isLoading, error, saveEntry, updateEntry } = useCalendar();
  const { outfits, saveOutfit } = useOutfits();
  const { weather } = useWeather();

  const days = useMemo(() => {
    if (!currentMonth) return [];
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const entryByDate = useMemo(() => {
    const map = new Map<string, OutfitCalendarEntry>();
    for (const entry of entries) {
      map.set(entry.date.slice(0, 10), entry);
    }
    return map;
  }, [entries]);

  const selectedEntry = selectedDate
    ? entryByDate.get(format(selectedDate, 'yyyy-MM-dd'))
    : undefined;

  const handleSaveDay = async (payload: {
    id?: string;
    date: string;
    event_name: string;
    occasion: string;
    outfit_id: string | null;
    status: 'planned' | 'worn' | 'skipped';
  }) => {
    if (payload.id) {
      await updateEntry(payload.id, {
        event_name: payload.event_name || null,
        occasion: payload.occasion,
        outfit_id: payload.outfit_id,
        status: payload.status,
      });
    } else {
      await saveEntry({
        date: payload.date,
        event_name: payload.event_name || null,
        occasion: payload.occasion,
        outfit_id: payload.outfit_id,
        status: payload.status,
        weather_snapshot: weather ?? null,
      });
    }
    setSelectedDate(null);
  };

  const handleGetRecommendation = async (
    occasion: string,
    dateStr: string
  ): Promise<Outfit | null> => {
    try {
      const res = await fetch('/api/outfits/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion, date: dateStr }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const rawList: RawRecommendation[] =
        data.outfits ?? data.recommendations ?? [];
      if (!rawList[0]) return null;

      const topOutfit = normalizeRecommendedOutfit(rawList[0], occasion, 0);
      if (topOutfit.id && !topOutfit.id.startsWith('temp-')) {
        return topOutfit;
      }

      return await saveOutfit({
        name: topOutfit.name || `${occasion.replace(/_/g, ' ')} Look`,
        occasion,
        score: topOutfit.score,
        explanation: topOutfit.explanation,
        items: (topOutfit.items ?? []).map((i, idx) => ({
          wardrobe_item_id: i.wardrobe_item_id,
          role: i.role,
          position_order: idx,
        })),
      });
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">
            Outfit Calendar
          </h1>
          <p className="text-sm text-taupe mt-1">
            Plan your looks ahead and track what you wear.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-[#E8DFD3]/70">
          <button
            type="button"
            onClick={() =>
              setCurrentMonth((m) => (m ? subMonths(m, 1) : m))
            }
            className="p-1.5 rounded-lg text-charcoal hover:bg-ivory transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-charcoal min-w-[140px] text-center">
            {currentMonth ? format(currentMonth, 'MMMM yyyy') : 'Loading...'}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentMonth((m) => (m ? addMonths(m, 1) : m))
            }
            className="p-1.5 rounded-lg text-charcoal hover:bg-ivory transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Calendar Grid */}
      {isLoading || !currentMonth ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white animate-pulse border border-[#E8DFD3]/50"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-[#E8DFD3]/70">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium uppercase tracking-wider text-taupe py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              return (
                <CalendarDayCell
                  key={key}
                  date={day}
                  currentMonth={currentMonth}
                  entry={entryByDate.get(key)}
                  isSelected={
                    selectedDate ? format(selectedDate, 'yyyy-MM-dd') === key : false
                  }
                  onSelect={setSelectedDate}
                />
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="mt-4 pt-4 border-t border-ivory flex items-center justify-center gap-2 text-xs text-taupe">
              <CalendarIcon className="w-4 h-4" />
              <span>Click any day to plan your first outfit.</span>
            </div>
          )}
        </div>
      )}

      <DayDetailPanel
        date={selectedDate}
        entry={selectedEntry}
        outfits={outfits}
        weather={weather}
        onClose={() => setSelectedDate(null)}
        onSave={handleSaveDay}
        onGetRecommendation={handleGetRecommendation}
      />
    </motion.div>
  );
}
