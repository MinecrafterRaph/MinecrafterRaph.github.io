import React, { useState } from 'react';
import {
  Search,
  MoreVertical,
  ArrowLeft,
  Trash2,
  BellOff,
  Volume2,
  CheckCheck,
  UserCheck,
  Star,
  Settings,
  Palette,
  X,
  Clock,
  Lock,
  Unlock,
  Tag,
  Check,
  Link,
  Copy,
  Phone,
  Video,
  Server,
} from 'lucide-react';
import { Chat } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { CHAT_LABELS } from '../utils/labels';
import { getChatInviteLink } from '../utils/inviteLinks';

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  onToggleSearchInChat: () => void;
  onOpenContactInfo: () => void;
  onOpenSettings?: () => void;
  onClearChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onToggleMute: (chatId: string) => void;
  onMarkAllRead?: (chatId: string) => void;
  onOpenStarredMessages?: () => void;
  onOpenDisappearingMessages?: () => void;
  onSetChatLabel?: (chatId: string, label?: string) => void;
  onToggleLockChat?: (chatId: string) => void;
  onOpenMuteModal?: (chatId: string) => void;
  onStartCall?: (type: 'voice' | 'video') => void;
  onOpenCallConfig?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  onBack,
  onToggleSearchInChat,
  onOpenContactInfo,
  onOpenSettings,
  onClearChat,
  onDeleteChat,
  onToggleMute,
  onMarkAllRead,
  onOpenStarredMessages,
  onOpenDisappearingMessages,
  onSetChatLabel,
  onToggleLockChat,
  onOpenMuteModal,
  onStartCall,
  onOpenCallConfig,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLabelSubmenu, setShowLabelSubmenu] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleCopyInviteLink = () => {
    const link = getChatInviteLink(chat.id);
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  return (
    <div
      className={`h-[60px] px-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between shrink-0 select-none relative transition-all ${
        showMenu ? 'z-50' : 'z-20'
      }`}
    >
      {/* Left info (clicking opens Contact Info) */}
      <div
        className="flex items-center gap-3 min-w-0 cursor-pointer group"
        onClick={onOpenContactInfo}
      >
        {/* Back button on mobile */}
        {onBack && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden p-1.5 -ml-2 text-[#54656f] hover:text-[#111b21] rounded-full hover:bg-black/5"
            title="Zurück zu Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Contact Avatar */}
        <div className="relative shrink-0">
          <WhatsAppAvatar
            name={chat.name}
            avatarUrl={chat.avatar}
            isGroup={chat.isGroup}
            isGlobal={chat.isGlobal}
            size="md"
            isOnline={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
            showOnlineBadge={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
            className="group-hover:opacity-95 transition-opacity"
          />
        </div>

        {/* Name and online status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="font-medium text-sm text-[#111b21] truncate leading-tight group-hover:text-[#008069] transition-colors">
              {chat.nickname || chat.name}
            </h2>
            {chat.nickname && (
              <span className="text-[10px] text-[#008069] bg-[#d9fdd3] px-1.5 py-0.2 rounded font-medium shrink-0" title={`Originaler Name: ${chat.name}`}>
                Spitzname
              </span>
            )}
            {chat.label && CHAT_LABELS[chat.label] && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${CHAT_LABELS[chat.label].badgeClass}`}>
                {CHAT_LABELS[chat.label].name}
              </span>
            )}
            {chat.isLocked && (
              <Lock className="w-3.5 h-3.5 text-[#008069] shrink-0" title="Gesperrter Chat" />
            )}
            {chat.isMuted && (
              <BellOff className="w-3.5 h-3.5 text-[#8696a0] shrink-0" title="Stummgeschaltet" />
            )}
            {chat.disappearingTimer && chat.disappearingTimer !== 'off' && (
              <span title={`Selbstlöschende Nachrichten aktiv: ${chat.disappearingTimer}`}>
                <Clock className="w-3.5 h-3.5 text-[#008069] shrink-0" />
              </span>
            )}
          </div>
          <p className="text-xs truncate leading-tight mt-0.5">
            {chat.isGroup || chat.isGlobal ? (
              <span className="text-[#667781] truncate">
                {chat.groupMembers && chat.groupMembers.length > 0
                  ? chat.groupMembers.join(', ')
                  : 'Gruppenteilnehmer'}
              </span>
            ) : chat.onlineStatus === 'typing' ? (
              <span className="text-[#008069] font-medium animate-pulse">tippt...</span>
            ) : chat.onlineStatus === 'online' ? (
              <span className="text-[#008069] font-medium">online</span>
            ) : (
              <span className="text-[#667781]">{chat.lastSeen || 'offline'}</span>
            )}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 text-[#54656f]">
        {/* Group / Chat Invite Link Button */}
        {(chat.isGroup || chat.isGlobal) && (
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="p-1.5 hover:text-[#008069] hover:bg-black/5 rounded-full transition-colors flex items-center gap-1"
            title="Einladungslink zur Gruppe kopieren"
          >
            {inviteCopied ? (
              <span className="text-[11px] font-semibold text-[#008069] flex items-center gap-1 px-1">
                <Check className="w-4 h-4" /> Link kopiert
              </span>
            ) : (
              <Link className="w-4.5 h-4.5" />
            )}
          </button>
        )}

        {/* Video & Voice Call with Cloud/API Config */}
        {onStartCall && (
          <div className="flex items-center bg-black/5 hover:bg-black/8 rounded-full p-0.5 transition-colors">
            {/* Video Call */}
            <button
              type="button"
              onClick={() => onStartCall('video')}
              className="p-1.5 hover:text-[#008069] hover:bg-white rounded-full transition-all cursor-pointer shadow-2xs"
              title="Videoanruf starten"
            >
              <Video className="w-4.5 h-4.5" />
            </button>

            {/* Voice Call */}
            <button
              type="button"
              onClick={() => onStartCall('voice')}
              className="p-1.5 hover:text-[#008069] hover:bg-white rounded-full transition-all cursor-pointer shadow-2xs"
              title="Sprachanruf starten"
            >
              <Phone className="w-4.5 h-4.5" />
            </button>

            {/* Configure Custom Cloud / API */}
            {onOpenCallConfig && (
              <button
                type="button"
                onClick={onOpenCallConfig}
                className="p-1 hover:text-[#008069] hover:bg-white rounded-full transition-all cursor-pointer text-[#8696a0]"
                title="Eigene Cloud / WebRTC API für Anrufe anpassen"
              >
                <Server className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* In-chat search */}
        <button
          type="button"
          onClick={onToggleSearchInChat}
          className="p-1.5 hover:text-[#111b21] hover:bg-black/5 rounded-full transition-colors"
          title="Nachrichten durchsuchen"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Chat Settings & Wallpaper button */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 hover:text-[#008069] hover:bg-black/5 rounded-full transition-colors"
            title="Chat-Einstellungen & Wallpaper"
          >
            <Palette className="w-5 h-5" />
          </button>
        )}

        {/* More options dropdown (3 Dots) */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((p) => !p);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              showMenu ? 'bg-black/10 text-[#111b21]' : 'hover:text-[#111b21] hover:bg-black/5 text-[#54656f]'
            }`}
            title="Menü (Optionen)"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop overlay to close reliably when clicking anywhere */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />

              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-[#d1d7db] py-1.5 z-50 text-xs text-[#111b21] animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Kontaktinfo */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenContactInfo();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-[#54656f]" />
                  <span className="font-normal">{chat.isGroup ? 'Gruppeninfo' : 'Kontaktinfo'}</span>
                </button>

                {/* Mit Link zur Gruppe einladen */}
                {(chat.isGroup || chat.isGlobal) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCopyInviteLink();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors text-xs text-[#111b21]"
                  >
                    <Link className="w-4 h-4 text-[#008069]" />
                    <span>Mit Link einladen</span>
                  </button>
                )}

                {/* Chat-Einstellungen & Wallpaper */}
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#008069]/10 text-[#008069] flex items-center gap-3 font-medium transition-colors border-y border-[#f0f2f5]"
                  >
                    <Settings className="w-4 h-4 text-[#008069]" />
                    <span>Chat-Einstellungen & Wallpaper</span>
                  </button>
                )}

                {/* Nachrichten durchsuchen */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleSearchInChat();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                >
                  <Search className="w-4 h-4 text-[#54656f]" />
                  <span>Nachrichten durchsuchen</span>
                </button>

                {/* Selbstlöschende Nachrichten */}
                {onOpenDisappearingMessages && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDisappearingMessages();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                  >
                    <Clock className="w-4 h-4 text-[#54656f]" />
                    <div className="flex items-center justify-between flex-1">
                      <span>Selbstlöschende Nachrichten</span>
                      {chat.disappearingTimer && chat.disappearingTimer !== 'off' && (
                        <span className="text-[10px] bg-[#d9fdd3] text-[#008069] px-1.5 py-0.2 rounded font-semibold">
                          {chat.disappearingTimer}
                        </span>
                      )}
                    </div>
                  </button>
                )}

                {/* Favoriten */}
                {onOpenStarredMessages && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenStarredMessages();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Favoriten anzeigen</span>
                  </button>
                )}

                {/* Label zuweisen */}
                {onSetChatLabel && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowLabelSubmenu((p) => !p)}
                      className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-[#54656f]" />
                        <span>Label zuweisen</span>
                      </div>
                      <span className="text-[10px] text-[#667781]">
                        {chat.label ? CHAT_LABELS[chat.label]?.name : ''}
                      </span>
                    </button>
                    {showLabelSubmenu && (
                      <div className="px-3 py-1.5 bg-[#f0f2f5] border-y border-[#e9edef] space-y-1">
                        {Object.values(CHAT_LABELS).map((lbl) => (
                          <button
                            key={lbl.id}
                            type="button"
                            onClick={() => {
                              onSetChatLabel(chat.id, chat.label === lbl.id ? undefined : lbl.id);
                              setShowLabelSubmenu(false);
                              setShowMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                              chat.label === lbl.id ? 'bg-white font-medium shadow-xs' : 'hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${lbl.dotClass}`} />
                              <span>{lbl.name}</span>
                            </div>
                            {chat.label === lbl.id && <Check className="w-3.5 h-3.5 text-[#008069]" />}
                          </button>
                        ))}
                        {chat.label && (
                          <button
                            type="button"
                            onClick={() => {
                              onSetChatLabel(chat.id, undefined);
                              setShowLabelSubmenu(false);
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-xs text-[#667781] hover:bg-white/60"
                          >
                            Label entfernen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat sperren / entsperren */}
                {onToggleLockChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleLockChat(chat.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                  >
                    {chat.isLocked ? (
                      <>
                        <Unlock className="w-4 h-4 text-[#54656f]" />
                        <span>Chat entsperren</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#54656f]" />
                        <span>Chat sperren</span>
                      </>
                    )}
                  </button>
                )}

                {/* Stummschalten */}
                <button
                  type="button"
                  onClick={() => {
                    if (chat.isMuted) {
                      onToggleMute(chat.id);
                    } else if (onOpenMuteModal) {
                      onOpenMuteModal(chat.id);
                    } else {
                      onToggleMute(chat.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                >
                  {chat.isMuted ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#54656f]" />
                      <span>Benachrichtigungen an</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 text-[#54656f]" />
                      <span>Stummschalten...</span>
                    </>
                  )}
                </button>

                {/* Als gelesen markieren */}
                {onMarkAllRead && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAllRead(chat.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4 text-[#54656f]" />
                    <span>Als gelesen markieren</span>
                  </button>
                )}

                <div className="my-1 border-t border-[#f0f2f5]" />

                {/* Chat leeren */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Möchtest du wirklich alle Nachrichten in diesem Chat leeren?')) {
                      onClearChat(chat.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] text-[#54656f] flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[#54656f]" />
                  <span>Chat-Verlauf leeren</span>
                </button>

                {/* Chat schließen */}
                {onBack && (
                  <button
                    type="button"
                    onClick={() => {
                      onBack();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] text-[#54656f] flex items-center gap-3 transition-colors"
                  >
                    <X className="w-4 h-4 text-[#54656f]" />
                    <span>Chat schließen</span>
                  </button>
                )}

                {/* Chat löschen */}
                {chat.id !== 'chat_global_all' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Möchtest du den Chat mit "${chat.name}" wirklich löschen?`)) {
                        onDeleteChat(chat.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-3 transition-colors border-t border-[#f0f2f5]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="font-medium">Chat löschen</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
