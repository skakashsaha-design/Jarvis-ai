import React, { useState } from 'react';
import {
  Shield,
  Lock,
  EyeOff,
  Trash2,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { soundEffects } from '../../services/speech';

interface PrivacyScreenProps {
  onClearAll: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onClearAll }) => {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipedMessage, setWipedMessage] = useState(false);

  const handleFullWipe = () => {
    storageService.clearAllData();
    onClearAll();
    setConfirmWipe(false);
    setWipedMessage(true);
    if (soundEffects) soundEffects.playPing('alert');
    setTimeout(() => setWipedMessage(false), 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              PRIVACY & SECURITY PROTOCOL
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              User control, data isolation & zero telemetry
            </div>
          </div>
        </div>
      </div>

      {/* Security Manifesto */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-cyan-300 font-hud font-bold">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>ZERO-COMPROMISE DATA PRIVACY</span>
        </div>

        <div className="space-y-2 text-slate-300 font-sans text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Local Memory Storage:</strong> All memories, preferences, and conversations reside strictly on your device storage. They are never sold or pooled.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>No Hidden Audio Recording:</strong> Microphone access only activates when you tap the mic or enable Hands-Free mode. Continuous unpermitted listening is strictly barred.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Encrypted Transport:</strong> All server-side Gemini AI queries travel over end-to-end encrypted HTTPS connections.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>100% User Deletable:</strong> You possess sovereign control over all data with immediate one-tap purging.
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Sensors Permissions Status */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-2 text-xs font-mono">
        <span className="font-hud font-bold text-cyan-200 text-xs">DEVICE SENSORS & PRIVACY MATRIX</span>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span>Microphone (Voice Input):</span>
          <span className="text-cyan-400 font-bold">User-Initiated Only</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span>Optical Camera (Vision):</span>
          <span className="text-cyan-400 font-bold">Explicit Shutter Only</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span>Speech Synthesizer:</span>
          <span className="text-emerald-400 font-bold">Offline Native TTS</span>
        </div>
      </div>

      {/* Wipe Data Area */}
      <div className="hud-panel rounded-2xl p-4 border border-rose-500/30 space-y-3">
        <div className="flex items-center gap-2 text-rose-300 font-hud font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>DATA PURGE & PROTOCOL RESET</span>
        </div>

        <p className="text-[10px] text-slate-400 font-sans">
          Permanently clear all chat archives, saved memories, notes, and local settings from this browser/device.
        </p>

        {confirmWipe ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmWipe(false)}
              className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleFullWipe}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs shadow-md shadow-rose-900"
            >
              Confirm Full Wipe
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmWipe(true)}
            className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 font-mono text-xs flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Purge All Local Data</span>
          </button>
        )}

        {wipedMessage && (
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-center">
            All local databases and memory caches cleared successfully.
          </div>
        )}
      </div>
    </div>
  );
};
