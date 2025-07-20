import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Settings, Check, X, AlertCircle } from 'lucide-react';
import { voiceService, RecognitionResult, VoiceError } from './voiceService';

interface VoiceInputProps {
  onTranscriptUpdate: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  placeholder?: string;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptUpdate,
  onFinalTranscript,
  isListening,
  onListeningChange,
  placeholder = "Start speaking...",
  className = ""
}) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

  const recognitionTimeoutRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef<string>('');

  // Initialize voice service
  useEffect(() => {
    if (!voiceService.isSupported()) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Configure voice service
    voiceService.setRecognitionConfig({
      continuous: voiceSettings.continuous,
      interimResults: voiceSettings.interimResults,
      maxAlternatives: 3,
      language: voiceSettings.language
    });

    voiceService.setSynthesisConfig({
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      volume: voiceSettings.volume
    });
  }, [voiceSettings]);

  // Handle recognition results
  const handleRecognitionResult = useCallback((result: RecognitionResult) => {
    if (result.isFinal) {
      // Final result - process and submit
      const finalTranscript = result.transcript.trim();
      if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = finalTranscript;
        setCurrentTranscript(prev => prev + ' ' + finalTranscript);
        onFinalTranscript(finalTranscript);
        
        // Generate correction suggestions
        const suggestions = voiceService.getCorrectionSuggestions(
          finalTranscript, 
          result.alternatives || []
        );
        setCorrections(suggestions);
      }
      setInterimTranscript('');
    } else {
      // Interim result - show live transcription
      setInterimTranscript(result.transcript);
      setConfidence(result.confidence);
    }

    // Update parent component with current transcript
    const fullTranscript = (currentTranscript + ' ' + result.transcript).trim();
    onTranscriptUpdate(fullTranscript);
  }, [currentTranscript, onTranscriptUpdate, onFinalTranscript]);

  // Handle recognition errors
  const handleRecognitionError = useCallback((error: VoiceError) => {
    console.error('Speech recognition error:', error);
    setError(error.message);
    onListeningChange(false);
  }, [onListeningChange]);

  // Start listening
  const startListening = useCallback(() => {
    if (!voiceService.isSupported()) {
      setError('Speech recognition is not supported');
      return;
    }

    setError(null);
    setCorrections([]);
    
    const success = voiceService.startListening(
      handleRecognitionResult,
      handleRecognitionError,
      () => {
        console.log('Recognition started');
        onListeningChange(true);
      },
      () => {
        console.log('Recognition ended');
        onListeningChange(false);
      }
    );

    if (!success) {
      setError('Failed to start speech recognition');
    }
  }, [handleRecognitionResult, handleRecognitionError, onListeningChange]);

  // Stop listening
  const stopListening = useCallback(() => {
    voiceService.stopListening();
    onListeningChange(false);
    setInterimTranscript('');
  }, [onListeningChange]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Apply correction
  const applyCorrection = useCallback((correction: string) => {
    const words = currentTranscript.split(' ');
    words.pop(); // Remove last word
    const correctedTranscript = words.join(' ') + ' ' + correction;
    setCurrentTranscript(correctedTranscript);
    onTranscriptUpdate(correctedTranscript);
    setCorrections([]);
  }, [currentTranscript, onTranscriptUpdate]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
    setInterimTranscript('');
    setCorrections([]);
    onTranscriptUpdate('');
  }, [onTranscriptUpdate]);

  // Auto-restart recognition if it stops unexpectedly
  useEffect(() => {
    if (isListening && !voiceService.getListeningStatus()) {
      recognitionTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          startListening();
        }
      }, 1000);
    }

    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, [isListening, startListening]);

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
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isListening
              ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Listening
            </>
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>

        {currentTranscript && (
          <button
            onClick={clearTranscript}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={voiceSettings.language}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-IN">English (India)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speech Rate
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
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="continuous"
              checked={voiceSettings.continuous}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, continuous: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="continuous" className="text-sm text-gray-700">
              Continuous recognition
            </label>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      <div className="space-y-3">
        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Current Transcript:</div>
            <div className="text-gray-900">{currentTranscript}</div>
          </div>
        )}

        {/* Interim Transcript */}
        {interimTranscript && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-blue-600">Live Transcription:</div>
              <div className="text-sm text-blue-600">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            </div>
            <div className="text-blue-900 italic">{interimTranscript}</div>
          </div>
        )}

        {/* Correction Suggestions */}
        {corrections.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-700 mb-2">Correction Suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {corrections.map((correction, index) => (
                <button
                  key={index}
                  onClick={() => applyCorrection(correction)}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  <Check className="w-3 h-3" />
                  {correction}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder when no transcript */}
        {!currentTranscript && !interimTranscript && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
            {placeholder}
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {isListening ? 'Listening' : 'Not listening'}
        </div>
        
        {voiceService.getSpeakingStatus() && (
          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4" />
            Speaking
          </div>
        )}
      </div>
    </div>
  );
}; 