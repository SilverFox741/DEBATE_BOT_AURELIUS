import React, { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { VoiceOutput } from './VoiceOutput';
import { voiceService } from './voiceService';

export const VoiceTest: React.FC = () => {
  const [testText, setTestText] = useState('Hello, this is a test of the voice functionality.');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleTranscriptUpdate = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleFinalTranscript = (finalTranscript: string) => {
    setTranscript(prev => prev + ' ' + finalTranscript);
  };

  const handleListeningChange = (listening: boolean) => {
    setIsListening(listening);
  };

  const testVoiceSupport = () => {
    const isSupported = voiceService.isSupported();
    console.log('Voice support:', isSupported);
    alert(`Voice support: ${isSupported ? 'Available' : 'Not available'}`);
  };

  const testSpeechSynthesis = () => {
    const success = voiceService.speak(
      'This is a test of speech synthesis.',
      () => console.log('Speech started'),
      () => console.log('Speech ended'),
      (error) => console.error('Speech error:', error)
    );
    console.log('Speech synthesis test:', success);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Voice Functionality Test</h1>
      
      {/* Support Test */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Voice Support Test</h2>
        <button
          onClick={testVoiceSupport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Voice Support
        </button>
        <button
          onClick={testSpeechSynthesis}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Test Speech Synthesis
        </button>
      </div>

      {/* Voice Input Test */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">Voice Input Test</h2>
        <VoiceInput
          onTranscriptUpdate={handleTranscriptUpdate}
          onFinalTranscript={handleFinalTranscript}
          isListening={isListening}
          onListeningChange={handleListeningChange}
          placeholder="Test voice input here..."
        />
      </div>

      {/* Voice Output Test */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-900 mb-2">Voice Output Test</h2>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Enter text to test speech synthesis..."
        />
        <VoiceOutput
          text={testText}
          autoPlay={false}
        />
      </div>

      {/* Current Transcript */}
      {transcript && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Transcript</h2>
          <div className="text-gray-700">{transcript}</div>
        </div>
      )}

      {/* Status */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Status</h2>
        <div className="space-y-2 text-sm">
          <div>Voice Support: {voiceService.isSupported() ? '✅ Available' : '❌ Not Available'}</div>
          <div>Listening: {isListening ? '✅ Active' : '❌ Inactive'}</div>
          <div>Speaking: {voiceService.getSpeakingStatus() ? '✅ Active' : '❌ Inactive'}</div>
        </div>
      </div>
    </div>
  );
}; 