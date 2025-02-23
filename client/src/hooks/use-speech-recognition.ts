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
  const minListenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Request microphone permission and initialize recognition
  const initializeSpeechRecognition = async () => {
    try {
      // Check for available audio input devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      if (audioInputs.length === 0) {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      }

      // Request microphone permission
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

        // Set a minimum listening time of 3 seconds
        minListenTimeoutRef.current = setTimeout(() => {
          minListenTimeoutRef.current = null;
        }, 3000);

        // Show toast to indicate listening started
        toast({
          title: "Listening",
          description: "Speak now...",
        });
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

        // Don't stop if we're still in minimum listen time
        if (minListenTimeoutRef.current) {
          return;
        }

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
            // Restart recognition if no speech detected
            if (isRecording) {
              recognition.stop();
              setTimeout(() => {
                recognition.start();
                toast({
                  title: "No Speech Detected",
                  description: "Please try speaking again...",
                });
              }, 100);
            }
            break;
          case 'audio-capture':
            toast({
              title: "Microphone Error",
              description: "No microphone detected or microphone is not working. Please check your device settings.",
              variant: "destructive"
            });
            break;
          case 'not-found':
            toast({
              title: "Microphone Not Found",
              description: "Please connect a microphone and try again.",
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

        // Don't stop if we're still in minimum listen time
        if (minListenTimeoutRef.current) {
          recognition.start();
          return;
        }

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
      if (minListenTimeoutRef.current) {
        clearTimeout(minListenTimeoutRef.current);
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
      if (minListenTimeoutRef.current) {
        clearTimeout(minListenTimeoutRef.current);
        minListenTimeoutRef.current = null;
      }
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