import { useState, useCallback } from "react";

export const useElevenLabs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options = {}) => {
    if (isPlaying || isLoading) return;
    
    setIsLoading(true);
    setIsPlaying(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: options.voiceId || "pNInz6obpgDQGcFmaJgB", // Default to Adam voice
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(null);
        };
        audio.onerror = reject;
        audio.play();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      throw err;
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [isPlaying, isLoading]);

  return { speak, isLoading, error, isPlaying };
};
