import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">Oops!</h1>
              <p className="text-xl text-gray-700 mt-2">Story Not Found</p>
            </div>

            <p className="mt-4 text-gray-600 mb-6">
              The story you're looking for doesn't exist or has been moved.
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setLocation('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">Oops!</h1>
              <p className="text-xl text-gray-700 mt-2">Story Not Found</p>
            </div>

            <p className="mt-4 text-gray-600 mb-6">
              We couldn't find the story you're looking for.
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setLocation('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
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
         <img src="/assets/logo.png" alt="Back" className="h-8 w-8" />
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