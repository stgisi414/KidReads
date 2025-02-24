import { useState, useEffect, useRef } from "react";
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
}: UseSpeechRecognitionProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryCount = useRef(0);
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Request microphone permission and initialize recognition
  const initializeSpeechRecognition = async () => {
    try {
      // Check for available audio input devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput",
      );

      if (audioInputs.length === 0) {
        throw new Error(
          "No microphone found. Please connect a microphone and try again.",
        );
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition API not available");
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous || isMobileDevice; // Force continuous on mobile
      recognition.interimResults = interimResults && !isMobileDevice; // Disable interim results on mobile

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started");
        setIsRecording(true);
        retryCount.current = 0; // Reset retry count on successful start

        toast({
          title: "Listening",
          description: "Speak now...",
        });
      };

      recognition.onspeechstart = () => {
        console.log("🗣️ Speech detected");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log("🎯 Recognition results:", event.results);
        let transcript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result[0]) {
            transcript = result[0].transcript.trim().toLowerCase();
            console.log("Heard word:", transcript);
            
            if (result.isFinal || !interimResults) {
              console.log("✅ Final transcript:", transcript);
              onTranscriptionUpdate?.(transcript);
              break; // Process one word at a time
            }
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("❌ Speech recognition error:", event.error);

        const handleRetry = () => {
          if (retryCount.current < maxRetries && isRecording) {
            retryCount.current++;
            console.log(`Retrying recognition (attempt ${retryCount.current}/${maxRetries})`);

            // Clear any existing retry timeout
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }

            retryTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (error) {
                  console.error("Failed to restart recognition:", error);
                }
              }
            }, 1000);
          } else if (retryCount.current >= maxRetries) {
            setIsRecording(false);
            toast({
              title: "Recognition Error",
              description: "Maximum retry attempts reached. Please try again.",
              variant: "destructive",
            });
          }
        };

        switch (event.error) {
          case "not-allowed":
            setHasPermission(false);
            setIsRecording(false);
            toast({
              title: "Microphone Access Required",
              description:
                "Please allow microphone access in your browser settings to continue.",
              variant: "destructive",
            });
            break;
          case "no-speech":
            if (isMobileDevice) {
              handleRetry();
            } else {
              toast({
                title: "No Speech Detected",
                description: "Please speak louder or check your microphone",
              });
            }
            break;
          case "network":
            handleRetry();
            break;
          case "aborted":
            if (isMobileDevice) {
              handleRetry();
            }
            break;
          case "audio-capture":
            toast({
              title: "Microphone Error",
              description:
                "No microphone detected or microphone is not working. Please check your device settings.",
              variant: "destructive",
            });
            break;
          default:
            if (isMobileDevice) {
              handleRetry();
            } else {
              toast({
                title: "Speech Recognition Error",
                description: `Error: ${event.error}. Please try again.`,
                variant: "destructive",
              });
            }
        }
      };

      recognition.onend = () => {
        console.log("🛑 Speech recognition ended");

        // If we're still supposed to be recording and haven't hit max retries
        if (isRecording && retryCount.current < maxRetries) {
          console.log("Attempting to restart recognition...");
          try {
            recognition.start();
          } catch (error) {
            console.error("Failed to restart recognition:", error);
            setIsRecording(false);
            onRecognitionEnd?.();
          }
        } else {
          setIsRecording(false);
          onRecognitionEnd?.();
        }
      };

      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      setHasPermission(false);

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast({
            title: "Microphone Access Denied",
            description:
              "Please grant microphone access in your browser settings.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Speech Recognition Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!hasPermission) {
      await initializeSpeechRecognition();
      return;
    }

    if (recognitionRef.current && !isRecording) {
      try {
        retryCount.current = 0; // Reset retry count
        await recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recording:", error);
        toast({
          title: "Recognition Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      recognitionRef.current.stop();
      retryCount.current = maxRetries; // Prevent auto-restart
    }
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    hasPermission,
  };
}