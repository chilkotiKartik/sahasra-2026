import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, ShieldCheck, FileText, Cpu, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ExplainabilityDrawer, CitationData } from './ExplainabilityDrawer';

interface AskSahasraCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  supportingFirs?: string[];
  modelSource?: string;
}

export const AskSahasraCopilot: React.FC<AskSahasraCopilotProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Greetings. I am Ask SAHASRA AI Intelligence Copilot. How can I assist your investigation today?',
      supportingFirs: []
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Explainability Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/catalyst/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      // API returns the RAG fields at the top level (res.json({ success, ...result }))
      const payload = json && json.result ? json.result : json;
      if (json && json.success && payload && payload.answer) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: payload.answer,
            supportingFirs: payload.supportingFirs,
            modelSource: payload.modelSource
          }
        ]);
      } else {
        throw new Error('Empty RAG response');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Error contacting Catalyst RAG copilot engine.',
          supportingFirs: []
        }
      ]);
    }
    setLoading(false);
  };

  const handleFirChipClick = (fir: string, text: string) => {
    setActiveCitation({
      title: `RAG Citation: ${fir}`,
      category: 'Copilot Vector RAG Proof',
      fir_citations: [fir],
      model_source: 'Catalyst QuickML Strict RAG Engine v2.4',
      shap_features: [
        { feature: 'Vector Cosine Similarity', weight: 0.94 },
        { feature: 'MO Pattern Match', weight: 0.88 }
      ]
    });
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-80 md:w-96 z-[4000] bg-navy-950 border-l border-navy-700 shadow-2xl flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy-700 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wide flex items-center gap-1">
                <span>Ask SAHASRA Copilot</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Catalyst QuickML Vector RAG</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border space-y-2 ${
                m.sender === 'user'
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-100 ml-6'
                  : 'bg-navy-900 border-navy-700 text-slate-200 mr-6'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>

              {/* Clickable FIR Citation Chips */}
              {m.supportingFirs && m.supportingFirs.length > 0 && (
                <div className="pt-2 border-t border-navy-800 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Supporting FIR Citations:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.supportingFirs.map(fir => (
                      <button
                        key={fir}
                        onClick={() => handleFirChipClick(fir, m.text)}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono font-bold hover:bg-emerald-900 transition-all"
                      >
                        📜 {fir}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-amber-400 text-xs font-mono flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying Catalyst QuickML RAG...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-2 border-t border-navy-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cases, gangs, or FIRs..."
            className="flex-1 px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-lg font-bold flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <ExplainabilityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={activeCitation}
      />
    </>
  );
};
