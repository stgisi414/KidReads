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
      const response = await apiRequest("POST", "/api/stories", {
        topic,
        content: `A story about ${topic}...`,
        imageUrl: "https://placeholder.com/image",
        words: [`A`, `story`, `about`, topic],
      });
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
          <img src={logoImage} alt="Logo" className="h-24 w-auto mb-4"/> {/* Added logo image */}
          <h1 className="text-5xl font-bold text-primary animate-bounce">
            Reading Adventure!
          </h1>
          <p className="text-2xl text-gray-600">
            Tell me what you want to read about!
          </p>
          <div className="space-y-4">
            <VoiceInput onResult={handleTopicSubmit} isLoading={isLoading} />
            <Button
              className="w-full bg-primary/90 hover:bg-primary text-white text-xl py-6"
              size="lg"
              disabled={isLoading}
              onClick={() => handleTopicSubmit("cat")}
            >
              Try an Example Story
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}