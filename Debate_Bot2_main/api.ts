// API-related types
import { Argument, Speech, DebateRole } from './debate';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning?: string;
}

export interface CasePrepRequest {
  motion: string;
  side: 'government' | 'opposition';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface CasePrepResponse {
  mainArguments: Argument[];
  rebuttals: string[];
  evidence: string[];
  strategy: string;
}

export interface DebateRequest {
  motion: string;
  previousSpeeches: Speech[];
  currentRole: DebateRole;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  context: string;
}

export interface JudgingRequest {
  motion: string;
  speeches: Speech[];
  criteria: string[];
}