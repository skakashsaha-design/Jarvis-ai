import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Sparkles,
  Bot,
  User,
  X,
  Globe,
  Brain,
  ExternalLink,
  Paperclip,
  FileText,
  FileSpreadsheet,
  Film,
  FileCode,
  File,
  ChevronDown,
  ChevronUp,
  Puzzle,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage, AppSettings, CoreState, FileAttachment } from '../../types';
import { soundEffects, voiceSynthesizer, speechRecognizer } from '../../services/speech';

interface ChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageBase64?: string, fileAttachment?: FileAttachment) => Promise<void>;
  onClearChat: () => void;
  onDeleteMessage: (id: string) => void;
  onRegenerate: () => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  coreState: CoreState;
  setCoreState: (state: CoreState) => void;
  isLoading: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onDeleteMessage,
  onRegenerate,
  settings,
  onUpdateSettings,
  coreState,
  setCoreState,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPluginMenu, setShowPluginMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputGeneralRef = useRef<HTMLInputElement | null>(null);
  const fileInputImageRef = useRef<HTMLInputElement | null>(null);
  const fileInputDocRef = useRef<HTMLInputElement | null>(null);
  const fileInputSheetRef = useRef<HTMLInputElement | null>(null);
  const fileInputVideoRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Convert raw file into FileAttachment object
  const handleProcessFile = (file: File) => {
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let fileType: FileAttachment['type'] = 'other';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (ext === 'pdf' || file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) {
      fileType = 'spreadsheet';
    } else if (['docx', 'doc', 'odt', 'rtf'].includes(ext)) {
      fileType = 'document';
    } else if (['pptx', 'ppt', 'odp'].includes(ext)) {
      fileType = 'presentation';
    } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'sql', 'cpp', 'java'].includes(ext)) {
      fileType = 'code';
    }

    // Text / CSV / Code / Json reader
    if (fileType === 'spreadsheet' || fileType === 'code' || file.type.startsWith('text/') || ext === 'csv' || ext === 'json') {
      const textReader = new FileReader();
      textReader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: sizeFormatted,
          type: fileType,
          mimeType: file.type || 'text/plain',
          textPreview: textReader.result as string,
        });
        setShowAttachMenu(false);
        if (settings.soundFX) soundEffects.playPing('click');
      };
      textReader.readAsText(file);
      return;
    }

    // Base64 Reader for images, PDFs, videos, and binary documents
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: sizeFormatted,
        type: fileType,
        mimeType: file.type || 'application/octet-stream',
        base64: reader.result as string,
      });
      setShowAttachMenu(false);
      if (settings.soundFX) soundEffects.playPing('click');
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachedFile) return;

    if (settings.soundFX) soundEffects.playPing('click');
    const fileToSend = attachedFile || undefined;
    const imageToSend = attachedFile?.type === 'image' ? attachedFile.base64 : undefined;

    setInputText('');
    setAttachedFile(null);

    await onSendMessage(
      trimmed || (fileToSend ? `Inspect and analyze attached file: ${fileToSend.name}` : ''),
      imageToSend,
      fileToSend
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && settings.enterToSend) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (settings.soundFX) soundEffects.playPing('complete');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingMessageId === id && voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setSpeakingMessageId(null);
      setCoreState('idle');
      return;
    }

    setSpeakingMessageId(id);
    setCoreState('speaking');

    voiceSynthesizer.speak(text, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
      onEnd: () => {
        setSpeakingMessageId(null);
        setCoreState('idle');
      },
      onError: () => {
        setSpeakingMessageId(null);
        setCoreState('idle');
      },
    });
  };

  const toggleMicInput = () => {
    if (isListeningInput) {
      speechRecognizer.stop();
      setIsListeningInput(false);
      setCoreState('idle');
      return;
    }

    setIsListeningInput(true);
    setCoreState('listening');
    if (settings.soundFX) soundEffects.playPing('listen');

    const ok = speechRecognizer.start({
      lang: settings.voiceLang,
      onResult: (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal) {
          setIsListeningInput(false);
          setCoreState('idle');
        }
      },
      onError: () => {
        setIsListeningInput(false);
        setCoreState('idle');
      },
      onEnd: () => {
        setIsListeningInput(false);
        setCoreState('idle');
      },
    });

    if (!ok) {
      setIsListeningInput(false);
      setCoreState('idle');
    }
  };

  // Render attachment badge according to format
  const renderAttachmentBadge = (att: FileAttachment) => {
    const isImage = att.type === 'image' && att.base64;
    const isVideo = att.type === 'video' && att.base64;

    return (
      <div className="mb-2.5 rounded-xl bg-black/60 border border-cyan-500/30 overflow-hidden text-xs">
        {isImage && (
          <img src={att.base64} alt={att.name} className="w-full max-h-56 object-cover" />
        )}
        {isVideo && (
          <video controls src={att.base64} className="w-full max-h-56 bg-black" />
        )}
        <div className="p-2 flex items-center justify-between font-mono text-[11px] text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            {att.type === 'image' && <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />}
            {att.type === 'spreadsheet' && <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />}
            {att.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400 shrink-0" />}
            {att.type === 'video' && <Film className="w-4 h-4 text-purple-400 shrink-0" />}
            {att.type === 'code' && <FileCode className="w-4 h-4 text-blue-400 shrink-0" />}
            {att.type === 'document' && <FileText className="w-4 h-4 text-amber-400 shrink-0" />}
            {att.type === 'other' && <File className="w-4 h-4 text-slate-400 shrink-0" />}
            <span className="truncate font-semibold">{att.name}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{att.size}</span>
        </div>
      </div>
    );
  };

  // Format code blocks, tables, bold text
  const renderFormattedText = (raw: string) => {
    const parts = raw.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-xl bg-black/90 border border-cyan-500/30 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-cyan-500/20 text-[10px] text-cyan-300">
              <span className="font-bold">{lang || 'code'}</span>
              <button
                onClick={() => handleCopy(`code_${index}`, codeContent)}
                className="flex items-center gap-1 hover:text-white"
              >
                {copiedId === `code_${index}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === `code_${index}` ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed font-mono-tech">{codeContent}</pre>
          </div>
        );
      }

      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed">
          {part.split('\n').map((line, lIdx) => {
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            const cleaned = isBullet ? line.trim().substring(2) : line;

            return (
              <p key={lIdx} className={isBullet ? 'pl-4 relative before:content-["•"] before:absolute before:left-1 before:text-cyan-400' : ''}>
                {cleaned}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-2xl mx-auto p-3 pb-20">
      {/* Hidden File Input Nodes */}
      <input
        type="file"
        ref={fileInputGeneralRef}
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputImageRef}
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputDocRef}
        accept=".pdf,.doc,.docx,.odt,.txt,.md"
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputSheetRef}
        accept=".csv,.xlsx,.xls,.ods,.tsv"
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputVideoRef}
        accept="video/*"
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
      />

      {/* Chat Header Bar with Model & Clear */}
      <div className="flex items-center justify-between hud-panel rounded-xl px-3 py-2 mb-2 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-hud font-bold text-cyan-200">
            SECURE CONVERSATION PROTOCOL
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            {settings.preferredProvider.toUpperCase()}
          </span>
          {settings.thinkLonger && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">
              THINKING LONGER
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <>
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition"
                title="Regenerate Last Response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
              <Bot className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-hud text-base font-bold text-cyan-200 tracking-wider">
              J.A.R.V.I.S. M.V. READY
            </h3>
            <p className="text-xs font-sans text-slate-400 max-w-sm mt-1 leading-relaxed">
              Upload spreadsheets, PDFs, Word, photos, or video clips. Engage real-time Google Search, extended reasoning, and multilingual voice.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThoughtExpanded = expandedThoughts[msg.id] ?? false;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 animate-message-enter ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-700 to-cyan-700 text-white rounded-tr-none'
                      : 'hud-panel border border-cyan-500/25 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* File / Visual Attachment preview */}
                  {msg.fileAttachment && renderAttachmentBadge(msg.fileAttachment)}
                  {msg.imageUrl && !msg.fileAttachment && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-cyan-500/40 max-w-xs">
                      <img src={msg.imageUrl} alt="Attached reconnaissance" className="w-full object-cover max-h-48" />
                    </div>
                  )}

                  {/* ChatGPT-style Collapsible Thought Process Box */}
                  {msg.thinkingProcess && (
                    <div className="mb-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 overflow-hidden text-[11px] font-mono">
                      <button
                        onClick={() => toggleThought(msg.id)}
                        className="w-full px-3 py-1.5 flex items-center justify-between bg-purple-950/60 text-purple-300 hover:text-white transition"
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            Thought for {msg.thinkingDurationMs ? (msg.thinkingDurationMs / 1000).toFixed(1) : '3.2'}s
                          </span>
                        </span>
                        {isThoughtExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isThoughtExpanded && (
                        <div className="p-3 text-slate-300 font-mono-tech leading-relaxed border-t border-purple-500/20 bg-black/50 whitespace-pre-wrap max-h-56 overflow-y-auto">
                          {msg.thinkingProcess}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Message Text */}
                  {renderFormattedText(msg.text)}

                  {/* Gemini Google Search Live Grounding Citations */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[10px] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-hud font-bold">
                        <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>SATELLITE GROUNDING CITATIONS</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.groundingSources.slice(0, 4).map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 border border-cyan-500/40 text-cyan-200 hover:text-white hover:border-cyan-300 transition text-[9px] font-mono"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{source.title || 'Web Reference'}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action footer */}
                  <div className="mt-2 pt-1.5 border-t border-cyan-500/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.activePlugin && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px]">
                          {msg.activePlugin}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-cyan-300 p-0.5"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {!isUser && (
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className={`hover:text-cyan-300 p-0.5 ${
                            speakingMessageId === msg.id ? 'text-cyan-300 animate-pulse' : ''
                          }`}
                          title="Speak aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="hover:text-rose-400 p-0.5"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-900 border border-blue-500/40 flex items-center justify-center text-blue-200 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-start animate-message-enter">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="hud-panel rounded-2xl p-3 border border-cyan-500/30 text-xs text-cyan-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                {settings.thinkLonger
                  ? 'Deep cognitive reasoning in progress (Thinking longer)...'
                  : 'J.A.R.V.I.S. formulating neural synthesis...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section & Advanced ChatGPT Toolbar */}
      <div className="mt-2 space-y-1.5">
        {/* ChatGPT Style Power Toolbar: Web Search, Think Longer, Plugins */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            {/* Live Web Grounding Toggle */}
            <button
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onUpdateSettings?.({ webGroundingEnabled: !settings.webGroundingEnabled });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                settings.webGroundingEnabled
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Google Search Real-Time Intelligence"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Web Search</span>
            </button>

            {/* Think Longer / Reasoning Toggle */}
            <button
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onUpdateSettings?.({
                  thinkLonger: !settings.thinkLonger,
                  deepThinkingEnabled: !settings.thinkLonger,
                });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                settings.thinkLonger
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 font-bold shadow-sm shadow-purple-950'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Thinking Longer / Deep Chain-of-Thought (ChatGPT o1 / Gemini High Reasoning)"
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Think Longer</span>
            </button>

            {/* Plugins Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPluginMenu(!showPluginMenu)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                  settings.activePlugin !== 'none'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Select Computational Plugin"
              >
                <Puzzle className="w-3 h-3 text-cyan-400" />
                <span className="capitalize">{settings.activePlugin === 'none' ? 'Plugins' : settings.activePlugin.replace('-', ' ')}</span>
              </button>

              {showPluginMenu && (
                <div className="absolute bottom-8 left-0 z-50 w-48 rounded-xl hud-panel border border-cyan-500/40 p-1.5 shadow-2xl space-y-1">
                  <div className="text-[9px] font-hud uppercase px-2 py-1 text-slate-400 border-b border-cyan-500/20 font-bold">
                    SELECT AI ENGINE PLUGIN
                  </div>
                  {[
                    { id: 'none', label: 'Direct Response (No Plugin)' },
                    { id: 'code-interpreter', label: 'Code Interpreter & Exec' },
                    { id: 'spreadsheet-calc', label: 'Spreadsheet & Data Calc' },
                    { id: 'deep-reasoner', label: 'Deep STEM Proof Reasoner' },
                  ].map((plugin) => (
                    <button
                      key={plugin.id}
                      onClick={() => {
                        onUpdateSettings?.({ activePlugin: plugin.id as any });
                        setShowPluginMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition ${
                        settings.activePlugin === plugin.id
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-slate-300 hover:bg-cyan-950/60'
                      }`}
                    >
                      {plugin.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span className="uppercase text-cyan-400 font-bold">
            [{settings.activeMode}]
          </span>
        </div>

        {/* Selected File / Attachment Preview Badge */}
        {attachedFile && (
          <div className="relative flex items-center justify-between p-2 rounded-xl bg-cyan-950/80 border border-cyan-400 text-xs font-mono text-cyan-200">
            <div className="flex items-center gap-2 truncate">
              {attachedFile.type === 'spreadsheet' ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : attachedFile.type === 'pdf' ? (
                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
              ) : attachedFile.type === 'video' ? (
                <Film className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <File className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="font-semibold truncate">{attachedFile.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">({attachedFile.size})</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Input Textarea & Multi-Format Paperclip Menu */}
        <div className="relative hud-panel rounded-2xl p-1.5 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-950 flex items-center gap-1.5">
          {/* Universal Attachment Paperclip Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-xl transition"
              title="Attach File (Spreadsheet, PPT, Word, PDF, Photo, Video)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Multimodal Attachment Dropdown Drawer */}
            {showAttachMenu && (
              <div className="absolute bottom-11 left-0 z-50 w-56 rounded-2xl hud-panel border border-cyan-500/40 p-2 shadow-2xl space-y-1">
                <div className="text-[9px] font-hud uppercase px-2 py-1 text-slate-400 font-bold border-b border-cyan-500/20">
                  ATTACH MULTIMODAL MEDIA
                </div>

                <button
                  onClick={() => fileInputImageRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/60 text-slate-200 text-xs font-mono transition"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Photo / Camera</span>
                </button>

                <button
                  onClick={() => fileInputSheetRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/60 text-slate-200 text-xs font-mono transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Spreadsheet (CSV, Excel)</span>
                </button>

                <button
                  onClick={() => fileInputDocRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/60 text-slate-200 text-xs font-mono transition"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Document (PDF, Word, TXT)</span>
                </button>

                <button
                  onClick={() => fileInputVideoRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/60 text-slate-200 text-xs font-mono transition"
                >
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Video Clip (MP4, WebM)</span>
                </button>

                <button
                  onClick={() => fileInputGeneralRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/60 text-slate-200 text-xs font-mono transition"
                >
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>Code / Raw File</span>
                </button>
              </div>
            )}
          </div>

          {/* Voice Mic Input */}
          <button
            onClick={toggleMicInput}
            className={`p-2 rounded-xl transition ${
              isListeningInput
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40'
            }`}
            title="Dictate with voice"
          >
            {isListeningInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListeningInput
                ? 'Listening to voice...'
                : attachedFile
                ? `Ask about ${attachedFile.name}...`
                : `Message JARVIS (${settings.voiceLang.startsWith('bn') ? 'বাংলা / English' : 'English'})...`
            }
            rows={1}
            className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-1.5 px-1 max-h-24 font-sans"
          />

          {/* Transmit Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !attachedFile) || isLoading}
            className={`p-2 rounded-xl transition font-hud font-bold ${
              inputText.trim() || attachedFile
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-md shadow-cyan-600/40 active:scale-95'
                : 'text-slate-600'
            }`}
            title="Transmit message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
