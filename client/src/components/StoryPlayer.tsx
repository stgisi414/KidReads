import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useElevenLabs } from "@/hooks/use-elevenlabs";
import type { Story } from "@shared/schema";

// List of forbidden words and topics for content filtering
const FORBIDDEN_WORDS = [
  'devil', 'demon', 'satan', 'hell',
  'gun', 'weapon', 'bomb', 'kill', 'shoot',
  'war', 'fight', 'death', 'die',
  'blood', 'gore',
  'religion', 'god', 'jesus', 'bible',
  'hate', 'racist', 'violence'
];

interface StoryPlayerProps {
  story: Story;
}

const VOICE_OPTIONS = [
  { id: "dyTPmGzuLaJM15vpN3DS", name: "Aiden" },
  { id: "pPdl9cQBQq4p6mRkZy2Z", name: "Emma" },
  { id: "7fbQ7yJuEo56rYjrYaEh", name: "John" },
] as const;

// Define stop words that should be grouped with the following word
const STOP_WORDS = new Set([
  // Articles
  'the', 'a', 'an',
  // Prepositions
  'to', 'in', 'on', 'at', 'for', 'by', 'with', 'from', 'of', 'into', 'onto', 'upon', 'within', 'without', 'through', 'between', 'among', 'across', 'behind', 'beside', 'beyond', 'under', 'over', 'after', 'before',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'yet', 'so',
  // Personal Pronouns
  'he', 'she', 'it', 'they', 'we', 'you', 'i',
  // Possessive Pronouns and Adjectives
  'his', 'her', 'their', 'its', 'my', 'your', 'our',
  // Demonstrative Pronouns
  'this', 'that', 'these', 'those',
  // Other connecting words
  'as', 'if', 'when', 'while', 'where', 'how', 'than', 'too',
  //Commonly used adverbs
  'very', 'quite', 'much', 'more', 'less', 'most', 'even',
]);

interface WordGroup {
  text: string;
  words: string[];
  startIndex: number;
}

// Check if content contains any forbidden words
const containsForbiddenContent = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => normalizedText.includes(word.toLowerCase()));
};

export default function StoryPlayer({ story }: StoryPlayerProps) {
  // Check for inappropriate content when story is loaded
  useEffect(() => {
    if (containsForbiddenContent(story.topic) || containsForbiddenContent(story.content)) {
      toast({
        title: "Content Warning",
        description: "This story contains inappropriate content for children.",
        variant: "destructive"
      });
    }
  }, [story, toast]);

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<typeof VOICE_OPTIONS[number]['id']>(VOICE_OPTIONS[0].id);
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const stopRecordingRef = useRef<() => void>(() => {});

  const { speak, isLoading: isSpeaking } = useElevenLabs();
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const { toast } = useToast();

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

  const handleTranscriptionUpdate = useCallback((transcript: string) => {
    if (isPending) return;

    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    const expectedText = currentGroup.text.toLowerCase().replace(/[.,!?]$/, '').trim();
    console.log('Comparing:', { heard: heardText, expected: expectedText });

    const similarityThreshold = isMobileDevice ? 0.4 : 0.5;
    const similarity = calculateWordSimilarity(heardText, expectedText);
    console.log('Similarity:', similarity);

    if (similarity >= similarityThreshold ||
        heardText === expectedText ||
        heardText.includes(expectedText) ||
        expectedText.includes(heardText)) {

      setIsPending(true);
      stopRecordingRef.current();
      setIsActive(false);

      if (currentGroupIndex < wordGroups.length - 1) {
        toast({
          title: "Great job! 🌟",
          description: `You correctly said "${currentGroup.text}"!`
        });

        const delay = isMobileDevice ? 0 : 500;
        setTimeout(() => {
          setCurrentGroupIndex(prev => prev + 1);
          setIsPending(false);
        }, delay);
      } else {
        setShowCelebration(true);
        setIsPending(false);
        toast({
          title: "Congratulations! 🎉",
          description: "You've completed the story!"
        });
      }
    } else {
      if (!isMobileDevice || transcript.endsWith('.')) {
        toast({
          title: "Almost there! 💪",
          description: `Try saying "${currentGroup.text}" again.`
        });
      }
    }
  }, [currentGroupIndex, wordGroups, isPending, isMobileDevice, toast]);

  const handleRecognitionEnd = useCallback(() => {
    setIsActive(false);
    if (!isMobileDevice) {
      setTimeout(() => setIsPending(false), 300);
    }
  }, [isMobileDevice]);

  const { startRecording, stopRecording, isRecording, transcript } = useSpeechRecognition({
    language: "en-US",
    onTranscriptionUpdate: handleTranscriptionUpdate,
    onRecognitionEnd: handleRecognitionEnd,
    continuous: false,
    interimResults: !isMobileDevice,
    initializeOnMount: false
  });

  // Store the stopRecording function in a ref
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Process story words into groups
  useEffect(() => {
    const groups: WordGroup[] = [];
    const words = story.words;
    const hasPunctuation = (word: string) => /[.,!?]/.test(word);

    let i = 0;
    while (i < words.length) {
      const currentWord = words[i].toLowerCase();

      // Check if current word is a stop word and there's a next word without breaking the groups at punctuation
      if (STOP_WORDS.has(currentWord.replace(/[.,!?]$/, '')) && 
          i + 1 < words.length && 
          !hasPunctuation(words[i])) {
        const group = {
          text: `${words[i]} ${words[i + 1]}`,
          words: [words[i], words[i + 1]],
          startIndex: i
        };
        groups.push(group);
        i += 2;
      } else {
        const group = {
          text: words[i],
          words: [words[i]],
          startIndex: i
        };
        groups.push(group);
        i += 1;
      }
    }

    console.log('Created word groups:', groups);
    setWordGroups(groups);
  }, [story.words]);

  const resetStory = () => {
    setCurrentGroupIndex(0);
    setShowCelebration(false);
    setLastHeard("");
    setIsActive(false);
  };

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

  const readWord = async () => {
    if (isActive || isSpeaking || isPending) return;

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    const wordToRead = `"${currentGroup.text}"`;
    console.log('Reading group:', wordToRead);

    setIsActive(true);
    setLastHeard("");
    setIsPending(false);

    try {
      await speak(wordToRead, {
        voiceId: selectedVoice
      });

      if (!isMobileDevice) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      await startRecording();
    } catch (error) {
      console.error('Error in readWord:', error);
      setIsActive(false);
      setIsPending(false);
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
    <div className="p-8 text-center space-y-6 relative">
      <div className="max-w-2xl mx-auto text-xl mb-8 leading-relaxed break-words whitespace-pre-wrap">
        {wordGroups.map((group, groupIndex) => (
          <span
            key={group.startIndex}
            className={`inline-block mx-1 ${
              groupIndex === currentGroupIndex
                ? 'text-2xl font-semibold text-primary'
                : 'text-gray-600'
            }`}
          >
            {group.text}
          </span>
        ))}
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
          disabled={isActive || isSpeaking || isPending}
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

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fade-in">
          <div className="text-center">
            <div className="text-[7rem] animate-bounce mb-8">🎉</div>
            <Button
              variant="outline"
              size="lg"
              onClick={resetStory}
              className="bg-white hover:bg-gray-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Read Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}