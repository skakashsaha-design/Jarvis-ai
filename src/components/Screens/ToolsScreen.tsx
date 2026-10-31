import React, { useState } from 'react';
import {
  Wrench,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Search,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calculator,
  Languages,
  Battery,
  BatteryCharging,
  Cpu,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, DeviceInfo } from '../../types';
import { storageService } from '../../services/storage';
import { soundEffects } from '../../services/speech';

interface ToolsScreenProps {
  settings: AppSettings;
  deviceInfo: DeviceInfo;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({ settings, deviceInfo }) => {
  const [activeTab, setActiveTab] = useState<'intents' | 'notes' | 'calc' | 'translate'>('intents');

  // Notes state
  const [notes, setNotes] = useState(() => storageService.getNotes());
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Calculator state
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Translator state
  const [translateText, setTranslateText] = useState('');
  const [targetLang, setTargetLang] = useState('Bengali');
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Intent Launchers
  const launchIntent = (url: string) => {
    if (settings.soundFX) soundEffects.playPing('click');
    window.location.href = url;
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;
    const newNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim(),
      text: '',
      done: false,
      date: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    storageService.saveNotes(updated);
    setNewNoteTitle('');
    if (settings.soundFX) soundEffects.playPing('complete');
  };

  const toggleNote = (id: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n));
    setNotes(updated);
    storageService.saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    storageService.saveNotes(updated);
  };

  const handleCalc = () => {
    try {
      // Safe sanitized arithmetic evaluator
      const sanitized = calcInput.replace(/[^0-9+\-*/().%^]/g, '');
      // Evaluate basic arithmetic
      const res = Function(`'use strict'; return (${sanitized})`)();
      setCalcResult(String(res));
      if (settings.soundFX) soundEffects.playPing('complete');
    } catch {
      setCalcResult('Syntax Error');
      if (settings.soundFX) soundEffects.playPing('alert');
    }
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setIsTranslating(true);
    if (settings.soundFX) soundEffects.playPing('process');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Translate the following text accurately into ${targetLang}. Return ONLY the direct translation:\n\n${translateText}`,
        }),
      });

      if (!res.ok) throw new Error('Translation request failed');
      const data = await res.json();
      setTranslatedResult(data.reply);
      if (settings.soundFX) soundEffects.playPing('complete');
    } catch (e: any) {
      setTranslatedResult(`Translation error: ${e.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              ANDROID ASSISTANT TOOLS
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              System intents, tasks, telemetry & utilities
            </div>
          </div>
        </div>

        {/* Battery widget */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
          {deviceInfo.isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          ) : (
            <Battery className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{deviceInfo.batteryLevel ?? 85}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { id: 'intents', label: 'Android Apps' },
          { id: 'notes', label: 'Checklist' },
          { id: 'calc', label: 'Calculator' },
          { id: 'translate', label: 'Translator' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (settings.soundFX) soundEffects.playPing('click');
              setActiveTab(tab.id as any);
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-mono transition border ${
              activeTab === tab.id
                ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold'
                : 'hud-panel border-cyan-500/20 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Android Apps & System Intents Tab */}
      {activeTab === 'intents' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest px-1">
            Native Android Action Triggers
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => launchIntent('tel:')}
              className="p-3.5 rounded-2xl hud-panel border border-cyan-500/20 hover:border-cyan-400/50 text-left transition hover:bg-cyan-950/40 group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs font-hud font-bold text-slate-100 flex items-center justify-between">
                <span>Phone Dialer</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Place calls via Android intent</div>
            </button>

            <button
              onClick={() => launchIntent('sms:')}
              className="p-3.5 rounded-2xl hud-panel border border-cyan-500/20 hover:border-cyan-400/50 text-left transition hover:bg-cyan-950/40 group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-950/70 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-xs font-hud font-bold text-slate-100 flex items-center justify-between">
                <span>Send SMS</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Compose text messages</div>
            </button>

            <button
              onClick={() => launchIntent('mailto:')}
              className="p-3.5 rounded-2xl hud-panel border border-cyan-500/20 hover:border-cyan-400/50 text-left transition hover:bg-cyan-950/40 group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs font-hud font-bold text-slate-100 flex items-center justify-between">
                <span>Email Client</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Open default email app</div>
            </button>

            <button
              onClick={() => launchIntent('https://maps.google.com')}
              className="p-3.5 rounded-2xl hud-panel border border-cyan-500/20 hover:border-cyan-400/50 text-left transition hover:bg-cyan-950/40 group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-950/70 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs font-hud font-bold text-slate-100 flex items-center justify-between">
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Navigation & coordinates</div>
            </button>
          </div>

          <div className="p-3 rounded-2xl hud-panel border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-hud font-bold text-cyan-200">GOOGLE SEARCH INTENT</span>
            </div>
            <div className="flex gap-2">
              <input
                id="search-input"
                type="text"
                placeholder="Search web through Android browser..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) launchIntent(`https://www.google.com/search?q=${encodeURIComponent(val)}`);
                  }
                }}
              />
              <button
                onClick={() => {
                  const el = document.getElementById('search-input') as HTMLInputElement;
                  if (el?.value) launchIntent(`https://www.google.com/search?q=${encodeURIComponent(el.value)}`);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tasks & Checklist Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Add task or reminder for JARVIS..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans"
            />
            <button
              onClick={handleAddNote}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="hud-panel rounded-xl p-3 border border-cyan-500/20 flex items-center justify-between text-xs"
              >
                <div
                  onClick={() => toggleNote(note.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1"
                >
                  {note.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span
                    className={`font-sans leading-relaxed ${
                      note.done ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {note.title}
                  </span>
                </div>

                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AI Quick Calculator Tab */}
      {activeTab === 'calc' && (
        <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span className="font-hud font-bold text-cyan-200">TACTICAL CALCULATOR</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              placeholder="e.g. (250 * 1.15) / 4 + 75"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-mono"
            />
            <button
              onClick={handleCalc}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono"
            >
              Calculate
            </button>
          </div>

          {calcResult !== null && (
            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/40 text-center font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Calculation Result:</span>
              <div className="text-xl font-bold text-cyan-300 mt-1">{calcResult}</div>
            </div>
          )}
        </div>
      )}

      {/* 4. AI Translator Tab */}
      {activeTab === 'translate' && (
        <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-cyan-400" />
              <span className="font-hud font-bold text-cyan-200">NEURAL TRANSLATOR</span>
            </div>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300 font-mono"
            >
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Arabic">Arabic</option>
              <option value="Hindi">Hindi</option>
              <option value="German">German</option>
              <option value="French">French</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <textarea
            value={translateText}
            onChange={(e) => setTranslateText(e.target.value)}
            placeholder="Enter text in any language..."
            rows={3}
            className="w-full p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans"
          />

          <button
            onClick={handleTranslate}
            disabled={!translateText.trim() || isTranslating}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs disabled:opacity-50"
          >
            {isTranslating ? 'Translating...' : `Translate into ${targetLang}`}
          </button>

          {translatedResult && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/40 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                {targetLang} Translation:
              </span>
              <p className="text-slate-100 font-sans leading-relaxed text-xs">
                {translatedResult}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
