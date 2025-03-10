import { useState, useCallback } from "react";
import * as phonemeDictionary from "../../../shared/phoneme-dictionary";

interface GoogleTTSOptions {
  voiceId?: string;
  languageCode?: string;
  useIPAPhonemes?: boolean;
}

interface GoogleTTSError {
  error?: {
    message?: string;
    status?: string;
  };
  message?: string;
}

// Check if text is a single phoneme that should use SSML formatting
const isSinglePhoneme = (text: string): boolean => {
  // Remove any whitespace and check if it's short enough to be a phoneme
  const cleanText = text.trim();
  return cleanText.length <= 3;
};

/**
 * Wraps an IPA symbol in the appropriate Google TTS SSML phoneme tag
 * with breaks before and after for better clarity
 * @param ipaSymbol IPA symbol to wrap in SSML
 * @returns SSML string with phoneme tag and breaks
 */
const wrapGoogleIPAInSSML = (ipaSymbol: string): string => {
  return `<break time="200ms"/><phoneme alphabet="ipa" ph="${ipaSymbol}">${ipaSymbol}</phoneme><break time="200ms"/>`;
};

export const useGoogleTTS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options: GoogleTTSOptions = {}) => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setIsPlaying(true);
    setError(null);

    const voiceId = options.voiceId || "en-US-Chirp-HD-F"; // Default voice 
    const languageCode = options.languageCode || "en-US"; // Default language code

    // Format text with IPA phoneme tags if needed
    let formattedText = text;

    // Check if this is a phoneme that should be wrapped in SSML
    if (options.useIPAPhonemes && isSinglePhoneme(text)) {
      console.log(`Converting phoneme "${text}" to SSML format for Google TTS`);
      formattedText = `<speak>${wrapGoogleIPAInSSML(text.trim())}</speak>`;
    } else if (options.useIPAPhonemes) {
      // If it's not a single phoneme but we still want to use SSML
      formattedText = `<speak>${text}</speak>`;
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: formattedText,
          voice: {
            languageCode,
            name: voiceId
          },
          audioConfig: {
            audioEncoding: "LINEAR16"
          },
          useSSML: options.useIPAPhonemes
        }),
      });

      if (!response.ok) {
        let errorData: GoogleTTSError;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }
        const errorMessage = errorData.error?.message || errorData.message || response.statusText;
        throw new Error(`Google TTS API error: ${errorMessage}`);
      }

      const audioData = await response.json();
      
      // The audio content will be base64-encoded
      const audioBuffer = Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
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
      console.error('Google TTS error:', err);
      throw err;
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [isPlaying, isLoading]);

  return { speak, isLoading, error, isPlaying };
};

// Export the Google-specific wrapper function for external use
export { wrapGoogleIPAInSSML };