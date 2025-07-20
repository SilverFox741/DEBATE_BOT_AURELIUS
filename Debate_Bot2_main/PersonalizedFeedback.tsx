import { useEffect, useState } from 'react';
import { DebateSession } from './debate';
import { geminiService } from './gemini';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { useDebateHistory } from './useDebateHistory';
import { Component, ReactNode } from 'react';

interface PersonalizedFeedbackProps {
  session: DebateSession;
  onBack: () => void;
  onNewDebate: () => void;
}

interface FeedbackResult {
  criteria: { [key: string]: string };
  summary: string;
  argumentMapping?: string;
  fallacyDetection?: string;
  rhetoricalDeviceRecognition?: string;
  sentimentAndEngagementAnalysis?: string;
  comparativeClashAnalysis?: string;
  roleSkillAdaptedFeedback?: string;
  rubricTransparency?: string;
  keyMoments?: string;
}

const CRITERIA = [
  { key: 'argumentQuality', label: 'Argument Quality & Logical Coherence' },
  { key: 'rhetoricalTechniques', label: 'Rhetorical Techniques & Persuasiveness' },
  { key: 'responseToOpposition', label: 'Response to Opposition Arguments' },
  { key: 'structureAndTime', label: 'Structure & Time Management' },
  { key: 'deliveryAndPresentation', label: 'Delivery & Presentation' },
];

