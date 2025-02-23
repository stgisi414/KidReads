import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onResult: (text: string) => void;
  isLoading?: boolean;
}

export default function VoiceInput({ onResult, isLoading }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Request microphone permission immediately
    const requestPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Initialize speech recognition only after permission is granted
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const newRecognition = new SpeechRecognition();
          newRecognition.continuous = false;
          newRecognition.interimResults = false;
          setRecognition(newRecognition);
        }
      } catch (error) {
        console.error('Microphone permission error:', error);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice input",
          variant: "destructive"
        });
      }
    };

    requestPermission();

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: event.error,
        variant: "destructive"
      });
    };
  }, [recognition, onResult]);

  const toggleListening = () => {
    if (!recognition || isLoading) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
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