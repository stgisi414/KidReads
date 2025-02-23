//client/src/components/StoryPlayer.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import WordDisplay from "@/components/WordDisplay";
import { Play, Pause, RotateCcw, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import type { Story } from "@shared/schema";

interface StoryPlayerProps {
    story: Story;
}

declare var webkitSpeechRecognition: any;

export default function StoryPlayer({ story }: StoryPlayerProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speed, setSpeed] = useState(0.8);
    const { toast } = useToast();

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const isComponentMounted = useRef(true); // Track component mount state


    // --- Setup and Cleanup Effects ---

    useEffect(() => {
        // Speech synthesis setup
        if ('speechSynthesis' in window) {
            synthesisRef.current = window.speechSynthesis;
        } else {
            toast({
                title: "Speech Synthesis Not Available",
                description: "Your browser doesn't support text-to-speech.",
                variant: "destructive",
            });
        }

        // Speech recognition initialization (now happens *here*)
        initializeRecognition();

        return () => {
            isComponentMounted.current = false; // Set to false on unmount
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []); // Run only once on mount


    // --- Speech Recognition Setup ---

    const initializeRecognition = async () => {
        try {
            // Request microphone permission explicitly
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if ('webkitSpeechRecognition' in window && !recognitionRef.current) {
                const newRecognition = new webkitSpeechRecognition();
                newRecognition.continuous = false;
                newRecognition.interimResults = false;
                newRecognition.lang = 'en-US';

            newRecognition.onstart = () => {
                if (isComponentMounted.current) {  // Check if mounted
                  setIsListening(true);
                }
            };

            newRecognition.onend = () => {
                if (isComponentMounted.current) { // Check if mounted
                  setIsListening(false);
                }
            };

            newRecognition.onerror = (event: any) => {
              if (isComponentMounted.current){
                setIsListening(false);
                setIsPlaying(false);

                if (event.error === 'not-allowed') {
                    toast({
                        title: "Microphone Access Denied",
                        description: "Please allow microphone access.",
                        variant: "destructive",
                    });
                } else if (event.error !== 'no-speech') { // Don't show for no-speech
                    toast({
                        title: "Speech Recognition Error",
                        description: `Error: ${event.error}`,
                        variant: "destructive",
                    });
                }
              }
            };

            newRecognition.onresult = (event: any) => {
                if (isComponentMounted.current) {
                    // --- The "Gate" ---
                    if (event.results && event.results[0] && event.results[0][0]) {
                        const confidence = event.results[0][0].confidence;
                        if (confidence < 0.7) { // Adjust this threshold as needed!
                            console.log("Low confidence result ignored:", event.results[0][0].transcript, "Confidence:", confidence);
                            return; // Ignore low-confidence results
                        }

                        const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
                        const resultIndex = currentWordIndex;
                        const currentWord = story.words[resultIndex].toLowerCase().trim();
                        const cleanSpokenWord = spokenWord.replace(/[.,!?]/g, '');
                        const cleanCurrentWord = currentWord.replace(/[.,!?]/g, '');
                        const isMatch = cleanSpokenWord === cleanCurrentWord;

                        if (isMatch) {
                            toast({ description: "Great reading! ⭐", duration: 1000 });
                            if (resultIndex === currentWordIndex) {
                                handleNextWord();
                            }
                        } else {
                            toast({
                                title: "Try Again",
                                description: `You said: "${spokenWord}". Try: "${currentWord}"`,
                                duration: 2500,
                            });
                            setTimeout(() => {
                                if (isPlaying && isComponentMounted.current) {
                                    speakWord(currentWord);
                                }
                            }, 3000);
                        }
                    }
                }
            };

            recognitionRef.current = newRecognition;
            }
        } catch (error) {
            toast({
                title: "Microphone Access Required",
                description: "Please allow microphone access to use voice recognition.",
                variant: "destructive",
            });
            console.error("Microphone permission error:", error);
        }
    };


    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                if (isComponentMounted.current){
                  setIsListening(false); // Ensure consistency
                }
            }
        }
    };


    // --- Speech Synthesis (Speaking) ---

    const speakWord = (word: string) => {
        if (!synthesisRef.current) return;
        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = speed;

        utterance.onend = () => {
          if (isPlaying && isComponentMounted.current) {
            startListening();
          }
        };
        utterance.onerror = (error) => {
            console.error("Speech synthesis error:", error);
        }

        synthesisRef.current.speak(utterance);
    };

    // --- Control Functions ---

    const handleNextWord = () => {
      if (isComponentMounted.current){
        if (currentWordIndex < story.words.length - 1) {
          const nextIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextIndex);
          if (isPlaying) {
            speakWord(story.words[nextIndex]);
          }
        } else {
          setIsPlaying(false);
          toast({ title: "Story Complete! 🎉", description: "Great job!" });
        }
       }
    };

    const togglePlayback = () => {
        if (!isPlaying) {
            setIsPlaying(true);
            speakWord(story.words[currentWordIndex]); // Start reading
        } else {
            setIsPlaying(false);
            setIsListening(false); // Ensure listening state is updated
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop(); // Use stop() instead of abort()
            }
        }
    };
    const restart = () => {
      if(isComponentMounted.current){
        setCurrentWordIndex(0);
        setIsPlaying(false);
        setIsListening(false); // Reset listening state
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
        }
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        toast({ description: "Starting from the beginning!" });
      }
    };



    // --- UI ---
    return (
        <div className="space-y-8">
            <WordDisplay words={story.words} currentIndex={currentWordIndex} />

            <div className="space-y-6">
                {/* Speed Control */}
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Reading Speed:</span>
                    <Slider
                        value={[speed]}
                        onValueChange={([newSpeed]) => setSpeed(newSpeed)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-[200px]"
                    />
                    <span className="text-sm">{speed.toFixed(1)}x</span>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    <Button size="lg" variant="outline" onClick={restart}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Restart
                    </Button>
                    <Button size="lg" onClick={togglePlayback} variant={isPlaying ? "destructive" : "default"}>
                        {isPlaying ? (
                            <><Pause className="mr-2 h-4 w-4" /> Pause</>
                        ) : (
                            <><Play className="mr-2 h-4 w-4" /> Start Reading</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Status Indicators */}
            {isListening && (
                <div className="text-center space-y-2">
                    <Mic className="w-4 h-4 text-green-500 mx-auto animate-pulse" />
                    <p className="text-sm text-green-600">Your turn! Say: "{story.words[currentWordIndex]}"</p>
                </div>
            )}
            {!isListening && isPlaying && (
                <div className="text-center space-y-2">
                    <div className="w-4 h-4 rounded-full mx-auto bg-blue-400 animate-bounce" />
                    <p className="text-sm text-blue-600">Listening...</p>
                </div>
            )}
        </div>
    );
}
