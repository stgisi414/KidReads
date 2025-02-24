import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoryPlayer from "@/components/StoryPlayer";
import type { Story } from "@shared/schema";

export default function ReadAlong() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();

  const { data: story, isLoading, error } = useQuery<Story>({
    queryKey: [`/api/stories/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load story');
      }
      return response.json();
    }
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error loading story. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Story not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto p-6 relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4"
          onClick={() => setLocation('/')}
        >
          Return Home
        </Button>
        <div className="aspect-video mb-6 rounded-lg overflow-hidden">
          <img
            src={story.imageUrl}
            alt={story.topic}
            className="w-full h-full object-cover"
          />
        </div>
        <StoryPlayer story={story} />
      </Card>
    </div>
  );
}