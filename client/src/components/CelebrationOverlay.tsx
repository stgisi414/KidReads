
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CelebrationOverlayProps {
  onRestart: () => void;
}

export function CelebrationOverlay({ onRestart }: CelebrationOverlayProps) {
  const [opacity, setOpacity] = useState(0);

  useState(() => {
    setTimeout(() => setOpacity(1), 100);
  });

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50"
      style={{ 
        opacity, 
        transition: 'opacity 1s ease-in-out'
      }}
    >
      <div className="text-[150px] animate-bounce">🎉</div>
      <Button
        variant="outline"
        size="sm"
        className="mt-8 bg-white hover:bg-gray-100"
        onClick={onRestart}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Start Over
      </Button>
    </div>
  );
}
