import React, { useState } from 'react';
import { X, Clock, Check, ShieldAlert } from 'lucide-react';

interface DisappearingMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimer?: 'off' | '24h' | '7d' | '90d';
  onSaveTimer: (timer: 'off' | '24h' | '7d' | '90d') => void;
  chatName: string;
}

export const DisappearingMessagesModal: React.FC<DisappearingMessagesModalProps> = ({
  isOpen,
  onClose,
  currentTimer = 'off',
  onSaveTimer,
  chatName,
}) => {
  const [selectedTimer, setSelectedTimer] = useState<'off' | '24h' | '7d' | '90d'>(currentTimer);

  if (!isOpen) return null;

  const options: { id: 'off' | '24h' | '7d' | '90d'; label: string; subtext: string }[] = [
    { id: '24h', label: '24 Stunden', subtext: 'Nachrichten verschwinden nach einem Tag' },
    { id: '7d', label: '7 Tage', subtext: 'Nachrichten verschwinden nach einer Woche' },
    { id: '90d', label: '90 Tage', subtext: 'Nachrichten verschwinden nach ca. 3 Monaten' },
    { id: 'off', label: 'Aus', subtext: 'Nachrichten bleiben dauerhaft gespeichert' },
  ];

  const handleSave = () => {
    onSaveTimer(selectedTimer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="text-base font-bold">Selbstlöschende Nachrichten</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center mx-auto mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#111b21]">
              Nachrichtentimer für diesen Chat
            </h3>
            <p className="text-xs text-[#667781] mt-1 max-w-xs mx-auto">
              Für mehr Privatsphäre und Speicherplatz verschwinden neue Nachrichten im Chat mit <span className="font-semibold text-[#111b21]">{chatName}</span> nach der ausgewählten Dauer.
            </p>
          </div>

          {/* Radio list */}
          <div className="border border-[#d1d7db] rounded-xl divide-y divide-[#f0f2f5] overflow-hidden">
            {options.map((opt) => {
              const isSelected = selectedTimer === opt.id;
              return (
                <label
                  key={opt.id}
                  onClick={() => setSelectedTimer(opt.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#f9fafb] transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#111b21]">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-[#667781]">{opt.subtext}</div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#008069] bg-[#008069] text-white'
                        : 'border-[#d1d7db] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Info note */}
          <div className="bg-[#f0f2f5] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#54656f]">
            <ShieldAlert className="w-4 h-4 text-[#008069] shrink-0 mt-0.5" />
            <p>
              Gilt nur für neue Nachrichten, die nach Aktivierung gesendet werden. Angepinnte Nachrichten bleiben erhalten.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white rounded-lg shadow-xs transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
