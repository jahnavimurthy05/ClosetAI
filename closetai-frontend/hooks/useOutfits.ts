'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Outfit } from '@/types';

export interface SaveOutfitInput {
  name?: string | null;
  occasion?: string | null;
  season?: Outfit['season'];
  score?: number | null;
  explanation?: Record<string, unknown>;
  is_favourite?: boolean;
  item_ids?: string[];
  items?: { wardrobe_item_id: string; role?: string | null; position_order?: number }[];
}

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutfits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/outfits');
      if (!res.ok) {
        throw new Error('Failed to fetch outfits');
      }
      const data = await res.json();
      setOutfits(data.outfits ?? data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  const saveOutfit = useCallback(
    async (outfit: SaveOutfitInput): Promise<Outfit | null> => {
      try {
        const normalizedItems =
          outfit.items ??
          (outfit.item_ids ?? []).map((id, idx) => ({
            wardrobe_item_id: id,
            position_order: idx,
          }));

        const res = await fetch('/api/outfits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: outfit.name,
            occasion: outfit.occasion,
            season: outfit.season,
            score: outfit.score,
            explanation: outfit.explanation,
            is_favourite: outfit.is_favourite,
            items: normalizedItems,
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to save outfit');
        }
        const data = await res.json();
        await fetchOutfits();
        return data.outfit ?? data.data ?? null;
      } catch {
        return null;
      }
    },
    [fetchOutfits]
  );

  const deleteOutfit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/outfits/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete outfit');
      }
      setOutfits((prev) => prev.filter((o) => o.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const markWorn = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/outfits/${id}/worn`, { method: 'POST' });
        if (!res.ok) {
          throw new Error('Failed to mark outfit as worn');
        }
        await fetchOutfits();
        return true;
      } catch {
        return false;
      }
    },
    [fetchOutfits]
  );

  return {
    outfits,
    isLoading,
    error,
    saveOutfit,
    deleteOutfit,
    markWorn,
    refetch: fetchOutfits,
  };
}
