import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [index, setIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const readWord = () => {
    if (isActive) return;

    const word = story.words[index];
    setIsActive(true);

    // Read the word
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.onend = () => {
      // Listen for response
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const heard = event.results[0][0].transcript.toLowerCase();
        const expected = word.toLowerCase();

        if (heard.includes(expected) || expected.includes(heard)) {
          if (index < story.words.length - 1) {
            setIndex(index + 1);
          }
        }
        setIsActive(false);
      };

      recognition.onerror = () => setIsActive(false);
      recognition.start();
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
      >
        <Play className="mr-2 h-4 w-4" />
        {isActive ? "Listening..." : "Read Word"}
      </Button>
    </div>
  );
}