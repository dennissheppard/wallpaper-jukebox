export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately (we just wanted permission)
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Capture audio from microphone and return as Blob
 * @param durationMs - Recording duration in milliseconds (default 5 seconds)
 * @returns Audio Blob or null if capture failed
 */
export async function captureAudio(durationMs: number = 5000): Promise<Blob | null> {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // Mono
        sampleRate: 44100,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });

    const audioChunks: Blob[] = [];

    return new Promise<Blob | null>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        try {
          // Create blob from chunks and return directly (no base64 encoding needed)
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        } catch (error) {
          console.error('Audio processing error:', error);
          resolve(null);
        }
      };

      mediaRecorder.onerror = (error) => {
        stream.getTracks().forEach(track => track.stop());
        console.error('MediaRecorder error:', error);
        reject(error);
      };

      // Start recording
      mediaRecorder.start();

      // Stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);
    });
  } catch (error) {
    console.error('Microphone access error:', error);
    return null;
  }
}
