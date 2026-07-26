import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, BadgeCheck, Lock, AlertCircle, Loader2, Info, Fingerprint, CheckCircle2 } from 'lucide-react';
import { ROLE_DEFAULT_ROUTES } from '@shared/types';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

type BioState = 'idle' | 'checking' | 'awaiting' | 'success' | 'error';

export const Login: React.FC = () => {
  const { login, applySession, loading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [badge, setBadge] = useState('SP-8821');
  const [password, setPassword] = useState('Ksp#2026');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WebAuthn support + state
  const [bioSupported, setBioSupported] = useState(false);
  const [bioState, setBioState] = useState<BioState>('idle');
  const [bioMsg, setBioMsg] = useState('');

  useEffect(() => {
    // Feature-detect a REAL platform authenticator before offering biometrics.
    (async () => {
      if (typeof window.PublicKeyCredential === 'undefined') return;
      try {
        const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBioSupported(ok);
      } catch {
        setBioSupported(false);
      }
    })();
  }, []);

  const goHome = (role?: string) => {
    const r = (role && (ROLE_DEFAULT_ROUTES as any)[role]) || '/command-center';
    navigate(r);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = await login(badge, password);
    if (res.success && res.role) {
      goHome(res.role);
    } else {
      setErrorMessage(res.message || 'Invalid Credentials');
    }
  };

  const handleBiometric = async () => {
    setErrorMessage(null);
    setBioState('checking');
    setBioMsg('Preparing device verification…');
    const B = badge.trim().toUpperCase();
    try {
      // Is a credential already registered for this badge on the server?
      const status = await fetch(`/api/catalyst/webauthn/status?badge=${encodeURIComponent(B)}`).then((r) => r.json());

      if (!status.registered) {
        // First-time setup: register a real platform-authenticator credential.
        setBioState('awaiting');
        setBioMsg('First-time setup — confirm on your device to enrol biometrics…');
        const opts = await fetch('/api/catalyst/webauthn/register/options', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badge: B })
        }).then((r) => r.json());
        if (!opts.success) throw new Error(opts.message || 'Could not start enrolment');
        const attResp = await startRegistration(opts.options); // triggers the OS biometric prompt
        const verify = await fetch('/api/catalyst/webauthn/register/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badge: B, response: attResp })
        }).then((r) => r.json());
        if (!verify.verified) throw new Error('Enrolment could not be verified');
      }

      // Authenticate with the platform authenticator.
      setBioState('awaiting');
      setBioMsg('Awaiting device verification…');
      const authOpts = await fetch('/api/catalyst/webauthn/auth/options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badge: B })
      }).then((r) => r.json());
      if (!authOpts.success) throw new Error(authOpts.message || 'Could not start verification');
      const asseResp = await startAuthentication(authOpts.options); // OS biometric prompt
      const verify = await fetch('/api/catalyst/webauthn/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badge: B, response: asseResp })
      }).then((r) => r.json());
      if (!verify.success || !verify.verified || !verify.session) throw new Error('Biometric verification failed');

      setBioState('success');
      setBioMsg('Verified — signing you in.');
      const role = applySession(verify.session);
      setTimeout(() => goHome(role), 600);
    } catch (e: any) {
      setBioState('error');
      const m = e?.name === 'NotAllowedError' ? 'Verification cancelled or timed out.' : (e?.message || 'Biometric verification failed.');
      setBioMsg(m);
      setErrorMessage(m + ' You can still sign in with your password.');
      setTimeout(() => setBioState('idle'), 2500);
    }
  };

  const handleQuickFill = (demoBadge: string) => {
    setBadge(demoBadge);
    setPassword('Ksp#2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F3864_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md ops-card p-8 z-10 shadow-ops-panel border border-navy-600">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-ops-glow mb-3">
            <Shield className="w-8 h-8 text-navy-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100 uppercase font-outfit">
            SAHASRA OPS LOGIN
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('Karnataka State Police Intelligence Portal', 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಕ್ರೈಮ್ ಪೋರ್ಟಲ್')}
          </p>
        </div>

        {/* Error State Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Single Clean Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('Badge / Service ID', 'ಬ್ಯಾಡ್ಜ್ ಸಂಖ್ಯೆ')}
            </label>
            <div className="relative">
              <BadgeCheck className="w-5 h-5 absolute left-3 top-2.5 text-navy-400" />
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                placeholder="e.g. SP-8821"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('Secure PIN / Password', 'ರಹಸ್ಯ ಪಾಸವರ್ಡ್')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-navy-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold uppercase tracking-wider rounded-lg shadow-ops-glow transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('Authenticating Gateway...', 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...')}</span>
              </>
            ) : (
              <span>{t('Authenticate & Enter Command Center', 'ಪ್ರವೇಶಿಸಿ')}</span>
            )}
          </button>
        </form>

        {/* Real WebAuthn biometric option — only shown if a platform authenticator exists */}
        {bioSupported && (
          <div className="mt-4">
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-navy-700" />
              <span className="text-[10px] uppercase text-slate-500 font-semibold">or</span>
              <div className="flex-1 h-px bg-navy-700" />
            </div>

            {bioState === 'idle' || bioState === 'error' ? (
              <button
                onClick={handleBiometric}
                className="w-full py-3 bg-navy-900 hover:bg-navy-800 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Fingerprint className="w-5 h-5" />
                <span>{t('Verify with Biometrics', 'ಬಯೋಮೆಟ್ರಿಕ್ ಪರಿಶೀಲನೆ')}</span>
              </button>
            ) : (
              <div className={`w-full py-4 rounded-lg border flex flex-col items-center justify-center gap-2 ${bioState === 'success' ? 'bg-emerald-950/40 border-emerald-600/50' : 'bg-navy-900 border-amber-500/40'}`}>
                {bioState === 'success' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : (
                  <div className="relative">
                    <Shield className="w-7 h-7 text-amber-400" />
                    <span className="absolute inset-0 rounded-full animate-ping bg-amber-400/30" />
                  </div>
                )}
                <span className={`text-xs font-mono ${bioState === 'success' ? 'text-emerald-300' : 'text-amber-300'}`}>{bioMsg}</span>
                <span className="text-[10px] text-slate-500">Native OS prompt — SAHASRA never sees your biometric</span>
              </div>
            )}
          </div>
        )}

        {/* Demo Roles Shortcut Fillers */}
        <div className="mt-6 pt-4 border-t border-navy-700 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('Demo KSP Officers (Password: Ksp#2026):', 'ಡೆಮೊ ಅಧಿಕಾರಿಗಳು:')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickFill('SP-8821')}
              className="p-2 bg-navy-900 hover:bg-navy-800 border border-navy-700 rounded text-left text-amber-300 font-mono"
            >
              SP-8821 <span className="text-[10px] text-slate-400 block font-sans">(District SP)</span>
            </button>
            <button
              onClick={() => handleQuickFill('ANALYST-104')}
              className="p-2 bg-navy-900 hover:bg-navy-800 border border-navy-700 rounded text-left text-blue-300 font-mono"
            >
              ANALYST-104 <span className="text-[10px] text-slate-400 block font-sans">(Crime Analyst)</span>
            </button>
            <button
              onClick={() => handleQuickFill('IO-402')}
              className="p-2 bg-navy-900 hover:bg-navy-800 border border-navy-700 rounded text-left text-emerald-300 font-mono"
            >
              IO-402 <span className="text-[10px] text-slate-400 block font-sans">(Investigating Off.)</span>
            </button>
            <button
              onClick={() => handleQuickFill('AKKA-55')}
              className="p-2 bg-navy-900 hover:bg-navy-800 border border-navy-700 rounded text-left text-rose-300 font-mono"
            >
              AKKA-55 <span className="text-[10px] text-slate-400 block font-sans">(Akka Pade Off.)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between items-center text-xs text-slate-400">
          <span>KSP Catalyst Gateway v3.2</span>
          <button
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            className="text-amber-400 hover:underline font-semibold"
          >
            {lang === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
          </button>
        </div>
      </div>
    </div>
  );
};
