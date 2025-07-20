// Component for AI-powered case preparation
import React, { useState } from 'react';
import { BookOpen, Lightbulb, Shield, Target, Loader2 } from 'lucide-react';
import { DebateMotion } from './debate';
import { CasePrepResponse } from './api';
import { geminiService } from './gemini';

interface CasePreparationProps {
  motion: DebateMotion;
  side: 'government' | 'opposition';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  onComplete: () => void;
}

export function CasePreparation({ motion, side, skillLevel, onComplete }: CasePreparationProps) {
  const [casePrep, setCasePrep] = useState<CasePrepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  const generateCasePrep = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating case prep for:', side, 'on motion:', motion.motion);
      const response = await geminiService.generateCasePrep({
        motion: motion.motion,
        side,
        skillLevel
      });
      console.log('Case prep generated successfully');
      setCasePrep(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate case preparation';
      console.error('Case prep error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    generateCasePrep();
  }, [motion, side, skillLevel]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Preparing your case...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={generateCasePrep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!casePrep) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Case Preparation</h2>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {side === 'government' ? 'Supporting' : 'Opposing'}: {motion.motion}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{motion.context}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Arguments */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            Main Arguments
          </h3>
          <div className="space-y-4">
            {casePrep.mainArguments.map((argument, index) => (
              <div key={argument.id || index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{argument.claim}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Reasoning: </span>
                    <span className="text-gray-600">{argument.reasoning}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Evidence: </span>
                    <span className="text-gray-600">{argument.evidence}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Impact: </span>
                    <span className="text-gray-600">{argument.impact}</span>
                  </div>
                  {argument.weight && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Strength: </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(argument.weight / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{argument.weight}/10</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rebuttals */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            Potential Rebuttals
          </h3>
          <div className="space-y-2">
            {casePrep.rebuttals.map((rebuttal, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-emerald-800">{rebuttal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Points */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Key Evidence
          </h3>
          <div className="space-y-2">
            {casePrep.evidence.map((evidence, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-amber-800">{evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Overall Strategy</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{casePrep.strategy}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={async () => {
              if (isContinuing) return;
              setIsContinuing(true);
              try {
                await onComplete();
              } finally {
                setIsContinuing(false);
              }
            }}
            disabled={isContinuing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isContinuing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isContinuing ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Loading Debate...
              </>
            ) : (
              'Continue to Debate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}