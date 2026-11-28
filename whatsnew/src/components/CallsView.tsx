import React, { useState, useEffect } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Link2,
  PhoneCall,
  Settings2,
  Search,
  Plus,
} from 'lucide-react';
import { CallRecord, CallConfig, Chat } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface CallsViewProps {
  calls: CallRecord[];
  chats: Chat[];
  callConfig?: CallConfig;
  onOpenConfig: () => void;
  onStartCall: (chatId: string, contactName: string, contactAvatar: string, type: 'voice' | 'video') => void;
  onSelectChat: (chat: Chat) => void;
}

export const CallsView: React.FC<CallsViewProps> = ({
  calls,
  chats,
  callConfig,
  onOpenConfig,
  onStartCall,
  onSelectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);

  const filteredCalls = calls.filter((c) =>
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCallLink = () => {
    const link = `${window.location.origin}/call/join-${Math.random().toString(36).slice(2, 8)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111b21] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#e9edef] dark:border-[#222e35] flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111b21] dark:text-[#e9edef]">Anrufe</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenConfig}
            title="Anruf-Cloud & API anpassen"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#54656f] dark:text-[#aebac1] transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewCallModalOpen(true)}
            title="Neuen Anruf starten"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#008069] dark:text-[#00a884] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cloud Status Banner */}
      <div className="px-4 py-2.5 bg-[#f0f2f5]/60 dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222e35] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#54656f] dark:text-[#8696a0] truncate">
          <span className="w-2 h-2 rounded-full bg-[#00a884] shrink-0" />
          <span className="truncate">
            {callConfig?.provider === 'demo'
              ? 'Demo-Cloud aktiv'
              : callConfig?.serverUrl
              ? `Cloud: ${callConfig.serverUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').slice(0, 24)}...`
              : 'Eigene Cloud nicht konfiguriert'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenConfig}
          className="text-[#00a884] font-medium hover:underline shrink-0 ml-2"
        >
          Anpassen
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#e9edef] dark:border-[#222e35]">
        <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3 py-1.5 text-xs text-[#111b21] dark:text-[#e9edef]">
          <Search className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Anrufe durchsuchen"
            className="w-full bg-transparent focus:outline-none placeholder-[#54656f] dark:placeholder-[#8696a0]"
          />
        </div>
      </div>

      {/* Call Link Action Button */}
      <div className="p-3 border-b border-[#e9edef] dark:border-[#222e35]">
        <button
          type="button"
          onClick={handleCreateCallLink}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Link2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#111b21] dark:text-[#e9edef]">
              {copiedLink ? 'Link in Zwischenablage kopiert!' : 'Anruflink erstellen'}
            </p>
            <p className="text-xs text-[#54656f] dark:text-[#8696a0] truncate">
              {copiedLink ? 'Teile den Link mit Freunden' : 'Link für einen WhatsApp-Anruf teilen'}
            </p>
          </div>
        </button>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#e9edef] dark:divide-[#222e35]">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-[#54656f] dark:text-[#8696a0] flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-center text-[#8696a0] mb-3">
              <PhoneCall className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111b21] dark:text-[#e9edef]">Keine Anrufe vorhanden</p>
            <p className="text-xs mt-1 max-w-xs">
              Starte einen Sprach- oder Videoanruf mit deinen Kontakten über das Telefon-Symbol.
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isMissed = call.status === 'missed' || call.direction === 'missed';
            return (
              <div
                key={call.id}
                className="group flex items-center justify-between p-3.5 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <WhatsAppAvatar avatarUrl={call.contactAvatar} size="md" />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isMissed ? 'text-red-500' : 'text-[#111b21] dark:text-[#e9edef]'
                      }`}
                    >
                      {call.contactName}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#54656f] dark:text-[#8696a0] mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
                      ) : call.direction === 'incoming' ? (
                        <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884]" />
                      ) : (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-[#54656f]" />
                      )}
                      <span>{call.timestamp}</span>
                      {call.duration ? <span>({Math.floor(call.duration / 60)}:{call.duration % 60 < 10 ? '0' : ''}{call.duration % 60})</span> : null}
                    </div>
                  </div>
                </div>

                {/* Call action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onStartCall(call.chatId, call.contactName, call.contactAvatar, 'voice')
                    }
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#00a884] transition-colors"
                    title="Sprachanruf"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartCall(call.chatId, call.contactName, call.contactAvatar, 'video')
                    }
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#00a884] transition-colors"
                    title="Videoanruf"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Call Modal Picker */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl max-w-sm w-full p-4 border border-[#e9edef] dark:border-[#222e35] shadow-xl">
            <h3 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] mb-3">
              Kontakt für Anruf auswählen
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setIsNewCallModalOpen(false);
                    onStartCall(c.id, c.name, c.avatar, 'voice');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WhatsAppAvatar avatarUrl={c.avatar} size="sm" />
                    <span className="text-xs font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                      {c.name}
                    </span>
                  </div>
                  <Phone className="w-4 h-4 text-[#00a884]" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsNewCallModalOpen(false)}
              className="mt-3 w-full py-2 text-xs font-medium text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
