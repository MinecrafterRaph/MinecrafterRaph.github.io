import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  BarChart2,
  UserCheck,
  X,
  Trash2,
  Check,
  ChevronDown,
  Search,
  Pin,
  PinOff,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Sparkles,
  Film,
  Zap,
  MapPin,
  Clock,
} from 'lucide-react';
import { Chat, Message, QuotedMessage, WallpaperTheme, FontSize, LocationData, MessageType } from '../types';
import { MessageItem } from './MessageItem';
import { sounds } from '../utils/audio';
import { QUICK_REPLIES, QuickReply } from '../utils/quickReplies';
import { LocationShareModal } from './LocationShareModal';
import { ScheduleMessageModal } from './ScheduleMessageModal';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  wallpaperTheme?: WallpaperTheme;
  showDoodles?: boolean;
  fontSize?: FontSize;
  enterToSend?: boolean;
  dailyLocationLimit?: number;
  isSearchingInChat?: boolean;
  onCloseSearch?: () => void;
  onSendMessage: (
    text: string,
    type?: MessageType,
    extra?: {
      mediaUrl?: string;
      mediaCaption?: string;
      audioDuration?: number;
      documentName?: string;
      documentSize?: string;
      replyTo?: QuotedMessage;
      locationData?: LocationData;
    }
  ) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleStar: (messageId: string) => void;
  onTogglePinMessage?: (messageId: string, duration?: '24h' | '7d' | '30d') => void;
  onForwardMessage?: (message: Message) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onScheduleMessage?: (text: string, timestamp: number) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onOpenPollModal: () => void;
  onOpenMedia: (url: string, caption?: string) => void;
  onViewOnce?: (messageId: string) => void;
  onNavigateToChat?: (chatId: string) => void;
  onNavigateToChannel?: (channelId: string) => void;
  draftText?: string;
  onDraftChange?: (draft: string) => void;
}

const EMOJI_LIST = [
  '😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '☕', '✨', '😍',
  '🙌', '👏', '🥳', '😎', '💪', '👌', '🤔', '😅', '🌅', '🍕',
  '🎈', '🌟', '🚀', '💯', '🤩', '👋', '👀', '💖', '💐', '🎂'
];

const STICKER_LIST = [
  '🐱', '🎉', '☕', '❤️', '🚀', '🔥', '👍', '🐶',
  '😎', '🥳', '🍕', '🌟', '💎', '🙏', '💯', '🎈',
  '🦄', '🌈', '⚡', '🏖️', '🍩', '🥑', '🎯', '🏆'
];

