import React, { useState } from 'react';
import {
  Layers,
  CheckCircle,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Zap,
} from 'lucide-react';
import { AppSettings, AIProvider } from '../../types';
import { soundEffects } from '../../services/speech';

interface ProvidersScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ProvidersScreen: React.FC<ProvidersScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const providers: Array<{
    id: AIProvider;
    name: string;
    model: string;
    tag: string;
    desc: string;
    isFree: boolean;
  }> = [
    {
      id: 'gemini',
      name: 'Google Gemini AI',
      model: 'gemini-3.8-flash',
      tag: 'RECOMMENDED (DEFAULT)',
      desc: 'Server-side native proxy with multimodal vision, speed, and deep reasoning.',
      isFree: true,
    },
    {
      id: 'groq',
      name: 'Groq Cloud API',
      model: 'llama-3.3-70b-versatile',
      tag: 'ULTRA LOW-LATENCY',
      desc: 'LPU inference engine with generous free tier. Requires free Groq API key.',
      isFree: true,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter Free Tier',
      model: 'mistralai/mistral-7b-instruct:free',
      tag: 'MULTI-MODEL AGGREGATOR',
      desc: 'Free open-weight models (Llama, Mistral). Requires OpenRouter free key.',
      isFree: true,
    },
    {
      id: 'offline',
      name: 'JARVIS Local Heuristic',
      model: 'heuristic-core-v1',
      tag: 'ZERO-NETWORK FALLBACK',
      desc: 'Rule-based local knowledge companion when no internet is available.',
      isFree: true,
    },
  ];

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus('Initiating neural diagnostic ping...');
    if (settings.soundFX) soundEffects.playPing('process');

    const start = performance.now();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Ping diagnostic check. Confirm operational readiness in 5 words.',
          provider: settings.preferredProvider,
          apiKey:
            settings.preferredProvider === 'groq'
              ? settings.groqKey
              : settings.preferredProvider === 'openrouter'
              ? settings.openrouterKey
              : settings.customGeminiKey || undefined,
        }),
      });

      const latency = Math.round(performance.now() - start);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Connection failed');
      }

      const data = await res.json();
      setTestStatus(`Diagnostic Successful (${latency}ms latency). Model: ${data.model || 'active'}. JARVIS responded: "${data.reply?.slice(0, 40)}..."`);
      if (settings.soundFX) soundEffects.playPing('complete');
    } catch (e: any) {
      setTestStatus(`Diagnostic Warning: ${e.message}`);
      if (settings.soundFX) soundEffects.playPing('alert');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              AI PROVIDER MATRIX & KEYS
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              Modular multi-model intelligence switcher
            </div>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>Ping Test</span>
        </button>
      </div>

      {/* Ping Test status output */}
      {testStatus && (
        <div className="hud-panel rounded-xl p-3 border border-cyan-500/30 text-xs font-mono text-cyan-300 leading-relaxed animate-fade-in">
          {testStatus}
        </div>
      )}

      {/* Provider selection cards */}
      <div className="space-y-2.5">
        {providers.map((p) => {
          const isSelected = settings.preferredProvider === p.id;
          return (
            <div
              key={p.id}
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onUpdateSettings({ preferredProvider: p.id });
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'hud-panel border-cyan-500/15 hover:border-cyan-500/40 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-hud font-bold text-slate-100">{p.name}</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {p.tag}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans mt-1">{p.desc}</p>

              <div className="mt-2 text-[10px] font-mono text-cyan-400/80 flex items-center justify-between">
                <span>Model: {p.model}</span>
                <span>{p.isFree ? '100% Free Tier Supported' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Key Configuration (Optional) */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-cyan-500/10">
          <Key className="w-4 h-4 text-cyan-400" />
          <span className="font-hud font-bold text-cyan-200">
            OPTIONAL API KEY VAULT (STORED LOCALLY)
          </span>
        </div>

        <p className="text-[10px] text-slate-400 font-sans">
          The default server Gemini API key is already attached. You can optionally add your own personal API keys below to unlock custom models or switch providers.
        </p>

        <div>
          <label className="text-[10px] font-mono text-cyan-400 uppercase">
            Custom Groq API Key:
          </label>
          <input
            type="password"
            value={settings.groqKey}
            onChange={(e) => onUpdateSettings({ groqKey: e.target.value })}
            placeholder="gsk_..."
            className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-cyan-400 uppercase">
            Custom OpenRouter Key:
          </label>
          <input
            type="password"
            value={settings.openrouterKey}
            onChange={(e) => onUpdateSettings({ openrouterKey: e.target.value })}
            placeholder="sk-or-..."
            className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-mono"
          />
        </div>

        <div className="pt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Protocol: Keys are never hardcoded and remain strictly on your device or secure proxy.</span>
        </div>
      </div>
    </div>
  );
};
