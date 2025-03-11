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
import { Loader2 } from "lucide-react";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [accentColor, setAccentColor] = useState("#4CAF50");
  const { toast } = useToast();

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
              <div className="relative h-[120px] overflow-hidden">
                <div className="absolute w-full transition-transform duration-1000 ease-in-out hover:pause-animation animate-scroll">
                  {[...stories, ...stories].slice(0, 16).map((story, index) => (
                    <Button
                      key={`${story.id}-${index}`}
                      variant="outline"
                      className="w-full justify-start text-left h-auto mb-2"
                      onClick={() => setLocation(`/read/${story.id}`)}
                      disabled={isLoading}
                    >
                      <span className="line-clamp-1">{story.topic}</span>
                    </Button>
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