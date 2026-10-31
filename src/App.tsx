/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ScreenId,
  CoreState,
  AppSettings,
  ChatMessage,
  MemoryItem,
} from './types';
import { storageService } from './services/storage';
import { soundEffects, voiceSynthesizer } from './services/speech';
import { useDeviceStatus } from './hooks/useDeviceStatus';

// Navigation & Screens
import { NavigationHUD } from './components/NavigationHUD';
import { SplashScreen } from './components/Screens/SplashScreen';
import { DashboardScreen } from './components/Screens/DashboardScreen';
import { ChatScreen } from './components/Screens/ChatScreen';
import { VoiceScreen } from './components/Screens/VoiceScreen';
import { VisionScreen } from './components/Screens/VisionScreen';
import { MemoryScreen } from './components/Screens/MemoryScreen';
import { HistoryScreen } from './components/Screens/HistoryScreen';
import { CustomizationScreen } from './components/Screens/CustomizationScreen';
import { ProvidersScreen } from './components/Screens/ProvidersScreen';
import { PersonalityScreen } from './components/Screens/PersonalityScreen';
import { ToolsScreen } from './components/Screens/ToolsScreen';
import { PrivacyScreen } from './components/Screens/PrivacyScreen';
import { AboutScreen } from './components/Screens/AboutScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [coreState, setCoreState] = useState<CoreState>('idle');
  const [isLoading, setIsLoading] = useState(false);

  // Storage states
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storageService.getMemories());
  const [chats, setChats] = useState<ChatMessage[]>(() => storageService.getChats());

  // Hardware & network telemetry
  const deviceInfo = useDeviceStatus();

  // Save settings when changed
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  // Memory handlers
  const handleAddMemory = (category: MemoryItem['category'], title: string, content: string) => {
    const newItem: MemoryItem = {
      id: `mem_${Date.now()}`,
      category,
      title,
      content,
      updatedAt: Date.now(),
    };
    const updated = [newItem, ...memories];
    setMemories(updated);
    storageService.saveMemories(updated);
  };

  const handleUpdateMemory = (id: string, title: string, content: string) => {
    const updated = memories.map((m) =>
      m.id === id ? { ...m, title, content, updatedAt: Date.now() } : m
    );
    setMemories(updated);
    storageService.saveMemories(updated);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    storageService.saveMemories(updated);
  };

  const handleClearMemories = () => {
    setMemories([]);
    storageService.saveMemories([]);
  };

  const handleImportMemories = (newItems: MemoryItem[]) => {
    setMemories(newItems);
    storageService.saveMemories(newItems);
  };

  // Chat message transmission
  const handleSendMessage = async (text: string, imageUrl?: string, isVoice: boolean = false) => {
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
      imageUrl,
      isVoice,
    };

    const newChatList = [...chats, userMsg];
    setChats(newChatList);
    storageService.saveChats(newChatList);

    setIsLoading(true);
    setCoreState('thinking');

    try {
      // Build memory context string if enabled
      const memorySnippets = settings.memoryEnabled
        ? memories.map((m) => `${m.title}: ${m.content}`)
        : [];

      // If user uploaded an image, route through multimodal vision endpoint
      if (imageUrl) {
        const visionRes = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageUrl,
            mimeType: 'image/jpeg',
            prompt: text,
            taskType: 'general',
            apiKey: settings.customGeminiKey || undefined,
          }),
        });

        if (!visionRes.ok) throw new Error('Visual reconnaissance failed');
        const visionData = await visionRes.json();

        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          text: visionData.analysis,
          timestamp: Date.now(),
          provider: 'gemini-vision',
          model: 'gemini-3.8-flash',
        };

        const updated = [...newChatList, assistantMsg];
        setChats(updated);
        storageService.saveChats(updated);
        setCoreState('idle');

        if (settings.autoSpeak || isVoice) {
          setCoreState('speaking');
          voiceSynthesizer.speak(assistantMsg.text, {
            lang: settings.voiceLang,
            gender: settings.voiceGender,
            speed: settings.voiceSpeed,
            pitch: settings.voicePitch,
            volume: settings.voiceVolume,
            onEnd: () => setCoreState('idle'),
            onError: () => setCoreState('idle'),
          });
        }
        return;
      }

      // Normal chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chats.slice(-6).map((c) => ({ role: c.role, text: c.text })),
          personality: settings.personality,
          customPrompt: settings.customPersonalityPrompt,
          memories: memorySnippets,
          provider: settings.preferredProvider,
          apiKey:
            settings.preferredProvider === 'groq'
              ? settings.groqKey
              : settings.preferredProvider === 'openrouter'
              ? settings.openrouterKey
              : settings.customGeminiKey || undefined,
          modelName:
            settings.preferredProvider === 'gemini'
              ? settings.geminiModel
              : settings.preferredProvider === 'groq'
              ? settings.groqModel
              : settings.openrouterModel,
          webGrounding: settings.webGroundingEnabled,
          deepThinking: settings.deepThinkingEnabled,
          operationalMode: settings.activeMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI transmission failed');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: Date.now(),
        provider: data.provider,
        model: data.model,
        groundingSources: data.groundingSources,
        webSearchQueries: data.webSearchQueries,
      };

      const updated = [...newChatList, assistantMsg];
      setChats(updated);
      storageService.saveChats(updated);
      setCoreState('idle');

      if (settings.autoSpeak || isVoice) {
        setCoreState('speaking');
        voiceSynthesizer.speak(assistantMsg.text, {
          lang: settings.voiceLang,
          gender: settings.voiceGender,
          speed: settings.voiceSpeed,
          pitch: settings.voicePitch,
          volume: settings.voiceVolume,
          onEnd: () => setCoreState('idle'),
          onError: () => setCoreState('idle'),
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        text: `[JARVIS Diagnostic Notice]: Communication failed - ${err.message}. Please check connection or switch to Offline Protocol.`,
        timestamp: Date.now(),
      };
      const updated = [...newChatList, errMsg];
      setChats(updated);
      storageService.saveChats(updated);
      setCoreState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setChats([]);
    storageService.saveChats([]);
  };

  const handleDeleteMessage = (id: string) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    storageService.saveChats(updated);
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...chats].reverse().find((c) => c.role === 'user');
    if (lastUserMsg) {
      await handleSendMessage(lastUserMsg.text, lastUserMsg.imageUrl, lastUserMsg.isVoice);
    }
  };

  // Direct directive from Dashboard quick chips or voice
  const handleSendDirective = async (text: string) => {
    setCurrentScreen('chat');
    await handleSendMessage(text, undefined, true);
  };

  const handleClearAll = () => {
    setChats([]);
    setMemories([]);
  };

  // Dynamic Theme Styling
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'amoled-black':
        return 'bg-black text-slate-100';
      case 'arc-blue':
        return 'bg-[#020b18] text-slate-100';
      case 'stark-gold':
        return 'bg-[#120707] text-slate-100';
      case 'matrix-emerald':
        return 'bg-[#02120a] text-slate-100';
      case 'cyber-purple':
        return 'bg-[#0d0417] text-slate-100';
      case 'crimson-alert':
        return 'bg-[#150404] text-slate-100';
      case 'light-tech':
        return 'bg-[#060c18] text-slate-100';
      case 'classic':
      default:
        return 'bg-gray-950 text-slate-100';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} hud-grid-pattern relative flex flex-col font-sans transition-colors duration-300`}>
      {/* Initial Splash Screen */}
      {showSplash && (
        <SplashScreen
          onEnter={() => setShowSplash(false)}
          settings={settings}
        />
      )}

      {/* Persistent Navigation HUD Header & Bottom Bar */}
      <NavigationHUD
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        deviceInfo={deviceInfo}
      />

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto overflow-x-hidden">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            settings={settings}
            deviceInfo={deviceInfo}
            coreState={coreState}
            setCoreState={setCoreState}
            onNavigate={setCurrentScreen}
            onSendDirective={handleSendDirective}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            messages={chats}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onDeleteMessage={handleDeleteMessage}
            onRegenerate={handleRegenerate}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            coreState={coreState}
            setCoreState={setCoreState}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'voice' && (
          <VoiceScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            coreState={coreState}
            setCoreState={setCoreState}
            lastAssistantMessage={[...chats].reverse().find((c) => c.role === 'assistant')}
            onSendVoiceMessage={(text) => handleSendMessage(text, undefined, true)}
          />
        )}

        {currentScreen === 'vision' && (
          <VisionScreen
            settings={settings}
            coreState={coreState}
            setCoreState={setCoreState}
          />
        )}

        {currentScreen === 'memory' && (
          <MemoryScreen
            memories={memories}
            onAddMemory={handleAddMemory}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
            onClearMemories={handleClearMemories}
            onImportMemories={handleImportMemories}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            messages={chats}
            onClearHistory={handleClearChat}
            onDeleteMessage={handleDeleteMessage}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'customization' && (
          <CustomizationScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentScreen === 'providers' && (
          <ProvidersScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentScreen === 'personality' && (
          <PersonalityScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentScreen === 'tools' && (
          <ToolsScreen
            settings={settings}
            deviceInfo={deviceInfo}
          />
        )}

        {currentScreen === 'privacy' && (
          <PrivacyScreen
            onClearAll={handleClearAll}
          />
        )}

        {currentScreen === 'about' && (
          <AboutScreen />
        )}
      </main>
    </div>
  );
}
