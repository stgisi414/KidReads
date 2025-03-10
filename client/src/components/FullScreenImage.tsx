import React, { useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./FullScreenImage.css";

interface FullScreenImageProps {
  imageUrl: string;
  alt: string;
}

export default function FullScreenImage({ imageUrl, alt }: FullScreenImageProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="relative">
      {/* Regular image with fullscreen button */}
      <div className="aspect-video rounded-t-lg overflow-hidden relative group">
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover border-2 border-gray-200 border-dashed rounded-lg"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/60 backdrop-blur-sm hover:bg-white/80 z-10"
          onClick={toggleFullScreen}
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Fullscreen overlay */}
      {isFullScreen && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-container">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm hover:bg-white/80"
              onClick={toggleFullScreen}
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-3 right-3 bg-white/60 backdrop-blur-sm hover:bg-white/80"
              onClick={toggleFullScreen}
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}