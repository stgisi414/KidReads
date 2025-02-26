import { useEffect, useState } from "react";
import type { Story } from "@shared/schema";

interface BackgroundSliderProps {
  stories: Story[];
  onAccentColorChange?: (color: string) => void;
}

// Predefined vibrant colors
const VIBRANT_COLORS = [
  "#FF3B30", // Bright Red
  "#4CD964", // Bright Green
  "#007AFF", // Bright Blue
  "#FFCC00", // Bright Yellow
  "#FF9500", // Bright Orange
  "#5856D6", // Bright Purple
];

const getStorySnippet = (content: string) => {
  // Get first 2 sentences or ~100 characters
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const snippet = sentences.slice(0, 2).join('. ').trim();
  return snippet.length > 100 ? snippet.slice(0, 97) + '...' : snippet + '.';
};

export default function BackgroundSlider({ stories, onAccentColorChange }: BackgroundSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>(VIBRANT_COLORS[0]);
  const [snippetOpacity, setSnippetOpacity] = useState(1);

  useEffect(() => {
    if (!stories || stories.length <= 1) return;

    const interval = setInterval(() => {
      // Start fade out
      setSnippetOpacity(0);

      // Change slide after fade out
      setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % stories.length);
        // Start fade in
        setSnippetOpacity(1);
      }, 500); // Half of the transition time

    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [stories]);

  useEffect(() => {
    if (!stories || stories.length === 0) return;

    // Extract and enhance color from current image
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

        // Calculate average RGB
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Calculate color brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Calculate color saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = (max === 0) ? 0 : 1 - (min / max);

        let finalColor;
        if (brightness < 128 || saturation < 0.4) {
          // If the color is too dark or desaturated, use a vibrant color
          finalColor = VIBRANT_COLORS[currentIndex % VIBRANT_COLORS.length];
        } else {
          // Enhance the saturation of the extracted color
          const factor = 1.5; // Saturation enhancement factor
          const enhanceColor = (c: number, max: number) => {
            const distance = max - c;
            return c + (distance * factor);
          };

          if (max === r) {
            g = Math.min(255, enhanceColor(g, r));
            b = Math.min(255, enhanceColor(b, r));
          } else if (max === g) {
            r = Math.min(255, enhanceColor(r, g));
            b = Math.min(255, enhanceColor(b, g));
          } else {
            r = Math.min(255, enhanceColor(r, b));
            g = Math.min(255, enhanceColor(g, b));
          }

          finalColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        setDominantColor(finalColor);
        onAccentColorChange?.(finalColor);
      } catch (error) {
        console.error('Error extracting color:', error);
        // Fallback to vibrant color on error
        const fallbackColor = VIBRANT_COLORS[currentIndex % VIBRANT_COLORS.length];
        setDominantColor(fallbackColor);
        onAccentColorChange?.(fallbackColor);
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
      {/* Story Snippet Overlay */}
      <div
        className="absolute inset-x-0 bottom-0 p-8 text-center transition-opacity duration-500"
        style={{ opacity: snippetOpacity }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xl md:text-2xl font-medium text-white drop-shadow-lg"
            style={{
              textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 1px 3px ${dominantColor}`,
              backgroundColor: `${dominantColor}88`,
              backdropFilter: 'blur(8px) brightness(0.8)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)`
            }}
          >
            {getStorySnippet(stories[currentIndex].content)}
          </p>
        </div>
      </div>
    </div>
  );
}