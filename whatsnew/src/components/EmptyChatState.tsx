import React from 'react';
import { Lock, Laptop, MessageSquare, MessageSquarePlus } from 'lucide-react';

interface EmptyChatStateProps {
  onOpenNewChat?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onOpenNewChat }) => {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] border-b-[6px] border-[#00a884] p-8 text-center select-none">
      <div className="max-w-md flex flex-col items-center">
        {/* Modern WhatsApp Web connection illustration */}
        <div className="w-48 h-48 rounded-full bg-white shadow-xs border border-[#d1d7db] flex items-center justify-center mb-8 relative">
          <div className="w-24 h-24 rounded-2xl bg-[#00a884]/10 flex items-center justify-center text-[#00a884]">
            <Laptop className="w-14 h-14 stroke-[1.5]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-md">
            <MessageSquare className="w-6 h-6 fill-current" />
          </div>
        </div>

        <h2 className="text-2xl font-light text-[#41525d] mb-3">WhatsNew</h2>
        <p className="text-sm text-[#667781] leading-relaxed max-w-sm mb-6">
          Sende und empfange Nachrichten, ohne dein Telefon online zu halten. Nutze WhatsApp
          auf bis zu 4 verknüpften Geräten und 1 Telefon gleichzeitig.
        </p>

        {onOpenNewChat && (
          <button
            type="button"
            onClick={onOpenNewChat}
            className="mb-8 px-4 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-2 transition-all hover:shadow cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Neuen Chat starten</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
          <Lock className="w-3.5 h-3.5 text-[#8696a0]" />
          <span>Ende-zu-Ende-verschlüsselt</span>
        </div>
      </div>
    </div>
  );
};
