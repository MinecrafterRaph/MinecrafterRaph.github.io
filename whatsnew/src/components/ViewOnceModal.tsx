import React from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';

interface ViewOnceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl?: string;
  text?: string;
  senderName: string;
  type?: string;
}

export const ViewOnceModal: React.FC<ViewOnceModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  text,
  senderName,
  type = 'image',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-white animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#111b21] border-b border-[#222e35] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#00a884] flex items-center justify-center font-bold text-sm text-[#00a884] bg-[#00a884]/15">
            1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#e9edef]">{senderName}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] font-medium">
                Einmalige Ansicht
              </span>
            </div>
            <div className="text-[11px] text-[#8696a0] flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-[#8696a0]" />
              <span>Nach dem Verlassen kann diese Nachricht nicht mehr geöffnet werden</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
          <span>Fertig & schließen</span>
        </button>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden relative">
        {type === 'image' || mediaUrl ? (
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center">
            <img
              src={mediaUrl}
              alt="Einmalansicht Foto"
              className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl select-none"
              referrerPolicy="no-referrer"
            />
            {text && (
              <p className="mt-4 text-center text-sm text-[#e9edef] bg-[#111b21]/90 px-4 py-2 rounded-lg border border-[#222e35] max-w-lg">
                {text}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-md w-full bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#00a884] mx-auto flex items-center justify-center text-lg font-bold text-[#00a884] bg-[#00a884]/10">
              1
            </div>
            <h3 className="text-base font-semibold text-[#e9edef]">Vertrauliche Nachricht</h3>
            <div className="p-4 rounded-xl bg-[#202c33] border border-[#2a3942] text-left text-sm text-[#e9edef] whitespace-pre-wrap break-words leading-relaxed font-sans">
              {text || 'Kein Text vorhanden'}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#8696a0]">
              <AlertCircle className="w-3.5 h-3.5 text-[#00a884]" />
              <span>Wird dauerhaft unleserlich nach dem Schließen</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer warning */}
      <footer className="py-2.5 px-4 bg-[#111b21] border-t border-[#222e35] text-center text-[11px] text-[#8696a0] shrink-0">
        🔒 Dies ist eine WhatsApp Web Einmalansicht. Beim Schließen wird der Inhalt endgültig maskiert.
      </footer>
    </div>
  );
};
