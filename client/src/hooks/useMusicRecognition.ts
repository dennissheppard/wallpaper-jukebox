import { useState, useCallback, useRef, useEffect } from 'react';
import { MusicMetadata, MusicSettings } from '../types/music';
import { captureAudio, requestMicrophonePermission } from '../utils/audioCapture';
import {
  recognizeMusic,
  getApiUsageCount,
  incrementApiUsage,
  hasExceededUsageLimit,
} from '../services/musicService';

interface UseMusicRecognitionOptions {
  settings: MusicSettings;
  onWallpaperQueryReady?: (query: string, lyric: string | null) => void;
}

const MAX_CONSECUTIVE_FAILURES = 2;

export function useMusicRecognition({ settings, onWallpaperQueryReady }: UseMusicRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastTrack, setLastTrack] = useState<MusicMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [apiUsage, setApiUsage] = useState(getApiUsageCount());

  // Auto-pause state
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const consecutiveFailures = useRef<number>(0);

  const lastRecognitionTime = useRef<number>(0);
  const hasPerformedInitialRecognition = useRef(false);

  // Check microphone permission on mount
  useEffect(() => {
    if (settings.enabled) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setPermissionGranted(result.state === 'granted');
        })
        .catch(() => {
          // Permissions API not supported, assume unknown
          setPermissionGranted(null);
        });
    }
  }, [settings.enabled]);

  const requestPermission = useCallback(async () => {
    const granted = await requestMicrophonePermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  // Resume auto-recognition (clear pause state)
  const resumeAutoRecognition = useCallback(() => {
    setIsAutoPaused(false);
    setPauseReason(null);
    consecutiveFailures.current = 0;
  }, []);

  const recognizeNow = useCallback(async (isManual: boolean = false): Promise<string | null> => {
    // Check if disabled
    if (!settings.enabled) {
      return null;
    }

    // If manual trigger, resume auto-recognition
    if (isManual && isAutoPaused) {
      resumeAutoRecognition();
    }

    // Check rate limiting (prevent rapid-fire calls)
    const now = Date.now();
    if (now - lastRecognitionTime.current < 30000) {
      // Allow initial auto-recognition to bypass 30s check if it's the very first one
      // (lastRecognitionTime is 0 initially)
      if (lastRecognitionTime.current > 0) {
        if (isManual) setError('Please wait 30 seconds between recognitions');
        return null;
      }
    }

    // Check API usage limit
    if (hasExceededUsageLimit()) {
      setError('Monthly API limit reached (250/250). Resets next month.');
      return null;
    }

    setIsRecording(true);
    setError(null);
    lastRecognitionTime.current = now;

    try {
      // Capture audio (returns Blob)
      const audioBlob = await captureAudio(5000);

      if (!audioBlob) {
        setError('Failed to capture audio. Check microphone permissions.');
        setIsRecording(false);
        consecutiveFailures.current++;
        checkAndPause();
        return null;
      }

      setIsRecording(false);
      setIsRecognizing(true);

      // Recognize music (send Blob via FormData)
      const result = await recognizeMusic(audioBlob, settings.mappingMode);

      if (!result.detected) {
        setError('No music detected. Try increasing volume or moving closer.');
        setIsRecognizing(false);
        consecutiveFailures.current++;
        checkAndPause();
        return null;
      }

      // Success - reset failure counter
      consecutiveFailures.current = 0;
      if (isAutoPaused) {
        resumeAutoRecognition();
      }

      incrementApiUsage();
      setApiUsage(getApiUsageCount());
      setLastTrack(result.track!);
      setError(null);
      setIsRecognizing(false);

      const query = result.wallpaperQuery || null;
      const lyric = result.lyric || null;

      // Log the query for debugging
      console.log('[Music Recognition] Wallpaper query:', query, 'Lyric:', lyric);

      // Notify callback if provided
      if (query && onWallpaperQueryReady) {
        onWallpaperQueryReady(query, lyric);
      }

      return query;
    } catch (err: any) {
      console.error('Recognition error:', err);
      setError(err.message || 'Failed to recognize music');
      setIsRecording(false);
      setIsRecognizing(false);
      consecutiveFailures.current++;
      checkAndPause();
      return null;
    }
  }, [settings.enabled, settings.mappingMode, onWallpaperQueryReady, isAutoPaused, resumeAutoRecognition]);

  // Check if we should pause auto-recognition
  const checkAndPause = useCallback(() => {
    if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES && settings.autoRecognize) {
      setIsAutoPaused(true);
      setPauseReason(`Auto-paused after ${MAX_CONSECUTIVE_FAILURES} failed attempts. Click "Update" to retry.`);
      console.log('[Music Recognition] Auto-paused due to consecutive failures');
    }
  }, [settings.autoRecognize]);

  // Auto-recognize on interval (if enabled and not paused)
  // Use a ref for the callback to prevent interval reset when dependencies change
  const savedRecognizeCallback = useRef(recognizeNow);

  useEffect(() => {
    savedRecognizeCallback.current = recognizeNow;
  }, [recognizeNow]);

  useEffect(() => {
    if (!settings.enabled || !settings.autoRecognize || settings.autoInterval === 0 || isAutoPaused) {
      return;
    }

    // Use shorter interval for retries if an error occurred
    const currentInterval = (error && consecutiveFailures.current > 0) ? 10 : settings.autoInterval;

    console.log('[Music Recognition] Starting auto-recognition timer. Interval:', currentInterval, 's');

    const tick = () => {
      console.log(`[Music Recognition] Auto-recognition interval triggered at ${new Date().toLocaleTimeString()}`);
      savedRecognizeCallback.current(false); // false = auto-triggered
    };

    const interval = setInterval(tick, currentInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.autoRecognize, settings.autoInterval, isAutoPaused, error]); // Added error dependency

  // Initial auto-recognition on load
  useEffect(() => {
    if (!settings.enabled || !settings.autoRecognize || isAutoPaused || hasPerformedInitialRecognition.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (settings.enabled && settings.autoRecognize && !isAutoPaused) {
        console.log('[Music Recognition] Performing initial check on page load...');
        recognizeNow(false);
        hasPerformedInitialRecognition.current = true;
      }
    }, 3000); // Wait 3 seconds after load

    return () => clearTimeout(timer);
  }, [settings.enabled, settings.autoRecognize, isAutoPaused, recognizeNow]);

  return {
    isRecording,
    isRecognizing,
    lastTrack,
    error,
    permissionGranted,
    apiUsage,
    isAutoPaused,
    pauseReason,
    requestPermission,
    recognizeNow: (isManual: boolean = true) => recognizeNow(isManual),
    resumeAutoRecognition,
  };
}
