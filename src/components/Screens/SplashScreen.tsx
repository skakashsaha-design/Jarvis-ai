import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Radio, Sparkles } from 'lucide-react';
import { soundEffects, voiceSynthesizer } from '../../services/speech';
import { AppSettings } from '../../types';

interface SplashScreenProps {
  onEnter: () => void;
  settings: AppSettings;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, settings }) => {
  const [bootStep, setBootStep] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    const steps = [
      'INITIALIZING NEURAL PROTOCOLS...',
      'CHECKING ARMv7 HARDWARE REGISTERS...',
      'OPTIMIZING HEAP FOR 1GB RAM ALLOCATION...',
      'CALIBRATING ACOUSTIC & VISION ENGINES...',
      'J.A.R.V.I.S. M.V. SYSTEMS ONLINE.',
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setBootLogs((prev) => [...prev, steps[current]]);
        current++;
        setBootStep(current);
        if (settings.soundFX) soundEffects.playPing('process');
      } else {
        clearInterval(interval);
        if (settings.soundFX) soundEffects.playBoot();
        if (settings.autoSpeak) {
          voiceSynthesizer.speak(
            `J.A.R.V.I.S. online. All systems fully operational, ${settings.userTitle}.`,
            {
              lang: settings.voiceLang,
              gender: settings.voiceGender,
              speed: settings.voiceSpeed,
            }
          );
        }
        setTimeout(onEnter, 800);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 hud-grid-pattern flex flex-col items-center justify-center p-6 text-slate-100 select-none">
      {/* Outer Hexagon / Arc Glow */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="w-36 h-36 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin-slow flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border border-cyan-400/60 animate-spin-reverse flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-cyan-950/80 border border-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="font-hud font-extrabold text-3xl text-cyan-300 tracking-wider animate-pulse">
                J
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl -z-10" />
      </div>

      <h1 className="text-2xl font-hud font-bold text-cyan-300 tracking-widest text-glow-cyan">
        JARVIS M.V. AI
      </h1>
      <p className="text-xs font-mono text-slate-400 mt-1 tracking-wider uppercase">
        Advanced Personal Companion
      </p>

      {/* Boot Progress Bar */}
      <div className="w-64 h-1.5 bg-slate-900 rounded-full mt-6 overflow-hidden border border-cyan-500/30">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-sm shadow-cyan-400"
          style={{ width: `${(bootStep / 5) * 100}%` }}
        />
      </div>

      {/* Terminal logs */}
      <div className="w-full max-w-sm h-28 mt-4 bg-black/60 rounded-xl border border-cyan-500/20 p-3 font-mono text-[11px] text-cyan-400/90 overflow-hidden flex flex-col justify-end space-y-1">
        {bootLogs.map((log, index) => (
          <div key={index} className="flex items-center gap-1.5 leading-relaxed">
            <span className="text-cyan-600">❯</span>
            <span>{log}</span>
          </div>
        ))}
      </div>

      {/* Direct Skip button */}
      <button
        onClick={() => {
          if (settings.soundFX) soundEffects.playBoot();
          onEnter();
        }}
        className="mt-6 px-4 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-300/80 hover:text-cyan-200 hover:border-cyan-400 transition"
      >
        Skip Diagnostics ❯
      </button>

      <div className="absolute bottom-4 text-[10px] font-mono text-slate-500">
        Engineered for Samsung Galaxy A2 Core & Android
      </div>
    </div>
  );
};
