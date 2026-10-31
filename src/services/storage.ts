import { AppSettings, ChatMessage, MemoryItem } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'jarvis_mv_settings_v2',
  MEMORIES: 'jarvis_mv_memories_v2',
  CHATS: 'jarvis_mv_chats_v2',
  NOTES: 'jarvis_mv_notes_v2',
};

// Check if device is low-memory by default (like Samsung Galaxy A2 Core)
function detectLowEndDevice(): boolean {
  if (typeof navigator !== 'undefined') {
    const nav = navigator as any;
    if (nav.deviceMemory && nav.deviceMemory <= 2) return true;
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  }
  return false;
}

export const DEFAULT_SETTINGS: AppSettings = {
  liteMode: detectLowEndDevice(),
  activeMode: 'tactical',
  webGroundingEnabled: true,
  deepThinkingEnabled: false,
  thinkLonger: false,
  activePlugin: 'none',
  autopilotVoice: false,
  theme: 'classic',
  personality: 'jarvis',
  customPersonalityPrompt: '',
  userTitle: 'Sir',
  autoSpeak: false,
  voiceGender: 'male',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  voiceLang: 'en-US',
  soundFX: true,
  enterToSend: true,
  targetFps: detectLowEndDevice() ? 30 : 60,
  memoryEnabled: true,
  preferredProvider: 'gemini',
  geminiModel: 'gemini-3.8-flash',
  customGeminiKey: '',
  groqKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  openrouterKey: '',
  openrouterModel: 'mistralai/mistral-7b-instruct:free',
};

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    category: 'preference',
    title: 'Assistant Identity',
    content: 'User addresses assistant as J.A.R.V.I.S. M.V.',
    updatedAt: Date.now(),
  },
  {
    id: 'mem_2',
    category: 'fact',
    title: 'Hardware Profile',
    content: 'Primary target device: Samsung Galaxy A2 Core (Android 8.1, 1GB RAM, ARMv7). Keep responses clean and resource-friendly.',
    updatedAt: Date.now(),
  },
  {
    id: 'mem_3',
    category: 'preference',
    title: 'Languages',
    content: 'User is proficient in English and Bengali (বাংলা). Answer fluently in the requested language.',
    updatedAt: Date.now(),
  },
];

export const storageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (!data) return INITIAL_MEMORIES;
      return JSON.parse(data);
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories', e);
    }
  },

  getChats(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveChats(chats: ChatMessage[]): void {
    try {
      // Limit saved messages in localStorage to prevent 1GB RAM memory exhaustion
      const trimmed = chats.slice(-100);
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save chats', e);
    }
  },

  getNotes(): Array<{ id: string; title: string; text: string; done: boolean; date: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (!data) {
        return [
          {
            id: 'note_1',
            title: 'Samsung Galaxy A2 Core Optimization',
            text: 'Lite Mode is active: 30 FPS canvas rendering, minimal DOM reflows for smooth 1GB RAM operation.',
            done: true,
            date: Date.now(),
          },
          {
            id: 'note_2',
            title: 'Voice Recognition Setup',
            text: 'Bangla (bn-BD) and English (en-US) voice commands enabled via Web Speech API.',
            done: true,
            date: Date.now(),
          },
        ];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveNotes(notes: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  },

  exportAllData(): string {
    const backup = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      memories: this.getMemories(),
      chats: this.getChats(),
      notes: this.getNotes(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.memories) this.saveMemories(parsed.memories);
      if (parsed.chats) this.saveChats(parsed.chats);
      if (parsed.notes) this.saveNotes(parsed.notes);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.MEMORIES);
      localStorage.removeItem(STORAGE_KEYS.CHATS);
      localStorage.removeItem(STORAGE_KEYS.NOTES);
    } catch (e) {}
  },
};
