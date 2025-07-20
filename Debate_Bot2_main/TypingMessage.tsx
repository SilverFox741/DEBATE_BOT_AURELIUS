// Component for displaying messages with typing effect
import React from 'react';
import { User, Bot, Play, Pause, SkipForward } from 'lucide-react';
import { useTypingEffect } from './useTypingEffect';

interface TypingMessageProps {
  content: string;
  isHuman: boolean;
  speakerName: string;
  role: string;
  timeUsed?: number;
  speed?: number;
  autoStart?: boolean;
  onComplete?: () => void;
  showControls?: boolean;
}

export function TypingMessage({
  content,
  isHuman,
  speakerName,
  role,
  timeUsed,
  speed = 60,
  autoStart = true,
  onComplete,
  showControls = false
}: TypingMessageProps) {
  const {
    displayedText,
    isTyping,
    isComplete,
    isPaused,
    start,
    pause,
    skip
  } = useTypingEffect(content, { speed, onComplete, autoStart });

  const [isExpanded, setIsExpanded] = React.useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      {/* Speaker Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isHuman ? (
            <User className="w-6 h-6 text-blue-600" />
          ) : (
            <Bot className="w-6 h-6 text-emerald-600" />
          )}
          <div>
            <div className="font-semibold text-gray-900">{speakerName}</div>
            <div className="text-sm text-gray-600">{role}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {timeUsed && (
            <span className="text-sm text-gray-500">
              {formatTime(timeUsed)}
            </span>
          )}
          
          {/* Typing Controls */}
          {showControls && !isComplete && (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={start}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Resume"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={skip}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Show full response"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="prose max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap">
          {isExpanded ? content : displayedText}
        </div>
        
        {/* Expand/Collapse for long messages */}
        {content.length > 500 && isComplete && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Show full response'}
          </button>
        )}
      </div>

      {/* Completion Indicator */}
      {isComplete && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span>Speech complete</span>
        </div>
      )}
    </div>
  );
}