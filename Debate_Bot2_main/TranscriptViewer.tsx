// Component for viewing debate transcripts
import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { DebateSession } from './debate';
import { generateFullTranscript } from './transcriptUtils';

interface TranscriptViewerProps {
  session: DebateSession;
  onDownload?: () => void;
}

export function TranscriptViewer({ session, onDownload }: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const generateTranscript = () => generateFullTranscript(session);

  const downloadTranscript = () => {
    const transcript = generateTranscript();
    const filename = `debate-transcript-${session.createdAt.toISOString().split('T')[0]}.txt`;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onDownload) onDownload();
  };

  const copyTranscript = async () => {
    const transcript = generateTranscript();
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy transcript:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Debate Transcript</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copyTranscript}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={downloadTranscript}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Debate Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Motion:</span>
              <p className="font-medium">{session.motion.motion}</p>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <p className="font-medium">{session.motion.category}</p>
            </div>
            <div>
              <span className="text-gray-600">Difficulty:</span>
              <p className="font-medium capitalize">{session.motion.difficulty}</p>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium">{session.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {session.speeches.map((speech, index) => {
            const isHuman = speech.speakerId === session.participants.human.role.id;
            const speakerName = isHuman ? 'You' : session.participants.ai.find(ai => ai.id === speech.speakerId)?.name || 'Unknown';
            
            return (
              <div key={speech.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      isHuman ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{speech.role.name}</h5>
                      <p className="text-sm text-gray-600">{speakerName} ({speech.role.side})</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Time Used: {formatTime(speech.timeUsed)}</div>
                    <div>Remaining: {formatTime(speech.role.timeLimit - speech.timeUsed)}</div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border-l-4 border-gray-300">
                  <p className="text-gray-800 whitespace-pre-wrap">{speech.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {session.result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Debate Results</h4>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Winner</p>
                  <p className="font-semibold text-gray-900 capitalize">{session.result.winner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Final Scores</p>
                  <div className="flex gap-4">
                    <span className="font-semibold text-blue-600">Government: {session.result.score.government.toFixed(1)}</span>
                    <span className="font-semibold text-red-600">Opposition: {session.result.score.opposition.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}