import React, { useState } from 'react';
import { X, Search, Forward, Check, MessageSquare } from 'lucide-react';
import { Chat, Message } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  chats: Chat[];
  onForward: (targetChatIds: string[], message: Message) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  message,
  chats,
  onForward,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  if (!isOpen || !message) return null;

  const toggleSelectChat = (chatId: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (selectedChatIds.length === 0) return;
    onForward(selectedChatIds, message);
    setSelectedChatIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Forward className="w-5 h-5" />
            <h2 className="text-base font-bold">Nachricht weiterleiten</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-3 bg-[#f0f2f5] border-b border-[#d1d7db] text-xs flex items-center gap-2 text-[#54656f]">
          <span className="font-semibold text-[#111b21] shrink-0">Weiterleiten:</span>
          <span className="truncate italic text-[#111b21]">
            {message.type === 'text'
              ? message.text
              : message.type === 'image'
              ? '📷 Foto'
              : message.type === 'voice'
              ? '🎤 Sprachnachricht'
              : message.type === 'document'
              ? `📄 ${message.documentName || 'Dokument'}`
              : message.type === 'poll'
              ? `📊 ${message.pollQuestion}`
              : `[${message.type}]`}
          </span>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#f0f2f5]">
          <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-1.5 rounded-lg">
            <Search className="w-4 h-4 text-[#54656f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chat oder Kontakt suchen"
              className="w-full bg-transparent text-xs text-[#111b21] outline-none placeholder:text-[#667781]"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5] max-h-80">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667781]">
              Keine Chats gefunden
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChatIds.includes(chat.id);
              return (
                <div
                  key={chat.id}
                  onClick={() => toggleSelectChat(chat.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f9fafb]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WhatsAppAvatar avatarUrl={chat.avatar} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#111b21] truncate">
                        {chat.name}
                      </div>
                      <div className="text-[11px] text-[#667781] truncate">
                        {chat.isGroup ? 'Gruppenchat' : chat.about || 'Auf WhatsApp'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#008069] border-[#008069] text-white'
                        : 'border-[#d1d7db] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#d1d7db] flex items-center justify-between">
          <span className="text-xs text-[#667781]">
            {selectedChatIds.length === 0
              ? 'Wähle mindestens einen Chat aus'
              : `${selectedChatIds.length} Chat(s) ausgewählt`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={selectedChatIds.length === 0}
              onClick={handleSend}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                selectedChatIds.length > 0
                  ? 'bg-[#008069] hover:bg-[#00a884] text-white shadow-xs cursor-pointer'
                  : 'bg-[#d1d7db] text-white cursor-not-allowed'
              }`}
            >
              <Forward className="w-3.5 h-3.5" />
              Senden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
