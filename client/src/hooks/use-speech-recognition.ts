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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Request microphone permission and initialize recognition
  const initializeSpeechRecognition = async () => {
    try {
      // First, request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition API not available');
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsRecording(true);
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ Speech detected');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎯 Speech recognition result received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
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
        setIsRecording(false);

        switch (event.error) {
          case 'not-allowed':
            setHasPermission(false);
            toast({
              title: "Microphone Access Required",
              description: "Please allow microphone access in your browser settings to continue.",
              variant: "destructive"
            });
            break;
          case 'no-speech':
            toast({
              title: "No Speech Detected",
              description: "Please try speaking again.",
              variant: "destructive"
            });
            break;
          default:
            toast({
              title: "Speech Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive"
            });
        }
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsRecording(false);
      };

      recognitionRef.current = recognition;

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setHasPermission(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Microphone Access Denied",
            description: "Please grant microphone access in your browser settings.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Speech Recognition Error",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    }
  };

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscriptionUpdate, continuous, interimResults]);

  const startRecording = async () => {
    if (!hasPermission) {
      await initializeSpeechRecognition();
      return;
    }

    if (recognitionRef.current && !isRecording) {
      try {
        await recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Recognition Error",
          description: "Failed to start speech recognition. Please try again.",
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
    hasPermission 
  };
}