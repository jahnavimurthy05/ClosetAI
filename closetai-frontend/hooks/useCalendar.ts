'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OutfitCalendarEntry } from '@/types';

export function useCalendar() {
  const [entries, setEntries] = useState<OutfitCalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calendar');
      if (!res.ok) {
        throw new Error('Failed to fetch calendar entries');
      }
      const data = await res.json();
      setEntries(data.entries ?? data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getEntriesForMonth = useCallback(
    (year: number, month: number): OutfitCalendarEntry[] => {
      return entries.filter((entry) => {
        const [y, m] = entry.date.split('-').map(Number);
        if (y && m) {
          return y === year && m - 1 === month;
        }
        const parsed = new Date(entry.date);
        return parsed.getFullYear() === year && parsed.getMonth() === month;
      });
    },
    [entries]
  );

  const saveEntry = useCallback(
    async (
      entry: Partial<OutfitCalendarEntry>
    ): Promise<OutfitCalendarEntry | null> => {
      try {
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (!res.ok) {
          throw new Error('Failed to save calendar entry');
        }
        const data = await res.json();
        await fetchAll();
        return data.entry ?? data.data ?? null;
      } catch {
        return null;
      }
    },
    [fetchAll]
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<OutfitCalendarEntry>
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/calendar/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          throw new Error('Failed to update calendar entry');
        }
        await fetchAll();
        return true;
      } catch {
        return false;
      }
    },
    [fetchAll]
  );

  return {
    entries,
    isLoading,
    error,
    getEntriesForMonth,
    saveEntry,
    updateEntry,
    refetch: fetchAll,
  };
}
