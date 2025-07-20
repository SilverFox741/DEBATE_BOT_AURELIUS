// Core debate system types
export interface DebateMotion {
  id: string;
  motion: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface DebateRole {
  id: string;
  name: string;
  side: 'government' | 'opposition';
  order: number;
  timeLimit: number;
  description: string;
}

export interface AIDebater {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  role: DebateRole;
  personality: string;
}

export interface Speech {
  id: string;
  speakerId: string;
  role: DebateRole;
  content: string;
  timeUsed: number;
  timestamp: Date;
  arguments: Argument[];
}

export interface Argument {
  id: string;
  claim: string;
  reasoning: string;
  evidence: string;
  impact: string;
  weight: number;
}

export interface Clash {
  id: string;
  topic: string;
  governmentArgument: Argument;
  oppositionArgument: Argument;
  weight: number;
  winner: 'government' | 'opposition' | 'tie';
  reasoning: string;
}

export interface JudgingCriteria {
  argumentQuality: number;
  logicalCoherence: number;
  rhetoricalTechniques: number;
  persuasiveness: number;
  responseToOpposition: number;
  structureAndTime: number;
  deliveryAndPresentation: number;
  evidenceCredibility: number;
  feedback?: string;
  role?: string;
}

export interface DebateResult {
  winner: 'government' | 'opposition';
  score: {
    government: number;
    opposition: number;
  };
  clashes: Clash[];
  individualScores: {
    [speakerId: string]: JudgingCriteria;
  };
  ranklist?: Array<{ speakerId: string; role: string; score: number }>;
  feedback: string;
  keyMoments: string[];
  improvementAreas: string[];
}

export interface DebateSession {
  id: string;
  motion: DebateMotion;
  participants: {
    human: {
      name: string;
      role: DebateRole;
      side: 'government' | 'opposition';
    };
    ai: AIDebater[];
  };
  speeches: Speech[];
  currentSpeaker: string | null;
  phase: 'preparation' | 'debate' | 'judging' | 'completed';
  result?: DebateResult;
  createdAt: Date;
}