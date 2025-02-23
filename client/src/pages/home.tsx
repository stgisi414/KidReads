import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VoiceInput from "@/components/VoiceInput";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTopicSubmit = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stories", {
        topic,
        content: `A story about ${topic}...`, // Placeholder - would use Gemini API
        imageUrl: "https://placeholder.com/image", // Placeholder - would use fal.ai
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">
          Reading Adventure!
        </h1>
        <div className="space-y-6">
          <p className="text-center text-lg">
            Tell me what you want to read about!
          </p>
          <VoiceInput onResult={handleTopicSubmit} isLoading={isLoading} />
          <Button
            className="w-full"
            size="lg"
            disabled={isLoading}
            onClick={() => handleTopicSubmit("cat")}
          >
            Try an Example Story
          </Button>
        </div>
      </Card>
    </div>
  );
}
