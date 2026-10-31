import React, { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  Compass,
  Zap,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  Globe,
  Brain,
  ShieldAlert,
  Radio,
  CloudSun,
  Newspaper,
  Cpu,
} from 'lucide-react';
import { ArcReactorCanvas } from '../ArcReactorCanvas';
import { CoreState, AppSettings, DeviceInfo, ScreenId, OperationalMode } from '../../types';
import { soundEffects, voiceSynthesizer, speechRecognizer } from '../../services/speech';

interface DashboardScreenProps {
  settings: AppSettings;
  deviceInfo: DeviceInfo;
  coreState: CoreState;
  setCoreState: (state: CoreState) => void;
  onNavigate: (screen: ScreenId) => void;
  onSendDirective: (text: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  settings,
  deviceInfo,
  coreState,
  setCoreState,
  onNavigate,
  onSendDirective,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [briefing, setBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial briefing
  useEffect(() => {
    let isMounted = true;
    setLoadingBriefing(true);
    fetch('/api/briefing')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.briefing) {
          setBriefing(data.briefing);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBriefing(
            `Good day, ${settings.userTitle}. All auxiliary protocols and neural memory banks are operational. Ready for your directives.`
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingBriefing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [settings.userTitle]);

  // Voice toggle on core tap
  const toggleVoiceListen = () => {
    if (coreState === 'listening') {
      speechRecognizer.stop();
      setCoreState('idle');
      if (settings.soundFX) soundEffects.playPing('click');
      return;
    }

    if (voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setCoreState('idle');
      return;
    }

    setCoreState('listening');
    setVoiceTranscript('Listening...');
    if (settings.soundFX) soundEffects.playPing('listen');

    const started = speechRecognizer.start({
      lang: settings.voiceLang,
      onResult: (text, isFinal) => {
        setVoiceTranscript(text);
        if (isFinal && text.trim()) {
          setCoreState('processing');
          if (settings.soundFX) soundEffects.playPing('process');
          onSendDirective(text.trim());
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setCoreState('idle');
        setVoiceTranscript('');
      },
      onEnd: () => {
        setCoreState('idle');
      },
    });

    if (!started) {
      setCoreState('idle');
      setVoiceTranscript('Speech input unavailable or microphone permission needed.');
    }
  };

  const handleSpeakBriefing = () => {
    if (voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setCoreState('idle');
      return;
    }

    setCoreState('speaking');
    voiceSynthesizer.speak(briefing, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
      onEnd: () => setCoreState('idle'),
      onError: () => setCoreState('idle'),
    });
  };

  const quickDirectives = [
    { label: 'Tactical Status', query: 'Status report on all systems and battery diagnostics.' },
    { label: 'Bengali Translation', query: 'Introduce yourself fluently in Bengali (বাংলা) and ask how you can assist me.' },
    { label: 'Explain Quantum Tech', query: 'Explain quantum entanglement simply using an everyday analogy.' },
    { label: 'Android A2 Core Audit', query: 'Explain the technical optimizations implemented for Samsung Galaxy A2 Core 1GB RAM.' },
  ];

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-100px)] p-4 pb-20 max-w-lg mx-auto space-y-4">
      {/* Top HUD Telemetry Banner */}
      <div className="w-full flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-sm font-hud font-bold text-cyan-200 tracking-wider">{timeStr}</div>
            <div className="text-[10px] font-mono text-slate-400">{dateStr}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-widest flex items-center justify-end gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>SYS 100%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {settings.liteMode ? '1GB RAM (Lite Engine)' : 'Full Holographic'}
          </div>
        </div>
      </div>

      {/* Main Holographic Arc Reactor Core */}
      <div className="flex flex-col items-center justify-center my-2">
        <ArcReactorCanvas
          state={coreState}
          theme={settings.theme}
          liteMode={settings.liteMode}
          mode={settings.activeMode}
          size={settings.liteMode ? 240 : 270}
          onClick={toggleVoiceListen}
        />

        {/* Voice Transcript banner when listening */}
        {voiceTranscript && (
          <div className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-mono text-xs max-w-xs text-center animate-pulse">
            {voiceTranscript}
          </div>
        )}

        {/* Mic push button under core */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={toggleVoiceListen}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-hud font-bold text-xs tracking-wider transition-all shadow-lg ${
              coreState === 'listening'
                ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30 hover:brightness-110 active:scale-95'
            }`}
          >
            {coreState === 'listening' ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>TERMINATE LISTENING</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>VOICE DIRECTIVE</span>
              </>
            )}
          </button>
        </div>

        {/* Active Operational Protocol Status Banner */}
        <div className="mt-3.5 flex items-center justify-center">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono border backdrop-blur-md shadow-sm ${
              settings.activeMode === 'deep-thought'
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                : settings.activeMode === 'live-recon'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : settings.activeMode === 'combat'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
                : settings.activeMode === 'stealth'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {settings.activeMode === 'deep-thought' && <Brain className="w-3.5 h-3.5 text-purple-400" />}
            {settings.activeMode === 'live-recon' && <Globe className="w-3.5 h-3.5 text-emerald-400" />}
            {settings.activeMode === 'combat' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
            {settings.activeMode === 'stealth' && <Radio className="w-3.5 h-3.5 text-amber-400" />}
            {settings.activeMode === 'tactical' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}

            <span className="font-hud font-bold tracking-wide">
              {settings.activeMode === 'deep-thought'
                ? 'QUANTUM REASONING: HIGH'
                : settings.activeMode === 'live-recon'
                ? 'SATELLITE RECON: LIVE SEARCH'
                : settings.activeMode === 'combat'
                ? 'COMBAT PROTOCOL ALPHA'
                : settings.activeMode === 'stealth'
                ? 'AIR-GAPPED STEALTH'
                : 'TACTICAL HUD PROTOCOL'}
            </span>
          </div>
        </div>

        {/* Combat Threat Assessment Widget (if Combat Mode) */}
        {settings.activeMode === 'combat' && (
          <div className="w-full max-w-sm mt-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-xs font-mono space-y-2 animate-fade-in shadow-lg shadow-rose-950/50">
            <div className="flex items-center justify-between text-rose-300 font-hud font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                MARK 85 DEFENSE STATUS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 text-[10px]">
                DEFCON 1
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1">
              <div>• Armor Integrity: 100%</div>
              <div>• Repulsors: 100% Armed</div>
              <div>• Nano-Shields: Deployed</div>
              <div>• Arc Output: 120% Overdrive</div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Tactical Briefing Card */}
      <div className="w-full hud-panel rounded-2xl p-4 border border-cyan-500/20 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              TACTICAL BRIEFING
            </span>
          </div>

          <button
            onClick={handleSpeakBriefing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition"
            title={coreState === 'speaking' ? 'Silence Speech' : 'Read Briefing Aloud'}
          >
            {coreState === 'speaking' ? (
              <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {loadingBriefing ? (
            <span className="font-mono text-cyan-400 animate-pulse">
              Synthesizing situational briefing for {settings.userTitle}...
            </span>
          ) : (
            briefing
          )}
        </p>
      </div>

      {/* Recon & Telemetry Modules Strip */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            onNavigate('weather');
          }}
          className="p-2.5 rounded-2xl hud-panel border border-cyan-500/25 hover:border-cyan-400 text-left transition group active:scale-95 bg-black/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <CloudSun className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono text-cyan-400/80">RADAR</span>
          </div>
          <div className="text-[11px] font-bold font-hud text-cyan-200">Weather</div>
          <div className="text-[9px] text-slate-400 font-mono truncate">Live Sensors</div>
        </button>

        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            onNavigate('news');
          }}
          className="p-2.5 rounded-2xl hud-panel border border-cyan-500/25 hover:border-cyan-400 text-left transition group active:scale-95 bg-black/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <Newspaper className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono text-emerald-400/80">WIRE</span>
          </div>
          <div className="text-[11px] font-bold font-hud text-emerald-200">News Feed</div>
          <div className="text-[9px] text-slate-400 font-mono truncate">Global Grounded</div>
        </button>

        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            onNavigate('electronics');
          }}
          className="p-2.5 rounded-2xl hud-panel border border-cyan-500/25 hover:border-cyan-400 text-left transition group active:scale-95 bg-black/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <Cpu className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono text-purple-400/80">LAB</span>
          </div>
          <div className="text-[11px] font-bold font-hud text-purple-200">Electronics</div>
          <div className="text-[9px] text-slate-400 font-mono truncate">Galaxy A2 / ICs</div>
        </button>
      </div>

      {/* Quick Directives Section */}
      <div className="w-full space-y-2">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
          <span>Quick Directives</span>
          <button
            onClick={() => onNavigate('chat')}
            className="text-cyan-400 hover:underline flex items-center gap-1 normal-case font-sans text-xs"
          >
            Open Full Chat <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickDirectives.map((qd, index) => (
            <button
              key={index}
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onSendDirective(qd.query);
              }}
              className="p-2.5 rounded-xl hud-panel border border-cyan-500/15 hover:border-cyan-400/50 text-left transition hover:bg-cyan-950/30 group active:scale-95"
            >
              <div className="text-xs font-hud font-semibold text-cyan-200 group-hover:text-cyan-300">
                {qd.label}
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                {qd.query}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
