import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import type { Story } from "@shared/schema";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const [dictation, setDictation] = useState("");
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const { toast } = useToast();
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ("speechSynthesis" in window) {
      synthesisRef.current = window.speechSynthesis;
    } else {
      toast({
        title: "Text-to-Speech Not Available",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
    }

    return () => {
      if (synthesisRef.current && utteranceRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Request microphone permission on mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasMicPermission(true);
      } catch (error) {
        console.error('Failed to get microphone permission:', error);
        setHasMicPermission(false);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use this feature",
          variant: "destructive"
        });
      }
    };
    requestMicPermission();
  }, []);

  const handleTranscription = (transcript: string) => {
    if (!transcript) return;

    setDictation(transcript);
    const spokenWord = transcript.toLowerCase().trim();
    const currentWord = story.words[currentWordIndex].toLowerCase().trim();

    // Compare words after removing punctuation
    const cleanSpokenWord = spokenWord.replace(/[.,!?]/g, "").trim();
    const cleanCurrentWord = currentWord.replace(/[.,!?]/g, "").trim();

    if (cleanSpokenWord.includes(cleanCurrentWord) || cleanCurrentWord.includes(cleanSpokenWord)) {
      toast({
        description: "Great reading! ⭐",
        duration: 1000,
      });
      handleNextWord();
    } else {
      toast({
        title: "Try Again",
        description: `Let's try reading: "${story.words[currentWordIndex]}"`,
        duration: 2000,
      });
      // Repeat the word after a short delay
      setTimeout(() => speakWord(story.words[currentWordIndex]), 1000);
    }
  };

  const { isRecording, startRecording, stopRecording } = useSpeechRecognition({
    language: "en-US",
    onTranscriptionUpdate: handleTranscription,
    continuous: false,
    interimResults: false,
  });

  const speakWord = (word: string) => {
    if (!synthesisRef.current) return;

    // Cancel any ongoing speech and recording
    stopRecording();
    if (utteranceRef.current) {
      synthesisRef.current.cancel();
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(word);
    utteranceRef.current = utterance;

    // Configure utterance
    utterance.rate = speed;
    utterance.lang = "en-US";
    utterance.volume = 1;

    // Debug logs for speech synthesis events
    utterance.onstart = () => {
      console.log('Speech started:', word);
    };

    utterance.onend = () => {
      console.log('Speech ended:', word);
      // Only start recording if we're still in playing mode
      if (isPlaying && hasMicPermission) {
        console.log('Starting recording after speech');
        startRecording();
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      toast({
        title: "Speech Error",
        description: "Failed to speak the word",
        variant: "destructive"
      });
    };

    utterance.onpause = () => console.log('Speech paused');
    utterance.onresume = () => console.log('Speech resumed');
    utterance.onboundary = (event) => console.log('Speech boundary hit:', event.charIndex);

    try {
      console.log('Starting speech for word:', word);
      synthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      toast({
        title: "Speech Error",
        description: "Failed to speak the word",
        variant: "destructive"
      });
    }
  };

  const handleNextWord = () => {
    stopRecording();
    if (currentWordIndex < story.words.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      // Small delay before speaking next word
      setTimeout(() => speakWord(story.words[nextIndex]), 500);
    } else {
      setIsPlaying(false);
      toast({
        title: "Story Complete! 🎉",
        description: "Great job reading!",
      });
    }
  };

  const togglePlayback = () => {
    if (!hasMicPermission) {
      toast({
        title: "Microphone Required",
        description: "Please allow microphone access to start reading",
        variant: "destructive"
      });
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
      speakWord(story.words[currentWordIndex]);
    } else {
      setIsPlaying(false);
      stopRecording();
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    }
  };

  const restart = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    stopRecording();
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    toast({ description: "Starting from the beginning!" });
  };

  return (
    <div className="space-y-8">
      <WordDisplay words={story.words} currentIndex={currentWordIndex} />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Reading Speed:</span>
          <Slider
            value={[speed]}
            onValueChange={([newSpeed]) => setSpeed(newSpeed)}
            min={0.5}
            max={2}
            step={0.1}
            className="w-[200px]"
          />
          <span className="text-sm">{speed.toFixed(1)}x</span>
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" variant="outline" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" /> Restart
          </Button>
          <Button
            size="lg"
            onClick={togglePlayback}
            variant={isPlaying ? "destructive" : "default"}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start Reading
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="text-center space-y-2">
        {!hasMicPermission && (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded-lg">
            <p>Microphone access is required for interactive reading.</p>
            <p className="text-sm">Please allow microphone access when prompted.</p>
          </div>
        )}

        {isRecording && (
          <div>
            <Mic className="w-4 h-4 text-green-500 mx-auto animate-pulse" />
            <p className="text-sm text-green-600">
              Your turn! Say: "{story.words[currentWordIndex]}"
            </p>
            <div className="border p-2 rounded-md mt-2">
              <p className="text-xs">Dictation:</p>
              <p>{dictation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}