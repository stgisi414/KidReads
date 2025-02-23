import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
  story: Story;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const { toast } = useToast();

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasMicPermission(true);
      } catch (error) {
        console.error('Failed to get microphone permission:', error);
        setHasMicPermission(false);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access and refresh the page to start reading",
          variant: "destructive"
        });
      }
    };
    checkMicPermission();
  }, []);

  const readAndListen = async () => {
    if (!hasMicPermission) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access and refresh the page",
        variant: "destructive"
      });
      return;
    }

    setIsReading(true);

    // Read the current word
    const utterance = new SpeechSynthesisUtterance(story.words[currentWordIndex]);
    utterance.rate = 0.8;
    utterance.onend = () => {
      // After reading, start listening
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        console.log('Started listening for:', story.words[currentWordIndex]);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const currentWord = story.words[currentWordIndex].toLowerCase().trim();

        console.log('Heard:', transcript, 'Expected:', currentWord);

        // Simple word matching
        if (transcript.includes(currentWord) || currentWord.includes(transcript)) {
          toast({ description: "Correct! ⭐" });
          if (currentWordIndex < story.words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
            setTimeout(readAndListen, 1000);
          } else {
            toast({ description: "Story complete! 🎉" });
            setIsReading(false);
          }
        } else {
          toast({ 
            description: `Try again: "${story.words[currentWordIndex]}"`,
            variant: "destructive" 
          });
          setTimeout(readAndListen, 1000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setIsReading(false);
        toast({
          title: "Error",
          description: "Failed to start listening. Please try again.",
          variant: "destructive"
        });
      };

      recognition.start();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-8">
      {!hasMicPermission ? (
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Microphone Access Required</h3>
          <p className="text-sm text-yellow-600 mt-2">
            Please allow microphone access when prompted and refresh the page to start reading.
          </p>
        </div>
      ) : (
        <>
          <div className="text-4xl font-bold text-center">
            {story.words[currentWordIndex]}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => !isReading && readAndListen()}
              disabled={isReading || !hasMicPermission}
            >
              <Play className="mr-2 h-4 w-4" />
              {isReading ? "Listening..." : "Start Reading"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}