import { useEffect, useState } from "react";
import type { Story } from "@shared/schema";

interface BackgroundSliderProps {
  stories: Story[];
  onAccentColorChange?: (color: string) => void;
}

export default function BackgroundSlider({ stories, onAccentColorChange }: BackgroundSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>("#4CAF50"); // Default green

  useEffect(() => {
    if (!stories || stories.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % stories.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [stories]);

  useEffect(() => {
    if (!stories || stories.length === 0) return;

    // Extract dominant color from current image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = stories[currentIndex].imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0, count = 0;

        // Sample pixels for average color
        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }

        // Calculate average and convert to hex
        const color = `#${Math.round(r/count).toString(16).padStart(2, '0')}${Math.round(g/count).toString(16).padStart(2, '0')}${Math.round(b/count).toString(16).padStart(2, '0')}`;
        setDominantColor(color);
        onAccentColorChange?.(color);
      } catch (error) {
        console.error('Error extracting color:', error);
      }
    };
  }, [currentIndex, stories, onAccentColorChange]);

  if (!stories || stories.length === 0) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {stories.map((story, index) => (
        <div
          key={story.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out
            ${index === currentIndex ? 'opacity-40' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${story.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${index === currentIndex ? '1' : '1.1'})`,
          }}
        />
      ))}
      <div 
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          background: `linear-gradient(to bottom, ${dominantColor}22, ${dominantColor}44)`
        }}
      />
    </div>
  );
}