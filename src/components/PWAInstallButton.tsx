import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // If browser doesn't support prompt event, provide guidance
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>APK ACTIVE</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 transition-all font-mono active:scale-95 shadow-sm shadow-cyan-900/30 ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
        }`}
        title="Install JARVIS M.V. as native Android APK / PWA"
      >
        <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Install APK</span>
      </button>

      {/* Guide Modal for browsers where beforeinstallprompt needs direct guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl hud-panel p-5 border border-cyan-500/50 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-hud text-cyan-200">
                  Android APK Installation
                </h3>
                <p className="text-xs text-slate-400 font-mono">Samsung Galaxy A2 Core & Android</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed bg-black/40 p-3.5 rounded-xl border border-cyan-500/20">
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">1.</span>
                <span>Open in <strong>Chrome</strong> browser on your Android device.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">2.</span>
                <span>Tap the Chrome menu button <strong className="text-cyan-300 font-mono">⋮</strong> (3 dots at top-right).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">3.</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-cyan-400 font-mono">4.</span>
                <span>Android automatically compiles and installs a standalone APK with full hardware acceleration!</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex gap-2">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs transition"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {installedNotice && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-900/90 text-emerald-200 border border-emerald-400 text-xs font-mono flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>JARVIS M.V. installed successfully to your Android app launcher.</span>
        </div>
      )}
    </>
  );
};
