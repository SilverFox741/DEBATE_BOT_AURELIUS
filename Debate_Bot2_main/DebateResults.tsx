// Component for displaying debate results and AI adjudication
import { useState } from 'react';
import { Trophy, FileText } from 'lucide-react';
import { DebateSession } from './debate';
import { EvaluationDashboard } from './EvaluationDashboard';
import { TranscriptViewer } from './TranscriptViewer';

interface DebateResultsProps {
  session: DebateSession;
  onNewDebate: () => void;
  onNextFeedback: () => void;
}

export function DebateResults({ session, onNewDebate, onNextFeedback }: DebateResultsProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!session.result) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">AI judge is evaluating the debate...</p>
      </div>
    );
  }

  const { result } = session;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Debate Results</h2>
        </div>
      </div>

      {/* Evaluation Dashboard */}
      <div className="p-6">
        <EvaluationDashboard 
          result={result} 
          humanSide={session.participants.human.side} 
        />
      </div>

      {/* Next: Personalized Feedback Button */}
      <div className="p-6 flex justify-end">
        <button
          onClick={onNextFeedback}
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Next: Personalized Feedback
        </button>
      </div>

      {/* Action Button */}
      <div className="p-6">
        <div className="flex gap-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            {showTranscript ? 'Hide' : 'View'} Full Transcript
          </button>
          <button
            onClick={onNewDebate}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start New Debate
          </button>
        </div>
      </div>
      
      {/* Transcript Viewer */}
      {showTranscript && (
        <div className="border-t border-gray-200">
          <TranscriptViewer session={session} />
        </div>
      )}
    </div>
  );
}