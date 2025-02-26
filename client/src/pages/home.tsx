import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VoiceInput from "@/components/VoiceInput";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../assets/logo.png";
import type { Story } from "@shared/schema";
import BackgroundSlider from "@/components/BackgroundSlider";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [accentColor, setAccentColor] = useState("#4CAF50");
  const { toast } = useToast();

  // Fetch existing stories
  const { data: stories } = useQuery<Story[]>({
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

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        {stories && stories.length > 0 && (
          <BackgroundSlider 
            stories={stories} 
            onColorChange={setAccentColor}
          />
        )}
      </div>

      <Card className="w-full max-w-lg mx-auto m-4 p-2">
        <div className="flex flex-col items-center justify-center text-center">
          <img src={logoImage} alt="KidReads Logo" className="w-48 h-48 object-contain mb-4" />
          <h1 className="text-4xl font-bold mb-2 sparkle-text">KidReads</h1>
          <p className="text-xl text-gray-600 mb-6">What would you like to read about?</p>

          <VoiceInput
            onSubmit={handleStoryCreation}
            isLoading={isLoading}
            accentColor={accentColor}
          />

          {stories && stories.length > 0 && (
            <div className="w-full mt-6">
              <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
              <div className="grid gap-2">
                {stories.slice(0, 3).map(story => (
                  <Button
                    key={story.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto"
                    onClick={() => setLocation(`/read/${story.id}`)}
                  >
                    <span className="line-clamp-1">{story.topic}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}