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

  const { toast } = useToast();

  const onTranscriptionUpdate = useCallback((transcript) => {
    // Clean and normalize the heard transcript
    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    // Use functional update for setCurrentWordIndex to get the latest index
    setCurrentWordIndex(prevIndex => {
      const currentWord = story.words[prevIndex]?.toLowerCase().trim() || "";

      // Log exact match attempt
      console.log('Speech Recognition Results:', {
        heard: heardText,
        expecting: currentWord,
        wordIndex: prevIndex
      });

      // Split heard text into words and clean each word
      const heardWords = heardText.split(/\s+/).map(word =>
        word.replace(/[.,!?]$/, '').trim().toLowerCase()
      );

      // Check if any of the heard words match our expected word
      const foundMatch = heardWords.some(heardWord => {
        const isExactMatch = heardWord === currentWord;
        const containsWord = heardWord.includes(currentWord) || currentWord.includes(heardWord);

        // Log each word comparison
        console.log('Word comparison:', {
          heardWord,
          currentWord,
          isExactMatch,
          containsWord,
          currentWordIndex: prevIndex
        });

        return isExactMatch || containsWord;
      });

      // Log final match result
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
  }, [story, toast]);

  const { startRecording, stopRecording, isRecording: hookIsRecording } = useSpeechRecognition({
    continuous: false,
    interimResults: false,
    onTranscriptionUpdate: onTranscriptionUpdate,
    onRecognitionEnd: () => {
      console.log("Speech recognition ended callback received in StoryPlayer, resetting isActive to false");
      setIsActive(false);
      setIsRecognitionInitialized(false); // Reset recognition state when it ends
    }
  });

  useEffect(() => {
    setIsActive(hookIsRecording);
    console.log("isActive in StoryPlayer updated to:", hookIsRecording);
  }, [hookIsRecording]);

  const readWord = () => {
    if (isActive) return;

    const wordToRead = story.words[currentWordIndex];
    setIsActive(true);
    setLastHeard("");
    setIsRecognitionInitialized(true); // Set recognition as initialized when starting

    const utterance = new SpeechSynthesisUtterance(wordToRead);
    utterance.onend = () => {
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Cleanup effect
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
      {/* Story display */}
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