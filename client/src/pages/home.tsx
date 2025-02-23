import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VoiceInput from "@/components/VoiceInput";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../assets/logo.jpg";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 shadow-xl bg-white/90 backdrop-blur">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <img src={logoImage} alt="Logo" className="h-16 w-auto"/>
            <h5 className="text-2xl font-bold text-primary">
              KidReads
            </h5>
          </div>
          <p className="text-2xl text-gray-600">
            Tell me what you want to read about!
          </p>
          <div className="space-y-4">
            <VoiceInput onResult={handleTopicSubmit} isLoading={isLoading} />
            <Button
              className="w-full bg-primary/90 hover:bg-primary text-white text-xl py-6"
              size="lg"
              disabled={isLoading}
              onClick={() => {
                const topics = [
                  "friendly cat",
                  "playful puppy",
                  "magical rainbow",
                  "flying butterfly",
                  "happy elephant",
                  "silly monkey",
                  "gentle giraffe",
                  "swimming dolphin",
                  "busy bee",
                  "wise owl"
                ];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                handleTopicSubmit(randomTopic);
              }}
            >
              Try an Example Story
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}