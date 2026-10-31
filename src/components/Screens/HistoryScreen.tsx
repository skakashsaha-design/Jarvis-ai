import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
  X,
  Copy,
  Check,
  Filter,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ScreenId } from '../../types';
import { soundEffects } from '../../services/speech';

interface HistoryScreenProps {
  messages: ChatMessage[];
  onClearHistory: () => void;
  onDeleteMessage: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  messages,
  onClearHistory,
  onDeleteMessage,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Common quick topic pills
  const quickTopics = ['All', 'Status', 'Code', 'Bengali', 'Vision', 'Memory', 'A2 Core'];

  // Filter messages based on search query and role
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((m) => {
      // Role filter check
      if (roleFilter !== 'all' && m.role !== roleFilter) {
        return false;
      }
      // Query filter check
      if (!q) return true;
      return m.text.toLowerCase().includes(q);
    });
  }, [messages, searchQuery, roleFilter]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (soundEffects) soundEffects.playPing('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (soundEffects) soundEffects.playPing('click');
  };

  const handleSelectQuickTopic = (topic: string) => {
    if (soundEffects) soundEffects.playPing('click');
    if (topic === 'All') {
      setSearchQuery('');
    } else {
      setSearchQuery(topic);
    }
  };

  const handleExportText = () => {
    const formatted = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.text}`
      )
      .join('\n\n');

    const blob = new Blob([formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-conversation-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (soundEffects) soundEffects.playPing('complete');
  };

  // Helper to highlight matching text occurrences safely
  const highlightMatch = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;

    const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-cyan-500/30 text-cyan-200 font-bold px-1 py-0.5 rounded border border-cyan-400/40"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-3.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              CONVERSATION ARCHIVES
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              {messages.length} logs stored in local memory
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportText}
            disabled={messages.length === 0}
            className="p-1.5 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 disabled:opacity-40 transition"
            title="Export conversation logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClearHistory}
            disabled={messages.length === 0}
            className="p-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-950/50 disabled:opacity-40 transition"
            title="Purge all archives"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Futuristic Search Bar */}
      <div className="space-y-2">
        <div className="relative hud-panel rounded-2xl border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-950/60 transition-all p-1">
          <div className="flex items-center px-2.5">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter archives by keyword (e.g. status, code, Bangla, vision)..."
              className="w-full py-2 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Topic Chips & Sender Filter */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
          {/* Quick topic buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {quickTopics.map((topic) => {
              const isSelected =
                (topic === 'All' && !searchQuery) ||
                searchQuery.toLowerCase() === topic.toLowerCase();
              return (
                <button
                  key={topic}
                  onClick={() => handleSelectQuickTopic(topic)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] transition border ${
                    isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-cyan-500/20 shrink-0">
            {(['all', 'user', 'assistant'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  if (soundEffects) soundEffects.playPing('click');
                  setRoleFilter(r);
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold transition ${
                  roleFilter === r
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'all' ? 'All' : r === 'user' ? 'User' : 'AI'}
              </button>
            ))}
          </div>
        </div>

        {/* Results telemetry indicator */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
          <span>
            {searchQuery ? (
              <>
                Found <strong className="text-cyan-300">{filteredMessages.length}</strong> matching "
                <span className="text-cyan-300">{searchQuery}</span>"
              </>
            ) : (
              <>
                Displaying <strong>{filteredMessages.length}</strong> total messages
              </>
            )}
          </span>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="text-cyan-400 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Filtered Messages List */}
      <div className="space-y-2 flex-1">
        {filteredMessages.length === 0 ? (
          <div className="hud-panel rounded-2xl p-8 text-center text-slate-400 border border-cyan-500/20 space-y-2">
            <MessageSquare className="w-8 h-8 text-cyan-500/40 mx-auto" />
            <h3 className="text-xs font-hud font-bold text-slate-300">
              No matching conversation records found
            </h3>
            <p className="text-[11px] font-sans text-slate-500 max-w-xs mx-auto">
              No previous dialogues match "{searchQuery}". Try different keywords or reset your filter.
            </p>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="mt-2 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs hover:bg-cyan-900/50"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className="hud-panel rounded-2xl p-3.5 border border-cyan-500/15 hover:border-cyan-400/40 transition space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`p-1 rounded-lg ${
                        isUser
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                          : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <span className="uppercase font-bold tracking-wider text-slate-200">
                      {isUser ? 'USER' : 'JARVIS M.V.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>
                      {new Date(msg.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="p-1 hover:text-cyan-300 transition"
                      title="Copy text snippet"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="p-1 hover:text-rose-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message Body with Keyword Highlighting */}
                <p className="text-slate-300 font-sans leading-relaxed break-words">
                  {highlightMatch(msg.text, searchQuery)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Return to Chat Button */}
      <button
        onClick={() => onNavigate('chat')}
        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-900 active:scale-95"
      >
        <span>Open Active Communication Matrix</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
