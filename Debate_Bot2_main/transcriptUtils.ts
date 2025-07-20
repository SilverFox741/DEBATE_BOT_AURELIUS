// transcriptUtils.ts
import { DebateSession } from './debate';

export function generateFullTranscript(session: DebateSession): string {
  const header = `DEBATE TRANSCRIPT
Motion: ${session.motion.motion}
Date: ${session.createdAt.toLocaleDateString()}
Time: ${session.createdAt.toLocaleTimeString()}
Category: ${session.motion.category}
Difficulty: ${session.motion.difficulty}

Participants:
- Human: ${session.participants.human.name} (${session.participants.human.role.name} - ${session.participants.human.side})
${session.participants.ai.map(ai => `- AI: ${ai.name} (${ai.role.name} - ${ai.role.side})`).join('\n')}

${'='.repeat(50)}

`;

  const speeches = session.speeches.map((speech, index) => {
    const speaker = speech.speakerId === session.participants.human.role.id 
      ? session.participants.human.name 
      : session.participants.ai.find(ai => ai.id === speech.speakerId)?.name || 'Unknown';
    const timeUsed = Math.floor(speech.timeUsed / 60);
    const timeRemaining = Math.floor((speech.role.timeLimit - speech.timeUsed) / 60);
    return `SPEECH ${index + 1}: ${speech.role.name} (${speech.role.side})\nSpeaker: ${speaker}\nTime Used: ${timeUsed}:${(speech.timeUsed % 60).toString().padStart(2, '0')}\nTime Remaining: ${timeRemaining}:${((speech.role.timeLimit - speech.timeUsed) % 60).toString().padStart(2, '0')}\n\n${speech.content}\n\n${'-'.repeat(30)}\n`;
  }).join('\n');

  const footer = session.result ? `\n\n${'='.repeat(50)}\n\nDEBATE RESULTS\nWinner: ${session.result.winner}\nFinal Scores:\n- Government: ${session.result.score.government.toFixed(1)}\n- Opposition: ${session.result.score.opposition.toFixed(1)}\n\nFeedback: ${session.result.feedback}\n\nKey Moments:\n${session.result.keyMoments.map(moment => `• ${moment}`).join('\n')}\n\nAreas for Improvement:\n${session.result.improvementAreas.map(area => `• ${area}`).join('\n')}\n` : '';

  return header + speeches + footer;
} 