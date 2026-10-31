import React, { useState } from 'react';
import {
  Cpu,
  Check,
  UserCheck,
  Smile,
  GraduationCap,
  Sparkles,
  Compass,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { AppSettings, PersonalityId } from '../../types';
import { soundEffects } from '../../services/speech';

interface PersonalityScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const PersonalityScreen: React.FC<PersonalityScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [customText, setCustomText] = useState(settings.customPersonalityPrompt);

  const personas: Array<{
    id: PersonalityId;
    title: string;
    icon: React.FC<{ className?: string }>;
    tag: string;
    desc: string;
    quote: string;
  }> = [
    {
      id: 'jarvis',
      title: 'Futuristic JARVIS',
      icon: Cpu,
      tag: 'DEFAULT / STARK HUD',
      desc: 'Sophisticated, composed, highly articulate, addressing you as Sir with concise tactical flair.',
      quote: '"Always at your service, Sir. Diagnostics complete."',
    },
    {
      id: 'professional',
      title: 'Professional Executive',
      icon: Briefcase,
      tag: 'PRODUCTIVITY',
      desc: 'Polished, structured, highly efficient assistant focused on business and task completion.',
      quote: '"Here is the structured breakdown of your action items."',
    },
    {
      id: 'friendly',
      title: 'Friendly Companion',
      icon: Smile,
      tag: 'WARM & EMPATHIC',
      desc: 'Warm, supportive, positive conversation partner who listens and gives encouraging guidance.',
      quote: '"I am right here with you! How are you feeling today?"',
    },
    {
      id: 'humorous',
      title: 'Humorous & Witty',
      icon: Sparkles,
      tag: 'CLEVER & LIGHTHEARTED',
      desc: 'Full of smart banter, puns, and pop-culture references while still delivering real intelligence.',
      quote: '"Well, that went smoother than Tony testing the Mark II suit!"',
    },
    {
      id: 'scientific',
      title: 'Scientific & STEM',
      icon: Compass,
      tag: 'EMPIRICAL RIGOR',
      desc: 'Prioritizes first-principles physics, mathematical precision, and academic depth.',
      quote: '"By applying Newton\'s laws to the kinematic equations..."',
    },
    {
      id: 'calm',
      title: 'Calm & Mindful',
      icon: UserCheck,
      tag: 'SERENE & FOCUSED',
      desc: 'Zen-like calm, grounding your thoughts and helping declutter mental overload.',
      quote: '"Let us pause and tackle one priority at a time with calm clarity."',
    },
    {
      id: 'study',
      title: 'Study Buddy & Tutor',
      icon: GraduationCap,
      tag: 'ACADEMIC MASTERY',
      desc: 'Breaks complex concepts into simple analogies, quizzes you, and reinforces learning.',
      quote: '"Let\'s break this concept down with a simple real-world analogy."',
    },
    {
      id: 'custom',
      title: 'Custom Personality',
      icon: HelpCircle,
      tag: 'USER-DEFINED',
      desc: 'Craft your own exact persona, directives, and tone of voice.',
      quote: '"Operating under your custom neural persona guidelines."',
    },
  ];

  const handleSelectPersona = (id: PersonalityId) => {
    if (settings.soundFX) soundEffects.playPing('click');
    onUpdateSettings({ personality: id });
  };

  const handleSaveCustom = () => {
    onUpdateSettings({
      personality: 'custom',
      customPersonalityPrompt: customText.trim(),
    });
    if (settings.soundFX) soundEffects.playPing('complete');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-4 pb-20 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between hud-panel rounded-2xl px-4 py-2.5 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-hud font-bold text-cyan-200 tracking-wider">
              NEURAL PERSONALITY MATRIX
            </h2>
            <div className="text-[10px] font-mono text-slate-400">
              Customize behavior, tone, and conversational dynamics
            </div>
          </div>
        </div>
      </div>

      {/* Persona cards */}
      <div className="space-y-2.5">
        {personas.map((p) => {
          const Icon = p.icon;
          const isSelected = settings.personality === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectPersona(p.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'hud-panel border-cyan-500/15 hover:border-cyan-500/40 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-xl ${
                      isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-cyan-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-hud font-bold text-slate-100">{p.title}</div>
                    <div className="text-[9px] font-mono text-cyan-400">{p.tag}</div>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">{p.desc}</p>
              <div className="mt-2 text-[11px] text-cyan-300/80 italic font-sans border-l-2 border-cyan-500/40 pl-2">
                {p.quote}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Persona Editor */}
      {settings.personality === 'custom' && (
        <div className="hud-panel rounded-2xl p-4 border border-cyan-500/30 space-y-3 animate-fade-in">
          <label className="text-xs font-hud font-bold text-cyan-200">
            CUSTOM SYSTEM DIRECTIVES
          </label>
          <p className="text-[10px] text-slate-400 font-sans">
            Define specific behavioral traits, knowledge domains, languages, or tone constraints.
          </p>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. You are a bilingual physics researcher who explains quantum optics in Bengali and English..."
            rows={4}
            className="w-full p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleSaveCustom}
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs"
          >
            Apply Custom Personality Matrix
          </button>
        </div>
      )}
    </div>
  );
};
