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

const VOICE_OPTIONS = [
  { id: "dyTPmGzuLaJM15vpN3DS", name: "Aiden" },
  { id: "pPdl9cQBQq4p6mRkZy2Z", name: "Emma" },
  { id: "7fbQ7yJuEo56rYjrYaEh", name: "John" },
] as const;

// Define stop words that should be grouped with the following word
const STOP_WORDS = ['the', 'a', 'an', 'to', 'in', 'on', 'at', 'for', 'and', 'but', 'or'];

interface WordGroup {
  text: string;
  originalIndices: number[];
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<typeof VOICE_OPTIONS[number]['id']>(VOICE_OPTIONS[0].id);
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);

  const { speak, isLoading: isSpeaking } = useElevenLabs();

  // Process story words into groups
  useEffect(() => {
    const groups: WordGroup[] = [];
    const words = story.words;

    let i = 0;
    while (i < words.length) {
      const currentWord = words[i].toLowerCase().replace(/[.,!?]$/, '');

      if (STOP_WORDS.includes(currentWord) && i + 1 < words.length) {
        // Group stop word with next word
        groups.push({
          text: `${words[i]} ${words[i + 1]}`,
          originalIndices: [i, i + 1]
        });
        i += 2;
      } else {
        // Single word
        groups.push({
          text: words[i],
          originalIndices: [i]
        });
        i += 1;
      }
    }

    setWordGroups(groups);
  }, [story.words]);

  const playWelcomeMessage = useCallback(async (voiceId: typeof VOICE_OPTIONS[number]['id']) => {
    const welcomeMessages = {
      "dyTPmGzuLaJM15vpN3DS": "Hi, I'm Aiden! Let's read together and have fun!",
      "pPdl9cQBQq4p6mRkZy2Z": "Hi, I'm Emma! I'm ready to help you read!",
      "7fbQ7yJuEo56rYjrYaEh": "Hi, I'm John! Let's dive into a story together!"
    } as const;

    const message = welcomeMessages[voiceId];
    if (message) {
      try {
        await speak(message, { voiceId });
      } catch (error) {
        console.error('Error playing welcome message:', error);
      }
    }
  }, [speak]);

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const { toast } = useToast();

  const onTranscriptionUpdate = useCallback((transcript: string) => {
    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    const expectedText = currentGroup.text.toLowerCase().trim();
    const heardWords = heardText.split(/\s+/).map(word => 
      word.replace(/[.,!?]$/, '').trim().toLowerCase()
    );

    const lastHeardWord = heardWords[heardWords.length - 1];
    if (!lastHeardWord) return;

    const similarityThreshold = 0.4;
    const similarity = calculateWordSimilarity(lastHeardWord, expectedText);

    if (similarity >= similarityThreshold || 
        lastHeardWord === expectedText || 
        lastHeardWord.includes(expectedText) || 
        expectedText.includes(lastHeardWord)) {

      stopRecording();
      setIsActive(false);

      if (currentGroupIndex < wordGroups.length - 1) {
        toast({
          title: "Great job! 🌟",
          description: `You correctly said "${currentGroup.text}"!`
        });
        setCurrentGroupIndex(currentGroupIndex + 1);
      } else {
        toast({
          title: "Congratulations! 🎉",
          description: "You've completed the story!"
        });
      }
    } else {
      toast({
        title: "Almost there! 💪",
        description: `Try saying "${currentGroup.text}" again.`
      });
    }
  }, [wordGroups, currentGroupIndex, toast]);

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

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    const wordToRead = `"${currentGroup.text}"`;
    setIsActive(true);
    setLastHeard("");

    try {
      await speak(wordToRead, {
        voiceId: selectedVoice
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
        {story.words.map((word, i) => {
          // Find which group this word belongs to
          const groupIndex = wordGroups.findIndex(group => 
            group.originalIndices.includes(i)
          );

          // Determine if this word's group is the current one
          const isCurrentGroup = groupIndex === currentGroupIndex;

          // Only show word if it's the first word in its group
          const isFirstInGroup = wordGroups[groupIndex]?.originalIndices[0] === i;

          return isFirstInGroup ? (
            <span
              key={i}
              className={`inline-block mx-1 ${isCurrentGroup ? 'text-2xl font-semibold text-primary' : 'text-gray-600'}`}
            >
              {wordGroups[groupIndex].text}
            </span>
          ) : null;
        })}
      </div>

      <div className="space-y-4">
        <select
          value={selectedVoice}
          onChange={(e) => {
            const newVoiceId = e.target.value as typeof VOICE_OPTIONS[number]['id'];
            setSelectedVoice(newVoiceId);
            playWelcomeMessage(newVoiceId);
          }}
          className="w-full max-w-sm mx-auto block px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {VOICE_OPTIONS.map(voice => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>

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

        {currentGroupIndex === wordGroups.length - 1 && (
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
    </div>
  );
}