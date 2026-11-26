'use client';

import { format, isToday, isSameMonth } from 'date-fns';
import type { OutfitCalendarEntry } from '@/types';

const OCCASION_DOT_COLOURS: Record<string, string> = {
  office: 'bg-slate-600',
  interview: 'bg-indigo-600',
  college: 'bg-blue-500',
  casual_outing: 'bg-emerald-500',
  party: 'bg-purple-500',
  wedding: 'bg-rose',
  date: 'bg-pink-500',
  dinner: 'bg-amber-600',
  festive: 'bg-yellow-500',
  travel: 'bg-cyan-500',
};

interface CalendarDayCellProps {
  date: Date;
  currentMonth: Date;
  entry?: OutfitCalendarEntry;
  isSelected: boolean;
  onSelect: (date: Date) => void;
}

export function CalendarDayCell({
  date,
  currentMonth,
  entry,
  isSelected,
  onSelect,
}: CalendarDayCellProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const firstItem = entry?.outfit?.items?.[0]?.wardrobe_item;
  const thumb =
    firstItem?.thumbnail_url ||
    firstItem?.processed_image_url ||
    firstItem?.original_image_url;

  const dotClass = entry?.occasion
    ? OCCASION_DOT_COLOURS[entry.occasion] ?? 'bg-taupe'
    : 'bg-taupe';

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={`min-h-[88px] sm:min-h-[108px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
        isSelected
          ? 'border-charcoal ring-2 ring-charcoal/15 bg-white'
          : inMonth
          ? 'border-[#E8DFD3]/80 bg-white hover:border-taupe'
          : 'border-transparent bg-ivory/40 opacity-50 hover:opacity-80'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center ${
            today
              ? 'bg-charcoal text-white'
              : inMonth
              ? 'text-charcoal'
              : 'text-taupe'
          }`}
        >
          {format(date, 'd')}
        </span>

        {entry && (
          <span
            className={`w-2 h-2 rounded-full ${dotClass}`}
            title={entry.occasion || 'Planned'}
          />
        )}
      </div>

      {entry ? (
        <div className="mt-1.5 space-y-1 w-full">
          {thumb && (
            <div className="w-full h-10 rounded-md bg-ivory overflow-hidden flex items-center justify-center">
              <img
                src={thumb}
                alt={entry.event_name || 'Planned outfit'}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <p className="text-[11px] font-medium text-charcoal truncate">
            {entry.event_name ||
              entry.occasion?.replace(/_/g, ' ') ||
              'Planned'}
          </p>
          {entry.status === 'worn' && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Worn
            </span>
          )}
        </div>
      ) : (
        <span className="text-[10px] text-taupe/50 mt-auto">No plan</span>
      )}
    </button>
  );
}
