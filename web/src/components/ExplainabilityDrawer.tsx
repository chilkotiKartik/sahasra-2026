import React from 'react';
import { X, ShieldCheck, Cpu, FileText, BarChart3, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ForensicScanReveal, ForensicScramble } from './ForensicScanReveal';

export interface CitationData {
  title: string;
  category: string;
  fir_citations: string[];
  model_source?: string;
  shap_features?: { feature: string; weight: number }[];
  metadata?: Record<string, any>;
}

interface ExplainabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: CitationData | null;
}

export const ExplainabilityDrawer: React.FC<ExplainabilityDrawerProps> = ({ isOpen, onClose, data }) => {
  const { t } = useLanguage();

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[5000] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-navy-900 border-l border-navy-700 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
          <ForensicScanReveal active={isOpen}>
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-navy-700 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                      {t('Explainability & Citation Audit', 'ಎಕ್ಸ್‌ಪ್ಲೇನಬಿಲಿಟಿ ಮತ್ತು ಸಾಕ್ಷ್ಯ ಆಡಿಟ್')}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">SAHASRA Provenance Engine</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target Item Summary */}
              <div className="p-4 bg-navy-950 rounded-xl border border-navy-700 space-y-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase text-[10px]">
                  {data.category}
                </span>
                <h4 className="font-bold text-sm text-slate-100 mt-1">{data.title}</h4>
              </div>

              {/* Section 1: Source Police FIR Citations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{t('Source Police FIR Citations:', 'ಮೂಲ ಪೊಲೀಸ್ ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆಗಳು:')}</span>
                </h4>

                <div className="space-y-1.5">
                  {data.fir_citations && data.fir_citations.length > 0 ? (
                    data.fir_citations.map((fir) => (
                      <div
                        key={fir}
                        className="p-2.5 bg-navy-950 rounded-lg border border-navy-800 flex items-center justify-between text-xs font-mono text-emerald-400 font-bold hover:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        <span>📜 <ForensicScramble text={fir} /></span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No FIR citations bound to this metric.</p>
                  )}
                </div>
              </div>

            {/* Section 2: AI Model Provenance */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>{t('AI Model & Version:', 'ಎಐ ಮಾದರಿ ಮತ್ತು ಆವೃತ್ತಿ:')}</span>
              </h4>

              <div className="p-3 bg-navy-950 rounded-lg border border-navy-800 text-xs font-mono text-blue-300 font-bold">
                {data.model_source || 'ST-DBSCAN Cluster Model v2.4 (Catalyst QuickML)'}
              </div>
            </div>

            {/* Section 3: SHAP Feature Attribution Weights */}
            {data.shap_features && data.shap_features.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>{t('SHAP Feature Attribution Weights:', 'ಅಂಶಗಳ ತೂಕ:')}</span>
                </h4>

                <div className="space-y-2 p-3 bg-navy-950 rounded-lg border border-navy-800">
                  {data.shap_features.map((feat) => {
                    const pct = Math.round(feat.weight * 100);
                    return (
                      <div key={feat.feature} className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>{feat.feature}</span>
                          <span className="font-mono text-amber-400 font-bold">+{pct}%</span>
                        </div>
                        <div className="w-full bg-navy-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </ForensicScanReveal>

          <div className="pt-4 border-t border-navy-800 text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              Verified by KSP Digital Intelligence & SHA-256 Audit Trail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