// Error boundary with error logging
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorInfo?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: undefined };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // Log error to the console for debugging
    console.error('PersonalizedFeedback error boundary:', error, info);
    this.setState({ errorInfo: error instanceof Error ? error.message : String(error) });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 rounded-lg shadow-sm max-w-2xl mx-auto my-12">
          <div className="p-6 text-red-700">
            An unexpected error occurred while rendering personalized feedback. Please try again or start a new debate.
            {this.state.errorInfo && (
              <pre className="mt-4 text-xs text-gray-700 bg-gray-100 p-2 rounded">{this.state.errorInfo}</pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function PersonalizedFeedback({ session, onBack, onNewDebate }: PersonalizedFeedbackProps) {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<string | null>(null);
  const { saveDebate } = useDebateHistory();

  // Find the user's speeches
  const humanId = session.participants.human.role.id;
  const userScores = session.result?.individualScores[humanId];
  const transcript = session.speeches.map((s, i) => {
    const isHuman = s.speakerId === humanId;
    const speaker = isHuman ? 'You' : session.participants.ai.find(ai => ai.id === s.speakerId)?.name || 'Unknown AI';
    return `SPEECH ${i + 1} - ${s.role.name} (${s.role.side})\nSpeaker: ${speaker}\n${s.content}`;
  }).join('\n\n');
  const aiAnalysis = session.result?.feedback || '';

  // If feedback is already available (e.g., from debate history), use it immediately
  useEffect(() => {
    let initialFeedback: FeedbackResult | null = null;
    if (session.result && (session.result as any).personalizedFeedback) {
      // If stored in result as personalizedFeedback
      initialFeedback = (session.result as any).personalizedFeedback;
    } else if (session.result && session.result.feedback) {
      // Try to parse if feedback is stored as JSON string (legacy)
      try {
        const parsed = JSON.parse(session.result.feedback);
        if (parsed && typeof parsed === 'object' && parsed.criteria) {
          initialFeedback = parsed;
        }
      } catch {}
    }
    if (initialFeedback && initialFeedback.criteria) {
      setFeedback(initialFeedback);
      setLoading(false);
      return;
    }
    // Otherwise, fetch from Gemini
    async function fetchFeedback() {
      setLoading(true);
      setParseError(null);
      setRawApiResponse(null);
      try {
        const prompt = `
You are an expert debate coach. Here is the full debate transcript:

"""
${transcript}
"""

Here is the AI judge's analysis of the debate:

"""
${aiAnalysis}
"""

Here are the user's scores (out of 10) for each criterion:
${CRITERIA.map(c => `- ${c.label}: ${userScores?.[c.key as keyof typeof userScores] ?? 'N/A'}`).join('\n')}

Based on the transcript, the AI's analysis, and the scores, give the user 2-3 specific, actionable suggestions for improvement for each criterion, referencing their actual performance.

Then, provide a summary panel called 'Personal feedback' with a descriptive paragraph on how the user can improve overall as a debater, based on the above.

Additionally, provide the following fields:
- argumentMapping: A brief mapping of the main arguments and counterarguments presented by the user and their opponent.
- fallacyDetection: Identify any logical fallacies present in the user's arguments, if any.
- rhetoricalDeviceRecognition: List and briefly describe any rhetorical devices used by the user.
- sentimentAndEngagementAnalysis: Analyze the sentiment and engagement level of the user's speeches.
- comparativeClashAnalysis: Compare how the user handled direct clashes with the opponent.
- roleSkillAdaptedFeedback: Give feedback tailored to the user's debate role and skill level, with examples.
- rubricTransparency: Briefly explain how the feedback aligns with the scoring rubric.
- keyMoments: Highlight 2-3 key moments from the debate that most influenced the outcome.

If you cannot provide a field, return an empty string for that field. Return your answer as JSON in this format:
{
  "criteria": {
    "argumentQuality": "...",
    "rhetoricalTechniques": "...",
    "responseToOpposition": "...",
    "structureAndTime": "...",
    "deliveryAndPresentation": "..."
  },
  "summary": "...",
  "argumentMapping": "...",
  "fallacyDetection": "...",
  "rhetoricalDeviceRecognition": "...",
  "sentimentAndEngagementAnalysis": "...",
  "comparativeClashAnalysis": "...",
  "roleSkillAdaptedFeedback": "...",
  "rubricTransparency": "...",
  "keyMoments": "..."
}
`.trim();

        const response = await geminiService.makeRequest(prompt, 'You are an expert debate coach.');
        let cleaned = response.content?.trim() ?? '';
        setRawApiResponse(cleaned);
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }
        let parsed: FeedbackResult | null = null;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          setParseError('Failed to parse feedback from Gemini. Raw response:\n' + (rawApiResponse || response.content));
          setLoading(false);
          return;
        }
        // Defensive: check for required fields
        if (!parsed || typeof parsed !== 'object' || !parsed.criteria || typeof parsed.criteria !== 'object') {
          setParseError('Gemini API returned malformed feedback. Raw response:\n' + (rawApiResponse || response.content));
          setLoading(false);
          return;
        }
        setFeedback(parsed);
        try {
          // Save feedback in result for future viewing
          saveDebate(session, '', parsed);
        } catch {
          // Ignore save errors
        }
      } catch (err) {
        setParseError('Failed to fetch feedback from Gemini.' + (err instanceof Error && err.message ? '\n' + err.message : ''));
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
    // eslint-disable-next-line
  }, [session.id]);

  return (
    <ErrorBoundary>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-2xl mx-auto my-12">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Personalized Feedback</h2>
        </div>
        <div className="p-6 space-y-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <div className="text-gray-600 text-lg">Generating personalized feedback...</div>
            </div>
          )}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 whitespace-pre-wrap">
              {parseError}
              {rawApiResponse && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600">Show raw API response</summary>
                  <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded">{rawApiResponse}</pre>
                </details>
              )}
            </div>
          )}
          {feedback && typeof feedback === 'object' && feedback.criteria && typeof feedback.criteria === 'object' && (
            <>
              <div className="space-y-6">
                {CRITERIA.map(c => (
                  <div key={c.key} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-semibold text-blue-900 mb-2">{c.label}</div>
                    <div className="text-gray-800 whitespace-pre-line">
                      {feedback.criteria[c.key]
                        ? feedback.criteria[c.key]
                        : <span className="text-gray-500 italic">No feedback available for this criterion.</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-8">
                <div className="font-semibold text-green-900 mb-2">Personal feedback</div>
                <div className="text-gray-800 whitespace-pre-line">
                  {typeof feedback.summary === 'string' && feedback.summary
                    ? feedback.summary
                    : <span className="text-gray-500 italic">No summary feedback available.</span>}
                </div>
              </div>
              {/* Additional feedback fields */}
              <div className="mt-8 space-y-4">
                {typeof feedback.argumentMapping === 'string' && feedback.argumentMapping && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="font-semibold text-yellow-900 mb-2">Argument Mapping</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.argumentMapping}</div>
                  </div>
                )}
                {typeof feedback.fallacyDetection === 'string' && feedback.fallacyDetection && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="font-semibold text-red-900 mb-2">Fallacy Detection</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.fallacyDetection}</div>
                  </div>
                )}
                {typeof feedback.rhetoricalDeviceRecognition === 'string' && feedback.rhetoricalDeviceRecognition && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-semibold text-purple-900 mb-2">Rhetorical Device Recognition</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.rhetoricalDeviceRecognition}</div>
                  </div>
                )}
                {typeof feedback.sentimentAndEngagementAnalysis === 'string' && feedback.sentimentAndEngagementAnalysis && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="font-semibold text-pink-900 mb-2">Sentiment & Engagement Analysis</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.sentimentAndEngagementAnalysis}</div>
                  </div>
                )}
                {typeof feedback.comparativeClashAnalysis === 'string' && feedback.comparativeClashAnalysis && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="font-semibold text-indigo-900 mb-2">Comparative Clash Analysis</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.comparativeClashAnalysis}</div>
                  </div>
                )}
                {typeof feedback.roleSkillAdaptedFeedback === 'string' && feedback.roleSkillAdaptedFeedback && (
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <div className="font-semibold text-blue-900 mb-2">Role/Skill-Adapted Feedback</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.roleSkillAdaptedFeedback}</div>
                  </div>
                )}
                {typeof feedback.rubricTransparency === 'string' && feedback.rubricTransparency && (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">Rubric Transparency</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.rubricTransparency}</div>
                  </div>
                )}
                {typeof feedback.keyMoments === 'string' && feedback.keyMoments && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <div className="font-semibold text-green-900 mb-2">Key Moments</div>
                    <div className="text-gray-800 whitespace-pre-line">{feedback.keyMoments}</div>
                  </div>
                )}
              </div>
            </>
          )}
          {!loading && !parseError && (!feedback || !feedback.criteria) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No personalized feedback is available for this debate. Please try again or start a new debate.
            </div>
          )}
          <div className="flex gap-4 mt-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </button>
            <button
              onClick={onNewDebate}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start New Debate
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 