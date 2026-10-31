export type CoreState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'offline';

export type ScreenId =
  | 'dashboard'
  | 'chat'
  | 'voice'
  | 'vision'
  | 'weather'
  | 'news'
  | 'electronics'
  | 'memory'
  | 'history'
  | 'customization'
  | 'providers'
  | 'personality'
  | 'tools'
  | 'privacy'
  | 'about';

export type PersonalityId =
  | 'jarvis'
  | 'professional'
  | 'friendly'
  | 'humorous'
  | 'scientific'
  | 'calm'
  | 'study'
  | 'custom';

export type ThemeId =
  | 'classic' // Cyan / JARVIS Blue
  | 'arc-blue' // Deep Electric Blue
  | 'stark-gold' // Iron Man Red & Gold
  | 'matrix-emerald' // Neon Green
  | 'cyber-purple' // Cyberpunk Purple
  | 'crimson-alert' // Tactical Red
  | 'amoled-black' // 100% OLED Black for battery saving
  | 'light-tech'; // Clean White HUD

export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'offline';

export type OperationalMode =
  | 'tactical' // Default JARVIS HUD
  | 'deep-thought' // Gemini High Thinking Level (Complex logic & math)
  | 'live-recon' // Gemini Google Search Grounding with Live Citations
  | 'combat' // Iron Man Mark 85 Threat Alert Mode
  | 'stealth'; // Zero network emissions, 100% offline local knowledge

export interface FileAttachment {
  name: string;
  size: string;
  type: 'image' | 'video' | 'pdf' | 'spreadsheet' | 'document' | 'presentation' | 'code' | 'other';
  mimeType: string;
  base64?: string;
  textPreview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  imageUrl?: string;
  fileAttachment?: FileAttachment;
  provider?: string;
  model?: string;
  isVoice?: boolean;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  webSearchQueries?: string[];
  thinkingProcess?: string;
  thinkingDurationMs?: number;
  activePlugin?: string;
}

export interface MemoryItem {
  id: string;
  category: 'fact' | 'preference' | 'project' | 'custom';
  title: string;
  content: string;
  updatedAt: number;
}

export interface AppSettings {
  liteMode: boolean; // Specially optimized for 1GB RAM devices like Samsung Galaxy A2 Core
  activeMode: OperationalMode;
  webGroundingEnabled: boolean; // Gemini Google Search Live Grounding
  deepThinkingEnabled: boolean; // Gemini High Thinking Level
  thinkLonger: boolean; // Extended Thinking / Reason Longer Mode
  activePlugin: 'none' | 'web-search' | 'code-interpreter' | 'spreadsheet-calc' | 'deep-reasoner';
  autopilotVoice: boolean; // Hands-free continuous loop
  theme: ThemeId;
  personality: PersonalityId;
  customPersonalityPrompt: string;
  userTitle: string; // e.g. "Sir", "Boss", "Arko"
  autoSpeak: boolean;
  voiceGender: 'male' | 'female' | 'auto';
  voiceSpeed: number; // 0.5 - 2.0
  voicePitch: number; // 0.5 - 1.5
  voiceVolume: number; // 0.1 - 1.0
  voiceLang: string; // 'en-US' | 'bn-BD' | 'bn-IN'
  soundFX: boolean;
  enterToSend: boolean;
  targetFps: 30 | 60;
  memoryEnabled: boolean;
  preferredProvider: AIProvider;
  geminiModel: string;
  customGeminiKey: string;
  groqKey: string;
  groqModel: string;
  openrouterKey: string;
  openrouterModel: string;
}

export interface DeviceInfo {
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOnline: boolean;
  estimatedRam: string;
  cores: number;
  platform: string;
  userAgent: string;
}

export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  apparentTemp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  forecast: Array<{
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
  }>;
  aiBriefing?: string;
  updatedAt: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'world' | 'tech' | 'science' | 'cyber' | 'electronics' | 'bangladesh';
  source?: string;
  url?: string;
  timestamp: string;
  readTime?: string;
}

export interface ElectronicProduct {
  id: string;
  name: string;
  category: 'microcontroller' | 'sensor' | 'ic' | 'passive' | 'phone' | 'gadget';
  specs: Record<string, string>;
  pinoutOrDiagram?: string;
  description: string;
  practicalApplications: string[];
}