const GIF_REACTIONS = [
  { title: 'Party', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=320&auto=format&fit=crop&q=80', caption: '🎉 Party!' },
  { title: 'Kaffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=320&auto=format&fit=crop&q=80', caption: '☕ Erstmal Kaffee...' },
  { title: 'Applaus', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=320&auto=format&fit=crop&q=80', caption: '👏 Applaus!' },
  { title: 'Sonnenuntergang', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&auto=format&fit=crop&q=80', caption: '🌅 Entspannung' },
  { title: 'Feier', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=320&auto=format&fit=crop&q=80', caption: '✨ Feier!' },
  { title: 'Musik', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=320&auto=format&fit=crop&q=80', caption: '🎵 Gute Musik' },
];

const WALLPAPER_MAP: Record<WallpaperTheme, string> = {
  classic: '#efeae2',
  salbei: '#d8e8e1',
  himmelblau: '#d7e8f6',
  pfirsich: '#fae3d9',
  dunkel: '#0b141a',
  dunkelgruen: '#103629',
  rein: '#ffffff',
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  wallpaperTheme = 'classic',
  showDoodles = true,
  fontSize = 'medium',
  enterToSend = true,
  dailyLocationLimit = 3,
  isSearchingInChat: controlledSearching,
  onCloseSearch,
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onToggleStar,
  onTogglePinMessage,
  onForwardMessage,
  onEditMessage,
  onScheduleMessage,
  onVotePoll,
  onOpenPollModal,
  onOpenMedia,
  onViewOnce,
  onNavigateToChat,
  onNavigateToChannel,
  draftText,
  onDraftChange,
}) => {
  const [inputText, setInputText] = useState(draftText || '');
  const [isViewOnceMode, setIsViewOnceMode] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Sync draft when switching chats
  useEffect(() => {
    setInputText(draftText || '');
    setShowQuickReplies(false);
    setQuickReplyFilter('');
  }, [chat.id, draftText]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState<'emoji' | 'sticker' | 'gif'>('emoji');
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<QuotedMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Search inside chat
  const [internalSearching, setInternalSearching] = useState(false);
  const isSearchingInChat = controlledSearching !== undefined ? controlledSearching : internalSearching;
  const [inChatSearchTerm, setInChatSearchTerm] = useState('');

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordTimerRef = useRef<number | null>(null);

  // File upload hidden ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const jumpToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  const pinnedMessage = chat.pinnedMessageId
    ? messages.find((m) => m.id === chat.pinnedMessageId)
    : messages.find((m) => m.isPinned);

  const wrapTextFormat = (prefix: string, suffix: string = prefix) => {
    setInputText((prev) => {
      if (!prev) return `${prefix}Text${suffix}`;
      return `${prev} ${prefix}Text${suffix}`;
    });
  };

  const handleSendSticker = (stickerEmoji: string) => {
    onSendMessage(stickerEmoji, 'sticker');
    setShowEmojiPicker(false);
  };

  const handleSendGif = (gifUrl: string, caption: string) => {
    onSendMessage(caption, 'image', { mediaUrl: gifUrl, mediaCaption: caption });
    setShowEmojiPicker(false);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottomBtn(distanceToBottom > 250);
  };

  // Start voice recording simulation
  const startRecording = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    recordTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    if (recordTimerRef.current !== null) {
      clearInterval(recordTimerRef.current);
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const finishRecording = () => {
    if (recordTimerRef.current !== null) {
      clearInterval(recordTimerRef.current);
    }
    const finalDuration = Math.max(2, recordingSeconds);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    // Send voice message
    sounds.playSentSound();
    onSendMessage('Sprachnachricht', 'voice', {
      audioDuration: finalDuration,
      replyTo: replyingTo || undefined,
    });
    setReplyingTo(null);
  };

  const filteredQuickReplies = QUICK_REPLIES.filter((qr) => {
    if (!quickReplyFilter) return true;
    return (
      qr.shortcut.toLowerCase().includes(quickReplyFilter) ||
      qr.title.toLowerCase().includes(quickReplyFilter) ||
      qr.text.toLowerCase().includes(quickReplyFilter)
    );
  });

  const applyQuickReply = (reply: QuickReply) => {
    setInputText(reply.text);
    if (onDraftChange) onDraftChange(reply.text);
    setShowQuickReplies(false);
    setQuickReplyFilter('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (onDraftChange) onDraftChange(val);

    if (val.startsWith('/')) {
      setShowQuickReplies(true);
      setQuickReplyFilter(val.slice(1).toLowerCase());
      setSelectedQuickReplyIndex(0);
    } else {
      setShowQuickReplies(false);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    sounds.playSentSound();
    onSendMessage(inputText.trim(), 'text', {
      replyTo: replyingTo || undefined,
      isViewOnce: isViewOnceMode,
    });
    setInputText('');
    setIsViewOnceMode(false);
    if (onDraftChange) onDraftChange('');
    setShowQuickReplies(false);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showQuickReplies && filteredQuickReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) => (prev + 1) % filteredQuickReplies.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) => (prev - 1 + filteredQuickReplies.length) % filteredQuickReplies.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyQuickReply(filteredQuickReplies[selectedQuickReplyIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowQuickReplies(false);
        return;
      }
    }

    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSendText();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        sounds.playSentSound();
        onSendMessage('', 'image', {
          mediaUrl: url,
          mediaCaption: file.name,
          replyTo: replyingTo || undefined,
          isViewOnce: isViewOnceMode,
        });
        setIsViewOnceMode(false);
        setReplyingTo(null);
      }
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    sounds.playSentSound();
    onSendMessage('', 'document', {
      documentName: file.name,
      documentSize: sizeMb,
      replyTo: replyingTo || undefined,
    });
    setReplyingTo(null);
    setShowAttachMenu(false);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Filter messages if search inside chat is active
  const filteredMessages = inChatSearchTerm.trim()
    ? messages.filter(
        (m) =>
          m.text?.toLowerCase().includes(inChatSearchTerm.toLowerCase()) ||
          m.mediaCaption?.toLowerCase().includes(inChatSearchTerm.toLowerCase()) ||
          m.documentName?.toLowerCase().includes(inChatSearchTerm.toLowerCase()) ||
          m.pollQuestion?.toLowerCase().includes(inChatSearchTerm.toLowerCase())
      )
    : messages;

  const activeWallpaperBg = chat.customWallpaper || WALLPAPER_MAP[wallpaperTheme] || '#efeae2';
  const isDarkWallpaper = wallpaperTheme === 'dunkel' || wallpaperTheme === 'dunkelgruen';

  const fontSizeClass =
    fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  return (
    <div
      className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: activeWallpaperBg }}
    >
      {/* Background SVG Dot Pattern Overlay */}
      {showDoodles && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDarkWallpaper ? 'opacity-[0.03] invert' : 'opacity-[0.06]'
          }`}
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')",
          }}
        />
      )}

      {/* Search in chat bar */}
      {isSearchingInChat && (
        <div className="px-4 py-2 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between text-xs z-20">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-white rounded-lg px-3 py-1.5 border border-[#d1d7db]">
            <Search className="w-4 h-4 text-[#54656f]" />
            <input
              type="text"
              value={inChatSearchTerm}
              onChange={(e) => setInChatSearchTerm(e.target.value)}
              placeholder="In diesem Chat suchen..."
              className="w-full text-xs outline-none bg-transparent text-[#111b21]"
              autoFocus
            />
            {inChatSearchTerm && (
              <>
                <span className="text-[11px] text-[#667781] shrink-0">
                  {filteredMessages.length} {filteredMessages.length === 1 ? 'Nachricht' : 'Nachrichten'}
                </span>
                <button
                  type="button"
                  onClick={() => setInChatSearchTerm('')}
                  className="text-[#54656f] hover:text-[#111b21]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setInternalSearching(false);
              if (onCloseSearch) onCloseSearch();
              setInChatSearchTerm('');
            }}
            className="p-1 text-[#54656f] hover:text-[#111b21] ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => jumpToMessage(pinnedMessage.id)}
          className="px-4 py-2 bg-white/95 backdrop-blur-xs border-b border-[#d1d7db] shadow-xs flex items-center justify-between text-xs z-20 cursor-pointer hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#008069]/10 flex items-center justify-center text-[#008069] shrink-0">
              <Pin className="w-3.5 h-3.5 fill-[#008069]" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-[#008069] mr-1.5">Angepinnte Nachricht:</span>
              <span className="text-[#54656f] truncate">
                {pinnedMessage.type === 'text'
                  ? pinnedMessage.text
                  : pinnedMessage.type === 'sticker'
                  ? `[Sticker ${pinnedMessage.text}]`
                  : pinnedMessage.type === 'call'
                  ? `[Anruf ${pinnedMessage.callType || ''}]`
                  : `[${pinnedMessage.type}]`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[11px] text-[#008069] font-medium hidden sm:inline hover:underline">
              Anzeigen
            </span>
            {onTogglePinMessage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePinMessage(pinnedMessage.id);
                }}
                className="p-1 text-[#667781] hover:text-[#111b21] rounded-full hover:bg-black/5"
                title="Loslösen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
      />

      {/* Wallpaper & Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`z-10 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col gap-2 relative ${fontSizeClass}`}
      >
        {/* Encryption notice banner */}
        <div className="flex justify-center mb-2">
          <div className="bg-[#ffeecd]/80 border border-[#f5dfb8] text-[#54656f] text-[11px] px-3.5 py-1.5 rounded-lg max-w-md text-center shadow-2xs select-none">
            🔒 Nachrichten sind Ende-zu-Ende-verschlüsselt. Niemand außerhalb dieses Chats kann sie lesen oder anhören.
          </div>
        </div>

        {/* Date Divider */}
        <div className="flex justify-center my-2">
          <div className="mx-auto mb-2 rounded bg-[#ffffff] px-3 py-1.5 text-[11px] uppercase tracking-wide shadow-sm text-[#54656f] select-none font-medium">
            Heute
          </div>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="text-center text-[#667781] text-xs py-8">
            {inChatSearchTerm ? 'Keine passenden Nachrichten gefunden' : 'Keine Nachrichten vorhanden'}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div id={`msg-${msg.id}`} key={msg.id}>
              <MessageItem
                message={msg}
                chatAvatar={chat.avatar}
                isGroup={chat.isGroup}
                isPinned={msg.id === chat.pinnedMessageId || msg.isPinned}
                isHighlighted={msg.id === highlightedMessageId}
                onTogglePin={onTogglePinMessage}
                onReply={(m) =>
                  setReplyingTo({
                    id: m.id,
                    senderName: m.sender === 'me' ? 'Du' : (chat.isGroup && m.senderName ? m.senderName : chat.name),
                    text: m.type === 'text' ? m.text : `[${m.type}]`,
                    type: m.type,
                  })
                }
                onReact={onReactMessage}
                onDelete={onDeleteMessage}
                onToggleStar={onToggleStar}
                onForward={onForwardMessage}
                onEditMessage={onEditMessage}
                onVotePoll={onVotePoll}
                onOpenMedia={onOpenMedia}
                onViewOnce={onViewOnce}
                onNavigateToChat={onNavigateToChat}
                onNavigateToChannel={onNavigateToChannel}
              />
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-[#d1d7db] flex items-center justify-center text-[#54656f] hover:text-[#00a884] hover:bg-[#f5f6f6] transition-all animate-in fade-in zoom-in"
          title="Nach unten scrollen"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Replying banner preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center justify-between text-xs z-20">
          <div className="border-l-4 border-[#00a884] bg-white px-3 py-1.5 rounded flex-1 mr-3">
            <span className="font-semibold text-[#008069]">{replyingTo.senderName}</span>
            <p className="text-[#54656f] truncate">{replyingTo.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-[#54656f] hover:text-[#111b21] rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formatting Toolbar Floating Preview */}
      {showFormatBar && !isRecordingVoice && (
        <div className="absolute bottom-[72px] left-20 z-30 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#d1d7db] shadow-lg animate-in fade-in slide-in-from-bottom-2 text-xs">
          <span className="text-[10px] text-[#667781] font-semibold uppercase tracking-wider mr-1">
            Format:
          </span>
          <button
            type="button"
            onClick={() => wrapTextFormat('*')}
            className="px-2 py-1 rounded hover:bg-[#f0f2f5] font-bold text-[#111b21] flex items-center gap-1"
            title="Fett (*Text*)"
          >
            <Bold className="w-3.5 h-3.5" /> Fett
          </button>
          <button
            type="button"
            onClick={() => wrapTextFormat('_')}
            className="px-2 py-1 rounded hover:bg-[#f0f2f5] italic text-[#111b21] flex items-center gap-1"
            title="Kursiv (_Text_)"
          >
            <Italic className="w-3.5 h-3.5" /> Kursiv
          </button>
          <button
            type="button"
            onClick={() => wrapTextFormat('~')}
            className="px-2 py-1 rounded hover:bg-[#f0f2f5] line-through text-[#111b21] flex items-center gap-1"
            title="Durchgestrichen (~Text~)"
          >
            <Strikethrough className="w-3.5 h-3.5" /> Durchgestrichen
          </button>
          <button
            type="button"
            onClick={() => wrapTextFormat('```')}
            className="px-2 py-1 rounded hover:bg-[#f0f2f5] font-mono text-[#111b21] flex items-center gap-1"
            title="Monospace (```Text```)"
          >
            <Code className="w-3.5 h-3.5" /> Code
          </button>
          <div className="h-4 w-px bg-[#d1d7db] mx-1" />
          <button
            type="button"
            onClick={() => setShowFormatBar(false)}
            className="text-[#667781] hover:text-[#111b21] p-1 rounded hover:bg-[#f0f2f5]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji, Sticker & GIF Picker Popover */}
      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-25 cursor-default"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div
            className="absolute bottom-16 left-4 z-30 bg-white border border-[#d1d7db] rounded-xl shadow-xl p-3 w-80 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header with 3 Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f5] mb-2">
            <div className="flex items-center gap-1 bg-[#f0f2f5] p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setEmojiTab('emoji')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  emojiTab === 'emoji' ? 'bg-white shadow-2xs text-[#111b21]' : 'text-[#667781] hover:text-[#111b21]'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                Smileys
              </button>
              <button
                type="button"
                onClick={() => setEmojiTab('sticker')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  emojiTab === 'sticker' ? 'bg-white shadow-2xs text-[#111b21]' : 'text-[#667781] hover:text-[#111b21]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sticker
              </button>
              <button
                type="button"
                onClick={() => setEmojiTab('gif')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  emojiTab === 'gif' ? 'bg-white shadow-2xs text-[#111b21]' : 'text-[#667781] hover:text-[#111b21]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                GIFs
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="text-[#54656f] hover:text-[#111b21] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Emoji Grid */}
          {emojiTab === 'emoji' && (
            <div className="grid grid-cols-6 gap-2 text-xl max-h-48 overflow-y-auto p-1">
              {EMOJI_LIST.map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + em.trim());
                  }}
                  className="hover:scale-125 transition-transform p-1.5 text-center rounded hover:bg-[#f0f2f5]"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Tab 2: Stickers Grid */}
          {emojiTab === 'sticker' && (
            <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
              {STICKER_LIST.map((stk, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendSticker(stk)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#f8f9fa] hover:bg-[#e9edef] hover:scale-110 transition-all border border-[#e2e8f0]"
                  title={`Sticker ${stk}`}
                >
                  <span className="text-3xl select-none">{stk}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab 3: GIFs Grid */}
          {emojiTab === 'gif' && (
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
              {GIF_REACTIONS.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendGif(g.url, g.caption)}
                  className="relative group rounded-lg overflow-hidden border border-[#d1d7db] hover:border-[#00a884] transition-all"
                >
                  <img
                    src={g.url}
                    alt={g.title}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 truncate text-left">
                    {g.caption}
                  </div>
                </button>
              ))}
            </div>
          )}
          </div>
        </>
      )}

      {/* Attach Menu Popover */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-25 cursor-default"
            onClick={() => setShowAttachMenu(false)}
          />
          <div
            className="absolute bottom-16 left-12 z-30 bg-white border border-[#d1d7db] rounded-xl shadow-xl p-2 w-52 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Fotos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Dokument</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenPollModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Umfrage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onSendMessage('Hier ist der geteilte Kontakt: Sarah Meier (+49 170 3456789)', 'text');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span>Kontakt teilen</span>
          </button>

          {/* Location Sharing Button (WIP with daily credit limits) */}
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowLocationModal(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold leading-tight">Standort teilen</div>
                <div className="text-[10px] text-[#667781]">Echten GPS-Standort senden</div>
              </div>
            </div>
            <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-2xs">
              WIP
            </span>
          </button>

          {/* Schedule Message Option */}
          {onScheduleMessage && (
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setShowScheduleModal(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f6] text-[#111b21] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold leading-tight">Nachricht planen</div>
                <div className="text-[10px] text-[#667781]">Automatisch zur gewünschten Zeit senden</div>
              </div>
            </button>
          )}
          </div>
        </>
      )}

      {/* View Once active indicator pill */}
      {isViewOnceMode && (
        <div className="px-4 py-1.5 bg-[#008069]/10 border-t border-[#008069]/20 flex items-center justify-between text-xs text-[#008069] z-20 animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#008069] flex items-center justify-center font-bold text-[10px] bg-[#008069]/15">
              1
            </div>
            <span>Einmalige Ansicht aktiviert — Empfänger kann Nachricht nur 1x öffnen</span>
          </div>
          <button
            type="button"
            onClick={() => setIsViewOnceMode(false)}
            className="p-1 hover:bg-[#008069]/10 rounded-full text-[#008069]"
            title="Deaktivieren"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Input Area */}
      <footer className="z-10 flex min-h-[62px] items-center bg-[#f0f2f5] px-4 py-2 border-t border-[#d1d7db] select-none">
        {isRecordingVoice ? (
          /* Voice Recording Mode Bar */
          <div className="flex-1 flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-[#d1d7db] animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm font-semibold text-[#111b21]">
                {formatTimer(recordingSeconds)}
              </span>
              <span className="text-xs text-[#667781] hidden sm:inline">
                Sprachaufnahme läuft...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 text-[#54656f] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                title="Abbrechen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={finishRecording}
                className="p-2 bg-[#00a884] text-white hover:bg-[#008069] rounded-full transition-colors shadow-sm"
                title="Sprachnachricht senden"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <>
            {/* Action buttons (Emoji + Attachment + Formatting toggle) */}
            <div className="flex gap-3 text-[#54656f] items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((p) => !p);
                  setShowAttachMenu(false);
                }}
                className={`hover:text-[#111b21] transition-colors p-1 rounded-full ${
                  showEmojiPicker ? 'text-[#00a884] bg-black/5' : ''
                }`}
                title="Emoji & Sticker"
              >
                <Smile className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu((p) => !p);
                  setShowEmojiPicker(false);
                }}
                className={`hover:text-[#111b21] transition-colors p-1 rounded-full ${
                  showAttachMenu ? 'text-[#00a884] bg-black/5' : ''
                }`}
                title="Anhängen"
              >
                <Paperclip className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => setShowFormatBar((p) => !p)}
                className={`hover:text-[#111b21] transition-colors p-1 rounded-full ${
                  showFormatBar ? 'text-[#00a884] bg-black/5' : ''
                }`}
                title="Text formatieren (*Fett*, _Kursiv_, etc.)"
              >
                <Bold className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickReplies((p) => !p);
                  setQuickReplyFilter('');
                }}
                className={`hover:text-[#111b21] transition-colors p-1 rounded-full ${
                  showQuickReplies ? 'text-[#00a884] bg-black/5' : ''
                }`}
                title="Schnellantworten (/danke, /ok, etc.)"
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Replies Popup Menu */}
            {showQuickReplies && (
              <div className="absolute bottom-[72px] left-4 right-4 sm:left-16 sm:right-auto sm:w-96 bg-white rounded-xl shadow-xl border border-[#d1d7db] z-40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-2 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between text-xs text-[#54656f]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-[#008069]" />
                    <span>Schnellantworten</span>
                    <span className="text-[11px] text-[#667781]">(Tippe / im Textfeld)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickReplies(false)}
                    className="p-1 hover:bg-black/5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#f0f2f5]">
                  {filteredQuickReplies.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#667781]">
                      Keine passende Schnellantwort gefunden
                    </div>
                  ) : (
                    filteredQuickReplies.map((reply, idx) => (
                      <button
                        key={reply.shortcut}
                        type="button"
                        onClick={() => applyQuickReply(reply)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col gap-0.5 ${
                          idx === selectedQuickReplyIndex ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#008069]">{reply.shortcut}</span>
                          <span className="text-[10px] text-[#667781]">{reply.title}</span>
                        </div>
                        <span className="text-[#111b21] truncate">{reply.text}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Text Input Wrapper */}
            <div className="mx-2 flex-1 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-2xs border border-transparent focus-within:border-[#00a884] transition-colors">
              <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Schreibe eine Nachricht (*fett*, _kursiv_, ~durchgestrichen~, / für Schnellantworten)"
                rows={1}
                className="w-full text-sm text-[#111b21] placeholder:text-[#667781] bg-transparent outline-none resize-none leading-5 max-h-24 block"
                style={{ height: 'auto' }}
              />

              {/* View Once circled 1 toggle button */}
              <button
                type="button"
                onClick={() => setIsViewOnceMode((p) => !p)}
                className={`p-1 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  isViewOnceMode
                    ? 'bg-[#00a884] text-white shadow-xs'
                    : 'text-[#54656f] hover:text-[#00a884] hover:bg-black/5'
                }`}
                title={
                  isViewOnceMode
                    ? 'Einmalige Ansicht aktiviert (Tippen zum Deaktivieren)'
                    : 'Zur einmaligen Ansicht senden'
                }
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 border-dashed flex items-center justify-center font-bold text-[11px] leading-none ${
                    isViewOnceMode ? 'border-white text-white' : 'border-[#54656f] text-[#54656f]'
                  }`}
                >
                  1
                </div>
              </button>
            </div>

            {/* Dynamic Send / Mic button */}
            <div className="text-[#54656f] shrink-0">
              {inputText.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={handleSendText}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Senden"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="hover:text-[#00a884] transition-colors p-2"
                  title="Sprachnachricht aufnehmen"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        )}
      </footer>

      {/* Real-time Location Share Modal [WIP] */}
      <LocationShareModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        dailyLimit={dailyLocationLimit}
        onSendLocation={(locData, text) => {
          onSendMessage(text || 'Geteilter Standort', 'location', {
            locationData: locData,
          });
        }}
      />

      {/* Schedule Message Modal */}
      {onScheduleMessage && (
        <ScheduleMessageModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          initialText={inputText}
          onSchedule={(text, time) => {
            onScheduleMessage(text, time);
            setInputText('');
            if (onDraftChange) onDraftChange('');
          }}
        />
      )}
    </div>
  );
};
