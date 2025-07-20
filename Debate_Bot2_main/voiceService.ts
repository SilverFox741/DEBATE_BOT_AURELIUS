// Voice service for speech-to-text and text-to-speech functionality

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export interface VoiceRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  language: string;
  grammars?: SpeechGrammarList;
}

export interface VoiceSynthesisConfig {
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

export interface VoiceError {
  error: string;
  message: string;
  timestamp: Date;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSpeaking = false;
  private recognitionConfig: VoiceRecognitionConfig = {
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    language: 'en-US'
  };
  private synthesisConfig: VoiceSynthesisConfig = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      return;
    }
    
    // Configure recognition
    this.recognition.continuous = this.recognitionConfig.continuous;
    this.recognition.interimResults = this.recognitionConfig.interimResults;
    this.recognition.maxAlternatives = this.recognitionConfig.maxAlternatives;
    this.recognition.lang = this.recognitionConfig.language;
  }

  private initializeSpeechSynthesis(): void {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    this.synthesis = window.speechSynthesis;
  }

  // Speech Recognition Methods
  public startListening(
    onResult: (result: RecognitionResult) => void,
    onError: (error: VoiceError) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition) {
      onError({
        error: 'NOT_SUPPORTED',
        message: 'Speech recognition is not supported in this browser',
        timestamp: new Date()
      });
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.isListening = true;

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      // Get alternatives for error correction
      const alternatives: string[] = [];
      for (let i = 0; i < result.length; i++) {
        if (result[i].transcript !== transcript) {
          alternatives.push(result[i].transcript);
        }
      }

      onResult({
        transcript: transcript.trim(),
        confidence,
        isFinal,
        alternatives: alternatives.length > 0 ? alternatives : undefined
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      onError({
        error: event.error,
        message: event.message || 'Speech recognition error',
        timestamp: new Date()
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
      onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      this.isListening = false;
      onError({
        error: 'START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start speech recognition',
        timestamp: new Date()
      });
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public pauseListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public resumeListening(): boolean {
    if (this.recognition && !this.isListening) {
      return this.startListening(
        () => {},
        () => {},
        () => {},
        () => {}
      );
    }
    return false;
  }

  // Text-to-Speech Methods
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: VoiceError) => void
  ): boolean {
    if (!this.synthesis) {
      onError?.({
        error: 'NOT_SUPPORTED',
        message: 'Speech synthesis is not supported in this browser',
        timestamp: new Date()
      });
      return false;
    }

    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = this.synthesisConfig.rate;
    utterance.pitch = this.synthesisConfig.pitch;
    utterance.volume = this.synthesisConfig.volume;
    
    if (this.synthesisConfig.voice) {
      utterance.voice = this.synthesisConfig.voice;
    }

    utterance.onstart = () => {
      console.log('Speech synthesis started');
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('Speech synthesis ended');
      onEnd?.();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      this.isSpeaking = false;
              onError?.({
          error: event.error,
          message: 'Speech synthesis error',
          timestamp: new Date()
        });
    };

    try {
      this.synthesis.speak(utterance);
      return true;
    } catch (error) {
      this.isSpeaking = false;
      onError?.({
        error: 'SPEAK_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start speech synthesis',
        timestamp: new Date()
      });
      return false;
    }
  }

  public stopSpeaking(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public pauseSpeaking(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  public resumeSpeaking(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.resume();
    }
  }

  // Configuration Methods
  public setRecognitionConfig(config: Partial<VoiceRecognitionConfig>): void {
    this.recognitionConfig = { ...this.recognitionConfig, ...config };
    
    if (this.recognition) {
      this.recognition.continuous = this.recognitionConfig.continuous;
      this.recognition.interimResults = this.recognitionConfig.interimResults;
      this.recognition.maxAlternatives = this.recognitionConfig.maxAlternatives;
      this.recognition.lang = this.recognitionConfig.language;
    }
  }

  public setSynthesisConfig(config: Partial<VoiceSynthesisConfig>): void {
    this.synthesisConfig = { ...this.synthesisConfig, ...config };
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    // Only return English voices
    return this.synthesis.getVoices().filter(voice => voice.lang && voice.lang.toLowerCase().startsWith('en'));
  }

  public getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    return voices.find(voice => voice.default) || voices[0] || null;
  }

  // Utility Methods
  public isSupported(): boolean {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    console.log('Voice support check:', {
      hasRecognition,
      hasSynthesis,
      webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
      SpeechRecognition: 'SpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window
    });
    
    return hasRecognition && hasSynthesis;
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  // Noise handling and audio processing
  public async setupAudioContext(): Promise<AudioContext | null> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContext.resume();
      return audioContext;
    } catch (error) {
      console.error('Failed to setup audio context:', error);
      return null;
    }
  }

  // Error correction suggestions
  public getCorrectionSuggestions(transcript: string, alternatives: string[]): string[] {
    const suggestions: string[] = [];
    
    // Add alternatives as suggestions
    suggestions.push(...alternatives);
    
    // Common speech recognition corrections
    const commonCorrections: Record<string, string> = {
      'uh': '',
      'um': '',
      'you know': '',
      'like': '',
      'so': '',
      'well': '',
      'i mean': '',
      'i think': '',
      'i believe': '',
      'i feel': '',
      'i would say': '',
      'in my opinion': '',
      'from my perspective': '',
      'from my point of view': ''
    };

    // Apply common corrections
    let correctedTranscript = transcript;
    Object.entries(commonCorrections).forEach(([pattern, replacement]) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      correctedTranscript = correctedTranscript.replace(regex, replacement);
    });

    // Clean up extra spaces
    correctedTranscript = correctedTranscript.replace(/\s+/g, ' ').trim();
    
    if (correctedTranscript !== transcript) {
      suggestions.unshift(correctedTranscript);
    }

    return suggestions.filter(suggestion => suggestion.length > 0);
  }
}

// Create and export a singleton instance
export const voiceService = new VoiceService(); 