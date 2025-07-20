// Gemini API integration service with enhanced error handling and 1.5 Flash model
import { GeminiConfig, AIResponse, CasePrepRequest, CasePrepResponse, DebateRequest, JudgingRequest } from './api';
import { DebateResult } from './debate';

class GeminiService {
  private config: GeminiConfig | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  setConfig(config: GeminiConfig) {
    this.config = config;
  }

  public async makeRequest(prompt: string, systemInstruction: string = ''): Promise<AIResponse> {
    if (!this.config) {
      throw new Error('Gemini API not configured. Please set your API key.');
    }

    if (!this.config.apiKey.startsWith('AIzaSy')) {
      throw new Error('Invalid API key format. Gemini API keys should start with "AIzaSy"');
    }

    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorData.error?.message || 'Bad request format'}`);
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (response.status === 403) {
          throw new Error('API access forbidden. Please check your API key permissions.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error('Gemini API server error. Please try again later.');
        } else {
          throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated. The content may have been filtered for safety.');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response was blocked for safety reasons. Please try rephrasing your request.');
      }
      
      if (candidate.finishReason === 'RECITATION') {
        throw new Error('Response was blocked due to recitation concerns. Please try again.');
      }

      const content = candidate.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Empty response from Gemini API. Please try again.');
      }

      return {
        content: content.trim(),
        confidence: 0.85
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Gemini API request failed:', error.message);
        throw error;
      } else {
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred while communicating with the AI service.');
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        'Hello',
        'Respond with a simple greeting.'
      );
      return Boolean(response.content && response.content.length > 0);
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async generateCasePrep(request: CasePrepRequest): Promise<CasePrepResponse> {
    const systemInstruction = `You are an expert debate coach with 20+ years of experience helping prepare cases for formal debates. 
    You understand debate theory, argumentation structure, and strategic thinking.
    
    Your task is to generate a comprehensive case preparation that includes:
    1. 3-4 main arguments with clear claim, reasoning, evidence, and impact
    2. 3-5 potential rebuttals to likely opposition arguments
    3. Key evidence points that support the case
    4. Overall strategic approach for the debate
    
