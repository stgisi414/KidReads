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

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started");
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(" ");

      setTranscript(currentTranscript);
      onTranscriptionUpdate?.(currentTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      toast({
        title: "Error",
        description: `Recognition error: ${event.error}`,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
      onRecognitionEnd?.();
    };

    recognitionRef.current = recognition;
  }, [language, continuous, interimResults, onTranscriptionUpdate, onRecognitionEnd, toast]);

  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      try {
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