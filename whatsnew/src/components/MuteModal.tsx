import React, { useState } from 'react';
import { X, BellOff } from 'lucide-react';

interface MuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatName: string;
  onConfirmMute: (duration: '8h' | '1w' | 'always') => void;
}

export const MuteModal: React.FC<MuteModalProps> = ({
  isOpen,
  onClose,
  chatName,
  onConfirmMute,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'8h' | '1w' | 'always'>('8h');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-[#d1d7db] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e9edef] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center text-[#54656f]">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111b21]">
                Benachrichtigungen stummschalten
              </h3>
              <p className="text-xs text-[#667781] mt-0.5 truncate max-w-[260px]">
                {chatName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#54656f] hover:text-[#111b21] hover:bg-[#f5f6f6] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-[#667781] leading-relaxed">
            Andere Teilnehmer sehen nicht, dass du diesen Chat stummgeschaltet hast. Du erhältst weiterhin Benachrichtigungen, wenn du erwähnt wirst.
          </p>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#e9edef] hover:bg-[#f5f6f6] cursor-pointer transition-colors">
              <input
                type="radio"
                name="mute-duration"
                value="8h"
                checked={selectedDuration === '8h'}
                onChange={() => setSelectedDuration('8h')}
                className="w-4 h-4 text-[#008069] focus:ring-[#008069] border-[#d1d7db]"
              />
              <span className="text-sm font-medium text-[#111b21]">8 Stunden</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#e9edef] hover:bg-[#f5f6f6] cursor-pointer transition-colors">
              <input
                type="radio"
                name="mute-duration"
                value="1w"
                checked={selectedDuration === '1w'}
                onChange={() => setSelectedDuration('1w')}
                className="w-4 h-4 text-[#008069] focus:ring-[#008069] border-[#d1d7db]"
              />
              <span className="text-sm font-medium text-[#111b21]">1 Woche</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#e9edef] hover:bg-[#f5f6f6] cursor-pointer transition-colors">
              <input
                type="radio"
                name="mute-duration"
                value="always"
                checked={selectedDuration === 'always'}
                onChange={() => setSelectedDuration('always')}
                className="w-4 h-4 text-[#008069] focus:ring-[#008069] border-[#d1d7db]"
              />
              <span className="text-sm font-medium text-[#111b21]">Immer</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f0f2f5] border-t border-[#e9edef] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:text-[#111b21] hover:bg-black/5 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmMute(selectedDuration);
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold bg-[#008069] hover:bg-[#006e5a] text-white rounded-lg transition-colors shadow-xs"
          >
            Stummschalten
          </button>
        </div>
      </div>
    </div>
  );
};
