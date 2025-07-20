import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Settings, AlertCircle } from 'lucide-react';
import { voiceService, VoiceError } from './voiceService';

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: VoiceError) => void;
  className?: string;
}

export const VoiceOutput: React.FC<VoiceOutputProps> = ({
  text,
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
  onError,
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: null as SpeechSynthesisVoice | null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

  const availableVoices = voiceService.getAvailableVoices();
  const defaultVoice = voiceService.getDefaultVoice();

  // Initialize voice settings
  useEffect(() => {
    if (defaultVoice && !voiceSettings.voice) {
      setVoiceSettings(prev => ({ ...prev, voice: defaultVoice }));
    }
  }, [defaultVoice, voiceSettings.voice]);

  // Always use the latest settings for speech synthesis
  useEffect(() => {
    voiceService.setSynthesisConfig({
      voice: voiceSettings.voice || undefined,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      volume: voiceSettings.volume
    });
    // If currently playing, restart speech with new settings
    if (isPlaying) {
      voiceService.stopSpeaking();
      setTimeout(() => {
        handlePlay();
      }, 100); // Small delay to allow cancel
    }
    // eslint-disable-next-line
  }, [voiceSettings.voice, voiceSettings.rate, voiceSettings.pitch, voiceSettings.volume]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && text && !isPlaying) {
      handlePlay();
    }
    // eslint-disable-next-line
  }, [autoPlay, text]);

  // Handle play
  const handlePlay = () => {
    if (!text.trim()) {
      setError('No text to speak');
      return;
    }

    if (!voiceService.isSupported()) {
      setError('Speech synthesis is not supported in this browser');
      return;
    }

    setError(null);
    setIsPlaying(true);
    setIsPaused(false);

    // Always use the latest settings
    voiceService.setSynthesisConfig({
      voice: voiceSettings.voice || undefined,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      volume: voiceSettings.volume
    });

    const success = voiceService.speak(
      text,
      () => {
        console.log('Speech synthesis started');
        onPlayStart?.();
      },
      () => {
        console.log('Speech synthesis ended');
        setIsPlaying(false);
        setIsPaused(false);
        onPlayEnd?.();
      },
      (error: VoiceError) => {
        console.error('Speech synthesis error:', error);
        setError(error.message);
        setIsPlaying(false);
        setIsPaused(false);
        onError?.(error);
      }
    );

    if (!success) {
      setError('Failed to start speech synthesis');
      setIsPlaying(false);
    }
  };

  // Handle pause
  const handlePause = () => {
    if (isPlaying && !isPaused) {
      voiceService.pauseSpeaking();
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      voiceService.resumeSpeaking();
      setIsPaused(false);
    }
  };

  // Handle stop
  const handleStop = () => {
    voiceService.stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? handleStop : handlePlay}
          disabled={!text.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            !text.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isPlaying
              ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
              : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-5 h-5" />
              Stop Speaking
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              Speak Text
            </>
          )}
        </button>

        {isPlaying && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Voice Settings
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Voice Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice
            </label>
            <select
              value={voiceSettings.voice?.voiceURI || ''}
              onChange={(e) => {
                const selectedVoice = availableVoices.find(v => v.voiceURI === e.target.value);
                setVoiceSettings(prev => ({ ...prev, voice: selectedVoice || null }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}) {voice.default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{voiceSettings.rate}x</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pitch
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{voiceSettings.pitch}x</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{Math.round(voiceSettings.volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Text Preview */}
      {text && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Text to Speak:</div>
          <div className="text-gray-900 max-h-32 overflow-y-auto">
            {text}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            isPlaying 
              ? isPaused 
                ? 'bg-yellow-500' 
                : 'bg-green-500 animate-pulse' 
              : 'bg-gray-400'
          }`} />
          {isPlaying 
            ? isPaused 
              ? 'Paused' 
              : 'Speaking' 
            : 'Not speaking'
          }
        </div>
        
        {voiceSettings.voice && (
          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4" />
            {voiceSettings.voice.name}
          </div>
        )}
      </div>
    </div>
  );
}; 