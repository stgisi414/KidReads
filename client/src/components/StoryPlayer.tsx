import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw, Mic, MicOff } from "lucide-react";
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
  const { toast } = useToast();
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const [dictation, setDictation] = useState("");

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    } else {
      toast({
        title: "Text-to-Speech Not Available",
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

  const handleTranscription = (transcript: string) => {
    if (!transcript) return;

    setDictation(transcript);

    const spokenWord = transcript.toLowerCase().trim();
    const currentWord = story.words[currentWordIndex].toLowerCase().trim();

    console.log('Spoken:', spokenWord, 'Expected:', currentWord);

    const cleanSpokenWord = spokenWord.replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
    const cleanCurrentWord = currentWord.replace(/[.,!?]/g, '').trim();

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
      if (isPlaying) {
        setTimeout(() => {
          speakWord(story.words[currentWordIndex]);
        }, 1500);
      }
    }
  };

  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use this feature",
          variant: "destructive"
        });
      });
  }, []);

  const { isRecording, startRecording, stopRecording } = useSpeechRecognition({
    language: 'en-US',
    onTranscriptionUpdate: handleTranscription,
    continuous: false,
    interimResults: false
  });

  const speakWord = (word: string) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speed;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      if (isPlaying) {
        alert("About to call startRecording"); // Add this line
        setTimeout(() => {
          startRecording();
        }, 300);
      }
    };


    synthesisRef.current.speak(utterance);
  };

  const handleNextWord = () => {
    stopRecording();

    if (currentWordIndex < story.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setTimeout(() => {
        speakWord(story.words[currentWordIndex + 1]);
      }, 1000);
    } else {
      setIsPlaying(false);
      toast({
        title: "Story Complete! 🎉",
        description: "Great job!"
      });
    }
  };

  const togglePlayback = () => {
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
              <><Pause className="mr-2 h-4 w-4" /> Pause</>
            ) : (
              <><Play className="mr-2 h-4 w-4" /> Start Reading</>
            )}
          </Button>
        </div>
      </div>

      {console.log("isRecording:", isRecording)}
      {isRecording && (
        <div className="text-center space-y-2">
          <Mic className="w-4 h-4 text-green-500 mx-auto animate-pulse" />
          <p className="text-sm text-green-600">Your turn! Say: "{story.words[currentWordIndex]}"</p>
          <div className="border p-2 rounded-md">
            <p className="text-xs">Dictation:</p>
            <p>{dictation}</p>
          </div>
        </div>
      )}
      {!isRecording && isPlaying && (
        <div className="text-center space-y-2">
          <div className="w-4 h-4 rounded-full mx-auto bg-blue-400 animate-bounce" />
          <p className="text-sm text-blue-600">Get ready...</p>
        </div>
      )}
    </div>
  );
}
