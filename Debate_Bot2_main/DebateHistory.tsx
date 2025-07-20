// Component for viewing debate history
import { useState, useEffect } from 'react';
import { History, Download, Search, Calendar, Trophy, Trash2, ArrowLeft, X } from 'lucide-react';
import { useDebateHistory } from './useDebateHistory';
import { DebateSession } from './debate';
import { generateFullTranscript } from './transcriptUtils';

interface DebateHistoryProps {
  onBack: () => void;
}

const formatFeedback = (feedback: any) => {
  if (!feedback) return 'No personalized feedback available.';
  let out = '';
  if (feedback.criteria) {
    out += 'Personalized Feedback by Criteria:\n';
    for (const [k, v] of Object.entries(feedback.criteria)) {
      out += `- ${k}: ${v}\n`;
    }
  }
  if (feedback.summary) {
    out += '\nPersonal Feedback Summary:\n' + feedback.summary + '\n';
  }
  // Add advanced fields if present
  if (feedback.argumentMapping) {
    out += '\nArgument Mapping:\n' + feedback.argumentMapping + '\n';
  }
  if (feedback.fallacyDetection) {
    out += '\nFallacy Detection:\n' + feedback.fallacyDetection + '\n';
  }
  if (feedback.rhetoricalDeviceRecognition) {
    out += '\nRhetorical Device Recognition:\n' + feedback.rhetoricalDeviceRecognition + '\n';
  }
  if (feedback.sentimentAndEngagementAnalysis) {
    out += '\nSentiment & Engagement Analysis:\n' + feedback.sentimentAndEngagementAnalysis + '\n';
  }
  if (feedback.comparativeClashAnalysis) {
    out += '\nComparative Clash Analysis:\n' + feedback.comparativeClashAnalysis + '\n';
  }
  if (feedback.roleSkillAdaptedFeedback) {
    out += '\nRole/Skill-Adapted Feedback:\n' + feedback.roleSkillAdaptedFeedback + '\n';
  }
  if (feedback.rubricTransparency) {
    out += '\nRubric Transparency:\n' + feedback.rubricTransparency + '\n';
  }
  if (feedback.keyMoments) {
    out += '\nKey Moments:\n' + feedback.keyMoments + '\n';
  }
  return out.trim() || 'No personalized feedback available.';
};

export function DebateHistory({ onBack }: DebateHistoryProps) {
  const { history, isLoading, deleteDebate } = useDebateHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedEntry) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedEntry]);

  const filteredHistory = history.filter(entry =>
    entry.session.motion.motion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.session.motion.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Always generate transcript on demand for download
  const downloadTranscript = (session: DebateSession, date: Date) => {
    const transcript = generateFullTranscript(session);
    const filename = `debate-transcript-${date.toISOString().split('T')[0]}.txt`;
    const content = transcript;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadResults = (entry: any) => {
    const filename = `debate-results-${entry.savedAt.toISOString().split('T')[0]}.txt`;
    let content = `DEBATE RESULTS\nMotion: ${entry.session.motion.motion}\nDate: ${entry.savedAt.toLocaleDateString()}\nTime: ${entry.savedAt.toLocaleTimeString()}\n\n`;
    if (entry.session.result) {
      content += `Winner: ${entry.session.result.winner}\n`;
      content += `Scores: Government ${entry.session.result.score.government.toFixed(1)}, Opposition ${entry.session.result.score.opposition.toFixed(1)}\n`;
      content += `\nFeedback: ${entry.session.result.feedback}\n`;
      content += `\nKey Moments:\n${entry.session.result.keyMoments.map((m: string) => `- ${m}`).join('\n')}\n`;
      content += `\nImprovement Areas:\n${entry.session.result.improvementAreas.map((a: string) => `- ${a}`).join('\n')}\n`;
    }
    content += '\n' + formatFeedback(entry.personalizedFeedback);
    content += '\n\nTRANSCRIPT:\n' + (entry.transcript || 'No transcript available.');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getWinnerDisplay = (session: DebateSession) => {
    if (!session.result) return 'No result';
    const humanSide = session.participants.human.side;
    const humanWon = session.result.winner === humanSide;
    return humanWon ? '🏆 You Won' : '😔 You Lost';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-lg text-gray-600">Loading debate history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Debate History</h2>
          </div>
          <div className="text-sm text-gray-500">
            {history.length} debate{history.length !== 1 ? 's' : ''} completed
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search debates by motion or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* History List */}
      <div className="p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {history.length === 0 ? 'No debates yet' : 'No matching debates'}
            </h3>
            <p className="text-gray-600">
              {history.length === 0 
                ? 'Complete your first debate to see it here'
                : 'Try adjusting your search terms'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="border-b border-gray-100 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {entry.session.motion.motion}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(entry.savedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {getWinnerDisplay(entry.session)}
                      </div>
                      <div>
                        Category: {entry.session.motion.category}
                      </div>
                      <div>
                        Your role: {entry.session.participants.human.role.name}
                      </div>
                    </div>

                    {/* Scores */}
                    {entry.session.result && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-600 font-medium">
                          Government: {entry.session.result.score.government.toFixed(1)}
                        </span>
                        <span className="text-red-600 font-medium">
                          Opposition: {entry.session.result.score.opposition.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => downloadTranscript(
                        entry.session,
                        entry.savedAt
                      )}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download transcript"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setSelectedEntry(entry.id)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Review Full Results
                    </button>
                    <button
                      onClick={() => downloadResults(entry)}
                      className="mt-2 ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Download Results
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this debate?')) {
                          deleteDebate(entry.id);
                        }
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete debate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal for full results and feedback */}
      {selectedEntry && (() => {
        const entry = history.find(e => e.id === selectedEntry);
        if (!entry) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            onClick={e => {
              if (e.target === e.currentTarget) setSelectedEntry(null);
            }}
          >
            <div
              className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto focus:outline-none"
              tabIndex={0}
              aria-label="Debate Results and Personalized Feedback"
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close results modal"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold mb-4">Debate Results & Personalized Feedback</h2>
              {/* Results */}
              {entry.session.result && (
                <div className="mb-6">
                  <div className="mb-2 font-semibold">Winner: {entry.session.result.winner}</div>
                  <div className="mb-2">Scores: Government {entry.session.result.score.government.toFixed(1)}, Opposition {entry.session.result.score.opposition.toFixed(1)}</div>
                  <div className="mb-2">Feedback: {entry.session.result.feedback}</div>
                  <div className="mb-2">Key Moments:<br />{entry.session.result.keyMoments.map((m: string, i: number) => <div key={i}>- {m}</div>)}</div>
                  <div className="mb-2">Improvement Areas:<br />{entry.session.result.improvementAreas.map((a: string, i: number) => <div key={i}>- {a}</div>)}</div>
                </div>
              )}
              {/* Personalized Feedback */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Personalized Feedback</h3>
                <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{formatFeedback(entry.personalizedFeedback)}</pre>
              </div>
              {/* Transcript */}
              <div>
                <h3 className="font-semibold mb-2">Transcript</h3>
                <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{generateFullTranscript(entry.session) || 'No transcript available.'}</pre>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}