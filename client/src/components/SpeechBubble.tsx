
import { useState } from 'react';

interface SpeechBubbleProps {
  text: string;
}

export default function SpeechBubble({ text }: SpeechBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = () => {
    if ('speechSynthesis' in window) {
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
        ${isPlaying ? 'animate-pulse' : ''}
      `}
    >
      {/* Speech bubble tail with shadow */}
      <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2">
        {/* Shadow triangle */}
        <div className="absolute -left-[1px] -top-[11px]">
          <div className="w-0 h-0 border-t-[11px] border-t-transparent border-r-[21px] border-r-gray-200 border-b-[11px] border-b-transparent" />
        </div>
        {/* White triangle */}
        <div className="relative">
          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[20px] border-r-white border-b-[10px] border-b-transparent" />
        </div>
      </div>
      
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  );
}
