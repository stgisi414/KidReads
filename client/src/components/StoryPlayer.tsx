import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useElevenLabs } from "@/hooks/use-elevenlabs";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const { toast } = useToast();
  const { speak, isLoading: isSpeaking } = useElevenLabs();

  const onTranscriptionUpdate = useCallback((transcript: string) => {
    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    const currentWord = story.words[currentWordIndex]?.toLowerCase().trim() || "";
    const heardWords = heardText.split(/\s+/).map((word: string) =>
      word.replace(/[.,!?]$/, '').trim().toLowerCase()
    );

    // Only process the last word spoken
    const lastHeardWord = heardWords[heardWords.length - 1];
    if (!lastHeardWord) return;

    const similarityThreshold = 0.4;
    const normalizedHeard = lastHeardWord.toLowerCase().trim();
    const normalizedTarget = story.words[currentWordIndex].toLowerCase().trim();
    const similarity = calculateWordSimilarity(normalizedHeard, normalizedTarget);
    
    console.log("Comparing:", normalizedHeard, normalizedTarget, similarity);
    const foundMatch = similarity >= similarityThreshold ||
      lastHeardWord === currentWord ||
      lastHeardWord.includes(currentWord) ||
      currentWord.includes(lastHeardWord);

    if (foundMatch) {
      stopRecording();
      setIsActive(false);
      
      if (currentWordIndex < story.words.length - 1) {
        toast({
          title: "Great job! 🌟",
          description: `You correctly said "${story.words[currentWordIndex]}"!`
        });
        
        // Small delay to ensure recognition has stopped
        setTimeout(() => {
          setCurrentWordIndex(prev => prev + 1);
        }, 1000);
      } else {
        toast({
          title: "Congratulations! 🎉",
          description: "You've completed the story!"
        });
      }
    } else {
      toast({
        title: "Almost there! 💪",
        description: `Try saying "${story.words[currentWordIndex]}" again.`
      });
    }
  }, [story, currentWordIndex, toast]);

  const { startRecording, stopRecording, isRecording, transcript } = useSpeechRecognition({
    language: "en-US",
    onTranscriptionUpdate,
    continuous: false,
    interimResults: !isMobileDevice,
    onRecognitionEnd: () => {
      setIsActive(false);
    },
    initializeOnMount: false
  });

  const calculateWordSimilarity = (word1: string, word2: string): number => {
    word1 = word1.toLowerCase().trim();
    word2 = word2.toLowerCase().trim();

    if (word1 === word2) return 1;
    if (word1.includes(word2) || word2.includes(word1)) return 0.9;

    let matches = 0;
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;

    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
  };

  const readWord = async () => {
    if (isActive || isSpeaking) return;

    const wordToRead = story.words[currentWordIndex];
    setIsActive(true);
    setLastHeard("");

    try {
      await speak(wordToRead, {
        voiceId: "pNInz6obpgDQGcFmaJgB" // Adam voice
      });
      await startRecording();
    } catch (error) {
      console.error('Error in readWord:', error);
      setIsActive(false);
      toast({
        title: "Error",
        description: "Failed to read the word. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <div className="p-8 text-center space-y-6">
      <div className="max-w-2xl mx-auto text-xl mb-8 leading-relaxed break-words whitespace-pre-wrap">
        {story.words.map((word, i) => (
          <span
            key={i}
            className={`inline-block mx-1 ${i === currentWordIndex ? 'text-2xl font-semibold text-primary' : 'text-gray-600'}`}
          >
            {word}
          </span>
        ))}
      </div>

      <Button
        size="lg"
        onClick={readWord}
        disabled={isActive || isSpeaking}
        className={`w-full max-w-sm mx-auto ${isActive ? "animate-pulse bg-green-500" : ""}`}
      >
        <Play className="mr-2 h-4 w-4" />
        {isActive ? "Listening..." : isSpeaking ? "Speaking..." : "Read Word"}
      </Button>

      {lastHeard && (
        <div className="text-sm text-gray-600">
          Last heard: "{lastHeard}"
        </div>
      )}

      {currentWordIndex === story.words.length - 1 && (
        <p className="mt-4 text-green-600">Last word! Keep going!</p>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Live Transcript</h3>
        <p className="text-gray-600 min-h-[2rem] transition-all">
          {isActive ? (
            transcript ?
              <span className="animate-pulse">{transcript}</span> :
              <span className="animate-pulse">Listening...</span>
          ) : (
            "Click 'Read Word' to start"
          )}
        </p>
      </div>
    </div>
  );
}