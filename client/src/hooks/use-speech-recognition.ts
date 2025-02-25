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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(" ");

      setTranscript(currentTranscript);

      // For interim results, set a timeout to ensure we get complete phrases
      if (interimResults && event.results[0].isFinal) {
        onTranscriptionUpdate?.(currentTranscript);
      } else if (!interimResults) {
        onTranscriptionUpdate?.(currentTranscript);
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

      // Set a small timeout before calling onRecognitionEnd
      timeoutRef.current = window.setTimeout(() => {
        onRecognitionEnd?.();
      }, 100);
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