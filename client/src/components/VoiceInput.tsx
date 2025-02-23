import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onResult: (text: string) => void;
  isLoading?: boolean;
}

export default function VoiceInput({ onResult, isLoading }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = false;
      newRecognition.interimResults = false;
      setRecognition(newRecognition);
    }
  }, []);

  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, [recognition, onResult]);

  const toggleListening = () => {
    if (!recognition || isLoading) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={toggleListening}
      disabled={isLoading}
    >
      {isListening ? (
        <><MicOff className="mr-2 h-4 w-4" /> Stop Listening</>
      ) : (
        <><Mic className="mr-2 h-4 w-4" /> Start Speaking</>
      )}
    </Button>
  );
}
