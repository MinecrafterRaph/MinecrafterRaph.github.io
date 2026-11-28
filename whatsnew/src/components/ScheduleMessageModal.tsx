import React, { useState } from 'react';
import { Clock, Calendar, Check, X, Send } from 'lucide-react';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onSchedule: (text: string, timestamp: number) => void;
}

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  onSchedule,
}) => {
  const [text, setText] = useState(initialText);
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !scheduledDateTime) return;
    const timeMs = new Date(scheduledDateTime).getTime();
    if (isNaN(timeMs) || timeMs <= Date.now()) {
      alert('Bitte wähle eine Zeit in der Zukunft.');
      return;
    }
    onSchedule(text.trim(), timeMs);
    onClose();
  };

  const setQuickTime = (minutesAhead: number) => {
    const d = new Date(Date.now() + minutesAhead * 60 * 1000);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    setScheduledDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#e9edef] dark:border-[#222e35]">
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5" />
            <h2 className="text-base font-semibold">Nachricht planen</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#54656f] dark:text-[#8696a0] mb-1">
              Nachrichtentext
            </label>
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Was möchtest du automatisch senden?"
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#d1d7db] dark:border-[#2a3942] focus:outline-none focus:border-[#00a884] text-[#111b21] dark:text-[#e9edef]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#54656f] dark:text-[#8696a0] mb-1">
              Sendezeitpunkt festlegen
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#d1d7db] dark:border-[#2a3942] focus:outline-none focus:border-[#00a884] text-[#111b21] dark:text-[#e9edef]"
            />
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setQuickTime(10)}
              className="px-2.5 py-1 text-[11px] rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#00a884]/15 hover:text-[#00a884] transition-colors border border-[#d1d7db]/60 dark:border-[#2a3942]"
            >
              In 10 Min.
            </button>
            <button
              type="button"
              onClick={() => setQuickTime(60)}
              className="px-2.5 py-1 text-[11px] rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#00a884]/15 hover:text-[#00a884] transition-colors border border-[#d1d7db]/60 dark:border-[#2a3942]"
            >
              In 1 Stunde
            </button>
            <button
              type="button"
              onClick={() => setQuickTime(1440)}
              className="px-2.5 py-1 text-[11px] rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#00a884]/15 hover:text-[#00a884] transition-colors border border-[#d1d7db]/60 dark:border-[#2a3942]"
            >
              Morgen gleiche Zeit
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Nachricht einplanen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
