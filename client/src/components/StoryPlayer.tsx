import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

// Properly declare the webkitSpeechRecognition interface
interface IWebkitSpeechRecognition extends EventTarget {
  new(): IWebkitSpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: (event: any) => void;
  onend: () => void;
  onresult: (event: any) => void;
  onstart: () => void;
}

declare var webkitSpeechRecognition: new () => IWebkitSpeechRecognition;

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const { toast } = useToast();

  const recognitionRef = useRef<IWebkitSpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    } else {
      toast({
        title: "Speech Synthesis Not Available",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
    }

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Initialize speech recognition immediately
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const newRecognition = new webkitSpeechRecognition();
      newRecognition.continuous = false;
      newRecognition.interimResults = false;
      newRecognition.lang = 'en-US';

      newRecognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
      };

      newRecognition.onend = () => {
        console.log('Recognition ended');
        setIsListening(false);
        if (isPlaying) {
          setTimeout(startListening, 500);
        }
      };

      newRecognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to continue.",
            variant: "destructive",
          });
          setIsPlaying(false);
        }
      };

      newRecognition.onresult = (event: any) => {
        const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
        const currentWord = story.words[currentWordIndex].toLowerCase().trim();
        console.log('Spoken:', spokenWord, 'Expected:', currentWord);

        if (spokenWord.includes(currentWord) || currentWord.includes(spokenWord)) {
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
          setTimeout(() => {
            speakWord(story.words[currentWordIndex]);
          }, 1500);
        }
      };

      recognitionRef.current = newRecognition;
    } else {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [story.words, currentWordIndex, isPlaying]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  const speakWord = (word: string) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speed;

    utterance.onend = () => {
      if (isPlaying) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    synthesisRef.current.speak(utterance);
  };

  const handleNextWord = () => {
    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setTimeout(() => {
        speakWord(story.words[currentWordIndex + 1]);
      }, 1000);
    } else {
      setIsPlaying(false);
      toast({
        title: "Story Complete! 🎉",
        description: "Great job reading the whole story!",
      });
    }
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      speakWord(story.words[currentWordIndex]);
    } else {
      setIsPlaying(false);
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
    }
  };

  const restart = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setIsListening(false);
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
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
        <div className="text-center space-y-2">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-ping mx-auto" />
          <p className="text-sm text-green-600 animate-pulse">
            Your turn! Say: "{story.words[currentWordIndex]}"
          </p>
        </div>
      )}
    </div>
  );
}