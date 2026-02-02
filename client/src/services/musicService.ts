import { RecognitionResult, MusicMappingMode } from '../types/music';

const STORAGE_KEY = 'music-api-usage';
const USAGE_LIMIT = 250; // Free tier: 250/month, $10 for 50k/month

interface UsageData {
  count: number;
  month: string; // Format: 'YYYY-MM'
}

/**
 * Send audio blob to backend for music recognition
 * @param audioBlob - Audio blob from microphone capture
 * @param mappingMode - How to map music to wallpaper query
 */
export async function recognizeMusic(
  audioBlob: Blob,
  mappingMode: MusicMappingMode
): Promise<RecognitionResult> {
  // Create FormData with the audio file
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('mappingMode', mappingMode);

  const response = await fetch('/api/music/recognize', {
    method: 'POST',
    body: formData, // No Content-Type header - browser sets it with boundary
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('API rate limit exceeded');
    }
    throw new Error('Failed to recognize music');
  }

  return response.json();
}

export function getApiUsageCount(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;

  try {
    const data: UsageData = JSON.parse(stored);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Reset if new month
    if (data.month !== currentMonth) {
      resetApiUsageCount();
      return 0;
    }

    return data.count;
  } catch {
    return 0;
  }
}

export function incrementApiUsage(): void {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const count = getApiUsageCount() + 1;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count, month: currentMonth })
  );
}

export function resetApiUsageCount(): void {
  const currentMonth = new Date().toISOString().slice(0, 7);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: 0, month: currentMonth })
  );
}

export function isNearUsageLimit(): boolean {
  return getApiUsageCount() >= USAGE_LIMIT * 0.9; // 90% threshold
}

export function hasExceededUsageLimit(): boolean {
  return getApiUsageCount() >= USAGE_LIMIT;
}
