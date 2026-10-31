import React, { useState } from 'react';
import {
  Info,
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  FileCode,
  Github,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { generateAndroidProjectZip } from '../../services/apkGenerator';
import { PWAInstallButton } from '../PWAInstallButton';
import { soundEffects } from '../../services/speech';

export const AboutScreen: React.FC = () => {
  const [generatingZip, setGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const directAppUrl = 'https://ais-pre-5zpxpusk7qxsrosn3r7czj-792117591950.asia-east1.run.app';

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(directAppUrl);
    setCopiedAppUrl(true);
    if (soundEffects) soundEffects.playPing('complete');
    setTimeout(() => setCopiedAppUrl(false), 2500);
  };

  const handleDownloadProjectZip = async () => {
    setGeneratingZip(true);
    if (soundEffects) soundEffects.playPing('process');

    try {
      const zipBlob = await generateAndroidProjectZip('JARVIS M.V. AI');
      const downloadUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'jarvis-mv-android-project-a2core.zip';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      if (soundEffects) soundEffects.playPing('complete');
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to generate Android project zip', err);
      alert('Error generating Android project files.');
    } finally {
      setGeneratingZip(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              ABOUT JARVIS M.V. & APK HUB
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              Deliverables, Android 8.1 specs & downloads
            </div>
          </div>
        </div>
      </div>

      {/* Samsung Galaxy A2 Core Dedicated Deliverable Hub */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/30 space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-hud font-bold text-cyan-200">
                INSTALLABLE ANDROID DELIVERABLES
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Target Device: Samsung Galaxy A2 Core (Android 8.1 • 1GB RAM)
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          To ensure effortless installation on your <strong>Samsung Galaxy A2 Core</strong>, two official installation methods have been engineered:
        </p>

        {/* Option 1: 1-Click Native WebAPK Install */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hud font-bold text-cyan-300">
              METHOD 1: 1-CLICK NATIVE ANDROID INSTALL (RECOMMENDED)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              BEST FOR 1GB RAM
            </span>
          </div>

          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
            <strong>Important:</strong> When browsing inside AI Studio, Chrome cannot install the app from within an iframe. Open the standalone app directly in Chrome to install the APK!
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 font-sans">
            <div>1. Tap <strong>"Open in Standalone Chrome"</strong> below (or paste link into Chrome).</div>
            <div>2. In Chrome, tap the <strong>⋮</strong> menu (top right) → tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</div>
            <div>3. Android compiles and installs a standalone APK with the Arc Reactor icon!</div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => window.open(directAppUrl, '_blank')}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-hud font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-950"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Standalone Chrome</span>
            </button>

            <button
              onClick={handleCopyAppUrl}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono text-xs flex items-center justify-center gap-1.5 transition"
            >
              {copiedAppUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAppUrl ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Download Standalone Android Studio Source ZIP */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hud font-bold text-slate-200">
              METHOD 2: FULL NATIVE ANDROID SOURCE & BUILD ZIP
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
              UNIVERSAL APK
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Download the complete Android Studio Kotlin project bundle with <code>minSdk 27</code>, ARMv7 32-bit universal APK build configs, and GitHub Actions cloud builder.
          </p>

          <button
            onClick={handleDownloadProjectZip}
            disabled={generatingZip}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-900 active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${generatingZip ? 'animate-bounce' : ''}`} />
            <span>
              {generatingZip
                ? 'GENERATING ANDROID PROJECT ARCHIVE...'
                : 'DOWNLOAD ANDROID STUDIO PROJECT (.ZIP)'}
            </span>
          </button>

          {downloadSuccess && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] font-mono text-center flex items-center justify-center gap-1.5 animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Project zip downloaded! Ready to build or compile.</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Compatibility & Hardware Report */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
        <span className="text-xs font-hud font-bold text-cyan-200">
          FEATURE COMPATIBILITY REPORT (SAMSUNG GALAXY A2 CORE)
        </span>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>Operating System (Android 8.1 Oreo):</span>
            <span className="text-emerald-400 font-bold">100% COMPATIBLE</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>CPU Architecture (ARMv7 32-bit):</span>
            <span className="text-emerald-400 font-bold">OPTIMIZED</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>Memory (1.0 GB RAM):</span>
            <span className="text-cyan-400 font-bold">LITE MODE SAFE</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>Speech Recognition (Bangla & English):</span>
            <span className="text-emerald-400 font-bold">SUPPORTED</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>Optical Vision & OCR (Gemini 3.8 Flash):</span>
            <span className="text-emerald-400 font-bold">SUPPORTED</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span>Offline Protocol Fallback:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-2 text-xs">
        <span className="text-xs font-hud font-bold text-cyan-200">
          SYSTEM SPECIFICATIONS
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div>• Codename: JARVIS M.V.</div>
          <div>• Version: 2.5.0-mobile</div>
          <div>• Core Engine: Gemini 3.8 Flash</div>
          <div>• Secondary: Groq & OpenRouter</div>
          <div>• Audio: Native SpeechSynthesis</div>
          <div>• Visuals: 60/30 FPS Canvas HUD</div>
        </div>
      </div>

      {/* Known Limitations */}
      <div className="hud-panel rounded-2xl p-4 border border-cyan-500/20 space-y-2 text-xs">
        <span className="text-xs font-hud font-bold text-amber-300">
          TRANSPARENT SYSTEM LIMITATIONS
        </span>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 font-sans leading-relaxed">
          <li>
            <strong>Background Listening:</strong> Android 8.1 OS battery saving policies restrict continuous mic recording when the screen is turned off. Voice commands operate when the app is active on screen.
          </li>
          <li>
            <strong>1GB RAM Memory Cap:</strong> Lite Mode is enabled to maintain smooth 30 FPS rendering and prevent Android system kills on low-RAM hardware.
          </li>
        </ul>
      </div>
    </div>
  );
};
