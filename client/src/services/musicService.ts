import { RecognitionResult, MusicMappingMode } from '../types/music';

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
