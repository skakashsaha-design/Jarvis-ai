import React, { useState } from 'react';
import {
  Cpu,
  MessageSquare,
  Mic,
  Camera,
  Wrench,
  Menu,
  X,
  Database,
  History,
  Sliders,
  Shield,
  Info,
  Layers,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Zap,
  Globe,
  Brain,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { ScreenId, AppSettings, DeviceInfo, OperationalMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { ModeSelectorModal } from './ModeSelectorModal';
import { soundEffects } from '../services/speech';

interface NavigationHUDProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  deviceInfo: DeviceInfo;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  currentScreen,
  onSelectScreen,
  settings,
  onUpdateSettings,
  deviceInfo,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  const handleNav = (screen: ScreenId) => {
    if (settings.soundFX) soundEffects.playPing('click');
    onSelectScreen(screen);
    setDrawerOpen(false);
  };

  const toggleLiteMode = () => {
    if (settings.soundFX) soundEffects.playPing('click');
    onUpdateSettings({ liteMode: !settings.liteMode });
  };

  const primaryTabs: Array<{ id: ScreenId; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Core', icon: Cpu },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'vision', label: 'Vision', icon: Camera },
    { id: 'tools', label: 'Tools', icon: Wrench },
  ];

  const drawerItems: Array<{ id: ScreenId; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
    { id: 'memory', label: 'Memory Manager', icon: Database, desc: 'Short, long & custom knowledge' },
    { id: 'history', label: 'Chat History', icon: History, desc: 'Saved conversation logs' },
    { id: 'customization', label: 'Customization', icon: Sliders, desc: 'Themes, voice & AMOLED styles' },
    { id: 'providers', label: 'AI Providers', icon: Layers, desc: 'Gemini, Groq, OpenRouter & keys' },
    { id: 'personality', label: 'Personality Matrix', icon: Cpu, desc: '8 personas & custom directives' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, desc: 'Local storage & data clearing' },
    { id: 'about', label: 'APK & About JARVIS', icon: Info, desc: 'Galaxy A2 Core specs & APK build' },
  ];

  return (
    <>
      {/* Top HUD Bar */}
      <header className="sticky top-0 z-40 w-full hud-panel border-b border-cyan-500/20 px-3 py-2 flex items-center justify-between backdrop-blur-md">
        {/* Brand & State */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="relative w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm shadow-cyan-500/20">
              <span className="font-hud font-bold text-xs tracking-wider">J</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="text-xs font-hud font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                <span>JARVIS M.V.</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="capitalize">{settings.personality}</span>
                <span>•</span>
                <span>{deviceInfo.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Center / Right Telemetry & Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Selector Trigger */}
          <button
            onClick={() => {
              if (settings.soundFX) soundEffects.playPing('click');
              setShowModeModal(true);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
              settings.activeMode === 'deep-thought'
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                : settings.activeMode === 'live-recon'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : settings.activeMode === 'combat'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
                : settings.activeMode === 'stealth'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
            }`}
            title="Switch Operational Mode"
          >
            {settings.activeMode === 'deep-thought' && <Brain className="w-3 h-3 text-purple-400" />}
            {settings.activeMode === 'live-recon' && <Globe className="w-3 h-3 text-emerald-400" />}
            {settings.activeMode === 'combat' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
            {settings.activeMode === 'stealth' && <Radio className="w-3 h-3 text-amber-400" />}
            {settings.activeMode === 'tactical' && <Zap className="w-3 h-3 text-cyan-400" />}
            <span className="uppercase font-bold">
              {settings.activeMode === 'deep-thought'
                ? 'THINK'
                : settings.activeMode === 'live-recon'
                ? 'RECON'
                : settings.activeMode === 'combat'
                ? 'WAR'
                : settings.activeMode === 'stealth'
                ? 'STEALTH'
                : 'HUD'}
            </span>
          </button>

          {/* Lite Mode Toggle badge */}
          <button
            onClick={toggleLiteMode}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
              settings.liteMode
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Lite Mode (Optimized for 1GB RAM on Samsung Galaxy A2 Core)"
          >
            {settings.liteMode ? 'LITE 1GB' : 'FULL HUD'}
          </button>

          {/* Battery Status */}
          {deviceInfo.batteryLevel !== null && (
            <div
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-[10px] font-mono text-slate-300"
              title={`Device Battery: ${deviceInfo.batteryLevel}%`}
            >
              {deviceInfo.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{deviceInfo.batteryLevel}%</span>
            </div>
          )}

          {/* Online / Offline */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              deviceInfo.isOnline
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-600/50 animate-pulse'
            }`}
            title={deviceInfo.isOnline ? 'Network Connected' : 'Offline Mode Active'}
          >
            {deviceInfo.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Drawer Menu Button */}
          <button
            onClick={() => {
              if (settings.soundFX) soundEffects.playPing('click');
              setDrawerOpen(!drawerOpen);
            }}
            className="p-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 transition"
            aria-label="Toggle Systems Menu"
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Systems Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs h-full bg-gray-950 border-l border-cyan-500/30 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-sm text-cyan-300">SYSTEM ARCHIVE</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hardware Profile Banner */}
              <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Device Profile</div>
                <div className="font-semibold text-slate-200">Samsung Galaxy A2 Core</div>
                <div className="text-slate-400 text-[10px]">Android 8.1 • 1 GB RAM • ARMv7</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-cyan-400">
                  <span>Engine: {settings.liteMode ? 'Lite Mode (Active)' : 'Full HUD'}</span>
                  <span>{deviceInfo.estimatedRam}</span>
                </div>
              </div>

              {/* Navigation List */}
              <div className="space-y-1">
                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition font-mono ${
                        isActive
                          ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200'
                          : 'hover:bg-slate-900/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          isActive ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-cyan-400 border border-cyan-900/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom drawer footer */}
            <div className="pt-4 border-t border-cyan-500/20 text-center font-mono text-[10px] text-slate-500">
              JARVIS M.V. v2.5.0 • Personal AI Companion
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 hud-panel border-t border-cyan-500/20 px-2 py-1.5 flex items-center justify-around backdrop-blur-lg">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-sm shadow-cyan-500/40 text-cyan-300'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[10px] font-hud tracking-wide mt-0.5 ${isActive ? 'font-bold text-cyan-300' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>
      <ModeSelectorModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        settings={settings}
        onSelectMode={(mode) => onUpdateSettings({ activeMode: mode })}
      />
    </>
  );
};
