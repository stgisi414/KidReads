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

      // Split heard text into individual words and clean them
      const heardWords = heard.split(/\s+/).map(w => w.replace(/[.,!?]$/, '').trim().toLowerCase());
      const cleanExpected = expected.replace(/[.,!?]$/, '').toLowerCase();

      // Match more flexibly by checking if any heard word contains or matches the expected word
      const isMatch = heardWords.some(word => {
        return (
          word === cleanExpected ||
          word.includes(cleanExpected) ||
          cleanExpected.includes(word) ||
          // Allow for slight variations
          (word.length > 3 && cleanExpected.length > 3 && 
           (word.includes(cleanExpected.slice(0, -1)) || 
            cleanExpected.includes(word.slice(0, -1))))
        );
      });

      console.log('Word matching:', {
        heardWords,
        cleanExpected,
        isMatch
      });

      if (isMatch) {
        if (index < story.words.length - 1) {
          toast({
            title: "Great job! 🌟",
            description: `You correctly said "${story.words[index]}"!`,
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
          description: `Try saying "${story.words[index]}" again.`,
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

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.onend = () => {
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-8 text-center space-y-6">
      {/* Full story display */}
      <div className="max-w-2xl mx-auto text-xl mb-8 leading-relaxed break-words whitespace-pre-wrap">
        {story.words.map((word, i) => (
          <span 
            key={i}
            className={`inline-block mx-1 ${i === index ? 'text-2xl font-semibold text-primary' : 'text-gray-600'}`} 
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

      {index === story.words.length - 1 && (
        <p className="mt-4 text-green-600">Last word! Keep going!</p>
      )}
    </div>
  );
}