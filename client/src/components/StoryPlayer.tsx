import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speed, setSpeed] = useState(0.8); // Default speed
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const newRecognition = new SpeechRecognition();
          newRecognition.continuous = false;
          newRecognition.interimResults = false;
          setRecognition(newRecognition);
          setSynthesis(window.speechSynthesis);
        } else {
          toast({
            title: "Speech Recognition Not Available",
            description: "Your browser doesn't support speech recognition.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to initialize speech recognition:", error);
        toast({
          title: "Speech Recognition Error",
          description: "There was an error setting up speech recognition.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const speakWord = (word: string) => {
    if (synthesis) {
      // Cancel any ongoing speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speed;
      utterance.onend = () => {
        if (isPlaying) {
          startListening();
        }
      };
      synthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to start listening. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      speakWord(story.words[currentWordIndex + 1]);
    } else {
      setIsPlaying(false);
      toast({
        title: "Story Complete!",
        description: "You've finished reading the story.",
      });
    }
  };

  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
        const currentWord = story.words[currentWordIndex].toLowerCase().trim();

        if (spokenWord.includes(currentWord)) {
          toast({
            description: "Good job! ✨",
            duration: 1000,
          });
          handleNextWord();
        } else {
          toast({
            title: "Try Again",
            description: `Try saying: "${story.words[currentWordIndex]}"`,
          });
          // Repeat the current word
          speakWord(story.words[currentWordIndex]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isPlaying) {
          // Small delay before restarting recognition
          setTimeout(startListening, 100);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "There was an error with speech recognition. Please try again.",
          variant: "destructive",
        });
      };
    }
  }, [recognition, currentWordIndex, story.words, isPlaying]);

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      speakWord(story.words[currentWordIndex]);
    } else {
      setIsPlaying(false);
      if (synthesis) {
        synthesis.cancel();
      }
      if (recognition) {
        recognition.abort();
      }
    }
  };

  const restart = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    if (synthesis) {
      synthesis.cancel();
    }
    if (recognition) {
      recognition.abort();
    }
    toast({
      description: "Starting from the beginning",
    });
  };

  return (
    <div className="space-y-8">
      <WordDisplay 
        words={story.words}
        currentIndex={currentWordIndex}
      />

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
          <span className="text-sm">{speed}x</span>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={restart}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button
            size="lg"
            onClick={togglePlayback}
            variant={isPlaying ? "destructive" : "default"}
          >
            {isPlaying ? (
              <><Pause className="mr-2 h-4 w-4" /> Pause</>
            ) : (
              <><Play className="mr-2 h-4 w-4" /> Start Reading</>
            )}
          </Button>
        </div>
      </div>

      {isListening && (
        <p className="text-center text-sm text-green-600 mt-2">
          Listening... Say: "{story.words[currentWordIndex]}"
        </p>
      )}
    </div>
  );
}