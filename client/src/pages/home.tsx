import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VoiceInput from "@/components/VoiceInput";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@shared/schema";
import BackgroundSlider from "@/components/BackgroundSlider";
import SpeechBubble from "@/components/SpeechBubble";
import { BookOpen, Loader2, Volume2 } from "lucide-react";
import { useGoogleTTS } from "@/hooks/use-google-tts";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [accentColor, setAccentColor] = useState("#4CAF50");
  const [speakingStoryId, setSpeakingStoryId] = useState<number | null>(null);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const { toast } = useToast();
  const { speak, isLoading: isSpeaking } = useGoogleTTS();

  // Fetch existing stories
  const { data: stories, isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    queryFn: async () => {
      const response = await fetch('/api/stories');
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      return response.json();
    }
  });

  const handleStoryCreation = async (topic: string) => {
    if (!topic) return;

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/stories", { topic });
      const story = await response.json();

      if (response.ok) {
        setLocation(`/read/${story.id}`);
      } else if (story.type === 'CONTENT_FILTER') {
        toast({
          title: "Content Warning",
          description: "Please choose a kid-friendly topic.",
          variant: "destructive"
        });
      } else {
        throw new Error('Failed to create story');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = isLoadingStories || isCreating;
  
  const handleSpeakTopic = async (story: Story, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isSpeaking) return;
    
    setSpeakingStoryId(story.id);
    setIsScrollPaused(true); // Pause scrolling while speaking
    
    try {
      await speak(story.topic);
    } catch (error) {
      console.error("Error speaking story topic:", error);
      toast({
        title: "Error",
        description: "Failed to speak the story topic. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSpeakingStoryId(null);
      setIsScrollPaused(false); // Resume scrolling after speaking
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        {stories && stories.length > 0 && (
          <BackgroundSlider 
            stories={stories}
            onAccentColorChange={setAccentColor}
          />
        )}
      </div>

      <Card className={`w-full max-w-lg mx-auto m-4 p-2 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="flex flex-col items-center justify-center text-center relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mb-6">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-48 h-48 object-contain" 
              aria-label="KidReads Logo"
            >
              <source src="/kidreads.mp4" type="video/mp4" />
            </video>
            <SpeechBubble text="What would you like to read about?" />
          </div>
          <h1 className="text-4xl font-bold mb-2 sparkle-text">KidReads</h1>

          <VoiceInput
            onSubmit={handleStoryCreation}
            isLoading={isLoading}
            accentColor={accentColor}
          />

          {stories && stories.length > 0 && (
            <div className="w-full mt-6 overflow-hidden">
              <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
              <div className="relative h-[220px] overflow-y-auto overflow-x-hidden rounded-lg" 
                onMouseEnter={() => setIsScrollPaused(true)}
                onMouseLeave={() => setIsScrollPaused(isSpeaking ? true : false)}
                onTouchStart={() => setIsScrollPaused(true)}
                onTouchEnd={() => setIsScrollPaused(isSpeaking ? true : false)}
              >
                <div className={`absolute w-full transition-transform duration-1000 ease-in-out ${isScrollPaused ? 'animation-paused' : 'animate-scroll'}`}>
                  {[...stories, ...stories].slice(0, 16).map((story, index) => (
                    <div
                      key={`${story.id}-${index}`}
                      className="flex items-center w-full mb-3 bg-white border rounded-lg p-2 hover:shadow-md transition-shadow"
                    >
                      <img 
                        src={story.imageUrl} 
                        alt={story.topic}
                        className="story-thumbnail"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1 font-medium">{story.topic}</p>
                      </div>
                      <div className="story-actions">
                        <button 
                          className="story-actions-button text-primary"
                          onClick={(e) => handleSpeakTopic(story, e)}
                          disabled={isLoading || (speakingStoryId !== null && speakingStoryId !== story.id)}
                          title="Read topic aloud"
                        >
                          {speakingStoryId === story.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </button>
                        <button 
                          className="story-actions-button text-primary"
                          onClick={() => setLocation(`/read/${story.id}`)}
                          disabled={isLoading}
                          title="Open story"
                        >
                          <BookOpen className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}