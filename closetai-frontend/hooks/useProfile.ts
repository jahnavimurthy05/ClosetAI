'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  UserProfile,
  BodyProfile,
  ColourProfile,
  StylePreferences,
} from '@/types';

interface ProfileState {
  profile: UserProfile | null;
  bodyProfile: BodyProfile | null;
  colourProfile: ColourProfile | null;
  stylePrefs: StylePreferences | null;
}

export interface ProfileUpdatePayload {
  profile?: Partial<UserProfile>;
  body_profile?: Partial<BodyProfile>;
  colour_profile?: Partial<ColourProfile>;
  style_preferences?: Partial<StylePreferences>;
}

export function useProfile() {
  const [data, setData] = useState<ProfileState>({
    profile: null,
    bodyProfile: null,
    colourProfile: null,
    stylePrefs: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      const d = await res.json();
      setData({
        profile: d.profile ?? null,
        bodyProfile: d.body_profile ?? null,
        colourProfile: d.colour_profile ?? null,
        stylePrefs: d.style_preferences ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdatePayload): Promise<boolean> => {
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          throw new Error('Failed to update profile');
        }
        await fetchProfile();
        return true;
      } catch {
        return false;
      }
    },
    [fetchProfile]
  );

  return {
    ...data,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
