/**
 * JARVIS M.V. Voice & Acoustic Engine
 * Lightweight, zero-RAM bloat, utilizing native device hardware speech synthesizer.
 */

// Web Audio API Synthesizer for futuristic HUD sound effects
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Futuristic JARVIS start chime
  playBoot() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      // Audio might be blocked until user gesture
    }
  }

  // HUD interaction feedback
  playPing(type: 'click' | 'listen' | 'process' | 'complete' | 'alert') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'listen') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'process') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(280, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) {
      // Ignore audio context autoplay policy restrictions
    }
  }
}

export const soundEffects = new SoundEffects();

// Voice Synthesizer using Web Speech API SpeechSynthesis
class VoiceSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  findBestVoice(lang: string, gender: 'male' | 'female' | 'auto'): SpeechSynthesisVoice | null {
    const list = this.getAvailableVoices();
    if (list.length === 0) return null;

    // Filter by language first (e.g. 'bn' or 'en')
    const langPrefix = lang.split('-')[0].toLowerCase();
    const matchingLang = list.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    const pool = matchingLang.length > 0 ? matchingLang : list;

    if (gender === 'auto') {
      return pool[0] || null;
    }

    // Heuristics for Male vs Female in system voices
    const isMale = gender === 'male';
    const maleKeywords = ['male', 'david', 'george', 'mark', 'daniel', 'james', 'guy', 'uk english male'];
    const femaleKeywords = ['female', 'samantha', 'zira', 'victoria', 'karen', 'hazel', 'siri', 'woman'];

    const targetKeywords = isMale ? maleKeywords : femaleKeywords;
    const found = pool.find((v) =>
      targetKeywords.some((k) => v.name.toLowerCase().includes(k))
    );

    return found || pool[0] || null;
  }

  speak(
    text: string,
    options: {
      lang?: string;
      gender?: 'male' | 'female' | 'auto';
      speed?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    if (!this.synth) {
      options.onError?.('SpeechSynthesis not supported on this device');
      return;
    }

    // Interrupt any ongoing utterance
    this.stop();

    // Clean markdown symbols for natural speech reading
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.speed ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const lang = options.lang || 'en-US';
    utterance.lang = lang;

    const voice = this.findBestVoice(lang, options.gender || 'male');
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.currentUtterance = utterance;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      options.onError?.(e);
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();

// Speech-to-Text Recognizer using Web Speech API
export class SpeechRecognizer {
  private recognition: any = null;
  private isListeningActive = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(options: {
    lang?: string;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.recognition) return false;

    try {
      this.recognition.lang = options.lang || 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          options.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          options.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        options.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        options.onEnd?.();
      };

      this.recognition.start();
      this.isListeningActive = true;
      return true;
    } catch (err) {
      this.isListeningActive = false;
      options.onError?.(err);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListeningActive = false;
    }
  }

  isListening(): boolean {
    return this.isListeningActive;
  }
}

export const speechRecognizer = new SpeechRecognizer();
