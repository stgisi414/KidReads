import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSpeechRecognitionProps {
  language?: string;
  onTranscriptionUpdate?: (transcript: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition({ 
  language = 'en-US', 
  onTranscriptionUpdate,
  continuous = false,
  interimResults = true
}: UseSpeechRecognitionProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    console.log('🎯 Initializing speech recognition...');
    // Check for both standard and webkit prefixed versions
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      console.log('✅ Speech Recognition API is available');
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        console.log('Current state:', { language, continuous, interimResults });
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎯 Speech recognition result event received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            console.log('📝 Final transcript:', transcript);
            finalTranscript += transcript;
          } else {
            console.log('🔄 Interim transcript:', transcript);
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (onTranscriptionUpdate && (finalTranscript || !interimResults)) {
          onTranscriptionUpdate(currentTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error);
        console.error('Error details:', event);
        if (event.error === 'not-allowed') {
          toast({ 
            title: "Microphone Access Required",
            description: "Please allow microphone access to continue reading.",
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Speech Recognition Error", 
            description: event.error,
            variant: "destructive" 
          });
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.error('❌ Speech Recognition API not available');
      toast({ 
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive" 
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscriptionUpdate, continuous, interimResults, toast]);

  const startRecording = () => {
    console.log('🎬 Attempting to start recording...');
    if (recognitionRef.current) {
      try {
        console.log('🎤 Starting speech recognition...');
        recognitionRef.current.start();
        console.log('✅ Speech recognition start command issued');
        setIsRecording(true);
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        setIsRecording(false);
        toast({
          title: "Recognition Error",
          description: "Failed to start speech recognition",
          variant: "destructive"
        });
      }
    } else {
      console.error('❌ Speech recognition not initialized');
      toast({
        title: "Recognition Error",
        description: "Speech recognition not initialized",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    console.log('⏹️ Attempting to stop recording...');
    if (recognitionRef.current) {
      console.log('🛑 Stopping speech recognition...');
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, transcript, startRecording, stopRecording };
}