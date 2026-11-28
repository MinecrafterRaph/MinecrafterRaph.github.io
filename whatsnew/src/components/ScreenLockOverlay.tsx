import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, Eye, EyeOff, LogOut } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ScreenLockOverlayProps {
  isLocked: boolean;
  requiredPin: string;
  userName: string;
  userAvatar?: string;
  onUnlock: () => void;
  onLogout: () => void;
}

export const ScreenLockOverlay: React.FC<ScreenLockOverlayProps> = ({
  isLocked,
  requiredPin,
  userName,
  onUnlock,
  onLogout,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLocked) {
      setPinInput('');
      setError(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;

    // Check against required PIN (default is '1234' if none set)
    const expected = requiredPin || '1234';
    if (pinInput === expected) {
      setError(false);
      sounds.playUnlockSound();
      onUnlock();
    } else {
      setError(true);
      setPinInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111b21] flex flex-col items-center justify-center p-4 select-none animate-in fade-in">
      <div className="w-full max-w-sm bg-[#202c33] rounded-3xl p-8 border border-[#374248] shadow-2xl flex flex-col items-center text-center">
        {/* WhatsApp Lock Shield */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-[#111b21] border-2 border-[#00a884] flex items-center justify-center shadow-inner">
            <Lock className="w-9 h-9 text-[#00a884]" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#00a884] rounded-full text-white shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-xl font-bold text-[#e9edef] mb-1">WhatsNew</h2>
        <p className="text-xs text-[#8696a0] mb-6">
          Bildschirm gesperrt für <span className="font-semibold text-[#e9edef]">{userName}</span>
        </p>

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                if (error) setError(false);
              }}
              placeholder="PIN oder Passwort eingeben"
              className={`w-full bg-[#111b21] text-[#e9edef] placeholder-[#8696a0] text-sm px-4 py-3 rounded-xl border outline-none text-center tracking-wider transition-all ${
                error
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : 'border-[#374248] focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8696a0] hover:text-[#e9edef] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium animate-shake">
              Falsche PIN. Bitte versuche es erneut.
            </p>
          )}

          <button
            type="submit"
            disabled={!pinInput.trim()}
            className="w-full py-3 bg-[#00a884] hover:bg-[#009374] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Entsperren</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Hint and Logout */}
        <div className="mt-8 pt-4 border-t border-[#374248] w-full flex items-center justify-between text-xs text-[#8696a0]">
          <span className="text-[11px] text-[#8696a0]/80">
            Standard-PIN: <span className="font-mono text-[#00a884]">1234</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
