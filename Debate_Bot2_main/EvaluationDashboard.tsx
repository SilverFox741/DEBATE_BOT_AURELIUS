// Component for detailed evaluation and scoring display
import { BarChart3, Target, TrendingUp, Award, Star } from 'lucide-react';
import { DebateResult } from './debate';

interface EvaluationDashboardProps {
  result: DebateResult;
  humanSide: 'government' | 'opposition';
}

export function EvaluationDashboard({ result, humanSide }: EvaluationDashboardProps) {
  const humanWon = result.winner === humanSide;

  const criteriaLabels = {
    argumentQuality: 'Argument Quality',
    logicalCoherence: 'Logical Coherence',
    rhetoricalTechniques: 'Rhetorical Techniques',
    persuasiveness: 'Persuasiveness',
    responseToOpposition: 'Response to Opposition',
    structureAndTime: 'Structure & Time Management',
    deliveryAndPresentation: 'Delivery & Presentation',
    evidenceCredibility: 'Evidence Credibility'
  };

  // Build ranklist from result.ranklist if available, else from individualScores
  const ranklist = result.ranklist || Object.entries(result.individualScores).map(([speakerId, scores]) => {
    // Use unknown cast to avoid type errors
    const scoreObj = scores as unknown as Record<string, string | number>;
    const total = Object.entries(scoreObj).reduce((a, [k, b]) => (typeof b === 'number' && k !== 'role' && k !== 'feedback' ? a + b : a), 0);
    const role = typeof scoreObj.role === 'string' ? scoreObj.role : speakerId;
    return { speakerId, role, score: total / 8 };
  }).sort((a, b) => b.score - a.score);

  const participants = [
    {
      name: 'Government',
      side: 'government' as const,
      score: result.score.government,
      isWinner: result.winner === 'government'
    },
    {
      name: 'Opposition', 
      side: 'opposition' as const,
      score: result.score.opposition,
      isWinner: result.winner === 'opposition'
    }
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Overall Results */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className={`text-4xl font-bold mb-2 ${humanWon ? 'text-green-600' : 'text-red-600'}`}>
            {humanWon ? '🎉 Victory!' : '💪 Good Effort!'}
          </div>
          <p className="text-lg text-gray-700">
            {result.winner === 'government' ? 'Government' : 'Opposition'} wins the debate
          </p>
        </div>

        {/* Ranking Leaderboard */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <Award className="w-5 h-5 text-yellow-600" />
            Final Rankings
          </h3>
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div
                key={participant.side}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  participant.isWinner ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-600">
                      {participant.side === humanSide ? '(You)' : '(AI)'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {participant.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Ranklist */}
        <div className="bg-white rounded-lg p-4 mt-6">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <Award className="w-5 h-5 text-yellow-600" />
            Speaker Ranklist
          </h3>
          <div className="space-y-3">
            {ranklist.map((entry: { speakerId: string; role?: string; score: number }, index: number) => (
              <div key={entry.speakerId} className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' : 'bg-gray-400'}`}>{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-900">{entry.role || entry.speakerId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{entry.score.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Performance Breakdown for all speakers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Speaker Performance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(result.individualScores).map(([speakerId, scores]) => {
            const scoreObj = scores as unknown as Record<string, string | number>;
            const role = typeof scoreObj.role === 'string' ? scoreObj.role : '';
            const side = typeof scoreObj.side === 'string' ? scoreObj.side : '';
            const name = typeof scoreObj.name === 'string' ? scoreObj.name : (side === humanSide ? 'You' : role);
            // Build a list of criterion keys (excluding feedback, role, side, name)
            const criteriaKeys = Object.keys(scoreObj).filter(
              k => !['feedback', 'role', 'side', 'name'].includes(k) && !k.endsWith('Justification')
            );
            return (
              <div key={speakerId} className="space-y-3 border-b pb-4 mb-4">
                <div className="font-semibold text-gray-900 mb-1 flex flex-col">
                  <span>{role}</span>
                  <span className="text-sm text-gray-600">{typeof side === 'string' && side ? side.charAt(0).toUpperCase() + side.slice(1) : ''}{name ? ` — ${name}` : ''}</span>
                </div>
                {criteriaKeys.map((criterion) => (
                  <div key={criterion} className="mb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{criteriaLabels[criterion as keyof typeof criteriaLabels] || criterion}</span>
                      <span className="text-lg font-bold text-gray-900">{typeof scoreObj[criterion] === 'number' ? (scoreObj[criterion] as number).toFixed(1) : ''}/10</span>
                    </div>
                    {/* Show justification if present */}
                    {(scoreObj[`${criterion}Justification`] as string | undefined) && (
                      <div className="text-xs text-gray-600 mt-1 pl-2 border-l-2 border-blue-200">{scoreObj[`${criterion}Justification`]}</div>
                    )}
                  </div>
                ))}
                {/* Show detailed feedback if available */}
                {'feedback' in scoreObj && (
                  <div className="text-sm text-blue-700 mt-2">{scoreObj.feedback}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clash Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
          <Target className="w-5 h-5 text-purple-600" />
          Clash Analysis & Scoring Methodology
        </h3>

        <div className="space-y-4 mb-6">
          {result.clashes.map((clash) => (
            <div key={clash.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{clash.topic}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    Weight: {clash.weight.toFixed(1)}/10
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    clash.winner === 'government' 
                      ? 'bg-blue-100 text-blue-800' 
                      : clash.winner === 'opposition'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {clash.winner === 'tie' ? 'Tie' : `${clash.winner} wins`}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{clash.reasoning}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                  <div className="font-medium text-blue-900 mb-1">Government Position</div>
                  <div className="text-sm text-blue-800">{clash.governmentArgument.claim}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Strength: {clash.governmentArgument.weight.toFixed(1)}/10
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                  <div className="font-medium text-red-900 mb-1">Opposition Position</div>
                  <div className="text-sm text-red-800">{clash.oppositionArgument.claim}</div>
                  <div className="text-xs text-red-600 mt-1">
                    Strength: {clash.oppositionArgument.weight.toFixed(1)}/10
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring Methodology */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Mathematical Scoring Algorithm</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>1. Clash Identification:</strong> AI identifies major argument clashes between teams</p>
            <p><strong>2. Weight Assignment:</strong> Each clash receives importance weight (1-10) based on centrality to motion</p>
            <p><strong>3. Clash Resolution:</strong> Winner determined through logical coherence and evidence strength</p>
            <p><strong>4. Score Calculation:</strong> Final scores = Σ(ClashWeight × ClashOutcome × CriteriaMultiplier) / TotalPossiblePoints × 100</p>
            <p><strong>5. Bias Prevention:</strong> Multiple evaluation passes with different analytical frameworks</p>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Performance Insights
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-green-600" />
              Key Strengths
            </h4>
            <div className="space-y-2">
              {result.keyMoments.map((moment, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <p className="text-sm text-gray-700">{moment}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-600" />
              Growth Opportunities
            </h4>
            <div className="space-y-2">
              {result.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    !
                  </div>
                  <p className="text-sm text-gray-700">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}