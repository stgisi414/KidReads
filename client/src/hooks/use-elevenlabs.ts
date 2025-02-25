import { useState, useCallback } from "react";

interface ElevenLabsOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

interface ElevenLabsError {
  detail?: {
    message?: string;
    status?: string;
  };
  message?: string;
}

export const useElevenLabs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options: ElevenLabsOptions = {}) => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setIsPlaying(true);
    setError(null);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': "sk_dfba85b4b9aa4632fce2fc4403b701910ca1febd112518f0",
        },
        body: JSON.stringify({
          text,
          model_id: options.modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ElevenLabsError;
        const errorMessage = errorData.detail?.message || errorData.message || response.statusText;
        throw new Error(`ElevenLabs API error: ${errorMessage}`);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [isPlaying, isLoading]);

  return { speak, isLoading, error, isPlaying };
};