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
} from 'lucide-react';
import { ChatMessage, AppSettings, CoreState } from '../../types';
import { soundEffects, voiceSynthesizer, speechRecognizer } from '../../services/speech';

interface ChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageBase64?: string) => Promise<void>;
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListeningInput, setIsListeningInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachedImage) return;

    if (settings.soundFX) soundEffects.playPing('click');
    const imageToSend = attachedImage || undefined;

    setInputText('');
    setAttachedImage(null);

    await onSendMessage(trimmed || 'Analyze attached visual data, Sir.', imageToSend);
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

  // Image file attachment handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      if (settings.soundFX) soundEffects.playPing('click');
    };
    reader.readAsDataURL(file);
  };

  // Format code blocks and markdown styling
  const renderFormattedText = (raw: string) => {
    // Split by code blocks ```
    const parts = raw.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-xl bg-black/80 border border-cyan-500/30 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-cyan-500/20 text-[10px] text-cyan-300">
              <span>{lang || 'code'}</span>
              <button
                onClick={() => handleCopy(`code_${index}`, codeContent)}
                className="flex items-center gap-1 hover:text-white"
              >
                {copiedId === `code_${index}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === `code_${index}` ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed">{codeContent}</pre>
          </div>
        );
      }

      // Format bold, bullets, lines
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
      {/* Chat header bar */}
      <div className="flex items-center justify-between hud-panel rounded-xl px-3 py-2 mb-2 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-hud font-bold text-cyan-200">
            SECURE CONVERSATION PROTOCOL
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            {settings.preferredProvider.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
              <Bot className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-hud text-base font-bold text-cyan-200 tracking-wider">
              J.A.R.V.I.S. M.V. IS LISTENING
            </h3>
            <p className="text-xs font-sans text-slate-400 max-w-sm mt-1">
              Ask questions in English or Bengali (বাংলা), dictate with voice, upload photos, or request code.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-700 to-cyan-700 text-white rounded-tr-none'
                      : 'hud-panel border border-cyan-500/25 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Image thumbnail if attached */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-cyan-500/40 max-w-xs">
                      <img src={msg.imageUrl} alt="Attached reconnaissance" className="w-full object-cover max-h-48" />
                    </div>
                  )}

                  {/* Text content */}
                  {renderFormattedText(msg.text)}

                  {/* Gemini Google Search Live Grounding Citations */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[10px] space-y-1.5 animate-fade-in">
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
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

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
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="hud-panel rounded-2xl p-3 border border-cyan-500/30 text-xs text-cyan-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>J.A.R.V.I.S. formulating neural synthesis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="mt-2 space-y-1.5">
        {/* Quick Grounding & Reasoning Toggle Bar */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onUpdateSettings?.({ webGroundingEnabled: !settings.webGroundingEnabled });
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition ${
                settings.webGroundingEnabled
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Google Search Web Intelligence"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Web Recon: {settings.webGroundingEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => {
                if (settings.soundFX) soundEffects.playPing('click');
                onUpdateSettings?.({ deepThinkingEnabled: !settings.deepThinkingEnabled });
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition ${
                settings.deepThinkingEnabled
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Gemini Deep Quantum Reasoning"
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Deep Thought: {settings.deepThinkingEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <span className="uppercase text-cyan-400 font-bold tracking-wider">
            [{settings.activeMode}]
          </span>
        </div>

        {/* Attached image preview */}
        {attachedImage && (
          <div className="relative inline-block mb-2 rounded-xl overflow-hidden border border-cyan-400">
            <img src={attachedImage} alt="Attachment" className="h-16 w-16 object-cover" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute top-0 right-0 p-1 bg-black/80 text-white hover:text-rose-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative hud-panel rounded-2xl p-1.5 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-950 flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-xl transition"
            title="Attach Image / Camera capture"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

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

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListeningInput ? 'Listening to voice...' : `Message JARVIS (${settings.voiceLang.startsWith('bn') ? 'বাংলা / English' : 'English'})...`}
            rows={1}
            className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-1.5 px-1 max-h-24 font-sans"
          />

          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !attachedImage) || isLoading}
            className={`p-2 rounded-xl transition font-hud font-bold ${
              inputText.trim() || attachedImage
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-md shadow-cyan-600/40'
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