    CRITICAL: You must respond with ONLY valid JSON in the exact format specified. Do not include any other text, explanations, or formatting.`;

    const prompt = `Motion: "${request.motion}"
Side: ${request.side}
Skill Level: ${request.skillLevel}

Generate a comprehensive case preparation. Consider the motion carefully and provide strategic arguments appropriate for the ${request.side} side.

For ${request.side === 'government' ? 'government' : 'opposition'}, you need to ${request.side === 'government' ? 'prove the motion is correct and should be implemented' : 'prove the motion is wrong and should not be implemented'}.

Return as JSON with this exact structure:
{
  "mainArguments": [
    {
      "id": "arg1",
      "claim": "Clear, specific claim statement",
      "reasoning": "Logical reasoning explaining why this claim is true",
      "evidence": "Specific evidence, examples, or data supporting this claim",
      "impact": "Why this argument matters and its significance to the debate",
      "weight": 8.5
    }
  ],
  "rebuttals": [
    "Specific rebuttal to likely opposition argument 1",
    "Specific rebuttal to likely opposition argument 2"
  ],
  "evidence": [
    "Key evidence point 1 with specific details",
    "Key evidence point 2 with specific details"
  ],
  "strategy": "Detailed overall strategic approach for winning this debate"
}`;

    try {
      const response = await this.makeRequest(prompt, systemInstruction);
      
      // Clean the response to ensure it's valid JSON
      let cleanedContent = response.content.trim();
      
      // Remove any markdown formatting
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanedContent);
      
      // Validate the structure
      if (!parsed.mainArguments || !Array.isArray(parsed.mainArguments)) {
        throw new Error('Invalid response structure: missing mainArguments array');
      }
      
      if (!parsed.rebuttals || !Array.isArray(parsed.rebuttals)) {
        throw new Error('Invalid response structure: missing rebuttals array');
      }
      
      if (!parsed.evidence || !Array.isArray(parsed.evidence)) {
        throw new Error('Invalid response structure: missing evidence array');
      }
      
      if (!parsed.strategy || typeof parsed.strategy !== 'string') {
        throw new Error('Invalid response structure: missing strategy string');
      }
      
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse AI response. The AI may be experiencing issues. Please try again.');
      }
      throw error;
    }
  }

  async generateDebateSpeech(request: DebateRequest): Promise<string> {
    const skillPrompts = {
      beginner: 'Use simple, clear language. Focus on basic arguments with straightforward reasoning. May have some minor logical gaps but should be generally coherent. Keep structure simple and easy to follow. Quote sources in a general way (e.g., "According to a news article...").',
      intermediate: 'Use more sophisticated arguments with good logical structure. Employ some rhetorical techniques and show good understanding of debate strategy. Arguments should be well-reasoned with solid evidence. Quote named sources or organizations (e.g., "A 2021 Pew Research study found...").',
      advanced: 'Deploy complex rhetorical techniques, sophisticated philosophical arguments, and exceptional logical coherence. Use advanced debate theory and strategic thinking. Arguments should be nuanced and highly persuasive. Quote highly credible, specific sources (e.g., "A 2023 meta-analysis in The Lancet concluded...").'
    };

    const roleGuidance: Record<string, string> = {
      'pm': 'As Prime Minister, you must define the motion, set up the government case, and present the first substantive arguments. Establish the framework for the debate.',
      'lo': 'As Leader of Opposition, you must respond to the government\'s definition and case, then present the opposition\'s counter-case with strong arguments.',
      'dpm': 'As Deputy Prime Minister, you must extend the government case with new arguments and respond to opposition points raised so far. Build upon your teammate\'s arguments.',
      'do': 'As Deputy Opposition, you must extend the opposition case and provide strong rebuttals to government arguments. Build upon your teammate\'s arguments.',
      'gw': 'As Government Whip, you must summarize the government case, respond to all opposition arguments, and provide final substantive points. Reference and extend your team\'s arguments.',
      'ow': 'As Opposition Whip, you must summarize the opposition case and provide comprehensive rebuttals to government arguments. Reference and extend your team\'s arguments.',
      'gr': 'As Government Reply, you must summarize why government wins. No new arguments allowed - only summarize existing case and explain why you\'ve won key clashes. Reference your team\'s arguments.',
      'or': 'As Opposition Reply, you must summarize why opposition wins. No new arguments allowed - only summarize existing case and explain why you\'ve won key clashes. Reference your team\'s arguments.'
    };

    // Summarize previous speech for rebuttal
    const previousSpeech = request.previousSpeeches.length > 0
      ? request.previousSpeeches[request.previousSpeeches.length - 1]
      : null;
    const previousSpeechSummary = previousSpeech
      ? `Previous Speech (${previousSpeech.role.name}, ${previousSpeech.role.side}):\n${previousSpeech.content.substring(0, 400)}${previousSpeech.content.length > 400 ? '...' : ''}`
      : 'No previous speeches yet.';

    // Summarize team arguments so far
    const teamSpeeches = request.previousSpeeches.filter(s => s.role.side === request.currentRole.side);
    const teamArgumentSummary = teamSpeeches.length > 0
      ? teamSpeeches.map((s) => `- ${s.role.name}: ${s.content.substring(0, 200)}${s.content.length > 200 ? '...' : ''}`).join('\n')
      : 'No team arguments yet.';

    const prompt = `Motion: "${request.motion}"
Your Role: ${request.currentRole.name} (${request.currentRole.side} side)
Your Position: You are ${request.currentRole.side === 'government' ? 'SUPPORTING' : 'OPPOSING'} this motion
Context: ${request.context}

${previousSpeechSummary}

Your Team's Previous Arguments:\n${teamArgumentSummary}

Instructions:
- If your role is not a Reply speech (not Government Reply or Opposition Reply), you must balance between supporting your teammate's arguments and introducing at least one new substantive point or perspective. Do not simply repeat or rephrase your teammate's arguments.
- If your role is a Reply speech (Government Reply or Opposition Reply), do not introduce new arguments. Only summarize and conclude your team's case, explain why your side wins, and address key clashes.
- Directly rebut the main points from the previous speech, referencing them specifically.
- If the previous speech (especially by the user) contains absurd, irrelevant, or off-topic remarks, and you are on the opposing team, explicitly and smartly call out the irrelevance or absurdity. If you are on the same team as the user, ignore such remarks and do not reference them.
- Build upon your teammate's arguments, extending them with new evidence or analysis, but always add something new unless you are a Reply speaker.
- Quote sources appropriate to your skill level: ${request.skillLevel === 'beginner' ? 'General references.' : request.skillLevel === 'intermediate' ? 'Named studies or organizations.' : 'Highly credible, specific sources with year and publication.'}
- Adapt your rhetorical style to the flow of the debate.
- Maintain logical progression and refer back to earlier arguments as needed.
- ${roleGuidance[request.currentRole.id] || request.currentRole.description}
- Keep your speech between 600-900 words.
- Use formal debate language, clear argumentation, and respond appropriately to previous speakers while advancing your side's case.
`;

    const systemInstruction = `You are an AI debater participating in a formal parliamentary debate. You must generate a speech that is:

1. Appropriate for your role: ${roleGuidance[request.currentRole.id] || request.currentRole.description}
2. At ${request.skillLevel} level: ${skillPrompts[request.skillLevel]}
3. Contextually aware of previous speeches
4. Structured with clear signposting
5. Between 4-6 minutes when spoken (600-900 words)
6. Maintains your side's position throughout
7. For all roles except Reply speeches, you must introduce at least one new substantive point in addition to supporting your team. For Reply speeches, only summarize and conclude.
8. If the previous speech (especially by the user) contains absurd, irrelevant, or off-topic remarks, and you are on the opposing team, explicitly and smartly call out the irrelevance or absurdity. If you are on the same team as the user, ignore such remarks and do not reference them.

Use formal debate language, clear argumentation, and respond appropriately to previous speakers while advancing your side's case.`;

