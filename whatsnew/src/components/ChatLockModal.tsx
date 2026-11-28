import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface ChatLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
}

export const ChatLockModal: React.FC<ChatLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanExpected = (expectedPin || '1234').trim();
    if (pin.trim() === cleanExpected) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-[#d1d7db] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#e9edef] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#111b21]">Gesperrte Chats</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#54656f] hover:text-[#111b21] hover:bg-[#f5f6f6] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#667781] leading-relaxed">
            Gib deine PIN ein, um deine gesperrten Chats anzuzeigen.
          </p>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667781]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="PIN eingeben (Standard: 1234)"
                autoFocus
                maxLength={12}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f0f2f5] border border-[#d1d7db] rounded-lg focus:border-[#008069] focus:bg-white outline-none text-[#111b21]"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Falsche PIN. Bitte erneut versuchen.</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-black/5 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!pin.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#008069] disabled:opacity-50 text-white rounded-lg hover:bg-[#006e5a] transition-colors shadow-xs"
            >
              Entsperren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
