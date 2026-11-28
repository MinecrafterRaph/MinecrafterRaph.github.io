import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation & Chats',
    items: [
      { keys: ['Strg', 'Alt', 'N'], description: 'Neuen Chat oder neue Gruppe starten' },
      { keys: ['Strg', 'Alt', 'F'], description: 'Chats durchsuchen' },
      { keys: ['Strg', 'Alt', ']'], description: 'Nächsten Chat auswählen' },
      { keys: ['Strg', 'Alt', '['], description: 'Vorherigen Chat auswählen' },
      { keys: ['Strg', 'Alt', 'S'], description: 'Status-Meldungen öffnen' },
      { keys: ['Esc'], description: 'Suche oder modales Fenster schließen' },
    ],
  },
  {
    title: 'Nachrichten & Schreiben',
    items: [
      { keys: ['Enter'], description: 'Nachricht absenden (sofern aktiviert)' },
      { keys: ['Shift', 'Enter'], description: 'Neue Zeile einfügen' },
      { keys: ['Strg', 'Alt', 'E'], description: 'Emoji- & Sticker-Leiste umschalten' },
      { keys: ['*Text*'], description: 'Fett formatieren (*Text*)' },
      { keys: ['_Text_'], description: 'Kursiv formatieren (_Text_)' },
      { keys: ['~Text~'], description: 'Durchgestrichen formatieren (~Text~)' },
      { keys: ['```Code```'], description: 'Monospace Codeblock (```Code```)' },
    ],
  },
  {
    title: 'Sicherheit & Einstellungen',
    items: [
      { keys: ['Strg', 'Alt', 'L'], description: 'Bildschirm sperren (Screen Lock)' },
      { keys: ['Strg', 'Alt', ','], description: 'Einstellungen öffnen' },
      { keys: ['Strg', 'Alt', 'M'], description: 'Aktiven Chat stummschalten / Ton an' },
      { keys: ['?'], description: 'Dieses Tastenkürzel-Fenster aufrufen' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#d1d7db] dark:border-[#374248] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#008069] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Tastaturkurzbefehle</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Schneller navigieren und chatten in WhatsApp Web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#111b21] dark:text-[#e9edef]">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#008069] dark:text-[#00a884]">
                {group.title}
              </h4>
              <div className="bg-[#f0f2f5] dark:bg-[#111b21] rounded-xl p-2 divide-y divide-[#e9edef] dark:divide-[#222e35]">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 text-xs"
                  >
                    <span className="text-[#3b4a54] dark:text-[#aebac1]">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 text-[11px] font-mono font-medium rounded-md bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] border border-[#d1d7db] dark:border-[#374248] shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-[#d1d7db] dark:border-[#222e35] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#008069] hover:bg-[#00705a] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
