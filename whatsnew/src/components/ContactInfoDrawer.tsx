import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  BellOff,
  Bell,
  Trash2,
  FileText,
  Image as ImageIcon,
  Clock,
  ChevronRight,
  Shield,
  Download,
  Lock,
  Unlock,
  Tag,
  Users,
  UserCheck,
  Palette,
  BarChart2,
  Check,
  Edit2,
  Link,
  Copy,
} from 'lucide-react';
import { Chat, Message } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { CHAT_LABELS } from '../utils/labels';
import { getChatInviteLink } from '../utils/inviteLinks';

interface ContactInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  messages: Message[];
  onToggleMute: (chatId: string) => void;
  onClearChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenMedia: (url: string, caption?: string) => void;
  onOpenDisappearingMessages?: () => void;
  onSetChatLabel?: (chatId: string, label?: string) => void;
  onToggleLockChat?: (chatId: string) => void;
  onOpenMuteModal?: (chatId: string) => void;
  onSetNickname?: (chatId: string, nickname: string) => void;
  onSetWallpaper?: (chatId: string, wallpaper: string) => void;
}

const WALLPAPER_PRESETS = [
  { id: 'default', label: 'Standard', bg: '#efeae2', textColor: '#111b21' },
  { id: 'sage', label: 'Salbei', bg: '#e2ece9', textColor: '#111b21' },
  { id: 'sky', label: 'Himmel', bg: '#e0f2fe', textColor: '#111b21' },
  { id: 'warm', label: 'Warmes Sand', bg: '#f5efe6', textColor: '#111b21' },
  { id: 'rose', label: 'Sanftes Rosa', bg: '#fce7f3', textColor: '#111b21' },
  { id: 'night', label: 'Dunkelblau', bg: '#0f172a', textColor: '#f8fafc' },
];

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  isOpen,
  onClose,
  chat,
  messages,
  onToggleMute,
  onClearChat,
  onDeleteChat,
  onOpenMedia,
  onOpenDisappearingMessages,
  onSetChatLabel,
  onToggleLockChat,
  onOpenMuteModal,
  onSetNickname,
  onSetWallpaper,
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'docs' | 'starred'>('media');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(chat.nickname || '');
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    setNicknameInput(chat.nickname || '');
    setIsEditingNickname(false);
    setInviteCopied(false);
  }, [chat.id, chat.nickname]);

  if (!isOpen) return null;

  const chatInviteLink = getChatInviteLink(chat.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(chatInviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  // Filter media in this chat
  const mediaMessages = messages.filter((m) => m.type === 'image' && m.mediaUrl && !m.deleted);
  const docMessages = messages.filter((m) => m.type === 'document' && !m.deleted);
  const starredMessages = messages.filter((m) => m.isStarred && !m.deleted);

  // Statistics for this friend/chat
  const mySentCount = messages.filter((m) => m.sender === 'me').length;
  const theirSentCount = messages.filter((m) => m.sender === 'them').length;
  const totalCount = messages.length;

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSetNickname) {
      onSetNickname(chat.id, nicknameInput.trim());
    }
    setIsEditingNickname(false);
  };

  const handleClearNickname = () => {
    setNicknameInput('');
    if (onSetNickname) {
      onSetNickname(chat.id, '');
    }
    setIsEditingNickname(false);
  };

  return (
    <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] bg-[#f0f2f5] border-l border-[#d1d7db] shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-[60px] px-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center gap-4 shrink-0 text-[#111b21]">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-black/5 rounded-full text-[#54656f] hover:text-[#111b21]"
          title="Schließen"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-sm">{chat.isGroup ? 'Gruppeninfo' : 'Kontaktinfo'}</h3>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-6">
        {/* Profile Card */}
        <div className="bg-white p-6 flex flex-col items-center text-center shadow-xs border-b border-[#e9edef]">
          <div className="relative mb-3">
            <WhatsAppAvatar
              name={chat.name}
              avatarUrl={chat.avatar}
              isGroup={chat.isGroup}
              isGlobal={chat.isGlobal}
              size={128}
              isOnline={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
              showOnlineBadge={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
              className="shadow-xs border border-black/10"
            />
          </div>
          <h2 className="text-xl font-semibold text-[#111b21]">{chat.nickname || chat.name}</h2>
          {chat.nickname && (
            <p className="text-xs text-[#008069] mt-0.5 font-medium">
              Echter Name: {chat.name}
            </p>
          )}
          <p className="text-xs text-[#667781] mt-1">
            {chat.isGroup || chat.isGlobal ? (
              <span className="text-[#667781] font-medium">
                {chat.groupMembers && chat.groupMembers.length > 0
                  ? `Gruppe • ${chat.groupMembers.length} Teilnehmer`
                  : 'Gruppenchat'}
              </span>
            ) : chat.onlineStatus === 'online' ? (
              <span className="text-[#008069] font-medium">online</span>
            ) : chat.onlineStatus === 'typing' ? (
              <span className="text-[#008069] font-medium animate-pulse">tippt...</span>
            ) : (
              chat.lastSeen || 'offline'
            )}
          </p>
        </div>

        {/* Friend Nickname (Spitzname) Editor */}
        {!chat.isGroup && onSetNickname && (
          <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#54656f]">
                <UserCheck className="w-4 h-4 text-[#008069]" />
                <span>Persönlicher Spitzname</span>
              </div>
              {!isEditingNickname && (
                <button
                  type="button"
                  onClick={() => setIsEditingNickname(true)}
                  className="text-xs text-[#008069] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> {chat.nickname ? 'Ändern' : 'Hinzufügen'}
                </button>
              )}
            </div>

            {isEditingNickname ? (
              <form onSubmit={handleSaveNickname} className="space-y-2 mt-2">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder={`Spitzname für ${chat.name}`}
                  className="w-full text-xs px-3 py-2 border border-[#d1d7db] rounded-lg outline-none focus:border-[#00a884] text-[#111b21]"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 text-xs">
                  {chat.nickname && (
                    <button
                      type="button"
                      onClick={handleClearNickname}
                      className="px-2.5 py-1 text-[#667781] hover:text-rose-600 rounded transition-colors"
                    >
                      Löschen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingNickname(false)}
                    className="px-2.5 py-1 text-[#54656f] hover:bg-[#f0f2f5] rounded transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#008069] hover:bg-[#00a884] text-white rounded font-medium transition-colors shadow-2xs"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-[#111b21]">
                {chat.nickname ? (
                  <span className="font-semibold text-[#008069]">{chat.nickname}</span>
                ) : (
                  <span className="text-[#8696a0] italic">Kein Spitzname festgelegt (nur für dich sichtbar)</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Custom Wallpaper for this Chat */}
        {onSetWallpaper && (
          <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#54656f] mb-2.5">
              <Palette className="w-4 h-4 text-[#008069]" />
              <span>Chat-Hintergrund</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected =
                  (!chat.customWallpaper && preset.id === 'default') ||
                  chat.customWallpaper === preset.bg;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSetWallpaper(chat.id, preset.id === 'default' ? '' : preset.bg)}
                    className={`h-12 rounded-lg border flex flex-col items-center justify-center p-1 relative transition-transform ${
                      isSelected ? 'border-[#008069] ring-2 ring-[#00a884]/40 scale-102' : 'border-[#d1d7db] hover:opacity-90'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                  >
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: preset.textColor }}
                    >
                      {preset.label}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 absolute top-1 right-1 text-[#008069]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Friend Chat Statistics */}
        <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#54656f] mb-3">
            <BarChart2 className="w-4 h-4 text-[#008069]" />
            <span>Chat-Statistiken</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#f0f2f5] p-2.5 rounded-lg border border-[#e9edef]">
              <div className="text-base font-bold text-[#111b21]">{totalCount}</div>
              <div className="text-[10px] text-[#667781]">Nachrichten</div>
            </div>
            <div className="bg-[#f0f2f5] p-2.5 rounded-lg border border-[#e9edef]">
              <div className="text-base font-bold text-[#008069]">{mySentCount}</div>
              <div className="text-[10px] text-[#667781]">Von dir</div>
            </div>
            <div className="bg-[#f0f2f5] p-2.5 rounded-lg border border-[#e9edef]">
              <div className="text-base font-bold text-[#54656f]">{theirSentCount}</div>
              <div className="text-[10px] text-[#667781]">Empfangen</div>
            </div>
          </div>
        </div>

        {/* Info / Status */}
        <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
          <div className="text-xs font-medium text-[#667781] mb-1">
            {chat.isGroup ? 'Gruppenbeschreibung' : 'Info'}
          </div>
          <p className="text-sm text-[#111b21]">{chat.about || (chat.isGroup ? 'Offener Chatraum für alle' : 'Verfügbar')}</p>
        </div>

        {/* Group members section if applicable */}
        {chat.isGroup && chat.groupMembers && chat.groupMembers.length > 0 && (
          <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
            <div className="text-xs font-semibold text-[#54656f] uppercase tracking-wide mb-2">
              Mitglieder ({chat.groupMembers.length})
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {chat.groupMembers.map((member) => (
                <span
                  key={member}
                  className="px-2.5 py-1 text-xs bg-[#f0f2f5] text-[#111b21] rounded-full border border-[#d1d7db]"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Group Invite Link Box */}
        {(chat.isGroup || chat.isGlobal) && (
          <div className="bg-white px-6 py-4 shadow-xs border-y border-[#e9edef]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#54656f] uppercase tracking-wide mb-2.5">
              <Link className="w-4 h-4 text-[#008069]" />
              <span>Mit Link zur Gruppe einladen</span>
            </div>
            <div className="p-3 bg-[#f0f2f5] rounded-xl border border-[#d1d7db] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-[#111b21] truncate select-all">
                  {chatInviteLink}
                </p>
                <p className="text-[11px] text-[#667781] mt-0.5">
                  Jeder mit WhatsApp kann diesem Link folgen, um beizutreten.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-1.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Link kopieren"
              >
                {inviteCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Kopiert</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Media, Docs & Starred Tabs Container */}
        <div className="bg-white px-5 py-3 shadow-xs border-y border-[#e9edef]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#54656f] uppercase tracking-wide">
              Medien, Dokumente & Favoriten
            </span>
          </div>

          <div className="flex border-b border-[#e9edef] gap-4 text-xs font-medium text-[#54656f] mb-3">
            <button
              type="button"
              onClick={() => setActiveMediaTab('media')}
              className={`pb-2 transition-colors relative ${
                activeMediaTab === 'media' ? 'text-[#008069] font-semibold' : 'hover:text-[#111b21]'
              }`}
            >
              Medien ({mediaMessages.length})
              {activeMediaTab === 'media' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#008069]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('docs')}
              className={`pb-2 transition-colors relative ${
                activeMediaTab === 'docs' ? 'text-[#008069] font-semibold' : 'hover:text-[#111b21]'
              }`}
            >
              Dokumente ({docMessages.length})
              {activeMediaTab === 'docs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#008069]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('starred')}
              className={`pb-2 transition-colors relative ${
                activeMediaTab === 'starred' ? 'text-[#008069] font-semibold' : 'hover:text-[#111b21]'
              }`}
            >
              Favoriten ({starredMessages.length})
              {activeMediaTab === 'starred' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#008069]" />
              )}
            </button>
          </div>

          {/* Media Grid */}
          {activeMediaTab === 'media' && (
            <div>
              {mediaMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#667781]">
                  Keine geteilten Medien vorhanden
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                  {mediaMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => onOpenMedia(msg.mediaUrl!, msg.mediaCaption)}
                      className="aspect-square bg-black/5 rounded cursor-pointer overflow-hidden group/img relative"
                    >
                      <img
                        src={msg.mediaUrl}
                        alt="Medien"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Docs Tab */}
          {activeMediaTab === 'docs' && (
            <div>
              {docMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#667781]">
                  Keine geteilten Dokumente vorhanden
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {docMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-center gap-2 p-2 bg-[#f0f2f5] rounded-lg text-xs"
                    >
                      <FileText className="w-4 h-4 text-[#008069] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[#111b21] font-medium truncate">
                          {msg.documentName || 'Dokument'}
                        </div>
                        <div className="text-[10px] text-[#667781]">{msg.documentSize || 'PDF'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Starred Tab */}
          {activeMediaTab === 'starred' && (
            <div>
              {starredMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#667781]">
                  Keine markierten Nachrichten vorhanden
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {starredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2.5 bg-[#f0f2f5] rounded-lg text-xs border border-[#e9edef]"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#667781] mb-1">
                        <span>{msg.sender === 'me' ? 'Du' : chat.name}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-[#111b21]">{msg.text || (msg.type === 'image' ? '📷 Foto' : '📄 Dokument')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Settings / Quick Toggles */}
        <div className="bg-white shadow-xs border-y border-[#e9edef] divide-y divide-[#f0f2f5]">
          {/* Mute notifications */}
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
            }}
            className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-[#f5f6f6] transition-colors"
          >
            <div className="flex items-center gap-3 text-xs text-[#111b21]">
              {chat.isMuted ? (
                <BellOff className="w-4 h-4 text-[#8696a0]" />
              ) : (
                <Bell className="w-4 h-4 text-[#8696a0]" />
              )}
              <div className="text-left">
                <div>Benachrichtigungen stummschalten</div>
                {chat.isMuted && (
                  <div className="text-[11px] text-[#008069] font-medium">
                    {chat.mutedUntil === '8h'
                      ? 'Für 8 Stunden stumm'
                      : chat.mutedUntil === '1w'
                      ? 'Für 1 Woche stumm'
                      : 'Immer stumm'}
                  </div>
                )}
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${chat.isMuted ? 'bg-[#00a884]' : 'bg-[#d1d7db]'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.25 ${chat.isMuted ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>

          {/* Chat Lock */}
          {onToggleLockChat && (
            <button
              type="button"
              onClick={() => onToggleLockChat(chat.id)}
              className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-[#f5f6f6] transition-colors"
            >
              <div className="flex items-center gap-3 text-xs text-[#111b21]">
                {chat.isLocked ? (
                  <Lock className="w-4 h-4 text-[#008069]" />
                ) : (
                  <Unlock className="w-4 h-4 text-[#8696a0]" />
                )}
                <div className="text-left">
                  <div>Chat sperren</div>
                  <div className="text-[11px] text-[#667781]">
                    {chat.isLocked ? 'Gesperrt mit PIN' : 'Aus'}
                  </div>
                </div>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${chat.isLocked ? 'bg-[#00a884]' : 'bg-[#d1d7db]'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.25 ${chat.isLocked ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>
          )}

          {/* Chat-Labels */}
          {onSetChatLabel && (
            <div className="px-6 py-3.5 text-xs text-[#111b21]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-[#8696a0]" />
                  <span className="font-medium">Chat-Label</span>
                </div>
                {chat.label && (
                  <button
                    type="button"
                    onClick={() => onSetChatLabel(chat.id, undefined)}
                    className="text-[11px] text-[#008069] hover:underline cursor-pointer"
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(CHAT_LABELS).map(([key, item]) => {
                  const isSelected = chat.label === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSetChatLabel(chat.id, isSelected ? undefined : key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? `${item.badgeClass} ring-2 ring-[#00a884]/40 font-semibold`
                          : 'bg-[#f0f2f5] text-[#54656f] border-[#d1d7db] hover:bg-[#e9edef]'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disappearing messages */}
          <button
            type="button"
            onClick={onOpenDisappearingMessages}
            className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-[#f5f6f6] transition-colors text-xs text-[#111b21]"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#8696a0]" />
              <div>
                <div>Selbstlöschende Nachrichten</div>
                <div className="text-[11px] text-[#667781]">
                  {chat.disappearingTimer === '24h'
                    ? '24 Stunden'
                    : chat.disappearingTimer === '7d'
                    ? '7 Tage'
                    : chat.disappearingTimer === '90d'
                    ? '90 Tage'
                    : 'Aus'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696a0]" />
          </button>

          {/* Encryption info */}
          <div className="px-6 py-3.5 flex items-start gap-3 text-xs text-[#54656f]">
            <Shield className="w-4 h-4 text-[#008069] shrink-0 mt-0.5" />
            <div>
              <div className="text-[#111b21] font-medium">Verschlüsselung</div>
              <div className="text-[11px] text-[#667781] mt-0.5">
                Nachrichten sind durch Ende-zu-Ende-Verschlüsselung geschützt.
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone (Clear / Delete) */}
        <div className="bg-white shadow-xs border-y border-[#e9edef] divide-y divide-[#f0f2f5]">
          {chat.id !== 'chat_global_all' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Möchtest du wirklich alle Nachrichten in diesem Chat leeren?')) {
                    onClearChat(chat.id);
                  }
                }}
                className="w-full px-6 py-3.5 text-left text-xs text-amber-700 hover:bg-amber-50/50 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-amber-600" />
                <span>Chat-Verlauf leeren</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Möchtest du den Chat mit "${chat.name}" wirklich löschen?`)) {
                    onDeleteChat(chat.id);
                    onClose();
                  }
                }}
                className="w-full px-6 py-3.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Chat löschen</span>
              </button>
            </>
          ) : (
            <div className="px-6 py-3.5 text-xs text-[#667781] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#54656f]" />
              <span>Der "Alle"-Chat ist eine globale Gruppe und kann nicht gelöscht werden.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
