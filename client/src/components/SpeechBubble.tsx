import { useState } from "react";

interface SpeechBubbleProps {
  text: string;
}

export default function SpeechBubble({ text }: SpeechBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = () => {
    if ("speechSynthesis" in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      onClick={speak}
      className={`
        relative 
        bg-white 
        p-4 
        rounded-lg 
        shadow-lg 
        cursor-pointer 
        transition-transform 
        hover:scale-105
        border
        border-gray-200
        ${isPlaying ? "animate-pulse" : ""}
      `}
    >
      {/* Speech bubble tail */}
      <div className="absolute left-0 top-1/2 -translate-x-[10px] -translate-y-1/2">
        <div
          className="
              absolute 
              w-0 
              h-0 
              border-t-[10px] 
              border-t-transparent 
              border-r-[20px] 
              border-r-gray-200
              border-b-[10px] 
              border-b-transparent
            "
        />
        {/* White triangle - positioned slightly to the right of the shadow */}
        <div
          className="
              absolute 
              left-[1px]
              w-0 
              h-0 
              border-t-[10px] 
              border-t-transparent 
              border-r-[20px] 
              border-r-white 
              border-b-[10px] 
              border-b-transparent
            "
        />
      </div>

      <p className="text-gray-600 font-medium">📢 {text}</p>
    </div>
  );
}
