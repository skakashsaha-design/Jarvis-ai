import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileText,
  Code,
  PieChart,
  Copy,
  Check,
  Volume2,
  VolumeX,
  X,
  Eye,
  RefreshCw,
  Calculator,
  Cpu,
} from 'lucide-react';
import { AppSettings, CoreState } from '../../types';
import { soundEffects, voiceSynthesizer } from '../../services/speech';

interface VisionScreenProps {
  settings: AppSettings;
  coreState: CoreState;
  setCoreState: (state: CoreState) => void;
}

export const VisionScreen: React.FC<VisionScreenProps> = ({
  settings,
  coreState,
  setCoreState,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [taskType, setTaskType] = useState<'general' | 'ocr' | 'diagram' | 'code' | 'math' | 'hardware'>('general');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Resize image on client to conserve 1GB RAM on Samsung Galaxy A2 Core
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = settings.liteMode ? 800 : 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(compressedDataUrl);
        setAnalysisResult(null);
        if (settings.soundFX) soundEffects.playPing('click');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setCoreState('thinking');
    if (settings.soundFX) soundEffects.playPing('process');

    try {
      const userPrompt =
        prompt.trim() ||
        (taskType === 'ocr'
          ? 'Transcribe all text from this image with high fidelity.'
          : taskType === 'diagram'
          ? 'Analyze this diagram, flowchart, or technical graph.'
          : taskType === 'code'
          ? 'Extract and explain the code shown in this screenshot.'
          : 'Describe this image in detail and identify key objects, scenes, and context.');

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          prompt: userPrompt,
          taskType,
          apiKey: settings.customGeminiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vision analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      setCoreState('idle');
      if (settings.soundFX) soundEffects.playPing('complete');

      if (settings.autoSpeak) {
        voiceSynthesizer.speak(data.analysis, {
          lang: settings.voiceLang,
          gender: settings.voiceGender,
          speed: settings.voiceSpeed,
        });
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setAnalysisResult(`[Reconnaissance Error]: ${err.message}`);
      setCoreState('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (!analysisResult) return;
    if (speaking && voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setSpeaking(false);
      setCoreState('idle');
      return;
    }

    setSpeaking(true);
    setCoreState('speaking');
    voiceSynthesizer.speak(analysisResult, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      onEnd: () => {
        setSpeaking(false);
        setCoreState('idle');
      },
      onError: () => {
        setSpeaking(false);
        setCoreState('idle');
      },
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              VISUAL RECONNAISSANCE & OCR
            </h2>
            <div className="text-[10px] font-mono text-slate-400">Multimodal Gemini 3.8 Flash</div>
          </div>
        </div>

        {selectedImage && (
          <button
            onClick={() => {
              setSelectedImage(null);
              setAnalysisResult(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
            title="Clear Image"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Image Preview / Capture Box */}
      {!selectedImage ? (
        <div className="border-2 border-dashed border-cyan-500/30 rounded-2xl p-6 text-center hud-panel flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/70 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            <Camera className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h3 className="text-sm font-hud font-bold text-cyan-200">
              TARGET OPTICAL RECONNAISSANCE
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Take a photo using Android camera or choose an image from storage.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-600/30 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 font-hud font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/50 shadow-xl max-h-72 flex items-center justify-center">
          <img
            src={selectedImage}
            alt="Selected optical subject"
            className="w-full h-full object-contain max-h-72"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-xl bg-black/70 border border-cyan-500/40 text-cyan-300 hover:text-white"
              title="Retake Photo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Task Type Selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
          Analysis Directive:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'general', label: 'General Recon', icon: Eye },
            { id: 'ocr', label: 'OCR Text', icon: FileText },
            { id: 'diagram', label: 'Diagrams', icon: PieChart },
            { id: 'code', label: 'Code & UI', icon: Code },
            { id: 'math', label: 'Math & STEM', icon: Calculator },
            { id: 'hardware', label: 'Circuits & HW', icon: Cpu },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = taskType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTaskType(t.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-mono flex flex-col items-center justify-center gap-1 border transition ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950'
                    : 'hud-panel border-cyan-500/20 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
        {[
          'Translate text to Bengali',
          'Solve math step-by-step',
          'Identify electronic components',
          'Explain diagram architecture',
        ].map((chip, cIdx) => (
          <button
            key={cIdx}
            onClick={() => setPrompt(chip)}
            className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 shrink-0 transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Custom prompt input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
          Specific Query:
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Translate text to Bengali, solve equation, or inspect circuit pins..."
          className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
        />
      </div>

      {/* Execute Analysis button */}
      <button
        onClick={runAnalysis}
        disabled={!selectedImage || isAnalyzing}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-hud font-bold text-xs tracking-wider transition shadow-lg shadow-cyan-600/30 hover:brightness-110 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isAnalyzing ? 'PROCESSING VISUAL DATA...' : 'ENGAGE OPTICAL ANALYSIS'}</span>
      </button>

      {/* Results View */}
      {analysisResult && (
        <div className="hud-panel rounded-2xl p-4 border border-cyan-500/30 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <span className="text-xs font-hud font-bold text-cyan-300 tracking-wider">
              ANALYSIS REPORT
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-300"
                title="Copy Analysis"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleSpeak}
                className={`p-1 rounded-lg text-slate-400 hover:text-cyan-300 ${
                  speaking ? 'text-cyan-400 animate-pulse' : ''
                }`}
                title="Read aloud"
              >
                {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
};
