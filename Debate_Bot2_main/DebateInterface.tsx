// Main debate interface component
import { useState, useRef, useEffect } from 'react';
import { Clock, Users, Mic, Send, User, Bot, SkipForward, Gavel, Volume2 } from 'lucide-react';
import { DebateSession } from './debate';
import { debateRoles } from './motions';
import { TranscriptViewer } from './TranscriptViewer';
import { VoiceInput } from './VoiceInput';
import { VoiceOutput } from './VoiceOutput';

interface DebateInterfaceProps {
  session: DebateSession;
  onSpeechSubmit: (content: string) => void;
  onGenerateAISpeech: () => void;
  onCompleteDebate: () => void;
  isGeneratingSpeech: boolean;
  isCompletingDebate: boolean;
  ttsEnabled: boolean;
}

export function DebateInterface({ 
  session, 
  onSpeechSubmit, 
  onGenerateAISpeech,
  onCompleteDebate,
  isGeneratingSpeech,
  isCompletingDebate,
  ttsEnabled
}: DebateInterfaceProps) {
  const [humanSpeechContent, setHumanSpeechContent] = useState('');
  const [speechStartTime, setSpeechStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentAISpeechComplete, setCurrentAISpeechComplete] = useState(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(''); // Used in voice input handlers
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showVoiceOutput, setShowVoiceOutput] = useState(false);
  const speechAreaRef = useRef<HTMLTextAreaElement>(null);

  const currentRole = debateRoles.find(role => role.id === session.currentSpeaker);
  const isHumanTurn = session.participants.human.role.id === session.currentSpeaker;
  const isDebateComplete = session.speeches.length === debateRoles.length;

  // Timer for human speeches
  useEffect(() => {
    let interval: number;
    
    if (speechStartTime && isHumanTurn) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - speechStartTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [speechStartTime, isHumanTurn]);

  // Auto-generate AI speech when it's AI's turn
  useEffect(() => {
    if (!isHumanTurn && currentRole && !isDebateComplete && !isGeneratingSpeech && session.phase === 'debate' && currentAISpeechComplete) {
      const timer = setTimeout(() => {
        console.log('Auto-generating AI speech for:', currentRole.name);
        setCurrentAISpeechComplete(false);
        onGenerateAISpeech();
      }, 1500); // Small delay for realistic effect
      
      return () => clearTimeout(timer);
    }
  }, [session.currentSpeaker, isHumanTurn, isGeneratingSpeech, isDebateComplete, session.phase, onGenerateAISpeech, currentRole, currentAISpeechComplete]);

  // Show loading state if session is being initialized with AI speeches
  const isInitializing = session && session.speeches.length === 0 && !isHumanTurn;

  const handleStartSpeech = () => {
    setSpeechStartTime(new Date());
    setElapsedTime(0);
    speechAreaRef.current?.focus();
  };

  const handleSubmitSpeech = () => {
    if (!humanSpeechContent.trim() || !speechStartTime) return;
    
    onSpeechSubmit(humanSpeechContent.trim());
    setHumanSpeechContent('');
    setVoiceTranscript('');
    setSpeechStartTime(null);
    setElapsedTime(0);
  };

  // Voice input handlers
  const handleVoiceTranscriptUpdate = (transcript: string) => {
    setVoiceTranscript(transcript);
    setHumanSpeechContent(transcript);
  };

  const handleVoiceFinalTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    setHumanSpeechContent(prev => prev + ' ' + transcript);
  };

  // Use voiceTranscript for debugging/logging
  useEffect(() => {
    if (voiceTranscript) {
      console.log('Voice transcript updated:', voiceTranscript);
    }
  }, [voiceTranscript]);

  const handleVoiceListeningChange = (listening: boolean) => {
    setIsVoiceListening(listening);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (elapsed: number, limit: number) => {
    if (elapsed > limit) return 'text-red-600';
    if (elapsed > limit * 0.8) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Stop speech if ttsEnabled is toggled off
  useEffect(() => {
    if (!ttsEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [ttsEnabled]);

  if (isDebateComplete) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Debate Complete!</h2>
          <p className="text-gray-600 mb-6">All speeches have been delivered. Ready for judging?</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onCompleteDebate}
              disabled={isCompletingDebate}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isCompletingDebate 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isCompletingDebate ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Gavel className="w-5 h-5" />
                  Get AI Adjudication
                </>
              )}
            </button>
          </div>
        </div>
        {/* Always show transcript after debate complete */}
        <TranscriptViewer session={session} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Live Debate Panel (now above transcript) */}
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Live Debate</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Speech {session.speeches.length + 1} of {debateRoles.length}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="font-medium text-gray-900 mb-1">{session.motion.motion}</div>
          <div className="text-sm text-gray-600">{session.motion.context}</div>
        </div>
        {/* Remove the Debate Controls (speed/WPM slider) */}
      </div>
      {/* Current Speaker Info */}
      {currentRole && (
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isHumanTurn ? (
                <User className="w-8 h-8 text-blue-600" />
              ) : (
                <Bot className="w-8 h-8 text-emerald-600" />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {isHumanTurn ? 'Your Turn' : 'AI Speaking'}
                </div>
                <div className="text-sm text-gray-600">
                  {currentRole.name} ({currentRole.side})
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Time Limit: {formatTime(currentRole.timeLimit)}
              </div>
              {isHumanTurn && speechStartTime && (
                <div className={`text-lg font-mono font-bold ${getTimeColor(elapsedTime, currentRole.timeLimit)}`}> 
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Speech Content */}
      <div className="p-6">
        {isHumanTurn ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              {currentRole?.description}
            </div>
            {!speechStartTime ? (
              <div className="text-center">
                <button
                  onClick={handleStartSpeech}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Mic className="w-5 h-5" />
                  Start Your Speech
                </button>
                {/* Skip button for human turn */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSpeechStartTime(null);
                      setElapsedTime(0);
                      setHumanSpeechContent('');
                      setVoiceTranscript('');
                      // Mark this speech as skipped (empty speech)
                      onSpeechSubmit('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip to next speaker
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Voice Input Toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setShowVoiceInput(!showVoiceInput)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      showVoiceInput 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {showVoiceInput ? 'Hide' : 'Show'} Voice Input
                  </button>
                  <button
                    onClick={() => setShowVoiceOutput(!showVoiceOutput)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      showVoiceOutput 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    {showVoiceOutput ? 'Hide' : 'Show'} Voice Output
                  </button>
                </div>
                {/* Voice Input Component */}
                {showVoiceInput && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <VoiceInput
                      onTranscriptUpdate={handleVoiceTranscriptUpdate}
                      onFinalTranscript={handleVoiceFinalTranscript}
                      isListening={isVoiceListening}
                      onListeningChange={handleVoiceListeningChange}
                      placeholder="Start speaking your debate speech..."
                      className="mb-4"
                    />
                  </div>
                )}
                {/* Voice Output Component */}
                {showVoiceOutput && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <VoiceOutput
                      text={humanSpeechContent}
                      autoPlay={false}
                      className="mb-4"
                    />
                  </div>
                )}
                {/* Text Input */}
                <textarea
                  ref={speechAreaRef}
                  value={humanSpeechContent}
                  onChange={(e) => setHumanSpeechContent(e.target.value)}
                  placeholder="Type your speech here or use voice input above..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSpeechStartTime(null);
                      setElapsedTime(0);
                      setHumanSpeechContent('');
                      setVoiceTranscript('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitSpeech}
                    disabled={!humanSpeechContent.trim()}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Submit Speech
                  </button>
                  {/* Skip button for human turn while editing */}
                  <button
                    onClick={() => {
                      setSpeechStartTime(null);
                      setElapsedTime(0);
                      setHumanSpeechContent('');
                      setVoiceTranscript('');
                      onSpeechSubmit('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip to next speaker
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {isGeneratingSpeech || isInitializing ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="text-lg text-gray-600">
                  {isInitializing ? 'Preparing debate with AI speeches...' : 'AI is preparing speech...'}
                </span>
              </div>
            ) : !currentAISpeechComplete ? (
              <div className="py-4">
                <p className="text-lg text-gray-600 mb-4">AI is delivering speech...</p>
                {/* Voice Output for AI Speech */}
                {session.speeches.length > 0 && ttsEnabled && (
                  <div className="mb-4">
                    <VoiceOutput
                      text={session.speeches[session.speeches.length - 1]?.content || ''}
                      autoPlay={true}
                      className="mb-4"
                    />
                  </div>
                )}
                <button
                  onClick={() => setCurrentAISpeechComplete(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip to next speaker
                </button>
              </div>
            ) : (
              <div className="py-8">
                <Bot className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Waiting for AI to deliver speech...</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Transcript Panel (now below debate) */}
      <div className="p-6 border-t border-gray-200">
        <TranscriptViewer session={session} />
      </div>
    </div>
  );
}