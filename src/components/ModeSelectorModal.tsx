import React from 'react';
import {
  X,
  Zap,
  Globe,
  Brain,
  ShieldAlert,
  Radio,
  Check,
  Sparkles,
} from 'lucide-react';
import { OperationalMode, AppSettings } from '../types';
import { soundEffects } from '../services/speech';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSelectMode: (mode: OperationalMode) => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const modes: Array<{
    id: OperationalMode;
    title: string;
    badge: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    borderColor: string;
    desc: string;
    geminiHighlight: string;
  }> = [
    {
      id: 'tactical',
      title: 'Tactical HUD Mode',
      badge: 'STANDARD PROTOCOL',
      icon: Zap,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      desc: 'Balanced everyday Stark assistant with voice, fast responses, and animated Arc Reactor telemetry.',
      geminiHighlight: 'Gemini 3.8 Flash Core Engine',
    },
    {
      id: 'deep-thought',
      title: 'Deep Quantum Thought Mode',
      badge: 'GEMINI HIGH THINKING',
      icon: Brain,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      desc: 'Engages Gemini multi-step reasoning for deep coding, mathematical proofs, and STEM puzzles.',
      geminiHighlight: 'ThinkingLevel.HIGH Cognitive Stream',
    },
    {
      id: 'live-recon',
      title: 'Satellite Live Recon Mode',
      badge: 'GOOGLE SEARCH GROUNDING',
      icon: Globe,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      desc: 'Real-time live internet intelligence, 2026 events, breaking news, sports, and verified web citations.',
      geminiHighlight: 'Live Google Search Grounding with Web URLs',
    },
    {
      id: 'combat',
      title: 'Combat Threat Protocol',
      badge: 'MARK 85 DEFENSE HUD',
      icon: ShieldAlert,
      color: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      desc: 'Iron Man combat readiness mode. Tactical perimeter threat scan, power reroutes, and crimson HUD.',
      geminiHighlight: 'Tactical Defense Telemetry & Action Steps',
    },
    {
      id: 'stealth',
      title: 'Stealth Protocol Mode',
      badge: 'AIR-GAPPED OFFLINE',
      icon: Radio,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      desc: 'Zero network emissions. Runs 100% on local offline rules, keeping all communications completely internal.',
      geminiHighlight: 'Offline Heuristic Companion Engine',
    },
  ];

  const handleSelect = (mode: OperationalMode) => {
    if (soundEffects) soundEffects.playPing('complete');
    onSelectMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl hud-panel p-5 border border-cyan-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-hud font-bold text-cyan-200 tracking-wider">
                TACTICAL OPERATIONAL MODES
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Engage specialized Gemini & hardware protocols
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = settings.activeMode === m.id;

            return (
              <div
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/60'
                    : 'hud-panel border-cyan-500/15 hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${m.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-hud font-bold text-slate-100 flex items-center gap-2">
                        <span>{m.title}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-cyan-400">
                        {m.badge}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : null}
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                  {m.desc}
                </p>

                <div className="text-[10px] font-mono text-cyan-400/90 pt-1 border-t border-cyan-500/10 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{m.geminiHighlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:text-white"
          >
            Close Protocols
          </button>
        </div>
      </div>
    </div>
  );
};
