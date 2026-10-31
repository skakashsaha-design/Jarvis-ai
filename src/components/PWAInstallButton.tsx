import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, X, ExternalLink, Copy, Check, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundEffects } from '../services/speech';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Direct standalone app URL (outside of AI Studio iframe)
  const directAppUrl = 'https://ais-pre-5zpxpusk7qxsrosn3r7czj-792117591950.asia-east1.run.app';

  const handleInstallClick = async () => {
    if (soundEffects) soundEffects.playPing('click');

    // If native prompt is available (when opened directly in browser)
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
        return;
      }
    }
    // Otherwise open the foolproof installation guide modal
    setShowModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directAppUrl);
    setCopiedLink(true);
    if (soundEffects) soundEffects.playPing('complete');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenDirect = () => {
    if (soundEffects) soundEffects.playPing('click');
    window.open(directAppUrl, '_blank');
  };

  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
        <CheckCircle className="w-3 h-3" />
        <span>APK ACTIVE</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 transition-all font-mono active:scale-95 shadow-sm shadow-cyan-900/30 ${
          compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs font-semibold'
        }`}
        title="Install JARVIS M.V. on Android phone (Samsung Galaxy A2 Core)"
      >
        <Smartphone className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
        <span className="font-bold tracking-tight">APK</span>
      </button>

      {/* Guide Modal - Properly scrollable and vertically centered without top-crop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl hud-panel p-4 sm:p-5 border border-cyan-500/50 text-slate-100 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg bg-black/40 border border-slate-700/60"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 pr-8">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-hud text-cyan-200 leading-tight">
                  Install on Android Phone
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Samsung Galaxy A2 Core & Android 8.1+
                </p>
              </div>
            </div>

            {/* Standalone Browser Notice */}
            <div className="mb-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200/90 leading-tight">
              <span className="font-bold text-amber-400">⚡ Required Step:</span> You are currently viewing inside Google AI Studio. Android browsers can only install WebAPKs when opened directly!
            </div>

            {/* Direct Open Button */}
            <div className="space-y-2 mb-3">
              <button
                onClick={handleOpenDirect}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-hud text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Open in Standalone Chrome</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono text-[11px] flex items-center justify-center gap-2 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct App Link'}</span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 text-[11px] text-slate-300 font-sans leading-relaxed bg-black/50 p-3 rounded-xl border border-cyan-500/20">
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">1.</span>
                <span>Tap <strong>"Open in Standalone Chrome"</strong> above (or paste link into Chrome).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">2.</span>
                <span>In Chrome, tap the <strong className="text-cyan-300 font-mono">⋮</strong> (three dots at top-right).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">3.</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">4.</span>
                <span>Android will automatically install <strong>JARVIS M.V.</strong> as a standalone app with the reactor icon!</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {installedNotice && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-900/90 text-emerald-200 border border-emerald-400 text-xs font-mono flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>JARVIS M.V. installed to your Android home launcher.</span>
        </div>
      )}
    </>
  );
};
