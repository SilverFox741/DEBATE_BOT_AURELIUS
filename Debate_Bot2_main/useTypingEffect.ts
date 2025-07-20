// Custom hook for typewriter effect with controlled speed
import { useState, useEffect } from 'react';

interface UseTypingEffectOptions {
  speed?: number; // Words per minute
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTypingEffect(
  text: string, 
  options: UseTypingEffectOptions = {}
) {
  const { speed = 60, onComplete, autoStart = true } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoStart);

  // Calculate delay based on WPM (assuming average 5 characters per word)
  const charDelay = (60 / (speed * 5)) * 1000;

  useEffect(() => {
    if (!text || isPaused) return;

    setIsTyping(true);
    setIsComplete(false);
    setDisplayedText('');

    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        setIsComplete(true);
        clearInterval(timer);
        onComplete?.();
      }
    }, charDelay);

    return () => clearInterval(timer);
  }, [text, charDelay, onComplete, isPaused]);

  const start = () => setIsPaused(false);
  const pause = () => setIsPaused(true);
  const skip = () => {
    setDisplayedText(text);
    setIsTyping(false);
    setIsComplete(true);
    onComplete?.();
  };

  return {
    displayedText,
    isTyping,
    isComplete,
    isPaused,
    start,
    pause,
    skip
  };
}