import React, { useEffect, useState } from 'react';
import { MOTION_TOKENS, usePrefersReducedMotion } from '../styles/motion';

interface ForensicScrambleProps {
  text: string;
  className?: string;
}

export const ForensicScramble: React.FC<ForensicScrambleProps> = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplayText(text);
      return;
    }

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/#-';
    let frame = 0;
    const totalFrames = 10;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplayText(text);
        clearInterval(interval);
      } else {
        const scrambled = text
          .split('')
          .map((ch) => (ch === ' ' || ch === '/' || ch === '-' ? ch : chars[Math.floor(Math.random() * chars.length)]))
          .join('');
        setDisplayText(scrambled);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, prefersReduced]);

  return <span className={`font-mono transition-colors ${className}`}>{displayText}</span>;
};

interface ForensicScanRevealProps {
  children: React.ReactNode;
  active?: boolean;
}

export const ForensicScanReveal: React.FC<ForensicScanRevealProps> = ({ children, active = true }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced || !active) return <>{children}</>;

  return (
    <div className="relative overflow-hidden">
      {/* 2px Soft Amber Gradient Scan-Line Bar */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#F59E0B] z-20 animate-forensic-scan" />

      {/* Content Container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