    const response = await this.makeRequest(prompt, systemInstruction);
    return response.content;
  }

  async judgeDebate(request: JudgingRequest): Promise<DebateResult> {
    const systemInstruction = `You are an expert debate adjudicator with 15+ years of experience judging parliamentary debates at the highest levels. 

Your task is to evaluate this debate using rigorous mathematical analysis and a transparent, honest, and fair scoring system. Use the following anchors for each criterion (0-10):

Argument Quality:
10 = Flawless, original, deeply insightful arguments with strong evidence.
7 = Solid, well-structured arguments with good evidence and minor flaws.
5 = Average arguments, some structure, but lacking depth or evidence.
3 = Weak, poorly structured, or mostly assertions.
1 = No real argumentation or completely off-topic.

Logical Coherence:
10 = Perfectly logical, no fallacies; 7 = Mostly logical, minor issues; 5 = Some logic, some flaws; 3 = Disjointed; 1 = Illogical.

Rhetorical Techniques:
10 = Masterful use of rhetoric, highly persuasive; 7 = Good rhetorical style, some persuasive moments; 5 = Average, some attempts; 3 = Weak or awkward; 1 = No rhetorical effort.

Persuasiveness:
10 = Extremely convincing, changes minds; 7 = Generally persuasive; 5 = Somewhat persuasive; 3 = Unconvincing; 1 = Not persuasive at all.

Response to Opposition Arguments:
10 = Anticipates and refutes all major points; 7 = Responds to most; 5 = Responds to some; 3 = Few responses; 1 = Ignores opposition.

Structure and Time Management:
10 = Perfect structure, excellent timing; 7 = Good structure, minor timing issues; 5 = Average; 3 = Disorganized; 1 = No structure.

Delivery and Presentation:
10 = Flawless, engaging, confident; 7 = Good, clear, mostly confident; 5 = Average; 3 = Hesitant or unclear; 1 = Very poor.

Evidence Credibility:
10 = Highly credible, specific sources; 7 = Good sources, mostly credible; 5 = Some evidence, some credibility issues; 3 = Weak or vague evidence; 1 = No evidence or false claims.

For each score, provide a 1-2 sentence justification referencing specific arguments or moments from the transcript. If a score is much higher or lower than others, explain why. Directly compare government and opposition for each criterion. Normalize scores: average should be 6–7 unless debate is truly exceptional. Be honest and critical—do not inflate scores. If a speaker is off-topic or makes absurd claims, penalize accordingly.

Return results as JSON in this format:
{
  "winner": "government",
  "score": {
    "government": 82.5,
    "opposition": 76.8
  },
  "clashes": [ ... ],
  "individualScores": {
    "speaker1": {
      "argumentQuality": 8.5,
      "argumentQualityJustification": "Speaker 1 presented three original arguments with strong evidence, especially in the second speech.",
      "logicalCoherence": 8.0,
      "logicalCoherenceJustification": "The arguments followed a clear logical progression with no major fallacies.",
      "rhetoricalTechniques": 7.5,
      "rhetoricalTechniquesJustification": "Used effective rhetorical questions and repetition.",
      "persuasiveness": 7.5,
      "persuasivenessJustification": "The speech was generally convincing, especially when addressing economic impacts.",
      "responseToOpposition": 8.0,
      "responseToOppositionJustification": "Directly refuted the main opposition points about feasibility.",
      "structureAndTime": 9.0,
      "structureAndTimeJustification": "Speech was well-organized and within time limits.",
      "deliveryAndPresentation": 8.5,
      "deliveryAndPresentationJustification": "Confident delivery, good pacing.",
      "evidenceCredibility": 8.0,
      "evidenceCredibilityJustification": "Cited a 2023 Lancet study and government statistics.",
      "feedback": "Detailed, constructive feedback for this speaker."
    },
    ...
  },
  "ranklist": [ ... ],
  "feedback": "Comprehensive feedback on the debate performance, highlighting strengths and areas for improvement in the style of an experienced adjudicator",
  "keyMoments": [ ... ],
  "improvementAreas": [ ... ]
}`;

    const speechesText = request.speeches.map((speech) => 
      `SPEECH - ${speech.role.name} (${speech.role.side} side):
${speech.content}

---`
    ).join('\n\n');

    const prompt = `Motion: "${request.motion}"

DEBATE SPEECHES:
${speechesText}

Analyze this debate and provide comprehensive judging. Consider:
- Quality and logical coherence of arguments
- Rhetorical techniques and persuasiveness  
- Responses to opposition arguments
- Structure and time management
- Delivery and presentation
- Evidence credibility

Use mathematical clash analysis to determine the winner. Each clash should be weighted by importance and won/lost based on argument strength.

Return results as JSON with this exact structure:
{
  "winner": "government",
  "score": {
    "government": 82.5,
    "opposition": 76.8
  },
  "clashes": [
    {
      "id": "clash1",
      "topic": "Economic Impact Analysis",
      "governmentArgument": {
        "id": "gov_arg1",
        "claim": "Government's main claim on this clash",
        "reasoning": "Government's reasoning",
        "evidence": "Government's evidence",
        "impact": "Government's impact claim",
        "weight": 8.5
      },
      "oppositionArgument": {
        "id": "opp_arg1",
        "claim": "Opposition's counter-claim",
        "reasoning": "Opposition's reasoning", 
        "evidence": "Opposition's evidence",
        "impact": "Opposition's impact claim",
        "weight": 7.2
      },
      "weight": 9.0,
      "winner": "government",
      "reasoning": "Detailed explanation of why government won this clash based on logical coherence, evidence quality, and impact analysis"
    }
  ],
  "individualScores": {
    "speaker1": {
      "argumentQuality": 8.5,
      "argumentQualityJustification": "Speaker 1 presented three original arguments with strong evidence, especially in the second speech.",
      "logicalCoherence": 8.0,
      "logicalCoherenceJustification": "The arguments followed a clear logical progression with no major fallacies.",
      "rhetoricalTechniques": 7.5,
      "rhetoricalTechniquesJustification": "Used effective rhetorical questions and repetition.",
      "persuasiveness": 7.5,
      "persuasivenessJustification": "The speech was generally convincing, especially when addressing economic impacts.",
      "responseToOpposition": 8.0,
      "responseToOppositionJustification": "Directly refuted the main opposition points about feasibility.",
      "structureAndTime": 9.0,
      "structureAndTimeJustification": "Speech was well-organized and within time limits.",
      "deliveryAndPresentation": 8.5,
      "deliveryAndPresentationJustification": "Confident delivery, good pacing.",
      "evidenceCredibility": 8.0,
      "evidenceCredibilityJustification": "Cited a 2023 Lancet study and government statistics.",
      "feedback": "Detailed, constructive feedback for this speaker."
    },
    "speaker2": {
      "argumentQuality": 7.8,
      "argumentQualityJustification": "Speaker 2 presented two solid arguments with good evidence, but lacked depth and original thinking.",
      "logicalCoherence": 7.2,
      "logicalCoherenceJustification": "Some arguments were disjointed and had minor logical flaws.",
      "rhetoricalTechniques": 7.0,
      "rhetoricalTechniquesJustification": "Used some rhetorical questions, but overall delivery was average.",
      "persuasiveness": 7.0,
      "persuasivenessJustification": "The speech was generally unconvincing and failed to address key opposition points.",
      "responseToOpposition": 7.5,
      "responseToOppositionJustification": "Responded to some opposition points, but missed the main counter-arguments.",
      "structureAndTime": 8.0,
      "structureAndTimeJustification": "Speech was well-structured but slightly rushed towards the end.",
      "deliveryAndPresentation": 7.8,
      "deliveryAndPresentationJustification": "Clear delivery, but lacked confidence and engagement.",
      "evidenceCredibility": 7.5,
      "evidenceCredibilityJustification": "Cited a 2022 Pew Research study, but relied heavily on general statistics.",
      "feedback": "Detailed, constructive feedback for this speaker."
    }
  },
  "ranklist": [
    { "speakerId": "speaker1", "role": "Prime Minister", "score": 8.2 },
    { "speakerId": "speaker2", "role": "Leader of Opposition", "score": 7.8 }
  ],
  "feedback": "Comprehensive feedback on the debate performance, highlighting strengths and areas for improvement in the style of an experienced adjudicator",
  "keyMoments": ["Key moment 1 that influenced the debate", "Key moment 2"],
  "improvementAreas": ["Specific area for improvement 1", "Specific area for improvement 2"]
}`;

    let lastRawResponse: string | undefined = undefined;
    try {
      const response = await this.makeRequest(prompt, systemInstruction);
      lastRawResponse = response.content;
      // Clean the response to ensure it's valid JSON
      let cleanedContent = response.content.trim();
      // Remove any markdown formatting
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      const parsed = JSON.parse(cleanedContent);
      // Validate the structure
      if (!parsed.winner || !['government', 'opposition'].includes(parsed.winner)) {
        throw new Error('Invalid response: winner must be "government" or "opposition"');
      }
      if (!parsed.score || typeof parsed.score.government !== 'number' || typeof parsed.score.opposition !== 'number') {
        throw new Error('Invalid response: scores must be numbers');
      }
      if (!parsed.clashes || !Array.isArray(parsed.clashes)) {
        throw new Error('Invalid response: clashes must be an array');
      }
      if (!parsed.feedback || typeof parsed.feedback !== 'string') {
        throw new Error('Invalid response: feedback must be a string');
      }
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Failed to parse AI judge response. Raw response:', lastRawResponse || 'No response');
        throw new Error('Failed to parse AI judge response. The AI may be experiencing issues. Raw response:\n' + (lastRawResponse || 'No response'));
      }
      throw error;
    }
  }
}

export const geminiService = new GeminiService();