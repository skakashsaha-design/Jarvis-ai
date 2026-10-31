import React, { useEffect, useRef } from 'react';
import { CoreState, ThemeId, OperationalMode } from '../types';

interface ArcReactorCanvasProps {
  state: CoreState;
  theme: ThemeId;
  liteMode: boolean;
  size?: number;
  mode?: OperationalMode;
  onClick?: () => void;
}

export const ArcReactorCanvas: React.FC<ArcReactorCanvasProps> = ({
  state,
  theme,
  liteMode,
  size = 280,
  mode = 'tactical',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle1 = 0;
    let angle2 = 0;
    let pulse = 0;
    let pulseDir = 1;

    // Theme and Mode color palette
    const getColors = () => {
      if (state === 'error') {
        return { primary: '#ef4444', secondary: '#991b1b', core: '#ffffff', glow: 'rgba(239, 68, 68, 0.4)' };
      }
      if (state === 'offline') {
        return { primary: '#f59e0b', secondary: '#78350f', core: '#fef3c7', glow: 'rgba(245, 158, 11, 0.3)' };
      }

      // Mode-specific color overrides
      if (mode === 'combat') {
        return { primary: '#ef4444', secondary: '#fbbf24', core: '#ffffff', glow: 'rgba(239, 68, 68, 0.5)' };
      }
      if (mode === 'deep-thought') {
        return { primary: '#c084fc', secondary: '#6b21a8', core: '#ffffff', glow: 'rgba(192, 132, 252, 0.5)' };
      }
      if (mode === 'live-recon') {
        return { primary: '#10b981', secondary: '#0284c7', core: '#ffffff', glow: 'rgba(16, 185, 129, 0.5)' };
      }
      if (mode === 'stealth') {
        return { primary: '#f59e0b', secondary: '#451a03', core: '#fef3c7', glow: 'rgba(245, 158, 11, 0.3)' };
      }

      switch (theme) {
        case 'stark-gold':
          return { primary: '#fbbf24', secondary: '#dc2626', core: '#ffffff', glow: 'rgba(251, 191, 36, 0.4)' };
        case 'matrix-emerald':
          return { primary: '#10b981', secondary: '#065f46', core: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' };
        case 'cyber-purple':
          return { primary: '#c084fc', secondary: '#6b21a8', core: '#ffffff', glow: 'rgba(192, 132, 252, 0.4)' };
        case 'crimson-alert':
          return { primary: '#f87171', secondary: '#991b1b', core: '#ffffff', glow: 'rgba(239, 68, 68, 0.4)' };
        case 'arc-blue':
          return { primary: '#3b82f6', secondary: '#1e3a8a', core: '#ffffff', glow: 'rgba(59, 130, 246, 0.4)' };
        case 'classic':
        default:
          return { primary: '#00e5ff', secondary: '#0284c7', core: '#ffffff', glow: 'rgba(0, 229, 255, 0.4)' };
      }
    };

    // Particles for quantum cloud
    const particleCount = liteMode ? 10 : 32;
    const particles = Array.from({ length: particleCount }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      dist: 30 + Math.random() * 85,
      speed: (0.005 + Math.random() * 0.015) * (Math.random() > 0.5 ? 1 : -1),
      size: 1.5 + Math.random() * 2,
    }));

    let lastTime = performance.now();
    const targetInterval = liteMode ? 1000 / 30 : 1000 / 60; // 30 FPS for 1GB RAM Lite Mode

    const render = (now: number) => {
      const elapsed = now - lastTime;
      if (elapsed < targetInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastTime = now - (elapsed % targetInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = getColors();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Dynamic speeds based on state
      let speedMult = 1;
      if (state === 'thinking') speedMult = 2.5;
      if (state === 'processing') speedMult = 4.0;
      if (state === 'listening') speedMult = 1.6;
      if (state === 'speaking') speedMult = 2.0;

      angle1 += 0.012 * speedMult;
      angle2 -= 0.018 * speedMult;

      pulse += 0.03 * pulseDir * speedMult;
      if (pulse > 1) pulseDir = -1;
      if (pulse < 0) pulseDir = 1;

      // 1. Outer Tech Ring with Segmented Spokes
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle1);

      ctx.lineWidth = liteMode ? 2 : 3;
      ctx.strokeStyle = colors.primary;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      // Mechanical segmented teeth
      const segments = liteMode ? 8 : 16;
      for (let i = 0; i < segments; i++) {
        const segAngle = (i * Math.PI * 2) / segments;
        const x1 = Math.cos(segAngle) * (size * 0.38);
        const y1 = Math.sin(segAngle) * (size * 0.38);
        const x2 = Math.cos(segAngle) * (size * 0.44);
        const y2 = Math.sin(segAngle) * (size * 0.44);

        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? colors.primary : colors.secondary;
        ctx.lineWidth = 3;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Middle Ring with Counter Rotation
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle2);

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.30, 0, Math.PI * 2);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Triangle core locks
      const triangles = 3;
      for (let i = 0; i < triangles; i++) {
        const tAngle = (i * Math.PI * 2) / triangles;
        const tx = Math.cos(tAngle) * (size * 0.28);
        const ty = Math.sin(tAngle) * (size * 0.28);
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Audio/Energy Waveform if speaking or listening
      if (state === 'speaking' || state === 'listening') {
        ctx.save();
        ctx.translate(cx, cy);
        const bars = 24;
        for (let i = 0; i < bars; i++) {
          const bAngle = (i * Math.PI * 2) / bars;
          const waveHeight = Math.sin(now * 0.01 + i) * 12 + 14;
          const bx1 = Math.cos(bAngle) * (size * 0.22);
          const by1 = Math.sin(bAngle) * (size * 0.22);
          const bx2 = Math.cos(bAngle) * (size * 0.22 + waveHeight);
          const by2 = Math.sin(bAngle) * (size * 0.22 + waveHeight);

          ctx.strokeStyle = colors.primary;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx1, by1);
          ctx.lineTo(bx2, by2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Quantum particle cloud (only if not error/offline)
      if (state !== 'error' && state !== 'offline') {
        ctx.save();
        ctx.translate(cx, cy);
        particles.forEach((p) => {
          p.angle += p.speed * speedMult;
          const px = Math.cos(p.angle) * p.dist * (size / 280);
          const py = Math.sin(p.angle) * p.dist * (size / 280);

          ctx.fillStyle = colors.primary;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 5. Inner Arc Core
      ctx.save();
      ctx.translate(cx, cy);

      const coreRadius = (size * 0.14) + (pulse * (size * 0.02));
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
      gradient.addColorStop(0, colors.core);
      gradient.addColorStop(0.4, colors.primary);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing center pip
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, theme, liteMode, size]);

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group"
      style={{ width: size, height: size }}
      title="JARVIS Arc Reactor Core - Tap to interact"
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="transition-transform duration-300 group-hover:scale-105 active:scale-95"
      />
      {/* State Badge overlay */}
      <div className="absolute -bottom-2 px-3 py-0.5 rounded-full text-[10px] tracking-widest font-mono uppercase font-bold border hud-panel backdrop-blur-md">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
            state === 'listening'
              ? 'bg-cyan-400 animate-ping'
              : state === 'thinking' || state === 'processing'
              ? 'bg-blue-400 animate-pulse'
              : state === 'speaking'
              ? 'bg-emerald-400 animate-bounce'
              : state === 'error'
              ? 'bg-rose-500 animate-pulse'
              : state === 'offline'
              ? 'bg-amber-500'
              : 'bg-cyan-500'
          }`}
        />
        {state}
      </div>
    </div>
  );
};
