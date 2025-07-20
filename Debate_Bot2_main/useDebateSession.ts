// Custom hook for managing debate session state
import { useState, useCallback } from 'react';
import { DebateSession, DebateMotion, DebateRole, Speech, AIDebater } from './debate';
import { debateRoles } from './motions';
import { createAIDebater } from './aiPersonalities';
import { geminiService } from './gemini';
import { useDebateHistory } from './useDebateHistory';
import { generateFullTranscript } from './transcriptUtils';

export function useDebateSession() {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveDebate } = useDebateHistory();

  const createSession = useCallback(async (
    motion: DebateMotion,
    humanSide: 'government' | 'opposition',
    humanRole: DebateRole,
    aiSkillLevel: 'beginner' | 'intermediate' | 'advanced'
  ) => {
    try {
      // Create AI debaters for all roles except the human's role
      const aiDebaters: AIDebater[] = debateRoles
        .filter(role => role.id !== humanRole.id)
        .map(role => createAIDebater(aiSkillLevel, role));

      const newSession: DebateSession = {
        id: `session-${Date.now()}`,
        motion,
        participants: {
          human: {
            name: 'You',
            role: humanRole,
            side: humanSide
          },
          ai: aiDebaters
        },
        speeches: [],
        currentSpeaker: debateRoles[0].id, // Always start with first speaker (PM)
        phase: 'debate',
        createdAt: new Date()
      };

      setSession(newSession);
      setError(null);

      // (Removed: Do NOT pre-generate AI speeches for roles before the user's role)

      return newSession;
    } catch {
      setError('Failed to create debate session');
      return null;
    }
  }, []);

  const addSpeech = useCallback((speech: Speech) => {
    if (!session) return;

    setSession(prev => {
      if (!prev) return prev;
      
      const updatedSpeeches = [...prev.speeches, speech];
      const currentIndex = debateRoles.findIndex(role => role.id === prev.currentSpeaker);
      const nextSpeaker = currentIndex < debateRoles.length - 1 ? 
        debateRoles[currentIndex + 1].id : null;

      return {
        ...prev,
        speeches: updatedSpeeches,
        currentSpeaker: nextSpeaker,
        phase: nextSpeaker ? 'debate' : 'judging'
      };
    });
  }, [session]);

  const generateAISpeech = useCallback(async () => {
    if (!session || !session.currentSpeaker || isGeneratingSpeech) {
      return;
    }

    setIsGeneratingSpeech(true);
    setError(null);

    try {
      const currentRole = debateRoles.find(role => role.id === session.currentSpeaker);
      if (!currentRole) {
        throw new Error('Invalid current speaker role');
      }

      // Check if current speaker is human
      if (session.participants.human.role.id === session.currentSpeaker) {
        setIsGeneratingSpeech(false);
        return; // Human needs to deliver their speech manually
      }

      const aiDebater = session.participants.ai.find(ai => ai.role.id === session.currentSpeaker);
      if (!aiDebater) {
        throw new Error('AI debater not found for role: ' + session.currentSpeaker);
      }

      console.log(`Generating speech for ${aiDebater.name} (${currentRole.name})`);

      const speechContent = await geminiService.generateDebateSpeech({
        motion: session.motion.motion,
        previousSpeeches: session.speeches,
        currentRole,
        skillLevel: aiDebater.skillLevel,
        context: session.motion.context
      });

      const newSpeech: Speech = {
        id: `speech-${Date.now()}`,
        speakerId: aiDebater.id,
        role: currentRole,
        content: speechContent,
        timeUsed: Math.floor(Math.random() * 60) + currentRole.timeLimit - 30, // Simulate realistic time usage
        timestamp: new Date(),
        arguments: [] // Would be extracted from content in a more sophisticated system
      };

      addSpeech(newSpeech);
    } catch {
      setError('Failed to generate AI speech');
    } finally {
      setIsGeneratingSpeech(false);
    }
  }, [session, isGeneratingSpeech, addSpeech]);

  const completeDebate = useCallback(async () => {
    if (!session || session.speeches.length === 0) {
      setError('No debate session or speeches to judge');
      return;
    }

    try {
      setSession(prev => prev ? { ...prev, phase: 'judging' } : prev);
      
      console.log('Starting debate judging with', session.speeches.length, 'speeches');
      
      const result = await geminiService.judgeDebate({
        motion: session.motion.motion,
        speeches: session.speeches,
        criteria: [
          'Argument quality',
          'Logical coherence',
          'Rhetorical techniques',
          'Persuasiveness',
          'Response to opposition arguments',
          'Structure and time management',
          'Delivery and presentation',
          'Evidence credibility'
        ]
      });

      const completedSession = session ? { 
        ...session, 
        phase: 'completed' as const,
        result 
      } : null;
      
      setSession(completedSession);
      
      // Save to history with full transcript
      if (completedSession) {
        const transcript = generateFullTranscript(completedSession);
        saveDebate(completedSession, transcript);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to judge debate';
      console.error('Debate judging error:', errorMessage);
      setError(errorMessage);
      // Reset phase back to debate if judging fails
      setSession(prev => prev ? { ...prev, phase: 'debate' } : prev);
    }
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(null);
    setError(null);
    setIsGeneratingSpeech(false);
  }, []);

  return {
    session,
    isGeneratingSpeech,
    error,
    createSession,
    addSpeech,
    generateAISpeech,
    completeDebate,
    resetSession
  };
}