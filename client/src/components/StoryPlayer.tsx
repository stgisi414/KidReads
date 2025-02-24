import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecognitionInitialized, setIsRecognitionInitialized] = useState(false);
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const { toast } = useToast();

  // Function to calculate word similarity (more lenient on mobile)
  const calculateWordSimilarity = (word1: string, word2: string): number => {
    word1 = word1.toLowerCase().trim();
    word2 = word2.toLowerCase().trim();

    if (word1 === word2) return 1;

    // Check if one word contains the other
    if (word1.includes(word2) || word2.includes(word1)) return 0.9;

    // Count matching characters
    let matches = 0;
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;

    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
  };

  const onTranscriptionUpdate = useCallback((transcript) => {
    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    setCurrentWordIndex(prevIndex => {
      const currentWord = story.words[prevIndex]?.toLowerCase().trim() || "";

      console.log('Speech Recognition Results:', {
        heard: heardText,
        expecting: currentWord,
        wordIndex: prevIndex,
        isMobile: isMobileDevice
      });

      const heardWords = heardText.split(/\s+/).map(word =>
        word.replace(/[.,!?]$/, '').trim().toLowerCase()
      );

      // Use more lenient matching for mobile devices
      const similarityThreshold = isMobileDevice ? 0.7 : 0.9;
      const foundMatch = heardWords.some(heardWord => {
        const similarity = calculateWordSimilarity(heardWord, currentWord);

        console.log('Word comparison:', {
          heardWord,
          currentWord,
          similarity,
          threshold: similarityThreshold,
          isMobile: isMobileDevice
        });

        return similarity >= similarityThreshold;
      });

      console.log('Match result:', {
        heardWords,
        currentWord,
        foundMatch,
        currentWordIndex: prevIndex
      });

      if (foundMatch) {
        if (prevIndex < story.words.length - 1) {
          setTimeout(() => {
            toast({
              title: "Great job! 🌟",
              description: `You correctly said "${story.words[prevIndex]}"!`
            });
          }, 0);
          return prevIndex + 1;
        } else {
          setTimeout(() => {
            toast({
              title: "Congratulations! 🎉",
              description: "You've completed the story!"
            });
          }, 0);
          return prevIndex;
        }
      } else {
        setTimeout(() => {
          toast({
            title: "Almost there! 💪",
            description: `Try saying "${story.words[prevIndex]}" again.`
          });
        }, 0);
        return prevIndex;
      }
    });
  }, [story, toast, isMobileDevice]);

  const { startRecording, stopRecording, isRecording: hookIsRecording } = useSpeechRecognition({
    continuous: false,
    interimResults: !isMobileDevice, // Disable interim results on mobile
    onTranscriptionUpdate: onTranscriptionUpdate,
    onRecognitionEnd: () => {
      console.log("Speech recognition ended callback received in StoryPlayer");
      setIsActive(false);
      setIsRecognitionInitialized(false);
    }
  });

  useEffect(() => {
    setIsActive(hookIsRecording);
  }, [hookIsRecording]);

  const readWord = () => {
    if (isActive) return;

    const wordToRead = story.words[currentWordIndex];
    setIsActive(true);
    setLastHeard("");
    setIsRecognitionInitialized(true);

    const utterance = new SpeechSynthesisUtterance(wordToRead);
    utterance.onend = () => {
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isRecognitionInitialized) {
        stopRecording();
        setIsRecognitionInitialized(false);
      }
    };
  }, [isRecognitionInitialized, stopRecording]);

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
        disabled={isActive}
        className={`w-full max-w-sm mx-auto ${isActive ? "animate-pulse bg-green-500" : ""}`}
      >
        <Play className="mr-2 h-4 w-4" />
        {isActive ? "Listening..." : "Read Word"}
      </Button>

      {lastHeard && (
        <div className="text-sm text-gray-600">
          Last heard: "{lastHeard}"
        </div>
      )}

      {currentWordIndex === story.words.length - 1 && (
        <p className="mt-4 text-green-600">Last word! Keep going!</p>
      )}
    </div>
  );
}