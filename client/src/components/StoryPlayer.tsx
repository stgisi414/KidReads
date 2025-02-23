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

// Add proper type declarations for Speech Recognition
interface IWindow extends Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const { toast } = useToast();

  // Initialize speech recognition and synthesis on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize speech synthesis
      const synth = window.speechSynthesis;
      setSynthesis(synth);

      // Initialize speech recognition
      try {
        const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || 
                                 (window as unknown as IWindow).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const newRecognition = new SpeechRecognition();
          newRecognition.continuous = false;
          newRecognition.interimResults = false;
          newRecognition.lang = 'en-US';
          setRecognition(newRecognition);
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

  // Function to speak a word and wait for user input
  const speakWord = (word: string) => {
    if (synthesis) {
      // Cancel any ongoing speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speed;

      // Add a delay after speaking to allow for user response
      utterance.onend = () => {
        if (isPlaying) {
          setTimeout(() => {
            startListening();
          }, 500); // Short delay before starting recognition
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
        title: "Story Complete! 🎉",
        description: "Great job reading the whole story!",
      });
    }
  };

  // Set up recognition event handlers
  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
        const currentWord = story.words[currentWordIndex].toLowerCase().trim();

        // Compare spoken word with current word
        if (spokenWord.includes(currentWord)) {
          toast({
            description: "Great reading! ⭐",
            duration: 1000,
          });
          handleNextWord();
        } else {
          toast({
            title: "Try Again",
            description: `Let's try reading: "${story.words[currentWordIndex]}"`,
          });
          // Repeat the current word after a short delay
          setTimeout(() => {
            speakWord(story.words[currentWordIndex]);
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
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
      description: "Starting from the beginning!",
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
        <p className="text-center text-sm text-green-600 mt-2 animate-pulse">
          Your turn! Say: "{story.words[currentWordIndex]}"
        </p>
      )}
    </div>
  );
}