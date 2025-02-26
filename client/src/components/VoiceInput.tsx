import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Initialize speech recognition with better error handling
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = true; // Keep listening until explicitly stopped
      newRecognition.interimResults = true; // Get interim results
      newRecognition.lang = 'en-US'; // Set language explicitly
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
      let finalTranscript = '';
      let interimTranscript = '';

      // Log the raw results for debugging
      console.log('🎯 Recognition results:', event.results);

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', transcript);
        } else {
          interimTranscript += transcript;
          console.log('⏳ Interim transcript:', transcript);
        }
      }

      // Only send final results to the callback
      if (finalTranscript) {
        console.log('📝 Sending final result:', finalTranscript);
        onSubmit(finalTranscript);
        setIsListening(false);
        recognition.stop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Recognition error:', event.error);

      if (event.error === 'no-speech') {
        // Don't stop on no-speech, just notify
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
      // Only stop if we have a final result
      if (isListening) {
        console.log('🔄 Restarting recognition');
        recognition.start();
      }
    };
  }, [recognition, onSubmit, toast]);

  const toggleListening = () => {
    if (!recognition || isLoading) return;

    if (isListening) {
      try {
        recognition.abort(); // Use abort() to immediately stop
        recognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    } else {
      try {
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