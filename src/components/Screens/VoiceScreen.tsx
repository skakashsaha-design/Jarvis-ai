import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Languages,
  Sliders,
  User,
  Activity,
  Radio,
  RadioTower,
} from 'lucide-react';
import { AppSettings, CoreState, ChatMessage } from '../../types';
import { soundEffects, voiceSynthesizer, speechRecognizer } from '../../services/speech';

interface VoiceScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  coreState: CoreState;
  setCoreState: (state: CoreState) => void;
  lastAssistantMessage?: ChatMessage;
  onSendVoiceMessage: (text: string) => Promise<void>;
}

export const VoiceScreen: React.FC<VoiceScreenProps> = ({
  settings,
  onUpdateSettings,
  coreState,
  setCoreState,
  lastAssistantMessage,
  onSendVoiceMessage,
}) => {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [handsFree, setHandsFree] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const isListening = coreState === 'listening';
  const isSpeaking = coreState === 'speaking';

  // Toggle voice listening
  const handleToggleMic = () => {
    if (isListening) {
      speechRecognizer.stop();
      setCoreState('idle');
      if (settings.soundFX) soundEffects.playPing('click');
      return;
    }

    if (voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setCoreState('idle');
    }

    startListeningSession();
  };

  const startListeningSession = () => {
    setCoreState('listening');
    setLiveTranscript('Listening to your voice command...');
    if (settings.soundFX) soundEffects.playPing('listen');

    const ok = speechRecognizer.start({
      lang: settings.voiceLang,
      onResult: async (text, isFinal) => {
        setLiveTranscript(text);
        if (isFinal && text.trim()) {
          setCoreState('processing');
          if (settings.soundFX) soundEffects.playPing('process');
          await onSendVoiceMessage(text.trim());
          if (handsFree) {
            // Keep hands-free loop going after speech ends
            setTimeout(() => {
              if (handsFree && !voiceSynthesizer.isSpeaking()) {
                startListeningSession();
              }
            }, 3000);
          }
        }
      },
      onError: (err) => {
        console.warn('Voice error:', err);
        setCoreState('idle');
        setLiveTranscript('Voice recognition paused. Tap mic to resume.');
      },
      onEnd: () => {
        if (coreState === 'listening' && !handsFree) {
          setCoreState('idle');
        }
      },
    });

    if (!ok) {
      setCoreState('idle');
      setLiveTranscript('Microphone access unavailable or unsupported browser.');
    }
  };

  const handleInterrupt = () => {
    voiceSynthesizer.stop();
    speechRecognizer.stop();
    setCoreState('idle');
    if (settings.soundFX) soundEffects.playPing('alert');
  };

  const handleRepeatLast = () => {
    if (!lastAssistantMessage) return;
    setCoreState('speaking');
    voiceSynthesizer.speak(lastAssistantMessage.text, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
      onEnd: () => setCoreState('idle'),
      onError: () => setCoreState('idle'),
    });
  };

  const toggleLanguage = () => {
    if (settings.soundFX) soundEffects.playPing('click');
    const newLang = settings.voiceLang.startsWith('bn') ? 'en-US' : 'bn-BD';
    onUpdateSettings({ voiceLang: newLang });
  };

  const toggleGender = () => {
    if (settings.soundFX) soundEffects.playPing('click');
    const newGender = settings.voiceGender === 'male' ? 'female' : 'male';
    onUpdateSettings({ voiceGender: newGender });
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-100px)] p-4 pb-20 max-w-lg mx-auto">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between hud-panel rounded-2xl px-4 py-2 border border-cyan-500/20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:bg-cyan-900/50 transition"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{settings.voiceLang.startsWith('bn') ? 'বাংলা (Bengali)' : 'English (US)'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleGender}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300"
            title="Toggle Voice Gender"
          >
            <User className="w-3 h-3 text-cyan-400" />
            <span className="capitalize">{settings.voiceGender} Voice</span>
          </button>

          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="p-1.5 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50"
            title="Voice Pitch & Speed Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voice Tuning Sliders Popup */}
      {showVoiceSettings && (
        <div className="w-full hud-panel rounded-2xl p-4 border border-cyan-500/30 my-2 space-y-3 animate-fade-in text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-bold">Speech Speed: {settings.voiceSpeed}x</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.voiceSpeed}
              onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-32 accent-cyan-400"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-bold">Pitch: {settings.voicePitch}x</span>
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
        </div>
      )}

      {/* Central Pulsating Voice Orb / Equalizer */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center">
          {/* Animated shockwave rings */}
          {isListening && (
            <>
              <div className="absolute w-56 h-56 rounded-full border-2 border-cyan-400/40 animate-ping" />
              <div className="absolute w-44 h-44 rounded-full border border-cyan-300/60 animate-pulse" />
            </>
          )}

          {isSpeaking && (
            <div className="absolute w-48 h-48 rounded-full border-2 border-emerald-400/50 animate-pulse-slow" />
          )}

          {/* Core Mic Button */}
          <button
            onClick={handleToggleMic}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl z-10 active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/50 text-white animate-pulse'
                : isSpeaking
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/50 text-white'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-cyan-500/40 text-white hover:brightness-110'
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            <span className="text-[10px] font-hud font-bold mt-1 tracking-wider uppercase">
              {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Push To Talk'}
            </span>
          </button>
        </div>

        {/* Dynamic Equalizer Bars */}
        <div className="flex items-center gap-1.5 mt-8 h-10">
          {Array.from({ length: 16 }).map((_, i) => {
            const active = isListening || isSpeaking;
            const height = active ? Math.max(8, Math.sin(i * 0.8) * 30 + 10) : 4;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking ? 'bg-emerald-400' : isListening ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      </div>

      {/* Live Transcript / Dialogue Box */}
      <div className="w-full hud-panel rounded-2xl p-4 border border-cyan-500/20 text-center">
        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>Acoustic Neural Stream</span>
        </div>
        <p className="text-xs text-slate-200 min-h-[48px] flex items-center justify-center font-sans leading-relaxed">
          {liveTranscript || (
            lastAssistantMessage ? (
              <span className="text-slate-300 italic line-clamp-3">
                "{lastAssistantMessage.text}"
              </span>
            ) : (
              <span className="text-slate-500">
                Tap the center reactor to speak to JARVIS M.V. in English or Bengali.
              </span>
            )
          )}
        </p>
      </div>

      {/* Voice Controls: Hands-free & Interrupt */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4">
        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            setHandsFree(!handsFree);
          }}
          className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center justify-center transition ${
            handsFree
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
              : 'hud-panel border-cyan-500/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          <RadioTower className="w-4 h-4 mb-1 text-cyan-400" />
          <span className="text-[10px]">Hands-Free: {handsFree ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleInterrupt}
          disabled={!isSpeaking && !isListening}
          className="p-2.5 rounded-xl hud-panel border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-mono flex flex-col items-center justify-center transition disabled:opacity-40"
        >
          <VolumeX className="w-4 h-4 mb-1 text-rose-400" />
          <span className="text-[10px]">Interrupt</span>
        </button>

        <button
          onClick={handleRepeatLast}
          disabled={!lastAssistantMessage}
          className="p-2.5 rounded-xl hud-panel border border-cyan-500/20 text-cyan-300 hover:bg-cyan-950/40 text-xs font-mono flex flex-col items-center justify-center transition disabled:opacity-40"
        >
          <RotateCcw className="w-4 h-4 mb-1 text-cyan-400" />
          <span className="text-[10px]">Repeat</span>
        </button>
      </div>
    </div>
  );
};
