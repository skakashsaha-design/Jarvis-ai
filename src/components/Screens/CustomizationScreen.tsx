import React from 'react';
import {
  Sliders,
  Palette,
  Volume2,
  Cpu,
  Zap,
  Sparkles,
  Smartphone,
  Eye,
  Check,
  Globe,
  Brain,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { AppSettings, ThemeId, OperationalMode } from '../../types';
import { soundEffects, voiceSynthesizer } from '../../services/speech';

interface CustomizationScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const CustomizationScreen: React.FC<CustomizationScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const themes: Array<{ id: ThemeId; name: string; color: string; desc: string }> = [
    { id: 'classic', name: 'Classic Cyan', color: '#00e5ff', desc: 'Stark Industries HUD' },
    { id: 'arc-blue', name: 'Arc Blue', color: '#3b82f6', desc: 'Deep Electric Plasma' },
    { id: 'stark-gold', name: 'Stark Gold', color: '#fbbf24', desc: 'Iron Man Mark 85' },
    { id: 'matrix-emerald', name: 'Emerald Matrix', color: '#10b981', desc: 'Quantum Bio-Neural' },
    { id: 'cyber-purple', name: 'Cyber Purple', color: '#c084fc', desc: 'Synthesizer Wave' },
    { id: 'crimson-alert', name: 'Crimson Alert', color: '#ef4444', desc: 'Tactical Combat HUD' },
    { id: 'amoled-black', name: 'AMOLED Black', color: '#000000', desc: 'Maximum Battery Saver (Galaxy A2)' },
    { id: 'light-tech', name: 'Clean Light', color: '#38bdf8', desc: 'High Daytime Contrast' },
  ];

  const handleThemeSelect = (themeId: ThemeId) => {
    if (settings.soundFX) soundEffects.playPing('click');
    onUpdateSettings({ theme: themeId });
  };

  const previewVoice = () => {
    voiceSynthesizer.speak(`Testing voice synthesis. Greetings, ${settings.userTitle}.`, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              CUSTOMIZATION CONTROL CENTER
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              Personalize interface, voice & performance
            </div>
          </div>
        </div>
      </div>

      {/* Samsung Galaxy A2 Core 1GB RAM Optimizer */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-hud font-bold text-cyan-200">
                LITE MODE (1GB RAM OPTIMIZER)
              </span>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Caps canvas rendering to 30 FPS, reduces particle calculations, and minimizes memory footprint. Recommended for Samsung Galaxy A2 Core.
              </p>
            </div>
          </div>

          <button
            onClick={() => onUpdateSettings({ liteMode: !settings.liteMode })}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
              settings.liteMode
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {settings.liteMode ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Theme Picker */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-hud font-bold text-cyan-200">
            HOLOGRAPHIC ACCENT THEMES
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {themes.map((th) => {
            const isSelected = settings.theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => handleThemeSelect(th.id)}
                className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white/30"
                    style={{ backgroundColor: th.color }}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-xs font-hud font-bold text-slate-100">{th.name}</div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">{th.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Acoustic & Voice Tuning */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span className="font-hud font-bold text-cyan-200">VOICE SYNTHESIS TUNING</span>
          </div>

          <button
            onClick={previewVoice}
            className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 hover:bg-cyan-900/50"
          >
            Preview Voice
          </button>
        </div>

        {/* Gender Selection */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Voice Gender Profile:</span>
          <div className="flex gap-1">
            {(['male', 'female', 'auto'] as const).map((g) => (
              <button
                key={g}
                onClick={() => onUpdateSettings({ voiceGender: g })}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] border transition ${
                  settings.voiceGender === g
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Rate / Speed Slider */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Speech Rate: {settings.voiceSpeed}x</span>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={settings.voiceSpeed}
            onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
            className="w-32 accent-cyan-400"
          />
        </div>

        {/* Pitch Slider */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Voice Pitch: {settings.voicePitch}x</span>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.1"
            value={settings.voicePitch}
            onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
            className="w-32 accent-cyan-400"
          />
        </div>

        {/* Auto-Speak Responses */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
          <span className="text-slate-300">Auto-Speak Responses:</span>
          <button
            onClick={() => onUpdateSettings({ autoSpeak: !settings.autoSpeak })}
            className={`px-3 py-1 rounded-lg text-[10px] border font-bold ${
              settings.autoSpeak
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {settings.autoSpeak ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Sound FX */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">HUD Acoustic Feedback (Sound FX):</span>
          <button
            onClick={() => onUpdateSettings({ soundFX: !settings.soundFX })}
            className={`px-3 py-1 rounded-lg text-[10px] border font-bold ${
              settings.soundFX
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {settings.soundFX ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Gemini AI Advanced Protocols & Operational Modes */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 text-xs font-mono">
        <div className="flex items-center gap-2 pb-2 border-b border-cyan-500/10">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-hud font-bold text-cyan-200">
            GEMINI 3.8 FLASH PROTOCOLS
          </span>
        </div>

        {/* Operational Mode Picker */}
        <div>
          <span className="text-slate-300">Active Operational Mode:</span>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {[
              { id: 'tactical', label: 'Tactical HUD', icon: Zap },
              { id: 'deep-thought', label: 'Deep Thought', icon: Brain },
              { id: 'live-recon', label: 'Live Recon', icon: Globe },
              { id: 'combat', label: 'Combat Alert', icon: ShieldAlert },
              { id: 'stealth', label: 'Stealth Mode', icon: Radio },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = settings.activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (settings.soundFX) soundEffects.playPing('click');
                    onUpdateSettings({ activeMode: m.id as any });
                  }}
                  className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gemini Web Grounding Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
          <div>
            <div className="text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Search Live Grounding</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Enables real-time internet web grounding with citations
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ webGroundingEnabled: !settings.webGroundingEnabled })}
            className={`px-3 py-1 rounded-lg text-[10px] border font-bold ${
              settings.webGroundingEnabled
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {settings.webGroundingEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Gemini Deep Thinking Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-200 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Gemini High Cognitive Reasoning</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              ThinkingLevel.HIGH multi-step deductive problem solving
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ deepThinkingEnabled: !settings.deepThinkingEnabled })}
            className={`px-3 py-1 rounded-lg text-[10px] border font-bold ${
              settings.deepThinkingEnabled
                ? 'bg-purple-950 border-purple-400 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {settings.deepThinkingEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* User Title Directive */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-2">
        <label className="text-xs font-hud font-bold text-cyan-200">
          HONORIFIC / ADDRESS TITLE
        </label>
        <p className="text-[10px] text-slate-400 font-sans">
          How JARVIS should address you in voice and text (e.g. Sir, Boss, or your Name).
        </p>
        <input
          type="text"
          value={settings.userTitle}
          onChange={(e) => onUpdateSettings({ userTitle: e.target.value })}
          placeholder="Sir"
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-200 font-mono"
        />
      </div>
    </div>
  );
};
