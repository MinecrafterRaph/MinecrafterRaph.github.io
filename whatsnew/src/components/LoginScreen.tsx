import React, { useState } from 'react';
import { Lock, User as UserIcon, MessageSquare, ArrowRight, ShieldCheck, Clock, AlertTriangle, CheckSquare, Square, Radio } from 'lucide-react';
import { User } from '../types';
import { isIframe } from '../utils/storage';

interface SessionExpiredNotice {
  daysPassed: number;
  timeoutDays: number;
  lastOnlineDate: string;
}

interface LoginScreenProps {
  onLoginSuccess: (user: User, rememberMe: boolean) => void;
  defaultRememberMe?: boolean;
  sessionExpiredNotice?: SessionExpiredNotice | null;
  onClearExpiredNotice?: () => void;
  lastOnlineTimestamp?: number | null;
  pendingChannelInvite?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  defaultRememberMe = true,
  sessionExpiredNotice,
  onClearExpiredNotice,
  lastOnlineTimestamp,
  pendingChannelInvite,
}) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(defaultRememberMe);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein.');
      return;
    }
    if (!password.trim() || password.trim().length < 3) {
      setError('Das Passwort muss mindestens 3 Zeichen lang sein.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler bei der Anmeldung.');
      }

      onLoginSuccess(data.user, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedLastOnline = lastOnlineTimestamp
    ? new Date(lastOnlineTimestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="w-full h-screen bg-[#f0f2f5] flex flex-col justify-between select-none overflow-y-auto">
      {/* WhatsApp Web Banner Header */}
      <div className="h-56 bg-[#00a884] w-full px-6 sm:px-12 pt-8 flex items-start shrink-0">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-sm uppercase">WHATSNEW</span>
        </div>
      </div>

      {/* Main Login Card (overlaps header) */}
      <div className="max-w-4xl mx-auto w-full px-4 -mt-28 mb-12 z-10">
        <div className="bg-white rounded-lg shadow-xl border border-[#d1d7db] p-8 sm:p-12 flex flex-col md:flex-row gap-10 items-center">
          {/* Left Column: Form */}
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-light text-[#41525d] mb-2">WhatsNew verwenden</h1>
            <p className="text-sm text-[#667781] mb-6">
              Melde dich mit deinem Namen und Passwort an, um deine Chats und Nachrichten zu öffnen.
            </p>

            {/* Session Expired Notice Banner */}
            {sessionExpiredNotice && (
              <div className="p-3.5 mb-4 text-xs bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-amber-950 mb-0.5">Sitzung abgelaufen</div>
                  <p className="leading-relaxed text-amber-800">
                    Du warst zuletzt am <strong>{sessionExpiredNotice.lastOnlineDate}</strong> (vor {sessionExpiredNotice.daysPassed} Tagen) online. Gemäß deiner Sicherheitseinstellung ({sessionExpiredNotice.timeoutDays} {sessionExpiredNotice.timeoutDays === 1 ? 'Tag' : 'Tage'}) ist zur Sicherheit eine erneute Anmeldung erforderlich.
                  </p>
                </div>
                {onClearExpiredNotice && (
                  <button
                    type="button"
                    onClick={onClearExpiredNotice}
                    className="text-amber-700 hover:text-amber-950 text-xs font-semibold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Channel Invite Notice Banner */}
            {pendingChannelInvite && (
              <div className="p-3.5 mb-4 text-xs bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <Radio className="w-5 h-5 text-[#008069] shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <div className="font-bold text-emerald-950 mb-0.5">Kanal-Einladung erhalten!</div>
                  <p className="leading-relaxed text-emerald-800">
                    Du wurdest zum Kanal <strong className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded">{pendingChannelInvite}</strong> eingeladen. Melde dich kurz an, um direkt beizutreten.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Name Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#41525d]">Dein Name</label>
                  {name.trim().toLowerCase() === 'whatsapp' && (
                    <span className="flex items-center gap-1 text-[10px] text-[#008069] font-semibold bg-[#008069]/10 px-2 py-0.5 rounded-full animate-in fade-in">
                      <ShieldCheck className="w-3 h-3" /> Admin-Konto
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Deinen Namen eingeben"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#f0f2f5] focus:bg-white text-sm text-[#111b21] rounded-lg border border-transparent focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-medium text-[#41525d] mb-1">Passwort</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-[#8696a0]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort eingeben"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#f0f2f5] focus:bg-white text-sm text-[#111b21] rounded-lg border border-transparent focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Remember Me Toggle / Checkbox (localStorage) */}
              <div className="pt-1">
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-start gap-2.5 cursor-pointer select-none p-2 -mx-2 rounded-lg hover:bg-[#f0f2f5] transition-colors"
                >
                  <div className="mt-0.5 text-[#008069]">
                    {rememberMe ? (
                      <CheckSquare className="w-4 h-4 fill-[#008069] text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-[#8696a0]" />
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-medium text-[#111b21] block">
                      Angemeldet bleiben ({isIframe() ? 'im Host-Fenster speichern' : 'auf diesem Gerät speichern'})
                    </span>
                    <span className="text-[11px] text-[#667781] block mt-0.5">
                      {isIframe()
                        ? 'Speichert deine Sitzung sicher über die GitHub-Pages Hostseite.'
                        : 'Speichert deinen Login dauerhaft auf diesem Gerät. Du kannst die Speicherdauer und Einstellungen jederzeit anpassen.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Last Online on this device info */}
              {formattedLastOnline && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#667781] bg-[#f0f2f5] px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#008069]" />
                  <span>Zuletzt online auf diesem Gerät: <strong>{formattedLastOnline}</strong></span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#008069] hover:bg-[#00a884] text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Anmelden</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#8696a0] shrink-0">
        WhatsNew
      </footer>
    </div>
  );
};
