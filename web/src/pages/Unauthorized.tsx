import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { ROLE_DEFAULT_ROUTES } from '@shared/types';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (user && user.role) {
      const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || '/command-center';
      navigate(defaultRoute);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="ops-card p-8 max-w-lg border border-rose-600/40 shadow-ops-panel space-y-4">
        <div className="inline-flex p-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-12 h-12 stroke-[2.2]" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider font-outfit">
          {t('Access Restricted — Role Not Authorized', 'ಪೂರ್ವಾನುಮತಿ ಕಡ್ಡಾಯ — ಸೀಮಿತ ಪ್ರವೇಶ')}
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t(
            'Your assigned role scope does not have permission to view or execute actions on this operational screen. Every unauthorized access attempt is cryptographically logged.',
            'ನಿಮ್ಮ ಅಧಿಕೃತ ಪಾತ್ರಕ್ಕೆ ಈ ಪುಟದ ಪ್ರವೇಶ ಹಕ್ಕಿಲ್ಲ. ಈ ಪ್ರಯತ್ನವನ್ನು ಲಾಗ್ ಮಾಡಲಾಗಿದೆ.'
          )}
        </p>

        {user && (
          <div className="p-3 bg-navy-950 rounded-lg border border-navy-700 text-xs font-mono text-slate-300">
            <p><span className="text-slate-500">Active Officer:</span> {user.name} ({user.badgeNumber})</p>
            <p><span className="text-slate-500">Current Scope:</span> <span className="text-amber-400 font-bold uppercase">{user.role.replace('_', ' ')}</span></p>
          </div>
        )}

        <button
          onClick={handleReturn}
          className="w-full py-2.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Return to Authorized Workspace', 'ನಿಮ್ಮ ನಿಯೋಜಿತ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ')}
        </button>
      </div>
    </div>
  );
};
