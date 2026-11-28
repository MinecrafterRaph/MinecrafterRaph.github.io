import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  Smile,
  Reply,
  Star,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Pencil,
  Copy,
  X,
  Pin,
  PinOff,
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  Forward,
  MapPin,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import { Message, PollOption } from '../types';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { formatWhatsAppText } from '../utils/textFormatter';
import { parseInviteLink } from '../utils/inviteLinks';
import { WhatsAppInviteCard } from './WhatsAppInviteCard';

interface MessageItemProps {
  message: Message;
  chatAvatar?: string;
  isGroup?: boolean;
  isPinned?: boolean;
  isHighlighted?: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onToggleStar: (messageId: string) => void;
  onTogglePin?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onOpenMedia: (url: string, caption?: string) => void;
  onViewOnce?: (messageId: string) => void;
  onNavigateToChat?: (chatId: string) => void;
  onNavigateToChannel?: (channelId: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  chatAvatar,
  isGroup = false,
  isPinned = false,
  isHighlighted = false,
  onReply,
  onReact,
  onDelete,
  onToggleStar,
  onTogglePin,
  onForward,
  onEditMessage,
  onVotePoll,
  onOpenMedia,
  onViewOnce,
  onNavigateToChat,
  onNavigateToChannel,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [justCopied, setJustCopied] = useState(false);

  const isMe = message.sender === 'me';
  const effectivePinned = isPinned || message.isPinned;

  if (message.deleted) {
    return (
      <div className={`flex my-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`px-3 py-1.5 rounded-lg text-xs italic text-[#667781] max-w-[80%] border border-[#0000000a] ${
            isMe ? 'bg-[#eef8ed]' : 'bg-[#f5f6f6]'
          }`}
        >
          🚫 Diese Nachricht wurde gelöscht.
        </div>
      </div>
    );
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim() && onEditMessage) {
      onEditMessage(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text || '');
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
    setShowMenu(false);
  };

  // Calculate total votes for poll
  const totalPollVotes = message.pollOptions?.reduce((acc, opt) => acc + opt.votes, 0) || 0;

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex my-1 px-3 transition-all duration-300 ${
        isMe ? 'justify-end' : 'justify-start'
      } ${showMenu || showReactionPicker ? 'z-30' : 'z-0'}`}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Action triggers hover bar */}
      <div
        className={`absolute top-1 z-20 hidden group-hover:flex items-center gap-1 bg-white/95 border border-[#e9edef] rounded-full shadow-sm px-1.5 py-0.5 transition-opacity ${
          isMe ? 'right-full mr-2' : 'left-full ml-2'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowReactionPicker((p) => !p)}
          title="Reagieren"
          className="p-1 text-[#54656f] hover:text-[#00a884] rounded-full transition-colors"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onReply(message)}
          title="Antworten"
          className="p-1 text-[#54656f] hover:text-[#00a884] rounded-full transition-colors"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStar(message.id)}
          title={message.isStarred ? 'Stern entfernen' : 'Mit Stern markieren'}
          className={`p-1 rounded-full transition-colors ${
            message.isStarred ? 'text-amber-500' : 'text-[#54656f] hover:text-amber-500'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${message.isStarred ? 'fill-amber-500' : ''}`} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((p) => !p)}
            title="Mehr"
            className="p-1 text-[#54656f] hover:text-[#111b21] rounded-full transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div
                className="absolute top-full mt-1 right-0 w-44 bg-white rounded-lg shadow-xl border border-[#d1d7db] py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
              <button
                type="button"
                onClick={() => {
                  onReply(message);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
              >
                <Reply className="w-3.5 h-3.5 text-[#54656f]" /> Antworten
              </button>

              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePin(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
                >
                  {effectivePinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-[#54656f]" /> Nachricht loslösen
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-[#008069]" /> Nachricht anpinnen
                    </>
                  )}
                </button>
              )}

              {message.type === 'text' && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-[#54656f]" /> Kopieren
                </button>
              )}

              {isMe && message.type === 'text' && onEditMessage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditText(message.text);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#54656f]" /> Bearbeiten
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onToggleStar(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
              >
                <Star className={`w-3.5 h-3.5 ${message.isStarred ? 'text-amber-500 fill-amber-500' : 'text-[#54656f]'}`} />
                {message.isStarred ? 'Stern entfernen' : 'Stern markieren'}
              </button>

              {onForward && (
                <button
                  type="button"
                  onClick={() => {
                    onForward(message);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] text-[#111b21] flex items-center gap-2"
                >
                  <Forward className="w-3.5 h-3.5 text-[#54656f]" /> Weiterleiten
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-[#f0f2f5]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Löschen
              </button>
            </div>
          </>
          )}
        </div>
      </div>

      {/* Quick Reaction Popup */}
      {showReactionPicker && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker(false);
            }}
          />
          <div
            className={`absolute -top-9 z-30 flex items-center gap-1.5 bg-white border border-[#d1d7db] rounded-full shadow-lg px-2.5 py-1 animate-in fade-in zoom-in-95 duration-100 ${
              isMe ? 'right-0' : 'left-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(message.id, emoji);
                setShowReactionPicker(false);
              }}
              className="text-base hover:scale-125 transition-transform p-0.5"
            >
              {emoji}
            </button>
          ))}
          </div>
        </>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg p-2.5 text-sm shadow-xs select-text text-[#111b21] transition-all ${
          isHighlighted ? 'ring-2 ring-[#00a884] ring-offset-2 ring-offset-[#efeae2]' : ''
        } ${
          isMe
            ? 'bg-[#d9fdd3] rounded-tr-none'
            : 'bg-white rounded-tl-none'
        }`}
      >
        {/* Forwarded Header Indicator */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-[#667781] italic mb-1 select-none">
            <Forward className="w-3 h-3 text-[#667781]" />
            <span>Weitergeleitet</span>
          </div>
        )}

        {/* In group chats (like Alle), show the sender name on incoming messages */}
        {!isMe && isGroup && message.senderName && (
          <div className="text-[12px] font-semibold text-[#008069] mb-1 truncate select-none">
            ~{message.senderName}
          </div>
        )}

        {/* Reply Quote Banner if this message is replying to another */}
        {message.replyTo && (
          <div
            className={`border-l-4 rounded px-2 py-1 mb-1.5 text-xs ${
              isMe
                ? 'border-[#00a884] bg-[#cbf6c5]/70'
                : 'border-[#54656f] bg-[#f0f2f5]'
            }`}
          >
            <div className="font-semibold text-[#008069] truncate">
              {message.replyTo.senderName}
            </div>
            <div className="text-[#54656f] truncate">{message.replyTo.text}</div>
          </div>
        )}

        {/* View Once Message or Standard Content */}
        {message.isViewOnce ? (
          <div className="min-w-[210px] py-1 select-none">
            {isMe ? (
              // Sender view
              <div className="flex items-center gap-3 p-1">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#008069] flex items-center justify-center font-bold text-xs text-[#008069] shrink-0 bg-[#008069]/10">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-[#111b21]">
                    {message.type === 'image' ? 'Foto' : 'Nachricht'}
                  </div>
                  <div className="text-[11px] text-[#667781] flex items-center gap-1">
                    <span>{message.viewedOnce ? 'Geöffnet' : 'Einmalige Ansicht'}</span>
                  </div>
                </div>
              </div>
            ) : message.viewedOnce ? (
              // Recipient: Already opened
              <div className="flex items-center gap-3 p-1 text-[#667781] cursor-not-allowed opacity-80">
                <div className="w-8 h-8 rounded-full border-2 border-[#8696a0] flex items-center justify-center font-semibold text-xs text-[#8696a0] shrink-0">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-[#667781]">Geöffnet</div>
                  <div className="text-[11px] text-[#8696a0]">Einmalige Ansicht</div>
                </div>
              </div>
            ) : (
              // Recipient: Unopened - Click to view
              <button
                type="button"
                onClick={() => onViewOnce && onViewOnce(message.id)}
                className="w-full flex items-center gap-3 p-2 bg-[#f0f2f5] hover:bg-[#e9edef] rounded-lg transition-colors text-left group/vo cursor-pointer border border-[#e9edef]"
              >
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#008069] flex items-center justify-center font-bold text-xs text-[#008069] shrink-0 bg-[#008069]/15 group-hover/vo:scale-105 transition-transform">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#008069] flex items-center gap-1">
                    <span>{message.type === 'image' ? 'Foto' : 'Nachricht'}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#008069]/10 text-[#008069]">1x</span>
                  </div>
                  <div className="text-[11px] text-[#54656f]">Tippen zum Ansehen</div>
                </div>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Content by Type */}
            {message.type === 'image' && message.mediaUrl && (
              <div className="mb-1">
                <img
                  src={message.mediaUrl}
                  alt="Media"
                  onClick={() => onOpenMedia(message.mediaUrl!, message.mediaCaption)}
                  className="rounded-md max-h-72 w-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                {message.mediaCaption && (
                  <p className="mt-1.5 text-sm text-[#111b21]">{message.mediaCaption}</p>
                )}
              </div>
            )}

            {message.type === 'voice' && (
              <VoiceMessagePlayer
                id={message.id}
                duration={message.audioDuration || 12}
                isMe={isMe}
                avatar={chatAvatar}
              />
            )}

            {message.type === 'document' && (
              <div className="flex items-center gap-3 p-2 bg-black/[0.03] rounded-md min-w-[220px]">
                <div className="w-10 h-10 rounded-md bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111b21] truncate">
                    {message.documentName || 'Dokument.pdf'}
                  </p>
                  <p className="text-[11px] text-[#667781]">{message.documentSize || '1.2 MB'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Dokument heruntergeladen: ${message.documentName}`)}
                  className="p-1.5 text-[#54656f] hover:text-[#00a884] hover:bg-black/5 rounded-full transition-colors shrink-0"
                  title="Herunterladen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {message.type === 'poll' && (
              <div className="min-w-[240px] max-w-[320px] py-1">
                <h4 className="font-medium text-sm text-[#111b21] mb-2">{message.pollQuestion}</h4>
                <div className="space-y-2">
                  {message.pollOptions?.map((opt: PollOption) => {
                    const percent = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => onVotePoll(message.id, opt.id)}
                        className={`relative overflow-hidden p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          opt.votedByMe
                            ? 'border-[#00a884] bg-[#00a884]/5 font-medium'
                            : 'border-[#e9edef] bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-[#00a884]/15 transition-all duration-300 pointer-events-none"
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative flex items-center justify-between z-10">
                          <div className="flex items-center gap-2 pr-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                opt.votedByMe
                                  ? 'border-[#00a884] bg-[#00a884] text-white'
                                  : 'border-[#667781]'
                              }`}
                            >
                              {opt.votedByMe && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
                            </span>
                            <span className="text-[#111b21]">{opt.text}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#667781] shrink-0">
                            {opt.votes} ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-[#667781] mt-2 text-right">
                  {totalPollVotes} {totalPollVotes === 1 ? 'Stimme' : 'Stimmen'} gesamt
                </div>
              </div>
            )}

            {/* Sticker Message */}
            {message.type === 'sticker' && (
              <div className="py-1 px-1 flex flex-col items-center">
                {message.mediaUrl ? (
                  <img
                    src={message.mediaUrl}
                    alt="Sticker"
                    className="w-32 h-32 object-contain hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-6xl my-1 select-none hover:scale-110 transition-transform block">
                    {message.text}
                  </span>
                )}
              </div>
            )}

            {/* Call Log Message */}
            {message.type === 'call' && (
              <div className="flex items-center gap-3 py-1 pr-2 min-w-[200px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  message.callStatus === 'missed'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-[#008069]'
                }`}>
                  {message.callType === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#111b21]">
                    {message.callType === 'video' ? 'Videoanruf' : 'Sprachanruf'}
                  </div>
                  <div className="text-[11px] text-[#667781] flex items-center gap-1 mt-0.5">
                    {message.sender === 'me' ? (
                      <PhoneOutgoing className="w-3 h-3 text-[#008069]" />
                    ) : (
                      <PhoneIncoming className="w-3 h-3 text-[#667781]" />
                    )}
                    <span>
                      {message.callDuration && message.callDuration > 0
                        ? `${Math.floor(message.callDuration / 60)}:${
                            (message.callDuration % 60) < 10 ? '0' : ''
                          }${message.callDuration % 60} Min.`
                        : message.callStatus === 'missed'
                        ? 'Verpasst'
                        : 'Beendet'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Location Message [WIP] */}
            {message.type === 'location' && (
              <div className="min-w-[240px] max-w-[320px] rounded-lg overflow-hidden border border-[#d1d7db] bg-white shadow-2xs">
                {/* Mini Map Visual Tile */}
                <div className="relative h-28 bg-[#e5e3df] overflow-hidden flex items-center justify-center border-b border-[#e9edef]">
                  <div
                    className="absolute inset-0 opacity-40 bg-[radial-gradient(#008069_1px,transparent_1px)] [background-size:16px_16px]"
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-sky-100/40 via-emerald-100/20 to-amber-100/30" />
                  
                  {/* Pin Graphic */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-rose-500 shadow-md flex items-center justify-center text-white ring-4 ring-rose-200 animate-bounce">
                      <MapPin className="w-4 h-4 fill-white" />
                    </div>
                    <div className="w-3 h-1 bg-black/20 rounded-full blur-[1px] mt-1" />
                  </div>

                  {/* WIP Tag Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-2xs tracking-wide">
                    WIP • Standort
                  </div>

                  {message.locationData?.accuracy && (
                    <div className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-sm">
                      ±{message.locationData.accuracy}m
                    </div>
                  )}
                </div>

                {/* Location Info */}
                <div className="p-2.5">
                  <div className="font-semibold text-xs text-[#111b21] flex items-center justify-between">
                    <span className="truncate">
                      {message.locationData?.address || message.text || 'Geteilter Standort'}
                    </span>
                  </div>

                  {message.locationData && (
                    <div className="text-[11px] font-mono text-[#667781] mt-0.5">
                      {message.locationData.latitude.toFixed(4)}°, {message.locationData.longitude.toFixed(4)}°
                    </div>
                  )}

                  {/* Open in Map link */}
                  <a
                    href={
                      message.locationData?.mapUrl ||
                      (message.locationData
                        ? `https://www.google.com/maps?q=${message.locationData.latitude},${message.locationData.longitude}`
                        : '#')
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full py-1.5 px-2 bg-[#f0f2f5] hover:bg-[#e9edef] rounded text-[#008069] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>In Google Maps öffnen</span>
                    <ExternalLink className="w-3 h-3 text-[#667781]" />
                  </a>
                </div>
              </div>
            )}

            {/* Text Message or Edit Mode */}
            {message.type === 'text' && (
              isEditing ? (
                <form onSubmit={handleSaveEdit} className="my-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white rounded border border-[#00a884] outline-none text-[#111b21]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1 text-[#667781] hover:text-[#111b21]"
                      title="Abbrechen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="submit"
                      className="p-1 bg-[#00a884] text-white rounded hover:bg-[#008f70]"
                      title="Speichern"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1.5">
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-[14.2px]">
                    {formatWhatsAppText(message.text)}
                  </p>
                  {message.text && parseInviteLink(message.text) && (
                    <WhatsAppInviteCard
                      invite={parseInviteLink(message.text)!}
                      onNavigateToChat={onNavigateToChat}
                      onNavigateToChannel={onNavigateToChannel}
                    />
                  )}
                </div>
              )
            )}
          </>
        )}

        {/* Footer: edited tag, timestamp, pin, star, read ticks */}
        <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-3 select-none">
          {message.isEdited && (
            <span className="text-[10px] text-[#667781] italic mr-0.5">bearbeitet</span>
          )}
          {effectivePinned && (
            <Pin className="w-3 h-3 text-[#008069] fill-[#008069]" title="Angepinnt" />
          )}
          {message.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
          <span className="text-[11px] text-[#667781] leading-none">{message.timestamp}</span>
          {isMe && (
            <span className="inline-flex items-center ml-0.5">
              {message.status === 'pending' && (
                <span className="w-2.5 h-2.5 rounded-full border border-[#8696a0] border-t-transparent animate-spin" />
              )}
              {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-[#8696a0]" />}
              {message.status === 'delivered' && (
                <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
              )}
              {message.status === 'read' && (
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              )}
            </span>
          )}
        </div>

        {/* Copied toast badge */}
        {justCopied && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded shadow">
            Kopiert!
          </div>
        )}

        {/* Floating Tail on bubble */}
        {isMe ? (
          <span className="absolute top-0 -right-2 w-2 h-3 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 8 13" className="w-2 h-3 fill-[#d9fdd3]">
              <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
            </svg>
          </span>
        ) : (
          <span className="absolute top-0 -left-2 w-2 h-3 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 8 13" className="w-2 h-3 fill-white">
              <path d="M2.812 1H8v11.193L1.533 3.568C0.474 2.156 1.042 1 2.812 1z" />
            </svg>
          </span>
        )}
      </div>

      {/* Reactions Badge underneath bubble */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`absolute -bottom-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white shadow-xs border border-[#e9edef] cursor-pointer text-xs select-none hover:bg-[#f5f6f6] ${
            isMe ? 'right-4' : 'left-4'
          }`}
          onClick={() => onReact(message.id, message.reactions![0].emoji)}
        >
          {message.reactions.map((r, i) => (
            <span key={i} className="flex items-center gap-0.5">
              <span>{r.emoji}</span>
              {r.count > 1 && (
                <span className="text-[10px] font-semibold text-[#667781]">{r.count}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
