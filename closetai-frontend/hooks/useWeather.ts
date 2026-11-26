'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WeatherData } from '@/types';

export function useWeather(city?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchByCity = useCallback(async (cityName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?city=${encodeURIComponent(cityName)}`
      );
      if (!res.ok) {
        throw new Error('Weather fetch failed');
      }
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (city) {
      fetchByCity(city);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/weather?lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) {
            throw new Error('Weather fetch failed');
          }
          const data = await res.json();
          setWeather(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError(`Location access denied: ${err.message}`);
        setIsLoading(false);
      }
    );
  }, [city, fetchByCity]);

  return { weather, isLoading, error, fetchByCity };
}
