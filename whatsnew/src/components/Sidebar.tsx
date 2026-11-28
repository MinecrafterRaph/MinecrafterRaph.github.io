import React, { useState } from 'react';
import {
  CircleDashed,
  MessageSquarePlus,
  MoreVertical,
  Search,
  Filter,
  Pin,
  BellOff,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  FileText,
  BarChart2,
  ChevronDown,
  Trash2,
  Settings,
  Archive,
  ArchiveRestore,
  Laptop,
  ArrowLeft,
  Star,
  LogOut,
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Tag,
  Sparkles,
  HardDrive,
  Bot,
} from 'lucide-react';
import { Chat, Message, User, MetaAiConfig } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { CHAT_LABELS } from '../utils/labels';
import { ChatLockModal } from './ChatLockModal';

interface SidebarProps {
  currentUser?: User | null;
  onLogout?: () => void;
  chats: Chat[];
  activeChatId: string | null;
  lastMessages: Record<string, Message | undefined>;
  hasUnviewedStories: boolean;
  onSelectChat: (chatId: string) => void;
  onOpenNewChatModal: (tab?: 'direct' | 'group') => void;
  onOpenStatusModal: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel?: () => void;
  onTogglePinChat: (chatId: string) => void;
  onToggleMuteChat: (chatId: string) => void;
  onToggleFavoriteChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onMarkChatAsRead: (chatId: string) => void;
  onMarkChatAsUnread: (chatId: string) => void;
  onMarkAllAsRead: () => void;
  onToggleArchiveChat?: (chatId: string) => void;
  isArchivedView?: boolean;
  onBackFromArchived?: () => void;
  onOpenArchived?: () => void;
  archivedCount?: number;
  onOpenLinkedDevices?: () => void;
  compactMode?: boolean;
  drafts?: Record<string, string>;
  onSetChatLabel?: (chatId: string, label?: string) => void;
  onToggleLockChat?: (chatId: string) => void;
  onOpenMuteModal?: (chatId: string) => void;
  screenLockPin?: string;
  onOpenMetaAI?: () => void;
  metaAiConfig?: MetaAiConfig;
  onOpenStorageData?: () => void;
  storageDataEnabled?: boolean;
}

