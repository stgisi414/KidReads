import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = false;
      newRecognition.interimResults = false;
      setRecognition(newRecognition);
      setSynthesis(window.speechSynthesis);
    }
  }, []);

  const speakWord = (word: string) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
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
      }
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      speakWord(story.words[currentWordIndex + 1]);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event) => {
        const spokenWord = event.results[0][0].transcript.toLowerCase();
        const currentWord = story.words[currentWordIndex].toLowerCase();
        
        if (spokenWord.includes(currentWord)) {
          handleNextWord();
        }
      };

      recognition.onend = () => {
        if (isPlaying) {
          startListening();
        }
      };
    }
  }, [recognition, currentWordIndex, story.words, isPlaying]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      speakWord(story.words[currentWordIndex]);
      startListening();
    }
  };

  const restart = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    if (synthesis) {
      synthesis.cancel();
    }
  };

  return (
    <div className="space-y-8">
      <WordDisplay 
        words={story.words}
        currentIndex={currentWordIndex}
      />
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
        >
          {isPlaying ? (
            <><Pause className="mr-2 h-4 w-4" /> Pause</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Start Reading</>
          )}
        </Button>
      </div>
    </div>
  );
}
