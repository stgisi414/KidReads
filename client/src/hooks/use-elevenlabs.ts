import { useState, useCallback } from "react";
import { buildElevenLabsPhoneDictionary, wrapIPAInSSML } from "../../../shared/phoneme-dictionary";

interface ElevenLabsOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  useIPAPhonemes?: boolean; // New option to use IPA phonemes
}

interface ElevenLabsError {
  detail?: {
    message?: string;
    status?: string;
  };
  message?: string;
}

// Initialize the phoneme dictionary
const phonemeDictionary = buildElevenLabsPhoneDictionary();

/**
 * Checks if text is a single IPA phoneme that should use SSML formatting
 * @param text Text to check
 * @returns true if it's a single phoneme that exists in our dictionary
 */
const isSinglePhoneme = (text: string): boolean => {
  // Remove any whitespace and check if it exists in our phoneme dictionary
  const cleanText = text.trim();
  return cleanText.length <= 3 && Object.keys(phonemeDictionary).includes(cleanText);
};

export const useElevenLabs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options: ElevenLabsOptions = {}) => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setIsPlaying(true);
    setError(null);

    const voiceId = options.voiceId || "ErXwobaYiN019PkySvjV"; // Josh - Good for children's stories (CHANGE THIS!)
    const modelId = options.modelId || "eleven_turbo_v2"; // Prioritize
    const stability = options.stability || 0.3; // More expressive
    const similarityBoost = options.similarityBoost || 0.65; // Slightly more natural

    // Format text with IPA phoneme tags if needed
    let formattedText = text;

    // Check if this is a phoneme that should be wrapped in SSML
    if (options.useIPAPhonemes !== false && isSinglePhoneme(text)) {
      console.log(`Converting phoneme "${text}" to IPA SSML format`);
      // Get the phoneme tag directly from dictionary or generate it
      formattedText = phonemeDictionary[text.trim()] || wrapIPAInSSML(text.trim());
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': "sk_dfba85b4b9aa4632fce2fc4403b701910ca1febd112518f0",
        },
        body: JSON.stringify({
          text: formattedText,
          model_id: modelId,
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
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

/**
 * Wraps an IPA symbol in the appropriate ElevenLabs SSML phoneme tag
 * with breaks before and after for better clarity
 * @param ipaSymbol IPA symbol to wrap in SSML
 * @returns SSML string with phoneme tag and breaks
 */
export function wrapIPAInSSML(ipaSymbol: string): string {
  return `<break time="0.2s" /><phoneme alphabet="ipa" ph="${ipaSymbol}">${ipaSymbol}</phoneme><break time="0.2s" />`;
}