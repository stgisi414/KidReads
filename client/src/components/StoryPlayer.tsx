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
  const { toast } = useToast();

  const { startRecording, stopRecording } = useSpeechRecognition({
    continuous: false,
    interimResults: false,
    onTranscriptionUpdate: (heard) => {
      const expected = story.words[index].toLowerCase().trim();
      heard = heard.toLowerCase().trim();

      // Check if either word contains the other
      const isMatch = heard.indexOf(expected) !== -1 || expected.indexOf(heard) !== -1;

      if (isMatch) {
        if (index < story.words.length - 1) {
          setIndex(index + 1);
        } else {
          toast({
            title: "Congratulations!",
            description: "You've completed the story!",
          });
        }
      } else {
        toast({
          title: "Try Again",
          description: `Almost! Try saying "${story.words[index]}" again.`,
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

    // Read the word
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.onend = () => {
      // Start listening for response
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-8 text-center">
      <h1 className="text-6xl mb-8">{story.words[index]}</h1>
      <Button 
        size="lg" 
        onClick={readWord}
        disabled={isActive}
        className={isActive ? "animate-pulse" : ""}
      >
        <Play className="mr-2 h-4 w-4" />
        {isActive ? "Listening..." : "Read Word"}
      </Button>
      {index === story.words.length - 1 && (
        <p className="mt-4 text-green-600">Last word! Keep going!</p>
      )}
    </div>
  );
}