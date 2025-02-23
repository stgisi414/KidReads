import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  // Get the current word we're expecting the user to say
  const currentWord = story.words[currentWordIndex].toLowerCase().trim();

  const { startRecording, stopRecording } = useSpeechRecognition({
    continuous: false,
    interimResults: false,
    onTranscriptionUpdate: (transcript) => {
      // Clean and normalize the heard transcript
      const heardText = transcript.toLowerCase().trim();
      setLastHeard(heardText);

      // Log exact match attempt
      console.log('Speech Recognition Results:', {
        heard: heardText,
        expecting: currentWord,
        wordIndex: currentWordIndex
      });

      // Split heard text into words and clean each word
      const heardWords = heardText.split(/\s+/).map(word => 
        word.replace(/[.,!?]$/, '').trim().toLowerCase()
      );

      // Check if any of the heard words match our expected word
      const foundMatch = heardWords.some(heardWord => {
        const isExactMatch = heardWord === currentWord;
        const containsWord = heardWord.includes(currentWord) || currentWord.includes(heardWord);
        return isExactMatch || containsWord;
      });

      // Update state first, then log the result
      if (foundMatch) {
        if (currentWordIndex < story.words.length - 1) {
          const nextIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextIndex);
          
          // Log with updated index
          console.log('Match successful! Moving to next word:', {
            previousWord: currentWord,
            nextWord: story.words[nextIndex].toLowerCase().trim(),
            newIndex: nextIndex
          });

      if (foundMatch) {
        if (currentWordIndex < story.words.length - 1) {
          toast({
            title: "Great job! 🌟",
            description: `You correctly said "${story.words[currentWordIndex]}"!`
          });
          // Move to next word
          setCurrentWordIndex(prevIndex => prevIndex + 1);
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

      setIsActive(false);
      stopRecording();
    }
  });

  const readWord = () => {
    if (isActive) return;

    const wordToRead = story.words[currentWordIndex];
    setIsActive(true);
    setLastHeard("");

    const utterance = new SpeechSynthesisUtterance(wordToRead);
    utterance.onend = () => {
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

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