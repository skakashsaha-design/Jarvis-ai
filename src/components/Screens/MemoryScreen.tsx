import React, { useState, useRef } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Check,
  X,
  Shield,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { MemoryItem, AppSettings } from '../../types';
import { soundEffects } from '../../services/speech';

interface MemoryScreenProps {
  memories: MemoryItem[];
  onAddMemory: (category: MemoryItem['category'], title: string, content: string) => void;
  onUpdateMemory: (id: string, title: string, content: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
  onImportMemories: (items: MemoryItem[]) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const MemoryScreen: React.FC<MemoryScreenProps> = ({
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearMemories,
  onImportMemories,
  settings,
  onUpdateSettings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryItem['category']>('fact');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Banks' },
    { id: 'fact', label: 'Facts' },
    { id: 'preference', label: 'Preferences' },
    { id: 'project', label: 'Projects' },
    { id: 'custom', label: 'Custom' },
  ];

  const filteredMemories =
    selectedCategory === 'all'
      ? memories
      : memories.filter((m) => m.category === selectedCategory);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      onUpdateMemory(editingId, title.trim(), content.trim());
      setEditingId(null);
    } else {
      onAddMemory(category, title.trim(), content.trim());
    }

    if (settings.soundFX) soundEffects.playPing('complete');
    setTitle('');
    setContent('');
    setShowAddModal(false);
  };

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setShowAddModal(true);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis-memory-vault-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (settings.soundFX) soundEffects.playPing('complete');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportMemories(parsed);
          if (settings.soundFX) soundEffects.playPing('complete');
        }
      } catch (err) {
        alert('Invalid JSON file structure');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              LONG-TERM NEURAL MEMORY
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              {memories.length} entries registered in local storage
            </div>
          </div>
        </div>

        <button
          onClick={() => onUpdateSettings({ memoryEnabled: !settings.memoryEnabled })}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono border transition ${
            settings.memoryEnabled
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
          title="Enable/Disable Persistent Memory Injection"
        >
          {settings.memoryEnabled ? (
            <>
              <ToggleRight className="w-4 h-4 text-emerald-400" />
              <span>ENABLED</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-rose-400" />
              <span>DISABLED</span>
            </>
          )}
        </button>
      </div>

      {/* Categories & Actions Toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap transition border ${
                selectedCategory === c.id
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setEditingId(null);
              setTitle('');
              setContent('');
              setShowAddModal(true);
            }}
            className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
            title="Add Memory"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50"
            title="Export JSON Vault"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50"
            title="Import JSON Vault"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Memory List */}
      <div className="space-y-2.5 flex-1">
        {filteredMemories.length === 0 ? (
          <div className="hud-panel rounded-2xl p-6 text-center text-slate-400 border border-cyan-500/20">
            <p className="text-xs font-mono">No memory nodes recorded in this category.</p>
          </div>
        ) : (
          filteredMemories.map((item) => (
            <div
              key={item.id}
              className="hud-panel rounded-2xl p-3.5 border border-cyan-500/20 hover:border-cyan-400/40 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-hud font-bold text-cyan-200">{item.title}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 text-slate-400 hover:text-cyan-300"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMemory(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.content}</p>

              <div className="text-[9px] font-mono text-slate-500">
                Synchronized: {new Date(item.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl hud-panel p-5 border border-cyan-500/50 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <span className="text-xs font-hud font-bold text-cyan-200">
                {editingId ? 'MODIFY MEMORY NODE' : 'ENCODE NEW MEMORY NODE'}
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-400 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-200 font-mono"
              >
                <option value="fact">Fact</option>
                <option value="preference">Preference</option>
                <option value="project">Project</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-400 uppercase">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Device Model, User Goal"
                className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-400 uppercase">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What should JARVIS remember permanently?"
                rows={3}
                className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-mono text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs disabled:opacity-50"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
