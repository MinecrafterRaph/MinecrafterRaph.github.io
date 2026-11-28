export interface User {
  id: string;
  name: string;
  avatar: string;
  about?: string;
  isAdmin?: boolean;
}

export interface GlobalChatInfo {
  id: string;
  name: string;
  about: string;
  avatar: string;
  isPinned: boolean;
  disappearingTimer?: 'off' | '24h' | '7d' | '90d';
  messageCount: number;
  createdAt: number;
}

export interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalMedia: number;
  totalPolls: number;
  globalChats?: GlobalChatInfo[];
  users: {
    id: string;
    name: string;
    avatar: string;
    about?: string;
    createdAt: number;
    messageCount: number;
  }[];
  chats: {
    id: string;
    participantNames: string[];
    messageCount: number;
    createdAt: number;
  }[];
  recentMessages: {
    id: string;
    chatId: string;
    senderName: string;
    text: string;
    type: string;
    timestamp: string;
    createdAt: number;
    deleted?: boolean;
  }[];
}

export type MessageType = 'text' | 'image' | 'voice' | 'document' | 'poll' | 'sticker' | 'call' | 'location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number; // in meters
  isLive?: boolean;
  mapUrl?: string;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
  votedByMe?: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  byMe: boolean;
}

export interface QuotedMessage {
  id: string;
  senderName: string;
  text: string;
  type?: MessageType;
}

export interface Message {
  id: string;
  chatId: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string; // ISO or display time
  status: MessageStatus;
  type: MessageType;
  mediaUrl?: string;
  mediaCaption?: string;
  audioDuration?: number; // seconds
  documentName?: string;
  documentSize?: string;
  pollQuestion?: string;
  pollOptions?: PollOption[];
  pollMultipleAnswers?: boolean;
  reactions?: MessageReaction[];
  replyTo?: QuotedMessage;
  isStarred?: boolean;
  isForwarded?: boolean;
  locationData?: LocationData;
  callType?: 'voice' | 'video';
  callDuration?: number;
  callStatus?: 'completed' | 'missed' | 'declined';
  senderId?: string;
  senderName?: string;
  deleted?: boolean;
  isViewOnce?: boolean;
  viewedOnce?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isPinned?: boolean;
  pinnedUntil?: number;
  scheduledFor?: number;
  createdAt?: number;
}

export interface Chat {
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  isGroup?: boolean;
  isGlobal?: boolean;
  groupMembers?: string[];
  phoneNumber?: string;
  about?: string;
  onlineStatus?: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isLocked?: boolean;
  label?: 'familie' | 'arbeit' | 'wichtig' | 'freunde' | 'projekt' | string;
  mutedUntil?: '8h' | '1w' | 'always' | string;
  customWallpaper?: string;
  pinnedMessageId?: string;
  pinnedMessages?: { messageId: string; pinnedUntil?: number; text: string }[];
  draft?: string;
  disappearingTimer?: 'off' | '24h' | '7d' | '90d';
  unreadCount: number;
}

export interface ContactStory {
  id: string;
  chatId?: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  mediaUrl: string;
  caption?: string;
  viewed: boolean;
}

export type WallpaperTheme =
  | 'classic'
  | 'salbei'
  | 'himmelblau'
  | 'pfirsich'
  | 'dunkel'
  | 'dunkelgruen'
  | 'rein';

export type FontSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  wallpaperTheme: WallpaperTheme;
  showDoodles: boolean;
  wallpaperDimming: number; // 0 to 100
  fontSize: FontSize;
  enterToSend: boolean;
  mediaVisibility: boolean;
  soundEnabled: boolean;
  outgoingSoundEnabled: boolean;
  callRingtoneEnabled: boolean;
  messageSound: 'whatsapp' | 'bloop' | 'pop' | 'chime';
  soundVolume: number; // 0 to 100
  readReceipts: boolean;
  privacyLastSeen: 'everyone' | 'nobody';
  privacyProfilePhoto: 'everyone' | 'nobody';
  privacyAbout: 'everyone' | 'nobody';
  securityNotifications: boolean;
  rememberUser: boolean; // Angemeldeten Benutzer im localStorage speichern
  sessionTimeoutDays: number; // Nach wie vielen Tagen zuletzt online erneut anmelden (0 = nie)
  theme: 'light' | 'dark' | 'system'; // WhatsApp Web Erscheinungsbild
  compactMode: boolean; // Kompakte Chat-Höhe für mehr Übersicht
  autoDownloadPhotos: boolean; // Automatischer Medien-Download
  autoDownloadAudio: boolean;
  autoDownloadDocuments: boolean;
  screenLockEnabled: boolean; // WhatsApp Web Bildschirmsperre
  screenLockPin: string; // PIN oder Passwort für Bildschirmsperre
  screenLockTimeoutMinutes: number; // Sperren nach Inaktivität in Minuten (0 = nur manuell)
  locationShareDailyLimit: number; // Max. Standortfreigaben pro Tag (WIP, Standard: 3)
  callConfig?: CallConfig; // Eigene Cloud- & API-Konfiguration für Anrufe
  userMetaAiKey?: string; // Eigener Gemini/OpenAI API-Key falls vom Admin verlangt
}

export type CallProvider = 'webrtc' | 'agora' | 'custom' | 'demo' | 'livekit' | 'twilio';

export interface CallConfig {
  provider: CallProvider;
  serverUrl?: string;
  apiKey?: string;
  isConfigured: boolean;
}

export interface CallRecord {
  id: string;
  chatId: string;
  contactName: string;
  contactAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: number; // seconds
  status: 'completed' | 'missed' | 'declined';
  createdAt: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  announcementChatId: string;
  subGroupIds: string[];
  createdBy: string;
  createdAt: number;
}

export interface ScheduledMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  scheduledTime: number; // timestamp
  createdAt: number;
  status: 'pending' | 'sent' | 'cancelled';
}

export type MetaAiMode = 'disabled' | 'enabled_free' | 'enabled_user_key';

export interface MetaAiConfig {
  mode: MetaAiMode;
  promptNotice?: string;
}

export interface StorageDataConfig {
  enabled: boolean;
}

export interface StorageBreakdown {
  totalBytes: number;
  mediaBreakdown: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    messages: number;
  };
  chatBreakdown: {
    chatId: string;
    chatName: string;
    chatAvatar: string;
    totalBytes: number;
    mediaCount: number;
    messagesCount: number;
  }[];
}

export interface NotificationGuideStep {
  id: string;
  title: string;
  description: string;
  badge?: string;
  imageUrl?: string;
}

export interface NotificationGuideConfig {
  title: string;
  subtitle: string;
  androidSteps: NotificationGuideStep[];
  iosSteps: NotificationGuideStep[];
  troubleshootingTips: string[];
}

export interface ChannelComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  createdAt: number;
}

export interface ChannelPost {
  id: string;
  time: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  videoDuration?: string;
  isVideo?: boolean;
  link?: { title: string; url: string };
  reactions: { emoji: string; count: number; voters?: string[]; userReacted?: boolean }[];
  pollQuestion?: string;
  pollOptions?: PollOption[];
  comments?: ChannelComment[];
  createdAt?: number;
}

export interface ChannelItem {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  avatar: string;
  followers: string;
  description: string;
  isFollowing?: boolean;
  isMuted?: boolean;
  createdBy?: string;
  posts: ChannelPost[];
}

