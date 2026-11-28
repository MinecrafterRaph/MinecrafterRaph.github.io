import React, { useState } from 'react';
import { X, Star, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { Message, Chat } from '../types';
import { formatWhatsAppText } from '../utils/textFormatter';

interface StarredMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat?: Chat;
  messages: Message[];
  onToggleStar: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

export const StarredMessagesModal: React.FC<StarredMessagesModalProps> = ({
  isOpen,
  onClose,
  chat,
  messages,
  onToggleStar,
  onJumpToMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const starredList = messages.filter((m) => m.isStarred);
  const filteredList = searchTerm.trim()
    ? starredList.filter(
        (m) =>
          m.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : starredList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#d1d7db] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#111b21]">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mit Stern markierte Nachrichten</h3>
              <p className="text-[11px] text-[#667781]">
                {chat ? `In Chat: ${chat.name}` : 'Gespeicherte Favoriten'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#54656f] hover:text-[#111b21] rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#f0f2f5] bg-white">
          <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-lg px-3 py-1.5 border border-transparent focus-within:border-[#00a884] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-[#54656f]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="In mit Stern markierten Nachrichten suchen..."
              className="w-full text-xs bg-transparent outline-none text-[#111b21]"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-[#667781] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-2 text-[#8696a0]">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#111b21]">Keine Favoriten vorhanden</p>
              <p className="text-xs text-[#667781] mt-1 max-w-xs">
                Bewege den Mauszeiger über eine beliebige Nachricht und klicke auf den Stern, um sie hier dauerhaft zu sichern.
              </p>
            </div>
          ) : (
            filteredList.map((msg) => (
              <div
                key={msg.id}
                className="p-3 bg-[#f0f2f5]/60 hover:bg-[#f0f2f5] rounded-xl border border-[#e9edef] transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#008069]">
                    {msg.sender === 'me' ? 'Du' : msg.senderName || chat?.name || 'Kontakt'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#667781]">{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => onToggleStar(msg.id)}
                      className="text-amber-500 hover:text-amber-600 p-0.5"
                      title="Stern entfernen"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#111b21] leading-relaxed">
                  {msg.type === 'text' && formatWhatsAppText(msg.text)}
                  {msg.type === 'image' && (
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={msg.mediaUrl}
                        alt="Media"
                        className="w-14 h-14 object-cover rounded-md"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-[#54656f]">{msg.mediaCaption || 'Foto'}</span>
                    </div>
                  )}
                  {msg.type === 'voice' && (
                    <span className="italic text-[#54656f]">Sprachnachricht</span>
                  )}
                  {msg.type === 'document' && (
                    <span className="font-medium text-[#008069]">{msg.documentName}</span>
                  )}
                  {msg.type === 'poll' && (
                    <span className="text-[#54656f]">📊 Umfrage: {msg.pollQuestion}</span>
                  )}
                  {msg.type === 'sticker' && (
                    <div className="w-12 h-12 text-2xl flex items-center justify-center">
                      {msg.text}
                    </div>
                  )}
                </div>

                {onJumpToMessage && (
                  <div className="mt-2 pt-2 border-t border-[#d1d7db]/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToMessage(msg.id);
                        onClose();
                      }}
                      className="text-[11px] text-[#008069] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>Im Chat anzeigen</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
