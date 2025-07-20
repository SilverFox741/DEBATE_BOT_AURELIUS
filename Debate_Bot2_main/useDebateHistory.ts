// Custom hook for managing debate history
import { useState, useEffect } from 'react';
import { DebateSession } from './debate';

interface DebateHistoryEntry {
  id: string;
  session: DebateSession;
  savedAt: Date;
  transcript: string;
  personalizedFeedback?: any;
}

export function useDebateHistory() {
  const [history, setHistory] = useState<DebateHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('debate-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Convert date strings back to Date objects
        const historyWithDates = parsed.map((entry: any) => ({
          ...entry,
          savedAt: new Date(entry.savedAt),
          session: {
            ...entry.session,
            createdAt: new Date(entry.session.createdAt),
            speeches: entry.session.speeches.map((speech: any) => ({
              ...speech,
              timestamp: new Date(speech.timestamp)
            }))
          }
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Failed to load debate history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('debate-history', JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save debate history:', error);
      }
    }
  }, [history, isLoading]);

  const saveDebate = (session: DebateSession, transcript: string, personalizedFeedback?: any) => {
    const entry: DebateHistoryEntry = {
      id: `history-${Date.now()}`,
      session,
      savedAt: new Date(),
      transcript,
      personalizedFeedback
    };

    setHistory(prev => [entry, ...prev]);
    return entry.id;
  };

  const deleteDebate = (id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  };

  const getDebate = (id: string) => {
    return history.find(entry => entry.id === id);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    isLoading,
    saveDebate,
    deleteDebate,
    getDebate,
    clearHistory
  };
}