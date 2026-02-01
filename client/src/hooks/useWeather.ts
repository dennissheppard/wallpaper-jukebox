import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types/weather';
import { fetchWeatherAuto, fetchWeatherByCoords } from '../services/weatherService';

export function useWeather(
  enabled: boolean,
  usePreciseLocation: boolean,
  temperatureUnit: 'C' | 'F'
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      if (usePreciseLocation && 'geolocation' in navigator) {
        // Try to get precise location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const data = await fetchWeatherByCoords(
                position.coords.latitude,
                position.coords.longitude,
                temperatureUnit
              );
              setWeather(data);
              setLoading(false);
            } catch (err) {
              setError('Failed to fetch weather data');
              setLoading(false);
            }
          },
          async () => {
            // Geolocation denied, fall back to IP location
            try {
              const data = await fetchWeatherAuto(temperatureUnit);
              setWeather(data);
              setLoading(false);
            } catch (err) {
              setError('Failed to fetch weather data');
              setLoading(false);
            }
          }
        );
      } else {
        // Use IP-based location
        const data = await fetchWeatherAuto(temperatureUnit);
        setWeather(data);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  }, [enabled, usePreciseLocation, temperatureUnit]);

  // Fetch weather on mount and when settings change
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Refresh weather every 30 minutes
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled, fetchWeather]);

  const requestPreciseLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await fetchWeatherByCoords(
              position.coords.latitude,
              position.coords.longitude,
              temperatureUnit
            );
            setWeather(data);
          } catch (err) {
            setError('Failed to fetch weather data');
          }
        },
        () => {
          setError('Location permission denied');
        }
      );
    }
  }, [temperatureUnit]);

  return {
    weather,
    loading,
    error,
    refresh: fetchWeather,
    requestPreciseLocation,
  };
}
