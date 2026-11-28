import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], multipleAnswers: boolean) => void;
}

export const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multipleAnswers, setMultipleAnswers] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || validOptions.length < 2) {
      return;
    }
    onCreatePoll(question.trim(), validOptions, multipleAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#d1d7db] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#d1d7db] bg-[#f0f2f5]">
          <div className="flex items-center gap-2 text-[#111b21]">
            <BarChart2 className="w-5 h-5 text-[#00a884]" />
            <h3 className="font-semibold text-base">Umfrage erstellen</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#54656f] hover:text-[#111b21] rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#54656f] mb-1">
              Deine Frage
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="z. B. Wo wollen wir essen gehen?"
              className="w-full px-3.5 py-2 text-sm bg-[#f0f2f5] rounded-lg border border-transparent focus:border-[#00a884] focus:bg-white focus:outline-none transition-all text-[#111b21]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#54656f] mb-1">
              Optionen (mindestens 2)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3.5 py-1.5 text-sm bg-[#f0f2f5] rounded-lg border border-transparent focus:border-[#00a884] focus:bg-white focus:outline-none transition-all text-[#111b21]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-[#54656f] hover:text-rose-500 rounded-lg hover:bg-rose-50"
                      title="Option entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#008069] hover:text-[#00a884] py-1 px-2 rounded hover:bg-[#00a884]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Weitere Option hinzufügen
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#e9edef] flex items-center justify-between">
            <span className="text-xs text-[#111b21]">Mehrere Antworten erlauben</span>
            <input
              type="checkbox"
              checked={multipleAnswers}
              onChange={(e) => setMultipleAnswers(e.target.checked)}
              className="w-4 h-4 text-[#00a884] rounded border-gray-300 focus:ring-[#00a884] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00a884] hover:bg-[#008069] rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Umfrage senden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
