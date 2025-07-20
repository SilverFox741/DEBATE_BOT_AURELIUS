// Main application component
import { useState, useRef, useEffect } from 'react';
import { Scale, Gavel, Users, BookOpen, History, Volume2 } from 'lucide-react';

// Components
import { ApiKeySetup } from './ApiKeySetup';
import { MotionSelector } from './MotionSelector';
import { DebateSetup } from './DebateSetup';
import { CasePreparation } from './CasePreparation';
import { DebateInterface } from './DebateInterface';
import { DebateResults } from './DebateResults';
import { DebateHistory } from './DebateHistory';
import { PersonalizedFeedback } from './PersonalizedFeedback';

// Hooks and Services
import { useLocalStorage } from './useLocalStorage';
import { useDebateSession } from './useDebateSession';
import { geminiService } from './gemini';

// Types
import { DebateMotion, DebateRole, Speech } from './debate';

type AppPhase = 'setup' | 'motion' | 'config' | 'prep' | 'debate' | 'results' | 'feedback' | 'history';

function App() {
  // State management
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini-api-key', '');
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('setup');
  const [selectedMotion, setSelectedMotion] = useState<DebateMotion | null>(null);
  const [humanSide, setHumanSide] = useState<'government' | 'opposition'>('government');
  const [humanRole, setHumanRole] = useState<DebateRole | null>(null);
  const [aiSkillLevel, setAiSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isCompletingDebate, setIsCompletingDebate] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const guideModalRef = useRef<HTMLDivElement>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [voicesAvailable, setVoicesAvailable] = useState(true);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [voiceTestResult, setVoiceTestResult] = useState<string | null>(null);
  
  // Debate session management
  const {
    session,
    isGeneratingSpeech,
    error,
    createSession,
    addSpeech,
    generateAISpeech,
    completeDebate,
    resetSession
  } = useDebateSession();

  // Check TTS support and available voices on load
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setTtsSupported(supported);
    if (supported) {
      // Wait for voices to be loaded
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setVoicesAvailable(voices && voices.length > 0);
      };
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
      checkVoices();
    } else {
      setVoicesAvailable(false);
    }
  }, []);

  // Voice Test Handler
  const handleVoiceTest = () => {
    if (!ttsSupported) {
      setVoiceTestResult('Voice output is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    if (!voicesAvailable) {
      setVoiceTestResult('No system voices detected. Please refresh the page or try a different browser.');
      return;
    }
    try {
      const utter = new window.SpeechSynthesisUtterance('This is a test of voice output. If you hear this, your browser supports text to speech.');
      utter.onend = () => setVoiceTestResult('✅ Voice output test succeeded! You should have heard the test phrase.');
      utter.onerror = () => setVoiceTestResult('❌ Voice output test failed. Please check your browser and system audio.');
      window.speechSynthesis.speak(utter);
      setVoiceTestResult('Testing voice output...');
    } catch (e) {
      setVoiceTestResult('❌ Voice output test failed. Please check your browser and system audio.');
    }
  };

  // Close guide modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    if (showGuide) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuide]);

  // Trap focus in modal
  useEffect(() => {
    if (showGuide && guideModalRef.current) {
      const focusable = guideModalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) (focusable[0] as HTMLElement).focus();
    }
  }, [showGuide]);

  // Handle API key setup
  const handleApiKeySet = async (key: string) => {
    setApiKey(key);
    geminiService.setConfig({
      apiKey: key,
      model: 'gemini-1.5-flash'
    });
    
    // Test the API connection
    try {
      const isConnected = await geminiService.testConnection();
      if (isConnected) {
        setCurrentPhase('motion');
      } else {
        throw new Error('API connection test failed');
      }
    } catch (error) {
      alert(`API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key.`);
      setApiKey('');
    }
  };

  // Handle motion selection
  const handleMotionSelect = (motion: DebateMotion) => {
    setSelectedMotion(motion);
    setCurrentPhase('config');
  };

  // Handle debate configuration
  const handleSetupComplete = (
    side: 'government' | 'opposition',
    role: DebateRole,
    skillLevel: 'beginner' | 'intermediate' | 'advanced'
  ) => {
    setHumanSide(side);
    setHumanRole(role);
    setAiSkillLevel(skillLevel);
    setCurrentPhase('prep');
  };

  // Handle case preparation completion
  const handlePrepComplete = async () => {
    if (selectedMotion && humanRole) {
      await createSession(selectedMotion, humanSide, humanRole, aiSkillLevel);
      setCurrentPhase('debate');
    }
  };

  // Handle human speech submission
  const handleSpeechSubmit = (content: string) => {
    if (!session || !humanRole) return;

    const newSpeech: Speech = {
      id: `speech-${Date.now()}`,
      speakerId: session.participants.human.role.id,
      role: humanRole,
      content,
      timeUsed: 300, // Would be calculated from actual timing
      timestamp: new Date(),
      arguments: [] // Would be extracted from content
    };

    addSpeech(newSpeech);
  };

  // Handle debate completion and judging
  const handleCompleteDebate = async () => {
    if (isCompletingDebate) return; // Prevent multiple clicks
    
    setIsCompletingDebate(true);
    try {
      await completeDebate();
      setCurrentPhase('results');
    } catch (error) {
      console.error('Failed to complete debate:', error);
    } finally {
      setIsCompletingDebate(false);
    }
  };

  // Handle starting new debate
  const handleNewDebate = () => {
    resetSession();
    setSelectedMotion(null);
    setCurrentPhase('motion');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setCurrentPhase('motion')} tabIndex={0} aria-label="New Debate">
              <div className="debate-gradient p-2 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Debate Practice</h1>
            </div>
            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPhase('history')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPhase === 'history' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                aria-label="History"
              >
                <History className="w-5 h-5" /> History
              </button>
              <button
                onClick={handleNewDebate}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                aria-label="New Debate"
              >
                <Gavel className="w-5 h-5" /> New Debate
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                aria-label="Debate Guide"
              >
                <BookOpen className="w-5 h-5" /> Debate Guide
              </button>
              {/* TTS Toggle - now visible in header */}
              <button
                onClick={() => setTtsEnabled((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${ttsEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                aria-label="Toggle Text-to-Speech"
              >
                <Volume2 className="w-5 h-5" /> {ttsEnabled ? 'TTS On' : 'TTS Off'}
              </button>
              {/* Settings Dropdown (only API key now) */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-700 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded="false"
                  aria-label="Settings"
                >
                  <Users className="w-5 h-5" /> Settings
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-40">
                  <div className="p-2 flex flex-col gap-2">
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                      aria-label="Gemini API Key"
                    >
                      🔑 Gemini API Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Persistent TTS/voice warnings */}
      {(!ttsSupported || !voicesAvailable) && (
        <div className="bg-red-100 text-red-800 p-4 text-center font-bold z-50">
          { !ttsSupported
            ? 'Voice output is not supported in your browser. Please use the latest version of Chrome or Edge.'
            : 'No system voices detected. Please refresh the page or try a different browser.'
          }
        </div>
      )}
      {/* Voice Test Button (top right) */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
        <button
          onClick={() => setShowVoiceTest(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-semibold"
        >
          Test Voice Output
        </button>
      </div>
      {/* Voice Test Modal */}
      {showVoiceTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={e => { if (e.target === e.currentTarget) setShowVoiceTest(false); }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowVoiceTest(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close voice test modal"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Voice Output Test</h2>
            <p className="mb-4">Click the button below to test if your browser supports voice output (text-to-speech).</p>
            <button
              onClick={handleVoiceTest}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold mb-4"
            >
              Play Test Phrase
            </button>
            {voiceTestResult && (
              <div className="mt-4 p-3 rounded-lg text-center font-medium"
                style={{ background: voiceTestResult.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: voiceTestResult.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                {voiceTestResult}
              </div>
            )}
            <div className="mt-6 text-sm text-gray-600">
              <b>Troubleshooting:</b><br />
              - Use the latest version of Chrome or Edge.<br />
              - Make sure your system sound is on and not muted.<br />
              - If you see an error, try refreshing the page or switching browsers.<br />
              - If you still have issues, check the browser console for errors.
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal */}
      {showApiKeyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          onClick={e => {
            if (e.target === e.currentTarget) setShowApiKeyModal(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto focus:outline-none card"
            tabIndex={0}
            aria-label="Gemini API Key"
          >
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close API key modal"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Gemini API Key</h2>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 text-sm">
              <li>Go to <a href="https://aistudio.google.com/app/apikey" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Google AI Studio</a> and sign in with your Google account.</li>
              <li>Click "Create API Key" and copy the key (starts with <code>AIzaSy</code>).</li>
              <li>Paste your API key below and click "Save".</li>
              <li className="text-red-600 font-semibold mt-2">Warning: For your privacy, delete your API key after use!</li>
            </ol>
            <form
              onSubmit={e => {
                e.preventDefault();
                const key = apiKeyInputRef.current?.value.trim() || '';
                if (key) {
                  handleApiKeySet(key);
                  setShowApiKeyModal(false);
                }
              }}
              className="space-y-4"
            >
              <input
                ref={apiKeyInputRef}
                type="text"
                defaultValue={apiKey}
                placeholder="Enter Gemini API Key"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={30}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
            {apiKey && (
              <button
                onClick={() => { setApiKey(''); geminiService.setConfig({ apiKey: '', model: '' }); }}
                className="mt-4 btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete API Key
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debate Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          onClick={e => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div
            ref={guideModalRef}
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto focus:outline-none card"
            tabIndex={0}
            aria-label="Debate Guide"
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close debate guide"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Debate Guide</h2>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">What is Asian Parliamentary Debate?</h3>
              <p className="text-gray-800 mb-2">Asian Parliamentary Debate (AP) is a popular competitive debate format in Asia, featuring two teams (Government and Opposition) of three speakers each. Debates are fast-paced, with a focus on logical argumentation, rebuttal, and teamwork. Each speaker has a defined role and time limit.</p>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li>6 speakers: Prime Minister, Deputy Prime Minister, Government Whip, Leader of Opposition, Deputy Leader of Opposition, Opposition Whip</li>
                <li>Speech order alternates between teams</li>
                <li>Reply speeches summarize and crystallize the debate</li>
              </ul>
            </section>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Roles and Structure</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li><b>Prime Minister (PM):</b> Defines the motion, sets up the government case, presents main arguments</li>
                <li><b>Deputy Prime Minister (DPM):</b> Extends the government case, rebuts opposition</li>
                <li><b>Government Whip (GW):</b> Summarizes government case, rebuts, crystallizes key issues</li>
                <li><b>Leader of Opposition (LO):</b> Responds to PM, sets up opposition case, presents main arguments</li>
                <li><b>Deputy Leader of Opposition (DLO):</b> Extends opposition case, rebuts government</li>
                <li><b>Opposition Whip (OW):</b> Summarizes opposition case, rebuts, crystallizes key issues</li>
                <li><b>Reply Speeches:</b> Each side gives a short summary speech (no new arguments)</li>
              </ul>
            </section>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">How to Score Maximum Points</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li>Present clear, well-structured arguments with strong evidence</li>
                <li>Directly rebut and engage with the opposition’s points</li>
                <li>Use signposting and clear transitions</li>
                <li>Maintain good time management and delivery</li>
                <li>Support your teammates and build on their arguments</li>
                <li>Quote credible sources, especially at higher skill levels</li>
                <li>Summarize and crystallize key issues in reply/whip speeches</li>
              </ul>
            </section>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Judging Criteria Explained</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li><b>Argument Quality:</b> Are your arguments logical, relevant, and well-supported?</li>
                <li><b>Rebuttal:</b> Do you directly address and refute the opposition’s points?</li>
                <li><b>Structure & Organization:</b> Is your speech easy to follow?</li>
                <li><b>Delivery:</b> Are you clear, confident, and engaging?</li>
                <li><b>Teamwork:</b> Do you build on your teammates’ arguments?</li>
                <li><b>Evidence Credibility:</b> Are your sources reliable and well-integrated?</li>
              </ul>
            </section>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Tips for Debaters</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li>Listen actively and take notes during all speeches</li>
                <li>Use signposting (“My first point is...”, “In response to...”, etc.)</li>
                <li>Stay calm under pressure and manage your time</li>
                <li>Practice with different motions and roles</li>
                <li>Be respectful and professional at all times</li>
                <li>Review feedback and work on your weaknesses</li>
              </ul>
            </section>
            <section>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Useful Resources</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-2">
                <li><a href="https://en.wikipedia.org/wiki/Asian_Parliamentary_debate" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Wikipedia: Asian Parliamentary Debate</a></li>
                <li><a href="https://www.youtube.com/watch?v=6QK8g0yFJ5w" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Sample AP Debate Video</a></li>
                <li><a href="https://debateasia.org/resources/" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Debate Asia Resources</a></li>
                <li><a href="https://www.idebate.org/debatabase" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">iDebate: Debatabase</a></li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumbs */}
        {currentPhase !== 'setup' && (
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span className={currentPhase === 'motion' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Motion
                </span>
              </div>
              {currentPhase !== 'motion' && (
                <>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className={currentPhase === 'config' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Setup
                    </span>
                  </div>
                </>
              )}
              {['prep', 'debate', 'results'].includes(currentPhase) && (
                <>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className={currentPhase === 'prep' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Preparation
                    </span>
                  </div>
                </>
              )}
              {['debate', 'results'].includes(currentPhase) && (
                <>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className={currentPhase === 'debate' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Debate
                    </span>
                  </div>
                </>
              )}
              {currentPhase === 'results' && (
                <>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-1">
                    <Gavel className="w-4 h-4" />
                    <span className="text-blue-600 font-medium">Results</span>
                  </div>
                </>
              )}
            </div>
          </nav>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Phase-specific Content */}
        {currentPhase === 'setup' && (
          <ApiKeySetup onApiKeySet={handleApiKeySet} hasApiKey={!!apiKey} />
        )}

        {currentPhase === 'motion' && (
          <MotionSelector onMotionSelect={handleMotionSelect} />
        )}

        {currentPhase === 'config' && selectedMotion && (
          <DebateSetup
            motion={selectedMotion}
            onSetupComplete={handleSetupComplete}
            onBack={() => setCurrentPhase('motion')}
          />
        )}

        {currentPhase === 'prep' && selectedMotion && humanRole && (
          <CasePreparation
            motion={selectedMotion}
            side={humanSide}
            skillLevel={aiSkillLevel}
            onComplete={handlePrepComplete}
          />
        )}

        {currentPhase === 'debate' && session && (
          <DebateInterface
            session={session}
            onSpeechSubmit={handleSpeechSubmit}
            onGenerateAISpeech={generateAISpeech}
            onCompleteDebate={handleCompleteDebate}
            isGeneratingSpeech={isGeneratingSpeech}
            isCompletingDebate={isCompletingDebate}
            ttsEnabled={ttsEnabled}
          />
        )}

        {currentPhase === 'results' && session && (
          <DebateResults
            session={session}
            onNewDebate={handleNewDebate}
            onNextFeedback={() => setCurrentPhase('feedback')}
          />
        )}
        {currentPhase === 'feedback' && session && (
          <PersonalizedFeedback
            session={session}
            onBack={() => setCurrentPhase('results')}
            onNewDebate={handleNewDebate}
          />
        )}

        {currentPhase === 'history' && (
          <DebateHistory
            onBack={() => setCurrentPhase('motion')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">AI Debate Practice System - Powered by Gemini AI</p>
            <p className="text-sm">
              <strong>Mathematical Judging Algorithm:</strong> Debates are scored using weighted clash analysis where each argument clash is assigned importance (1-10), 
              winners determined through logical coherence and evidence strength, then final scores calculated through weighted sum normalization across all evaluation criteria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;