type FilterTab =
  | 'all'
  | 'unread'
  | 'favorites'
  | 'groups'
  | 'wichtig'
  | 'arbeit'
  | 'familie'
  | 'freunde'
  | 'projekt';

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  chats,
  activeChatId,
  lastMessages,
  hasUnviewedStories,
  onSelectChat,
  onOpenNewChatModal,
  onOpenStatusModal,
  onOpenSettings,
  onOpenAdminPanel,
  onTogglePinChat,
  onToggleMuteChat,
  onToggleFavoriteChat,
  onDeleteChat,
  onMarkChatAsRead,
  onMarkChatAsUnread,
  onMarkAllAsRead,
  onToggleArchiveChat,
  isArchivedView = false,
  onBackFromArchived,
  onOpenArchived,
  archivedCount = 0,
  onOpenLinkedDevices,
  compactMode = false,
  drafts,
  onSetChatLabel,
  onToggleLockChat,
  onOpenMuteModal,
  screenLockPin = '1234',
  onOpenMetaAI,
  metaAiConfig,
  onOpenStorageData,
  storageDataEnabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [labelSubmenuChatId, setLabelSubmenuChatId] = useState<string | null>(null);
  const [isLockedUnlocked, setIsLockedUnlocked] = useState(false);
  const [isChatLockModalOpen, setIsChatLockModalOpen] = useState(false);

  const lockedChatsCount = chats.filter((c) => c.isLocked).length;

  // Filter chats by search query and category
  const filteredChats = chats
    .filter((chat) => {
      // If chat is locked and folder is not unlocked, hide it
      if (chat.isLocked && !isLockedUnlocked) return false;

      // Category filter
      if (activeFilter === 'unread' && chat.unreadCount === 0) return false;
      if (activeFilter === 'favorites' && !chat.isFavorite) return false;
      if (activeFilter === 'groups' && !chat.isGroup) return false;
      if (['wichtig', 'arbeit', 'familie', 'freunde', 'projekt'].includes(activeFilter)) {
        if (chat.label !== activeFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = chat.name.toLowerCase().includes(q);
        const lastMsg = lastMessages[chat.id];
        const matchesMsg = lastMsg?.text.toLowerCase().includes(q);
        return matchesName || matchesMsg;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned chats first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const renderLastMessagePreview = (chatId: string) => {
    if (drafts && drafts[chatId]?.trim()) {
      return (
        <div className="flex items-center gap-1 min-w-0 text-xs truncate">
          <span className="text-[#00a884] font-semibold shrink-0">Entwurf:</span>
          <span className="text-[#111b21] truncate">{drafts[chatId]}</span>
        </div>
      );
    }

    const chat = chats.find((c) => c.id === chatId);
    if (!chat?.isGroup && !chat?.isGlobal && chat?.onlineStatus === 'typing') {
      return <span className="text-[#008069] font-medium">tippt...</span>;
    }

    const msg = lastMessages[chatId];
    if (!msg) return <span className="italic text-[#8696a0]">Keine Nachrichten</span>;

    const isMe = msg.sender === 'me';

    return (
      <div className="flex items-center gap-1 min-w-0 text-[#667781] text-xs truncate">
        {isMe && (
          <span className="shrink-0">
            {msg.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#8696a0]" />
            )}
          </span>
        )}

        {msg.type === 'voice' && (
          <span className="flex items-center gap-1 text-[#54656f]">
            <Mic className="w-3.5 h-3.5 text-[#00a884]" /> Sprachnachricht ({msg.audioDuration || 12}s)
          </span>
        )}
        {msg.type === 'image' && (
          <span className="flex items-center gap-1 text-[#54656f]">
            <ImageIcon className="w-3.5 h-3.5 text-[#54656f]" /> Foto
            {msg.mediaCaption ? `: ${msg.mediaCaption}` : ''}
          </span>
        )}
        {msg.type === 'document' && (
          <span className="flex items-center gap-1 text-[#54656f]">
            <FileText className="w-3.5 h-3.5 text-[#54656f]" /> {msg.documentName || 'Dokument'}
          </span>
        )}
        {msg.type === 'poll' && (
          <span className="flex items-center gap-1 text-[#54656f]">
            <BarChart2 className="w-3.5 h-3.5 text-[#00a884]" /> Umfrage: {msg.pollQuestion}
          </span>
        )}
        {msg.type === 'text' && <span className="truncate">{msg.text}</span>}
      </div>
    );
  };

  return (
    <div
      className="w-full md:w-[350px] lg:w-[380px] h-full bg-white border-r border-[#d1d7db] flex flex-col shrink-0 select-none"
      onClick={() => setContextMenuChatId(null)}
    >
      {/* Top Bar */}
      {isArchivedView ? (
        <header className="h-[60px] px-4 bg-[#008069] text-white flex items-center gap-3 shrink-0 relative z-20 shadow-xs">
          {onBackFromArchived && (
            <button
              type="button"
              onClick={onBackFromArchived}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="Zurück zu Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold">Archiviert</h1>
            <p className="text-[11px] text-white/80">
              {filteredChats.length} archivierte(r) Chat(s)
            </p>
          </div>
        </header>
      ) : (
        <header
          className={`h-[60px] px-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between shrink-0 relative transition-all ${
            showTopMenu ? 'z-40' : 'z-20'
          }`}
        >
        {/* User Profile Avatar & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-[#00a884] shrink-0"
            title="Profil & Einstellungen"
          >
            <WhatsAppAvatar
              name={currentUser?.name}
              avatarUrl={currentUser?.avatar}
              isAdmin={currentUser?.isAdmin}
              size="md"
            />
          </button>
          <span className="font-medium text-sm text-[#111b21] truncate hidden sm:inline-block max-w-[120px]">
            {currentUser?.name || 'Ich'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3 sm:gap-4 text-[#54656f]">
          {/* Admin badge button if admin */}
          {currentUser?.isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#008069] hover:bg-[#00a884] text-white text-[11px] font-bold rounded-full shadow-2xs transition-colors"
              title="Admin-Bereich öffnen"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* Status / Story trigger */}
          <button
            type="button"
            onClick={onOpenStatusModal}
            className="p-1 hover:text-[#111b21] hover:bg-black/5 rounded-full transition-colors relative"
            title="Status"
          >
            <CircleDashed className="w-5 h-5" />
            {hasUnviewedStories && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00a884] ring-2 ring-[#f0f2f5]" />
            )}
          </button>

          {/* New Chat trigger */}
          <button
            type="button"
            onClick={onOpenNewChatModal}
            className="p-1 hover:text-[#111b21] hover:bg-black/5 rounded-full transition-colors"
            title="Person hinzufügen / Neuer Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Meta AI trigger */}
          {onOpenMetaAI && (
            <button
              type="button"
              onClick={onOpenMetaAI}
              className="p-1 hover:bg-black/5 rounded-full transition-all group relative cursor-pointer"
              title="Meta AI"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#008069] via-[#00a884] to-blue-500 flex items-center justify-center p-[2px] shadow-2xs group-hover:scale-110 transition-transform">
                <div className="w-full h-full bg-[#f0f2f5] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-[#008069]" />
                </div>
              </div>
            </button>
          )}

          {/* More menu trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTopMenu((p) => !p);
              }}
              className="p-1 hover:text-[#111b21] hover:bg-black/5 rounded-full transition-colors"
              title="Menü"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showTopMenu && (
              <>
                {/* Backdrop overlay to close menu on click outside */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTopMenu(false);
                  }}
                />
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-2xl border border-[#d1d7db] py-1.5 z-50 text-xs text-[#111b21] animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentUser?.isAdmin && onOpenAdminPanel && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAdminPanel();
                        setShowTopMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5 text-[#008069] font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#008069]" /> Admin-Bereich öffnen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewChatModal('group');
                      setShowTopMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-[#54656f]" /> Neue Gruppe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewChatModal('direct');
                      setShowTopMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-[#54656f]" /> Neuer Chat / Person
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAllAsRead();
                      setShowTopMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5"
                  >
                    <CheckCheck className="w-4 h-4 text-[#54656f]" /> Alle als gelesen markieren
                  </button>
                  {onOpenLinkedDevices && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLinkedDevices();
                        setShowTopMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5"
                    >
                      <Laptop className="w-4 h-4 text-[#54656f]" /> Verknüpfte Geräte
                    </button>
                  )}
                  {onOpenMetaAI && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMetaAI();
                        setShowTopMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5 text-[#111b21]"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Meta AI
                    </button>
                  )}
                  {storageDataEnabled && onOpenStorageData && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenStorageData();
                        setShowTopMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2.5 text-[#111b21]"
                    >
                      <HardDrive className="w-4 h-4 text-[#008069]" /> Speicherdaten verwalten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setShowTopMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#008069]/10 text-[#008069] flex items-center gap-2.5 font-medium border-t border-[#f0f2f5]"
                  >
                    <Settings className="w-4 h-4 text-[#008069]" /> Einstellungen
                  </button>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setShowTopMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 border-t border-[#f0f2f5]"
                    >
                      <LogOut className="w-4 h-4" /> Abmelden ({currentUser?.name})
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Search Input Bar */}
      <div className="p-2 bg-white border-b border-[#f0f2f5] flex items-center gap-2">
        <div className="relative flex items-center flex-1 rounded-lg bg-[#f0f2f5] px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00a884] border border-transparent focus-within:border-[#00a884] transition-all">
          <Search className="w-5 h-5 text-[#54656f] mr-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche oder starte einen neuen Chat"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#667781] text-[#111b21]"
          />
        </div>
        <button
          type="button"
          onClick={() => setActiveFilter((prev) => (prev === 'unread' ? 'all' : 'unread'))}
          className={`p-1.5 rounded-lg transition-colors ${
            activeFilter === 'unread'
              ? 'bg-[#00a884] text-white'
              : 'text-[#54656f] hover:bg-[#f0f2f5]'
          }`}
          title="Ungelesene filtern"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Category Pills */}
      <div className="px-3 py-1.5 bg-white border-b border-[#f0f2f5] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'all', label: 'Alle' },
            { id: 'unread', label: 'Ungelesen' },
            { id: 'favorites', label: 'Favoriten' },
            { id: 'groups', label: 'Gruppen' },
            { id: 'wichtig', label: 'Wichtig' },
            { id: 'arbeit', label: 'Arbeit' },
            { id: 'familie', label: 'Familie' },
            { id: 'freunde', label: 'Freunde' },
            { id: 'projekt', label: 'Projekt' },
          ] as const
        ).map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#d9fdd3] text-[#008069]'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chats Scroll List */}
      <div className="flex-1 overflow-y-auto">
        {/* Locked Chats Folder Banner */}
        {!isArchivedView && lockedChatsCount > 0 && (
          <div
            onClick={() => {
              if (isLockedUnlocked) {
                setIsLockedUnlocked(false);
              } else {
                setIsChatLockModalOpen(true);
              }
            }}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#f0f2f5] border-b border-[#f0f2f5] transition-colors group select-none"
          >
            <div className="flex items-center gap-4 text-sm font-medium text-[#111b21]">
              <Lock className="w-5 h-5 text-[#008069]" />
              <span>Gesperrte Chats</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#54656f] bg-[#f0f2f5] px-2 py-0.5 rounded-full border border-[#d1d7db]">
                {lockedChatsCount}
              </span>
              <span className="text-xs text-[#008069] font-medium">
                {isLockedUnlocked ? 'Sperren' : 'Entsperren'}
              </span>
            </div>
          </div>
        )}

        {!isArchivedView && archivedCount > 0 && onOpenArchived && (
          <div
            onClick={onOpenArchived}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#f0f2f5] border-b border-[#f0f2f5] transition-colors group select-none"
          >
            <div className="flex items-center gap-4 text-sm font-medium text-[#111b21]">
              <Archive className="w-5 h-5 text-[#008069]" />
              <span>Archiviert</span>
            </div>
            <span className="text-xs text-[#008069] font-semibold bg-[#d9fdd3] px-2 py-0.5 rounded-full">
              {archivedCount}
            </span>
          </div>
        )}
        {filteredChats.length === 0 ? (
          chats.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center select-none">
              <div className="w-12 h-12 rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center mb-3">
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#111b21] mb-1">Noch keine Chats</p>
              <p className="text-xs text-[#667781] mb-4 max-w-[220px]">
                Klicke auf den Button, um eine Person nach Namen hinzuzufügen.
              </p>
              <button
                type="button"
                onClick={onOpenNewChatModal}
                className="px-4 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Person hinzufügen</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#667781]">
              Keine Chats für diesen Filter gefunden.
            </div>
          )
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const lastMsg = lastMessages[chat.id];

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex ${compactMode ? 'h-[58px]' : 'h-[72px]'} items-center px-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#f0f2f5]'
                    : 'bg-white hover:bg-[#f5f6f6]'
                } ${contextMenuChatId === chat.id ? 'z-30' : 'z-0'}`}
              >
                {/* Avatar with WhatsApp icon system */}
                <div className="relative shrink-0">
                  <WhatsAppAvatar
                    name={chat.name}
                    avatarUrl={chat.avatar}
                    isGroup={chat.isGroup}
                    isGlobal={chat.isGlobal}
                    size={compactMode ? 'md' : 'lg'}
                    isOnline={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
                    showOnlineBadge={!chat.isGroup && !chat.isGlobal && chat.onlineStatus === 'online'}
                  />
                </div>

                {/* Info and Preview */}
                <div
                  className={`ml-3 flex-1 border-b ${compactMode ? 'py-1.5' : 'py-3'} min-w-0 ${
                    isActive ? 'border-transparent' : 'border-[#f0f2f5]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-[#111b21] truncate flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{chat.nickname || chat.name}</span>
                      {chat.nickname && (
                        <span className="text-[10px] text-[#008069] bg-[#d9fdd3] px-1 py-0.2 rounded font-normal shrink-0" title={`Original: ${chat.name}`}>
                          Spitzname
                        </span>
                      )}
                      {chat.isGroup && (
                        <span className="text-[10px] font-semibold bg-[#008069]/10 text-[#008069] px-1.5 py-0.2 rounded shrink-0">
                          Gruppe
                        </span>
                      )}
                      {chat.label && CHAT_LABELS[chat.label] && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border shrink-0 ${CHAT_LABELS[chat.label].badgeClass}`}>
                          {CHAT_LABELS[chat.label].name}
                        </span>
                      )}
                      {chat.isLocked && (
                        <Lock className="w-3 h-3 text-[#008069] shrink-0" title="Gesperrter Chat" />
                      )}
                    </span>
                    <span
                      className={`text-xs shrink-0 ml-2 ${
                        chat.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#667781]'
                      }`}
                    >
                      {lastMsg ? lastMsg.timestamp : ''}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-[#667781] mt-0.5">
                    <div className="flex-1 min-w-0 pr-2">
                      {renderLastMessagePreview(chat.id)}
                    </div>

                    {/* Right side indicators */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {chat.isMuted && <BellOff className="w-3.5 h-3.5 text-[#8696a0]" />}
                      {chat.isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0] fill-[#8696a0]" />}
                      {chat.isFavorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      {chat.unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-[10px] text-white font-semibold">
                          {chat.unreadCount}
                        </span>
                      )}

                      {/* Dropdown trigger on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuChatId(contextMenuChatId === chat.id ? null : chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded-full text-[#54656f] transition-opacity"
                        title="Optionen"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Context Menu Popover */}
                {contextMenuChatId === chat.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuChatId(null);
                        setLabelSubmenuChatId(null);
                      }}
                    />
                    <div
                      className="absolute right-4 top-12 w-52 bg-white rounded-xl shadow-2xl border border-[#d1d7db] py-1.5 z-40 text-xs text-[#111b21] animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onTogglePinChat(chat.id);
                          setContextMenuChatId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {chat.isPinned ? 'Chat lösen' : 'Chat anheften'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onToggleFavoriteChat(chat.id);
                          setContextMenuChatId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {chat.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                      </button>

                      {onToggleArchiveChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleArchiveChat(chat.id);
                            setContextMenuChatId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                        >
                          {chat.isArchived ? (
                            <>
                              <ArchiveRestore className="w-3.5 h-3.5" /> Chat aus Archiv holen
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5" /> Chat archivieren
                            </>
                          )}
                        </button>
                      )}

                      {/* Label assignment */}
                      {onSetChatLabel && (
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLabelSubmenuChatId(labelSubmenuChatId === chat.id ? null : chat.id);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-[#54656f]" />
                              Label zuweisen
                            </span>
                            <ChevronDown className={`w-3 h-3 text-[#54656f] transition-transform ${labelSubmenuChatId === chat.id ? 'rotate-180' : ''}`} />
                          </button>

                          {labelSubmenuChatId === chat.id && (
                            <div className="px-3 py-1.5 bg-[#f0f2f5] border-y border-[#e9edef] space-y-1">
                              {Object.values(CHAT_LABELS).map((lbl) => (
                                <button
                                  key={lbl.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetChatLabel(chat.id, chat.label === lbl.id ? undefined : lbl.id);
                                    setLabelSubmenuChatId(null);
                                    setContextMenuChatId(null);
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetChatLabel(chat.id, undefined);
                                    setLabelSubmenuChatId(null);
                                    setContextMenuChatId(null);
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

                      {/* Lock Chat */}
                      {onToggleLockChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleLockChat(chat.id);
                            setContextMenuChatId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                        >
                          {chat.isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Chat entsperren
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Chat sperren
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (chat.isMuted) {
                            onToggleMuteChat(chat.id);
                          } else if (onOpenMuteModal) {
                            onOpenMuteModal(chat.id);
                          } else {
                            onToggleMuteChat(chat.id);
                          }
                          setContextMenuChatId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                      >
                        <BellOff className="w-3.5 h-3.5" />
                        {chat.isMuted ? 'Stummschaltung aufheben' : 'Stummschalten...'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (chat.unreadCount > 0) {
                            onMarkChatAsRead(chat.id);
                          } else {
                            onMarkChatAsUnread(chat.id);
                          }
                          setContextMenuChatId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] flex items-center gap-2"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {chat.unreadCount > 0 ? 'Als gelesen markieren' : 'Als ungelesen markieren'}
                      </button>

                      {chat.id !== 'chat_global_all' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Chat mit "${chat.name}" wirklich löschen?`)) {
                              onDeleteChat(chat.id);
                            }
                            setContextMenuChatId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-[#f0f2f5]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Chat löschen
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <ChatLockModal
        isOpen={isChatLockModalOpen}
        onClose={() => setIsChatLockModalOpen(false)}
        onSuccess={() => {
          setIsChatLockModalOpen(false);
          setIsLockedUnlocked(true);
        }}
        expectedPin={screenLockPin}
      />
    </div>
  );
};
