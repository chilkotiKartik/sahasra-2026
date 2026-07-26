import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrefersReducedMotion } from '../styles/motion';

interface CountUpKPIProps {
  value: number;
  label: string;
  subText?: string;
  trendPct?: number;
  isPositiveGood?: boolean;
  onClick?: () => void;
  drillLabel?: string;
}

export const CountUpKPI: React.FC<CountUpKPIProps> = ({
  value,
  label,
  subText,
  trendPct,
  isPositiveGood = false,
  onClick,
  drillLabel
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [showTrend, setShowTrend] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value);
      setShowTrend(true);
      return;
    }

    const duration = 800; // ms
    const steps = 30;
    const stepDuration = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(value * easeOut);
      setDisplayValue(current);

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
        setTimeout(() => setShowTrend(true), 150); // Delayed trend arrow reveal
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, prefersReduced]);

  const isUp = trendPct !== undefined && trendPct > 0;
  const isGood = isPositiveGood ? isUp : !isUp;

  const interactive = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick!();
              }
            }
          : undefined
      }
      className={`ops-card p-5 border border-navy-600 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-ops-panel transition-all ${
        interactive
          ? 'cursor-pointer hover:border-amber-500/70 hover:bg-navy-900/60 focus:outline-none focus:ring-2 focus:ring-amber-500/60'
          : ''
      }`}
    >
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>

      <div className="flex items-baseline space-x-3">
        <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          {displayValue.toLocaleString()}
        </span>

        {trendPct !== undefined && showTrend && (
          <div
            className={`flex items-center space-x-1 text-xs font-bold font-mono transition-all transform translate-y-0 opacity-100 ${
              isGood ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(trendPct)}%</span>
          </div>
        )}
      </div>

      {subText && <p className="text-[11px] text-slate-500">{subText}</p>}
      {interactive && (
        <p className="text-[10px] font-mono text-amber-500/80 uppercase tracking-wide">
          {drillLabel || 'Click to drill down →'}
        </p>
      )}
    </div>
  );
};
