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

  const handleTopicSubmit = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stories", { topic });
      const story = await response.json();
      setLocation(`/read/${story.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleStory = () => {
    if (!stories || stories.length === 0) {
      toast({
        title: "No stories available",
        description: "Please try speaking a topic instead.",
        variant: "destructive"
      });
      return;
    }

    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    setLocation(`/read/${randomStory.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {stories && stories.length > 0 && (
        <div className="absolute inset-0 opacity-30">
          <BackgroundSlider 
            stories={stories} 
            onAccentColorChange={setAccentColor}
          />
        </div>
      )}

      <Card className="w-full max-w-lg p-8 shadow-xl bg-white/80 backdrop-filter backdrop-opacity-80 transition-all duration-300 hover:bg-white/90 hover:shadow-2xl">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <img src={logoImage} alt="Logo" className="h-16 w-auto"/>
            <h5 
              className="text-3xl font-bold"
              style={{
                color: accentColor,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              KidReads
            </h5>
          </div>
          <p className="text-2xl text-gray-600">
            Tell me what you want to read about!
          </p>
          <div className="space-y-4">
            <VoiceInput onResult={handleTopicSubmit} isLoading={isLoading} />
            <Button
              className="w-full bg-opacity-90 hover:bg-opacity-100 text-white text-xl py-6"
              size="lg"
              disabled={isLoading}
              onClick={handleSampleStory}
              style={{
                backgroundColor: accentColor
              }}
            >
              Try a Sample Story
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}