import { useEffect, useState } from "react";
import type { Story } from "@shared/schema";

interface BackgroundSliderProps {
  stories: Story[];
}

export default function BackgroundSlider({ stories }: BackgroundSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!stories || stories.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % stories.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [stories]);

  if (!stories || stories.length === 0) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {stories.map((story, index) => (
        <div
          key={story.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
            ${index === currentIndex ? 'opacity-10' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${story.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(1.1)`, // Slightly larger to prevent white edges during animation
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/90 to-green-100/90 backdrop-blur-sm" />
    </div>
  );
}
