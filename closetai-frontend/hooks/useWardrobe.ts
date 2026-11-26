'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WardrobeItem } from '@/types';

export interface WardrobeFilters {
  category?: string;
  occasion?: string;
  season?: string;
  search?: string;
}

export function useWardrobe(filters?: WardrobeFilters) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.occasion) params.set('occasion', filters.occasion);
      if (filters?.season) params.set('season', filters.season);
      if (filters?.search) params.set('search', filters.search);

      const query = params.toString();
      const res = await fetch(`/api/wardrobe${query ? `?${query}` : ''}`);
      if (!res.ok) {
        throw new Error('Failed to fetch wardrobe');
      }
      const data = await res.json();
      const fetched: WardrobeItem[] = data.items ?? data.data ?? [];
      setItems(fetched);
      setTotalCount(data.total ?? data.count ?? fetched.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.category, filters?.occasion, filters?.season, filters?.search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, isLoading, error, refetch: fetchItems, totalCount };
}
