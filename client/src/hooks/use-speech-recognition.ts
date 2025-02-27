import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseSpeechRecognitionProps {
  language?: string;
  onTranscriptionUpdate?: (transcript: string) => void;
  onRecognitionEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  initializeOnMount?: boolean;
}

export function useSpeechRecognition({
  language = "en-US",
  onTranscriptionUpdate,
  onRecognitionEnd,
  continuous = false,
  interimResults = true,
  initializeOnMount = false
}: UseSpeechRecognitionProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description: "Speech Recognition not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    // Increase recognition timeout for better results
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started");
      setIsRecording(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Helper function to clean up repeated words from speech recognition
    const cleanRepeatedWords = (input: string): string => {
      // Split by spaces
      const words = input.split(/\s+/);
      if (words.length <= 1) return input;
      
      // Remove adjacent duplicates
      const cleanedWords: string[] = [];
      for (let i = 0; i < words.length; i++) {
        if (i === 0 || words[i].toLowerCase() !== words[i-1].toLowerCase()) {
          cleanedWords.push(words[i]);
        }
      }
      
      return cleanedWords.join(' ');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Process all results, combining them
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(" ");

      // Log the raw transcription results
      console.log("Speech recognition raw transcript:", currentTranscript);
      
      // Step 1: Trim the transcript
      const trimmedTranscript = currentTranscript.trim();
      
      // Step 2: Remove repeated words (like "may may")
      const cleanedTranscript = cleanRepeatedWords(trimmedTranscript);
      
      // Log the processing steps
      if (trimmedTranscript !== cleanedTranscript) {
        console.log("Removed repeated words:", trimmedTranscript, "→", cleanedTranscript);
      }
      
      console.log("Speech recognition final transcript:", cleanedTranscript);
      setTranscript(cleanedTranscript);

      // For interim results, set a timeout to ensure we get complete phrases
      if (interimResults && event.results[0].isFinal) {
        console.log("Calling update with final result:", cleanedTranscript);
        onTranscriptionUpdate?.(cleanedTranscript);
      } else if (!interimResults) {
        console.log("Calling update with non-interim result:", cleanedTranscript);
        onTranscriptionUpdate?.(cleanedTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      // Only show errors that aren't "no-speech" or aborted
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: "Error",
          description: `Recognition error: ${event.error}`,
          variant: "destructive"
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);

      // Set a longer timeout before calling onRecognitionEnd to give more time
      // for processing and showing feedback to the user
      timeoutRef.current = window.setTimeout(() => {
        onRecognitionEnd?.();
      }, 500); // Increased from 100ms to 500ms
    };

    recognitionRef.current = recognition;

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, interimResults, onTranscriptionUpdate, onRecognitionEnd, toast]);

  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      try {
        // Clear any existing timeout
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        await recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recording:", error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition",
          variant: "destructive"
        });
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    hasRecognitionSupport: !!recognitionRef.current
  };
}