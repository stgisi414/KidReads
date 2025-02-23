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

declare var webkitSpeechRecognition: any;

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speed, setSpeed] = useState(0.8);
  const { toast } = useToast();

  // Initialize speech synthesis and recognition
  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    } else {
      toast({
        title: "Speech Synthesis Not Available",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
    }

    // Initialize speech recognition
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
          // If we're still playing, restart recognition after a short delay
          setTimeout(startListening, 500);
        }
      };

      newRecognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use the reading feature.",
            variant: "destructive",
          });
          setIsPlaying(false);
        } else {
          toast({
            title: "Speech Recognition Error",
            description: "There was an error with speech recognition. Please try again.",
            variant: "destructive",
          });
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
          // Repeat the word after a short delay
          setTimeout(() => {
            speakWord(story.words[currentWordIndex]);
          }, 1500);
        }
      };

      setRecognition(newRecognition);
    } else {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }

    // Cleanup
    return () => {
      if (synthesis) {
        synthesis.cancel();
      }
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        console.log('Starting recognition');
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  const speakWord = (word: string) => {
    if (!synthesis) return;

    synthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speed;

    utterance.onend = () => {
      console.log('Finished speaking:', word);
      if (isPlaying) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    console.log('Speaking word:', word);
    synthesis.speak(utterance);
  };

  const handleNextWord = () => {
    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      if (recognition) {
        recognition.abort();
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
      if (synthesis) {
        synthesis.cancel();
      }
      if (recognition) {
        recognition.abort();
      }
      setIsListening(false);
    }
  };

  const restart = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setIsListening(false);
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
        <div className="text-center space-y-2">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-ping mx-auto"/>
          <p className="text-sm text-green-600 animate-pulse">
            Your turn! Say: "{story.words[currentWordIndex]}"
          </p>
        </div>
      )}
    </div>
  );
}