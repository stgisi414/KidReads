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

interface IWindow extends Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

declare global {
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }
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

          // Set up recognition handlers
          newRecognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
          };

          newRecognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          };

          newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);

            // Show specific error messages based on the error type
            let errorMessage = "There was an error with speech recognition. Please try again.";
            if (event.error === 'no-speech') {
              errorMessage = "No speech was detected. Please try speaking again.";
            } else if (event.error === 'not-allowed') {
              errorMessage = "Please allow microphone access to use speech recognition.";
            }

            toast({
              title: "Speech Recognition Error",
              description: errorMessage,
              variant: "destructive",
            });

            // Retry recognition after error
            if (isPlaying) {
              setTimeout(() => {
                startListening();
              }, 1000);
            }
          };

          newRecognition.onresult = (event: SpeechRecognitionEvent) => {
            console.log('Speech recognition result received');
            const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
            const currentWord = story.words[currentWordIndex].toLowerCase().trim();
            console.log('Spoken word:', spokenWord, 'Current word:', currentWord);

            // Compare spoken word with current word
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
              // Repeat the current word after a short delay
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
      } catch (error) {
        console.error("Failed to initialize speech recognition:", error);
        toast({
          title: "Speech Recognition Error",
          description: "There was an error setting up speech recognition.",
          variant: "destructive",
        });
      }
    }

    // Cleanup function
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
        console.log('Starting speech recognition');
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to start listening. Please try again.",
          variant: "destructive",
        });
        // Reset state and try again
        setIsListening(false);
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    }
  };

  const speakWord = (word: string) => {
    if (synthesis) {
      // Cancel any ongoing speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speed;
      utterance.onstart = () => {
        console.log('Speaking word:', word);
      };

      // Add a delay after speaking to allow for user response
      utterance.onend = () => {
        console.log('Finished speaking word:', word);
        if (isPlaying) {
          setTimeout(() => {
            startListening();
          }, 1000); // Longer delay before starting recognition
        }
      };

      synthesis.speak(utterance);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      if (recognition) {
        recognition.abort(); // Stop current recognition
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