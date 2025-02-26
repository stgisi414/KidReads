import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  accentColor?: string;
}

export default function VoiceInput({ onSubmit, isLoading, accentColor }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const debounceTimerRef = useRef<number | null>(null);
  const lastProcessedTextRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = false; 
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';
      setRecognition(newRecognition);
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      console.log('🎤 Recognition started');
      setIsListening(true);
      toast({
        title: "Listening",
        description: "Speak now...",
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const finalTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ')
        .trim()
        .toLowerCase()
        .replace(/(\b\w+\b)(?:\s+\1\b)+/g, '$1');

      if (finalTranscript && finalTranscript !== lastProcessedTextRef.current) {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
          if (finalTranscript.length < 3) {
            toast({
              title: "Too Short",
              description: "Please say a longer phrase (at least 3 characters)",
              variant: "destructive"
            });
          } else {
            lastProcessedTextRef.current = finalTranscript;
            onSubmit(finalTranscript);
            setIsListening(false);
            recognition.stop();
          }
          debounceTimerRef.current = null;
        }, 1000); 
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Recognition error:', event.error);

      if (event.error === 'no-speech') {
        toast({
          title: "No Speech Detected",
          description: "Please speak louder or check your microphone",
        });
      } else {
        setIsListening(false);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      console.log('🛑 Recognition ended');
      setIsListening(false);
    };

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [recognition, onSubmit, toast]);

  const toggleListening = () => {
    if (!recognition || isLoading) return;

    if (isListening) {
      try {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        recognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    } else {
      try {
        lastProcessedTextRef.current = ""; 
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        className="w-full"
        onClick={toggleListening}
        disabled={isLoading || !recognition}
      >
        {isListening ? (
          <><MicOff className="mr-2 h-4 w-4" /> Stop Listening</>
        ) : (
          <><Mic className="mr-2 h-4 w-4" /> Start Speaking</>
        )}
      </Button>

      {!recognition && (
        <p className="text-sm text-yellow-600">
          Speech recognition is not available or microphone access is required
        </p>
      )}
    </div>
  );
}