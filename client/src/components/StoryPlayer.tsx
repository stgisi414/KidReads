import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [index, setIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const { toast } = useToast();

  const { startRecording, stopRecording } = useSpeechRecognition({
    continuous: false,
    interimResults: false,
    onTranscriptionUpdate: (heard) => {
      const expected = story.words[index].toLowerCase().trim();
      heard = heard.toLowerCase().trim();
      setLastHeard(heard);

      console.log('📝 Speech Recognition Results:', {
        expected,
        heard,
        wordIndex: index,
        totalWords: story.words.length
      });

      // For short words (3 chars or less), use exact matching
      // For longer words, use more forgiving matching
      const isShortWord = expected.length <= 3;

      let isMatch = false;
      if (isShortWord) {
        // For short words, split heard text into words and check each one
        const heardWords = heard.split(/\s+/);
        isMatch = heardWords.some(word => word === expected);
        console.log('🔍 Short word matching:', {
          expected,
          heardWords,
          isMatch
        });
      } else {
        // For longer words, use contains matching in both directions
        const matchForward = heard.includes(expected);
        const matchBackward = expected.includes(heard);
        isMatch = matchForward || matchBackward;
        console.log('🎯 Match Analysis:', {
          matchForward: matchForward ? '✅' : '❌',
          matchBackward: matchBackward ? '✅' : '❌',
          finalResult: isMatch ? '✅ Match!' : '❌ No match'
        });
      }

      if (isMatch) {
        if (index < story.words.length - 1) {
          toast({
            title: "Great job! 🌟",
            description: `You correctly said "${expected}"!`,
          });
          setIndex(index + 1);
        } else {
          toast({
            title: "Congratulations! 🎉",
            description: "You've completed the story!",
          });
        }
      } else {
        toast({
          title: "Almost there! 💪",
          description: `I heard "${heard}". Try saying "${story.words[index]}" again.`,
        });
      }
      setIsActive(false);
      stopRecording();
    }
  });

  const readWord = () => {
    if (isActive) return;

    const word = story.words[index];
    setIsActive(true);
    setLastHeard("");

    // Read the word
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.onend = () => {
      // Start listening for response
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-8 text-center space-y-6">
      <h1 className="text-6xl mb-8">{story.words[index]}</h1>

      <Button 
        size="lg" 
        onClick={readWord}
        disabled={isActive}
        className={`w-full ${isActive ? "animate-pulse bg-green-500" : ""}`}
      >
        <Play className="mr-2 h-4 w-4" />
        {isActive ? "Listening..." : "Read Word"}
      </Button>

      {lastHeard && (
        <div className="text-sm text-gray-600">
          Last heard: "{lastHeard}"
        </div>
      )}

      {index === story.words.length - 1 && (
        <p className="mt-4 text-green-600">Last word! Keep going!</p>
      )}
    </div>
  );
}