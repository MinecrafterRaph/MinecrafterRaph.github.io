import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface DbUser {
  id: string;
  name: string;
  password: string;
  avatar: string;
  about: string;
  isAdmin?: boolean;
  createdAt: number;
}

interface DbChat {
  id: string;
  participants: string[];
  participantNames: string[];
  name?: string;
  about?: string;
  avatar?: string;
  isGroup?: boolean;
  isGlobal?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  pinnedBy?: string[];
  archivedBy?: string[];
  mutedBy?: string[];
  favoritesBy?: string[];
  lockedBy?: string[];
  label?: string;
  mutedUntil?: string;
  isLocked?: boolean;
  pinnedMessageId?: string;
  disappearingTimer?: 'off' | '24h' | '7d' | '90d';
  nicknameBy?: Record<string, string>;
  wallpaperBy?: Record<string, string>;
  createdAt: number;
}

interface DbMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'document' | 'poll' | 'sticker' | 'call' | 'location';
  mediaUrl?: string;
  mediaCaption?: string;
  audioDuration?: number;
  documentName?: string;
  documentSize?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    isLive?: boolean;
  };
  pollQuestion?: string;
  pollOptions?: { id: string; text: string; votes: number; voters: string[] }[];
  pollMultipleAnswers?: boolean;
  reactions?: { emoji: string; count: number; voters: string[] }[];
  replyTo?: { id: string; senderName: string; text: string; type?: string };
  isStarred?: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  isForwarded?: boolean;
  isViewOnce?: boolean;
  viewedBy?: string[];
  callType?: 'voice' | 'video';
  callDuration?: number;
  callStatus?: 'completed' | 'missed' | 'declined';
  deleted?: boolean;
  createdAt: number;
}

export interface DbChannelComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  createdAt: number;
}

export interface DbChannelPost {
  id: string;
  time: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  videoDuration?: string;
  isVideo?: boolean;
  link?: { title: string; url: string };
  reactions: { emoji: string; count: number; voters?: string[] }[];
  pollQuestion?: string;
  pollOptions?: { id: string; text: string; votes: number; voters: string[] }[];
  comments?: DbChannelComment[];
  createdAt: number;
}

export interface DbChannel {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  avatar: string;
  followers: string;
  description: string;
  createdBy?: string;
  posts: DbChannelPost[];
}

export interface DbCall {
  id: string;
  chatId: string;
  contactName: string;
  contactAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: number;
  status: 'completed' | 'missed' | 'declined';
  createdAt: number;
}

export interface DbScheduledMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  scheduledTime: number;
  createdAt: number;
  status: 'pending' | 'sent' | 'cancelled';
}

interface DatabaseSchema {
  users: DbUser[];
  chats: DbChat[];
  messages: DbMessage[];
  channels?: DbChannel[];
  calls?: DbCall[];
  scheduledMessages?: DbScheduledMessage[];
  metaAiConfig?: {
    mode: 'disabled' | 'enabled_free' | 'enabled_user_key';
    promptNotice?: string;
  };
  storageDataConfig?: {
    enabled: boolean;
  };
  settings?: {
    locationShareDailyLimit: number;
    locationUsageByDate?: Record<string, Record<string, number>>;
  };
  notificationGuide?: {
    title: string;
    subtitle: string;
    androidSteps: { id: string; title: string; description: string; badge?: string; imageUrl?: string }[];
    iosSteps: { id: string; title: string; description: string; badge?: string; imageUrl?: string }[];
    troubleshootingTips: string[];
  };
}

const DB_FILE = path.join(process.cwd(), 'server-data.json');

function loadDb(): DatabaseSchema {
  let db: DatabaseSchema = { users: [], chats: [], messages: [] };
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
  }

  if (!db.users) db.users = [];
  if (!db.chats) db.chats = [];
  if (!db.messages) db.messages = [];
  if (!db.calls) db.calls = [];
  if (!db.scheduledMessages) db.scheduledMessages = [];
  if (!db.metaAiConfig) {
    db.metaAiConfig = {
      mode: 'disabled',
      promptNotice: 'Meta AI intelligenter Assistent für WhatsApp',
    };
  }
  if (!db.storageDataConfig) {
    db.storageDataConfig = {
      enabled: false,
    };
  }

  let changed = false;

  // 1. Guarantee WhatsApp Admin User in db.users
  let admin = db.users.find(
    (u) => u.id === 'usr_whatsapp_admin' || u.name.toLowerCase() === 'whatsapp'
  );
  if (!admin) {
    admin = {
      id: 'usr_whatsapp_admin',
      name: 'WhatsApp',
      password: '13243',
      avatar: 'icon:admin',
      about: 'Offizieller WhatsApp Administrator',
      isAdmin: true,
      createdAt: 1700000000000,
    };
    db.users.unshift(admin);
    changed = true;
  } else {
    if (admin.id !== 'usr_whatsapp_admin') {
      admin.id = 'usr_whatsapp_admin';
      changed = true;
    }
    if (!admin.isAdmin) {
      admin.isAdmin = true;
      changed = true;
    }
    if (admin.password !== '13243') {
      admin.password = '13243';
      changed = true;
    }
    if (!admin.avatar) {
      admin.avatar = 'icon:admin';
      changed = true;
    }
  }

  // 2. Guarantee Global Chat "Alle"
  let globalChat = db.chats.find((c) => c.id === 'chat_global_all');
  if (!globalChat) {
    globalChat = {
      id: 'chat_global_all',
      participants: ['*'],
      participantNames: ['Alle'],
      name: 'Alle',
      about: 'Öffentlicher Gruppenchat für alle registrierten Nutzer',
      avatar: 'icon:globe',
      isGlobal: true,
      isPinned: true,
      disappearingTimer: 'off',
      createdAt: 1700000000000,
    };
    db.chats.unshift(globalChat);
    changed = true;
  } else {
    if (!globalChat.name) { globalChat.name = 'Alle'; changed = true; }
    if (!globalChat.isGlobal) { globalChat.isGlobal = true; changed = true; }
    if (globalChat.isPinned === undefined) { globalChat.isPinned = true; changed = true; }
    if (!globalChat.avatar) { globalChat.avatar = 'icon:globe'; changed = true; }
    if (!globalChat.participants.includes('*')) { globalChat.participants.unshift('*'); changed = true; }
  }

  if (changed) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error auto-saving bootstrap db:', e);
    }
  }

  return db;
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Helper avatar generator - pure WhatsApp icon system
  const getAvatar = (name: string) => {
    if (name.toLowerCase() === 'whatsapp' || name.toLowerCase().includes('admin')) {
      return 'icon:admin';
    }
    return 'icon:classic';
  };

  const GLOBAL_CHAT_ID = 'chat_global_all';
  const GLOBAL_CHAT_AVATAR = 'icon:globe';

  // Real-time user presence tracking (active within last 60 seconds = online)
  const userActivity: Record<string, number> = {};

  const updateUserActivity = (userId?: string) => {
    if (userId) {
      userActivity[userId] = Date.now();
    }
  };

  const getUserOnlineState = (userId: string): { isOnline: boolean; lastSeen?: string } => {
    const lastActive = userActivity[userId];
    // Strictly consider online only if active in the last 20 seconds (polling is ~1.5-2s)
    if (lastActive && Date.now() - lastActive < 20000) {
      return { isOnline: true };
    }
    if (!lastActive) {
      return { isOnline: false, lastSeen: 'offline' };
    }
    const diffMs = Date.now() - lastActive;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) {
      return { isOnline: false, lastSeen: 'zuletzt online vor wenigen Sekunden' };
    }
    if (diffMinutes < 60) {
      return { isOnline: false, lastSeen: `zuletzt online vor ${diffMinutes} Min.` };
    }
    const date = new Date(lastActive);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) {
      return { isOnline: false, lastSeen: `zuletzt online heute um ${timeStr}` };
    }
    return { isOnline: false, lastSeen: `zuletzt online gestern um ${timeStr}` };
  };

  const ensureGlobalChat = (db: DatabaseSchema) => {
    let globalChat = db.chats.find((c) => c.id === GLOBAL_CHAT_ID);
    if (!globalChat) {
      globalChat = {
        id: GLOBAL_CHAT_ID,
        participants: ['*'],
        participantNames: ['Alle'],
        name: 'Alle',
        about: 'Öffentlicher Gruppenchat für alle registrierten Nutzer',
        avatar: GLOBAL_CHAT_AVATAR,
        isGlobal: true,
        isPinned: true,
        disappearingTimer: 'off',
        createdAt: 1700000000000,
      };
      db.chats.unshift(globalChat);
      if (!db.messages.some((m) => m.chatId === GLOBAL_CHAT_ID)) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${
          now.getMinutes() < 10 ? '0' : ''
        }${now.getMinutes()}`;
        db.messages.push({
          id: 'msg_welcome_global',
          chatId: GLOBAL_CHAT_ID,
          senderId: 'usr_whatsapp_admin',
          senderName: 'WhatsApp',
          text: '👋 Willkommen im "Alle"-Chat! Dieser Chat verbindet die gesamte Community. Alle registrierten Nutzer können hier gemeinsam schreiben und sich austauschen.',
          timestamp: timeStr,
          status: 'read',
          type: 'text',
          createdAt: Date.now() - 3600000,
        });
      }
      saveDb(db);
    } else {
      if (!globalChat.name) globalChat.name = 'Alle';
      if (!globalChat.isGlobal) globalChat.isGlobal = true;
      if (globalChat.isPinned === undefined) globalChat.isPinned = true;
      if (!globalChat.avatar) globalChat.avatar = GLOBAL_CHAT_AVATAR;
    }
    return globalChat;
  };

  // 1. Auth: Login or Register
  app.post('/api/auth/login', (req, res) => {
    const { name, password } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Bitte gib einen gültigen Namen ein (mind. 2 Zeichen).' });
    }

    const trimmedName = name.trim();
    const trimmedPass = (password || '').trim();
    const db = loadDb();

    // Check for WhatsApp Admin credentials (requires admin password)
    const isWhatsAppAdmin = trimmedName.toLowerCase() === 'whatsapp';
    if (isWhatsAppAdmin) {
      if (!trimmedPass) {
        return res.status(400).json({
          error: 'Bitte gib das Passwort ein.',
        });
      }

      let adminUser = db.users.find((u) => u.name.toLowerCase() === 'whatsapp');
      const expectedPassword = adminUser?.password || '13243';

      if (trimmedPass !== expectedPassword) {
        return res.status(401).json({
          error: 'Falsches Passwort für das WhatsApp-Administratorkonto.',
        });
      }

      if (!adminUser) {
        adminUser = {
          id: 'usr_whatsapp_admin',
          name: 'WhatsApp',
          password: '13243',
          avatar: 'icon:admin',
          about: 'Offizieller WhatsApp Administrator',
          isAdmin: true,
          createdAt: Date.now(),
        };
        db.users.unshift(adminUser);
        saveDb(db);
      } else {
        adminUser.isAdmin = true;
        adminUser.password = '13243';
        saveDb(db);
      }

      return res.json({
        user: {
          id: adminUser.id,
          name: adminUser.name,
          avatar: adminUser.avatar,
          about: adminUser.about,
          isAdmin: true,
        },
      });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 3) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 3 Zeichen lang sein.' });
    }

    const existingUser = db.users.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingUser) {
      if (existingUser.password && existingUser.password !== trimmedPass) {
        return res.status(401).json({ error: 'Falsches Passwort für diesen Namen.' });
      }
      let changed = false;
      if (!existingUser.password) {
        existingUser.password = trimmedPass;
        changed = true;
      }
      // Ensure all chats mentioning this user's name have their ID in participants
      db.chats.forEach((c) => {
        if (
          c.participantNames &&
          c.participantNames.some((n) => n.toLowerCase() === existingUser.name.toLowerCase()) &&
          !c.participants.includes(existingUser.id)
        ) {
          c.participants.push(existingUser.id);
          changed = true;
        }
      });
      if (changed) {
        saveDb(db);
      }
      return res.json({
        user: {
          id: existingUser.id,
          name: existingUser.name,
          avatar: existingUser.avatar,
          about: existingUser.about,
          isAdmin: false,
        },
      });
    }

    // Auto-create new user
    const newUser: DbUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      password: trimmedPass,
      avatar: getAvatar(trimmedName),
      about: 'Verfügbar',
      createdAt: Date.now(),
    };

    db.users.push(newUser);

    // Link any chats that were created for this person before they registered
    db.chats.forEach((c) => {
      if (
        c.participantNames &&
        c.participantNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase()) &&
        !c.participants.includes(newUser.id)
      ) {
        c.participants.push(newUser.id);
      }
    });

    saveDb(db);

    return res.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        avatar: newUser.avatar,
        about: newUser.about,
        isAdmin: false,
      },
      isNew: true,
    });
  });

  // 2. Get list of users (to search or add persons)
  app.get('/api/users', (req, res) => {
    const db = loadDb();
    const safeUsers = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      about: u.about,
    }));
    res.json(safeUsers);
  });

  // 3. Get Chats for user
  app.get('/api/chats', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Touch user activity
    updateUserActivity(userId);

    const db = loadDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    ensureGlobalChat(db);

    // 1) All global community chats (created by WhatsApp admin or default "Alle")
    const globalChats = db.chats.filter(
      (c) => c.isGlobal || c.id === GLOBAL_CHAT_ID || c.participants.includes('*')
    );

    const formattedGlobalChats = globalChats.map((g) => {
      const globalMessages = db.messages.filter((m) => m.chatId === g.id);
      const lastGlobalMsg =
        globalMessages.length > 0 ? globalMessages[globalMessages.length - 1] : undefined;
      const unreadGlobalCount = globalMessages.filter(
        (m) => m.senderId !== userId && m.status !== 'read'
      ).length;

      return {
        id: g.id,
        name: g.name || (g.id === GLOBAL_CHAT_ID ? 'Alle' : 'Globaler Chat'),
        isGroup: true,
        isGlobal: true,
        groupMembers: db.users.map((u) => u.name),
        avatar: g.avatar || GLOBAL_CHAT_AVATAR,
        about: g.about || 'Öffentlicher Gruppenchat für die Community',
        onlineStatus: undefined,
        lastSeen: undefined,
        isPinned: g.isPinned ?? true,
        pinnedMessageId: g.pinnedMessageId,
        disappearingTimer: g.disappearingTimer || 'off',
        unreadCount: unreadGlobalCount,
        lastMessage: lastGlobalMsg,
        createdAt: g.createdAt,
      };
    });

    // 2) Filter user individual chats (exclude global chats)
    const userChats = db.chats.filter(
      (c) =>
        !c.isGlobal &&
        c.id !== GLOBAL_CHAT_ID &&
        !c.participants.includes('*') &&
        (c.participants.includes(userId) ||
          (c.participantNames && c.participantNames.some((n) => n.toLowerCase() === user.name.toLowerCase())))
    );

    const formattedChats = userChats.map((c) => {
      const isGroup = !!c.isGroup;

      let chatName = c.name || 'Chat';
      let chatAvatar = c.avatar || getAvatar(chatName);
      let chatAbout = c.about || (isGroup ? 'Gruppenchat' : 'Auf WhatsApp');
      let onlineStatus: 'online' | 'offline' | 'typing' | undefined = undefined;
      let lastSeen: string | undefined = undefined;
      let targetUser: DbUser | undefined = undefined;

      if (!isGroup) {
        // Find counterpart name
        const otherName =
          c.participantNames?.find((n) => n.toLowerCase() !== user.name.toLowerCase()) ||
          c.participantNames?.[0] ||
          'Unbekannt';

        targetUser = db.users.find(
          (u) => u.name.toLowerCase() === otherName.toLowerCase()
        );

        chatName = targetUser ? targetUser.name : otherName;
        chatAvatar = targetUser ? targetUser.avatar : getAvatar(otherName);
        chatAbout = targetUser?.about || 'Auf WhatsApp';

        if (targetUser) {
          const presence = getUserOnlineState(targetUser.id);
          onlineStatus = presence.isOnline ? 'online' : 'offline';
          lastSeen = presence.isOnline ? undefined : presence.lastSeen;
        } else {
          onlineStatus = 'offline';
          lastSeen = 'offline';
        }
      } else {
        // Groups NEVER show online or offline
        onlineStatus = undefined;
        lastSeen = undefined;
      }

      // Latest message
      const chatMessages = db.messages.filter((m) => m.chatId === c.id);
      const lastMsg =
        chatMessages.length > 0
          ? chatMessages[chatMessages.length - 1]
          : undefined;

      // Count unread (sent by others and not read)
      const unreadCount = chatMessages.filter(
        (m) => m.senderId !== userId && m.status !== 'read'
      ).length;

      const isPinned = c.pinnedBy ? c.pinnedBy.includes(userId) : !!c.isPinned;
      const isArchived = c.archivedBy ? c.archivedBy.includes(userId) : !!c.isArchived;
      const isMuted = c.mutedBy ? c.mutedBy.includes(userId) : !!c.isMuted;
      const isFavorite = c.favoritesBy ? c.favoritesBy.includes(userId) : false;
      const isLocked = c.lockedBy ? c.lockedBy.includes(userId) : !!c.isLocked;

      return {
        id: c.id,
        name: chatName,
        isGroup,
        groupMembers: isGroup ? c.participantNames : undefined,
        avatar: chatAvatar,
        about: chatAbout,
        onlineStatus,
        lastSeen,
        isPinned,
        isArchived,
        isMuted,
        mutedUntil: c.mutedUntil,
        isFavorite,
        isLocked,
        label: c.label,
        pinnedMessageId: c.pinnedMessageId,
        disappearingTimer: c.disappearingTimer || 'off',
        nickname: c.nicknameBy ? c.nicknameBy[userId] : undefined,
        customWallpaper: c.wallpaperBy ? c.wallpaperBy[userId] : undefined,
        unreadCount,
        lastMessage: lastMsg,
        createdAt: c.createdAt,
      };
    });

    const allChats = [...formattedGlobalChats, ...formattedChats];

    // Sort by pinned first, then latest message or creation date
    allChats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.createdAt || a.createdAt;
      const timeB = b.lastMessage?.createdAt || b.createdAt;
      return timeB - timeA;
    });

    res.json(allChats);
  });

  // 4. Create chat (1:1 with another person or new group)
  app.post('/api/chats', (req, res) => {
    const userId = (req.body.userId || req.body.currentUserId) as string;
    const targetName = (req.body.targetName || req.body.name) as string;
    const isGroup = !!req.body.isGroup;
    const groupName = req.body.groupName as string;
    const memberNames = (req.body.members || []) as string[];

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich.' });
    }

    const db = loadDb();
    let currentUser = db.users.find((u) => u.id === userId);
    if (!currentUser) {
      currentUser = db.users.find((u) => u.name.toLowerCase() === userId.toLowerCase());
    }
    if (!currentUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden. Bitte erneut einloggen.' });
    }

    // A) Handle Group Creation
    if (isGroup) {
      const cleanGroupName = (groupName || '').trim();
      if (cleanGroupName.length < 2) {
        return res.status(400).json({ error: 'Der Gruppenname muss mindestens 2 Zeichen lang sein.' });
      }

      const allMemberNames: string[] = [currentUser.name];
      const allMemberIds: string[] = [currentUser.id];

      for (const mName of memberNames) {
        const cleanMName = mName.trim().replace(/^@+/, '');
        if (!cleanMName || cleanMName.toLowerCase() === currentUser.name.toLowerCase()) continue;

        let mUser = db.users.find((u) => u.name.toLowerCase() === cleanMName.toLowerCase());
        if (!mUser) {
          // Auto-provision user account so they can log in and participate in the group
          mUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: cleanMName,
            password: '',
            avatar: getAvatar(cleanMName),
            about: 'Auf WhatsApp',
            createdAt: Date.now(),
          };
          db.users.push(mUser);
        }

        if (!allMemberNames.some((n) => n.toLowerCase() === mUser.name.toLowerCase())) {
          allMemberNames.push(mUser.name);
          allMemberIds.push(mUser.id);
        }
      }

      const newGroupChat: DbChat = {
        id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cleanGroupName,
        about: `Gruppe mit ${allMemberNames.length} Teilnehmern`,
        avatar: getAvatar(cleanGroupName),
        isGroup: true,
        participants: allMemberIds,
        participantNames: allMemberNames,
        createdAt: Date.now(),
      };

      db.chats.unshift(newGroupChat);
      saveDb(db);

      return res.json({
        id: newGroupChat.id,
        name: newGroupChat.name,
        isGroup: true,
        groupMembers: allMemberNames,
        avatar: newGroupChat.avatar,
        about: newGroupChat.about,
        onlineStatus: undefined,
        lastSeen: undefined,
        unreadCount: 0,
        createdAt: newGroupChat.createdAt,
      });
    }

    // B) Handle 1:1 Chat Creation
    if (!targetName || typeof targetName !== 'string') {
      return res.status(400).json({ error: 'Name der Person ist erforderlich.' });
    }

    const rawTarget = targetName.trim();
    const cleanTarget = rawTarget.replace(/^@+/, '').trim();

    if (cleanTarget.length < 2) {
      return res.status(400).json({ error: 'Der Name muss mindestens 2 Zeichen lang sein.' });
    }

    // If user enters "Alle" or "@Alle", return the global chat
    if (cleanTarget.toLowerCase() === 'alle') {
      ensureGlobalChat(db);
      return res.json({
        id: GLOBAL_CHAT_ID,
        name: 'Alle',
        isGroup: true,
        groupMembers: db.users.map((u) => u.name),
        avatar: GLOBAL_CHAT_AVATAR,
        about: 'Öffentlicher Gruppenchat für alle registrierten Nutzer',
        onlineStatus: undefined,
        lastSeen: undefined,
        unreadCount: 0,
      });
    }

    if (currentUser.name.toLowerCase() === cleanTarget.toLowerCase()) {
      return res.status(400).json({ error: 'Du kannst keinen Chat mit dir selbst anlegen.' });
    }

    // Check if target user already exists
    let targetUser = db.users.find(
      (u) => u.name.toLowerCase() === cleanTarget.toLowerCase()
    );

    // CRITICAL FIX: If target user is not yet in db.users, auto-create their account!
    // When they open WhatsApp and log in with that name, they will immediately have their account and this chat!
    if (!targetUser) {
      targetUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cleanTarget,
        password: '',
        avatar: getAvatar(cleanTarget),
        about: 'Auf WhatsApp',
        createdAt: Date.now(),
      };
      db.users.push(targetUser);
    }

    // Check if 1:1 chat already exists
    const existingChat = db.chats.find(
      (c) =>
        !c.isGlobal &&
        c.id !== GLOBAL_CHAT_ID &&
        !c.isGroup &&
        ((c.participants.includes(currentUser!.id) && c.participants.includes(targetUser!.id)) ||
          (c.participantNames &&
            c.participantNames.some((n) => n.toLowerCase() === currentUser!.name.toLowerCase()) &&
            c.participantNames.some((n) => n.toLowerCase() === targetUser!.name.toLowerCase())))
    );

    if (existingChat) {
      if (!existingChat.participants.includes(currentUser.id)) {
        existingChat.participants.push(currentUser.id);
      }
      if (!existingChat.participants.includes(targetUser.id)) {
        existingChat.participants.push(targetUser.id);
      }
      saveDb(db);
      const presence = getUserOnlineState(targetUser.id);
      return res.json({
        id: existingChat.id,
        name: targetUser.name,
        isGroup: false,
        avatar: targetUser.avatar,
        about: targetUser.about,
        onlineStatus: presence.isOnline ? 'online' : 'offline',
        lastSeen: presence.isOnline ? undefined : presence.lastSeen,
        unreadCount: 0,
      });
    }

    const newChat: DbChat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      participants: [currentUser.id, targetUser.id],
      participantNames: [currentUser.name, targetUser.name],
      createdAt: Date.now(),
    };

    db.chats.unshift(newChat);
    saveDb(db);

    const presence = getUserOnlineState(targetUser.id);
    return res.json({
      id: newChat.id,
      name: targetUser.name,
      isGroup: false,
      avatar: targetUser.avatar,
      about: targetUser.about,
      onlineStatus: presence.isOnline ? 'online' : 'offline',
      lastSeen: presence.isOnline ? undefined : presence.lastSeen,
      unreadCount: 0,
    });
  });

  // 5. Get Messages for a chat
  app.get('/api/chats/:chatId/messages', (req, res) => {
    const { chatId } = req.params;
    const userId = req.query.userId as string;

    const db = loadDb();
    if (chatId === GLOBAL_CHAT_ID) {
      ensureGlobalChat(db);
    }
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat nicht gefunden.' });
    }

    // Auto-clean disappearing messages if timer is active
    if (chat.disappearingTimer && chat.disappearingTimer !== 'off') {
      let durationMs = 0;
      if (chat.disappearingTimer === '24h') durationMs = 24 * 3600 * 1000;
      else if (chat.disappearingTimer === '7d') durationMs = 7 * 24 * 3600 * 1000;
      else if (chat.disappearingTimer === '90d') durationMs = 90 * 24 * 3600 * 1000;

      if (durationMs > 0) {
        const threshold = Date.now() - durationMs;
        const initialCount = db.messages.length;
        db.messages = db.messages.filter((m) => {
          if (m.chatId !== chatId) return true;
          if (m.id === chat.pinnedMessageId) return true; // preserve pinned message
          return m.createdAt >= threshold;
        });
        if (db.messages.length !== initialCount) {
          saveDb(db);
        }
      }
    }

    const chatMessages = db.messages.filter((m) => m.chatId === chatId);

    // Mark messages from others as read if userId provided
    if (userId) {
      let changed = false;
      chatMessages.forEach((m) => {
        if (m.senderId !== userId && m.status !== 'read') {
          m.status = 'read';
          changed = true;
        }
      });
      if (changed) {
        saveDb(db);
      }
    }

    // Format for client
    const formatted = chatMessages.map((m) => {
      const isSender = m.senderId === userId;
      const isViewOnce = !!m.isViewOnce;
      const viewedOnce = isViewOnce
        ? isSender
          ? !!(m.viewedBy && m.viewedBy.length > 0)
          : !!(m.viewedBy && m.viewedBy.includes(userId))
        : false;

      // If view-once and recipient already viewed it, mask text/media
      const textToReturn = isViewOnce && !isSender && viewedOnce ? 'Einmalige Nachricht' : m.text;
      const mediaToReturn = isViewOnce && !isSender && viewedOnce ? undefined : m.mediaUrl;

      return {
        ...m,
        text: textToReturn,
        mediaUrl: mediaToReturn,
        isViewOnce,
        viewedOnce,
        sender: isSender ? ('me' as const) : ('them' as const),
        reactions: (m.reactions || []).map((r) => ({
          emoji: r.emoji,
          count: r.count,
          byMe: r.voters ? r.voters.includes(userId) : false,
        })),
        pollOptions: (m.pollOptions || []).map((opt) => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes,
          votedByMe: opt.voters ? opt.voters.includes(userId) : false,
        })),
      };
    });

    res.json(formatted);
  });

  // 6. Send a Message
  app.post('/api/chats/:chatId/messages', (req, res) => {
    const { chatId } = req.params;
    const {
      senderId,
      senderName,
      text,
      type = 'text',
      mediaUrl,
      mediaCaption,
      audioDuration,
      documentName,
      documentSize,
      pollQuestion,
      pollOptions,
      pollMultipleAnswers,
      replyTo,
      callType,
      callDuration,
      callStatus,
      isPinned,
      isForwarded,
      isViewOnce,
      locationData,
    } = req.body;

    if (!senderId || (!text && !mediaUrl && !pollQuestion && !callType && !locationData)) {
      return res.status(400).json({ error: 'Ungültige Nachrichtendaten.' });
    }

    const db = loadDb();
    if (chatId === GLOBAL_CHAT_ID) {
      ensureGlobalChat(db);
    }
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat nicht gefunden.' });
    }

    if (chat.isGlobal || chat.id === GLOBAL_CHAT_ID || chat.participants.includes('*')) {
      if (!chat.participants.includes(senderId)) {
        chat.participants.push(senderId);
      }
      if (senderName && !chat.participantNames.includes(senderName)) {
        chat.participantNames.push(senderName);
      }
    }

    const now = new Date();
    const timeStr = `${now.getHours()}:${
      now.getMinutes() < 10 ? '0' : ''
    }${now.getMinutes()}`;

    const newMsg: DbMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      senderId,
      senderName: senderName || 'Unbekannt',
      text: text || '',
      timestamp: timeStr,
      status: 'delivered',
      type,
      mediaUrl,
      mediaCaption,
      audioDuration,
      documentName,
      documentSize,
      pollQuestion,
      pollOptions: pollOptions
        ? pollOptions.map((o: any) => ({
            id: o.id || `opt_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
            text: o.text,
            votes: 0,
            voters: [],
          }))
        : undefined,
      pollMultipleAnswers: !!pollMultipleAnswers,
      replyTo,
      callType,
      callDuration,
      callStatus,
      isPinned: !!isPinned,
      isForwarded: !!isForwarded,
      isViewOnce: !!isViewOnce,
      locationData: locationData
        ? {
            latitude: Number(locationData.latitude),
            longitude: Number(locationData.longitude),
            address: locationData.address ? String(locationData.address).trim() : undefined,
            accuracy: locationData.accuracy ? Number(locationData.accuracy) : undefined,
            isLive: !!locationData.isLive,
          }
        : undefined,
      viewedBy: [],
      createdAt: Date.now(),
    };

    db.messages.push(newMsg);
    saveDb(db);

    return res.json({
      ...newMsg,
      sender: 'me',
      isViewOnce: !!newMsg.isViewOnce,
      viewedOnce: false,
    });
  });

  // Reveal / consume View-Once message
  app.post('/api/messages/:messageId/view-once', (req, res) => {
    const { messageId } = req.params;
    const { userId } = req.body;
    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }
    if (!msg.viewedBy) msg.viewedBy = [];
    if (userId && !msg.viewedBy.includes(userId)) {
      msg.viewedBy.push(userId);
      saveDb(db);
    }
    return res.json({
      success: true,
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      viewedOnce: true,
    });
  });

  // Pin / Unpin message in chat
  app.post('/api/messages/:messageId/pin', (req, res) => {
    const { messageId } = req.params;
    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }
    const chat = db.chats.find((c) => c.id === msg.chatId);
    if (chat) {
      if (chat.pinnedMessageId === messageId) {
        chat.pinnedMessageId = undefined;
        msg.isPinned = false;
      } else {
        db.messages.filter((m) => m.chatId === msg.chatId).forEach((m) => {
          m.isPinned = false;
        });
        chat.pinnedMessageId = messageId;
        msg.isPinned = true;
      }
      saveDb(db);
    }
    res.json({ success: true, isPinned: msg.isPinned, pinnedMessageId: chat?.pinnedMessageId });
  });

  // Update chat settings (e.g. disappearingTimer, pinnedMessageId, isArchived, isPinned, isMuted, isFavorite)
  const handleChatSettings = (req: express.Request, res: express.Response) => {
    const { chatId } = req.params;
    const {
      userId,
      disappearingTimer,
      pinnedMessageId,
      isArchived,
      isPinned,
      isMuted,
      isFavorite,
      isLocked,
      label,
      mutedUntil,
      nickname,
      customWallpaper,
    } = req.body;
    const db = loadDb();
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat nicht gefunden' });
    }
    if (disappearingTimer !== undefined && ['off', '24h', '7d', '90d'].includes(disappearingTimer)) {
      chat.disappearingTimer = disappearingTimer;
      const timerMap: Record<string, string> = {
        off: 'deaktiviert',
        '24h': '24 Stunden',
        '7d': '7 Tage',
        '90d': '90 Tage',
      };
      const label = timerMap[disappearingTimer] || disappearingTimer;
      const now = new Date();
      const timeStr = `${now.getHours()}:${
        now.getMinutes() < 10 ? '0' : ''
      }${now.getMinutes()}`;
      const sName = req.body.senderName || 'Ein Teilnehmer';

      db.messages.push({
        id: `msg_sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId,
        senderId: userId || 'system',
        senderName: sName,
        text: `⏱️ ${sName !== 'Ein Teilnehmer' ? sName : 'Ein Teilnehmer'} hat selbstlöschende Nachrichten auf "${label}" gestellt.`,
        timestamp: timeStr,
        status: 'read',
        type: 'text',
        createdAt: Date.now(),
      });
    }
    if (pinnedMessageId !== undefined) {
      chat.pinnedMessageId = pinnedMessageId;
    }
    if (label !== undefined) {
      chat.label = label || undefined;
    }
    if (mutedUntil !== undefined) {
      chat.mutedUntil = mutedUntil || undefined;
    }

    if (userId) {
      // Per-user nickname
      if (nickname !== undefined) {
        if (!chat.nicknameBy) chat.nicknameBy = {};
        if (nickname && nickname.trim()) {
          chat.nicknameBy[userId] = nickname.trim();
        } else {
          delete chat.nicknameBy[userId];
        }
      }

      // Per-user custom wallpaper
      if (customWallpaper !== undefined) {
        if (!chat.wallpaperBy) chat.wallpaperBy = {};
        if (customWallpaper) {
          chat.wallpaperBy[userId] = customWallpaper;
        } else {
          delete chat.wallpaperBy[userId];
        }
      }

      // Per-user pin
      if (isPinned !== undefined) {
        if (!chat.pinnedBy) chat.pinnedBy = [];
        if (isPinned && !chat.pinnedBy.includes(userId)) chat.pinnedBy.push(userId);
        if (!isPinned) chat.pinnedBy = chat.pinnedBy.filter((id) => id !== userId);
      }
      // Per-user archive
      if (isArchived !== undefined) {
        if (!chat.archivedBy) chat.archivedBy = [];
        if (isArchived && !chat.archivedBy.includes(userId)) chat.archivedBy.push(userId);
        if (!isArchived) chat.archivedBy = chat.archivedBy.filter((id) => id !== userId);
      }
      // Per-user mute
      if (isMuted !== undefined) {
        if (!chat.mutedBy) chat.mutedBy = [];
        if (isMuted && !chat.mutedBy.includes(userId)) chat.mutedBy.push(userId);
        if (!isMuted) chat.mutedBy = chat.mutedBy.filter((id) => id !== userId);
      }
      // Per-user favorite
      if (isFavorite !== undefined) {
        if (!chat.favoritesBy) chat.favoritesBy = [];
        if (isFavorite && !chat.favoritesBy.includes(userId)) chat.favoritesBy.push(userId);
        if (!isFavorite) chat.favoritesBy = chat.favoritesBy.filter((id) => id !== userId);
      }
      // Per-user lock
      if (isLocked !== undefined) {
        if (!chat.lockedBy) chat.lockedBy = [];
        if (isLocked && !chat.lockedBy.includes(userId)) chat.lockedBy.push(userId);
        if (!isLocked) chat.lockedBy = chat.lockedBy.filter((id) => id !== userId);
      }
    } else {
      if (isArchived !== undefined) chat.isArchived = isArchived;
      if (isPinned !== undefined) chat.isPinned = isPinned;
      if (isMuted !== undefined) chat.isMuted = isMuted;
      if (isLocked !== undefined) chat.isLocked = isLocked;
    }

    saveDb(db);
    const userNickname = chat.nicknameBy && userId ? chat.nicknameBy[userId] : undefined;
    const userWallpaper = chat.wallpaperBy && userId ? chat.wallpaperBy[userId] : undefined;
    res.json({
      success: true,
      chat: {
        ...chat,
        nickname: userNickname,
        customWallpaper: userWallpaper,
      },
    });
  };

  app.patch('/api/chats/:chatId/settings', handleChatSettings);
  app.post('/api/chats/:chatId/settings', handleChatSettings);

  // 7. React to message
  app.post('/api/messages/:messageId/react', (req, res) => {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ error: 'userId and emoji required' });
    }

    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!msg.reactions) msg.reactions = [];

    const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      const voterIdx = existingReaction.voters.indexOf(userId);
      if (voterIdx >= 0) {
        // Remove vote
        existingReaction.voters.splice(voterIdx, 1);
        existingReaction.count = existingReaction.voters.length;
      } else {
        // Add vote
        existingReaction.voters.push(userId);
        existingReaction.count = existingReaction.voters.length;
      }
    } else {
      msg.reactions.push({
        emoji,
        count: 1,
        voters: [userId],
      });
    }

    msg.reactions = msg.reactions.filter((r) => r.count > 0);
    saveDb(db);

    res.json({ success: true, reactions: msg.reactions });
  });

  // 8. Delete message
  app.delete('/api/messages/:messageId', (req, res) => {
    const { messageId } = req.params;
    const { userId } = req.body;

    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    msg.deleted = true;
    msg.text = '🚫 Diese Nachricht wurde gelöscht.';
    saveDb(db);

    res.json({ success: true });
  });

  // 9. Poll vote
  app.post('/api/messages/:messageId/poll-vote', (req, res) => {
    const { messageId } = req.params;
    const { userId, optionId } = req.body;

    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg || !msg.pollOptions) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const allowMultiple = msg.pollMultipleAnswers || false;

    msg.pollOptions.forEach((opt) => {
      if (opt.id === optionId) {
        const voterIndex = opt.voters.indexOf(userId);
        if (voterIndex >= 0) {
          opt.voters.splice(voterIndex, 1);
        } else {
          opt.voters.push(userId);
        }
        opt.votes = opt.voters.length;
      } else if (!allowMultiple) {
        // Remove vote from other options
        const voterIndex = opt.voters.indexOf(userId);
        if (voterIndex >= 0) {
          opt.voters.splice(voterIndex, 1);
          opt.votes = opt.voters.length;
        }
      }
    });

    saveDb(db);
    res.json({ success: true, pollOptions: msg.pollOptions });
  });

  // 10. Delete Chat
  app.delete('/api/chats/:chatId', (req, res) => {
    const { chatId } = req.params;
    if (chatId === GLOBAL_CHAT_ID) {
      return res.status(400).json({ error: 'Der globale "Alle"-Chat kann nicht gelöscht werden.' });
    }
    const db = loadDb();

    db.chats = db.chats.filter((c) => c.id !== chatId);
    db.messages = db.messages.filter((m) => m.chatId !== chatId);
    saveDb(db);

    res.json({ success: true });
  });

  // Clear Chat messages
  app.post('/api/chats/:chatId/clear', (req, res) => {
    const { chatId } = req.params;
    if (chatId === GLOBAL_CHAT_ID) {
      return res.status(400).json({ error: 'Der "Alle"-Chat kann nicht geleert werden.' });
    }
    const db = loadDb();

    db.messages = db.messages.filter((m) => m.chatId !== chatId);
    saveDb(db);

    res.json({ success: true });
  });

  // 11. Edit a message
  app.patch('/api/messages/:messageId', (req, res) => {
    const { messageId } = req.params;
    const { userId, newText } = req.body;

    if (!newText || typeof newText !== 'string' || !newText.trim()) {
      return res.status(400).json({ error: 'Text darf nicht leer sein' });
    }

    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (msg.senderId !== userId) {
      return res.status(403).json({ error: 'Nur der Verfasser kann diese Nachricht bearbeiten' });
    }

    msg.text = newText.trim();
    msg.isEdited = true;
    saveDb(db);

    res.json({ success: true, message: msg });
  });

  // 12. Toggle star on message
  app.post('/api/messages/:messageId/star', (req, res) => {
    const { messageId } = req.params;
    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    msg.isStarred = !msg.isStarred;
    saveDb(db);

    res.json({ success: true, isStarred: msg.isStarred });
  });

  // 13. Update user profile (Name, About, Avatar Icon)
  app.patch('/api/users/:userId', (req, res) => {
    const { userId } = req.params;
    const { name, about, avatar } = req.body;

    const db = loadDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldName = user.name;
    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
      if (!avatar) {
        user.avatar = getAvatar(user.name);
      }

      // Update participant names in chats if changed
      db.chats.forEach((c) => {
        const idx = c.participants.indexOf(userId);
        if (idx >= 0) {
          c.participantNames[idx] = user.name;
        }
      });
      // Update senderName in recent messages
      db.messages.forEach((m) => {
        if (m.senderId === userId) {
          m.senderName = user.name;
        }
      });
    }

    if (avatar && typeof avatar === 'string' && avatar.trim()) {
      user.avatar = avatar.trim();
    }

    if (typeof about === 'string') {
      user.about = about.trim() || 'Verfügbar';
    }

    saveDb(db);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        about: user.about,
      },
    });
  });

  // ==================== ADMIN API ENDPOINTS ====================

  // 14. Admin Overview & Statistics
  app.get('/api/admin/overview', (req, res) => {
    const db = loadDb();
    ensureGlobalChat(db);

    const totalUsers = db.users.length;
    const totalChats = db.chats.length;
    const totalMessages = db.messages.length;
    const totalMedia = db.messages.filter(
      (m) => m.type === 'image' || m.type === 'voice' || m.type === 'document'
    ).length;
    const totalPolls = db.messages.filter((m) => m.type === 'poll').length;

    const globalChats = db.chats
      .filter((c) => c.isGlobal || c.id === GLOBAL_CHAT_ID || c.participants.includes('*'))
      .map((g) => {
        const msgCount = db.messages.filter((m) => m.chatId === g.id).length;
        return {
          id: g.id,
          name: g.name || (g.id === GLOBAL_CHAT_ID ? 'Alle' : 'Globaler Chat'),
          about: g.about || 'Öffentlicher Gruppenchat',
          avatar: g.avatar || GLOBAL_CHAT_AVATAR,
          isPinned: g.isPinned ?? true,
          disappearingTimer: g.disappearingTimer || 'off',
          messageCount: msgCount,
          createdAt: g.createdAt,
        };
      });

    const userStats = db.users.map((u) => {
      const msgCount = db.messages.filter((m) => m.senderId === u.id).length;
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        about: u.about,
        createdAt: u.createdAt || Date.now(),
        messageCount: msgCount,
      };
    });

    const chatStats = db.chats.map((c) => {
      const msgCount = db.messages.filter((m) => m.chatId === c.id).length;
      return {
        id: c.id,
        participantNames: c.participantNames,
        messageCount: msgCount,
        createdAt: c.createdAt,
      };
    });

    const recentMessages = db.messages
      .slice(-40)
      .reverse()
      .map((m) => ({
        id: m.id,
        chatId: m.chatId,
        senderName: m.senderName,
        text: m.text,
        type: m.type,
        timestamp: m.timestamp,
        createdAt: m.createdAt,
        deleted: m.deleted,
      }));

    res.json({
      totalUsers,
      totalChats,
      totalMessages,
      totalMedia,
      totalPolls,
      globalChats,
      users: userStats,
      chats: chatStats,
      recentMessages,
    });
  });

  // Admin: Get all Global Chats
  app.get('/api/admin/global-chats', (req, res) => {
    const db = loadDb();
    ensureGlobalChat(db);

    const globalChats = db.chats
      .filter((c) => c.isGlobal || c.id === GLOBAL_CHAT_ID || c.participants.includes('*'))
      .map((g) => {
        const msgCount = db.messages.filter((m) => m.chatId === g.id).length;
        return {
          id: g.id,
          name: g.name || (g.id === GLOBAL_CHAT_ID ? 'Alle' : 'Globaler Chat'),
          about: g.about || 'Öffentlicher Gruppenchat',
          avatar: g.avatar || GLOBAL_CHAT_AVATAR,
          isPinned: g.isPinned ?? true,
          disappearingTimer: g.disappearingTimer || 'off',
          messageCount: msgCount,
          createdAt: g.createdAt,
        };
      });

    res.json(globalChats);
  });

  // Admin: Create new Global Chat
  app.post('/api/admin/global-chats', (req, res) => {
    const { name, about, avatar, isPinned, initialMessage, disappearingTimer } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Der Name muss mindestens 2 Zeichen lang sein.' });
    }

    const db = loadDb();
    const newChatId = `chat_global_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newChat: DbChat = {
      id: newChatId,
      name: name.trim(),
      about: (about || 'Offizieller globaler Gruppenchat').trim(),
      avatar:
        avatar && typeof avatar === 'string' && avatar.trim()
          ? avatar.trim()
          : 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
      isGlobal: true,
      isPinned: isPinned !== false,
      disappearingTimer: disappearingTimer || 'off',
      participants: ['*'],
      participantNames: [name.trim()],
      createdAt: Date.now(),
    };

    db.chats.unshift(newChat);

    // Initial broadcast message from WhatsApp admin in this new global room
    const welcomeText =
      initialMessage && typeof initialMessage === 'string' && initialMessage.trim()
        ? initialMessage.trim()
        : `👋 Willkommen im neuen globalen Chat "${name.trim()}"! Jeder registrierte Nutzer kann hier beitreten und mitdiskutieren.`;

    const now = new Date();
    const timeStr = `${now.getHours()}:${
      now.getMinutes() < 10 ? '0' : ''
    }${now.getMinutes()}`;

    db.messages.push({
      id: `msg_init_${Date.now()}`,
      chatId: newChatId,
      senderId: 'usr_whatsapp_admin',
      senderName: 'WhatsApp',
      text: welcomeText,
      timestamp: timeStr,
      status: 'read',
      type: 'text',
      createdAt: Date.now(),
    });

    saveDb(db);
    res.json({ success: true, chat: newChat });
  });

  // Admin: Update Global Chat
  app.patch('/api/admin/global-chats/:chatId', (req, res) => {
    const { chatId } = req.params;
    const { name, about, avatar, isPinned, disappearingTimer } = req.body;

    const db = loadDb();
    let chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      if (chatId === GLOBAL_CHAT_ID) {
        chat = ensureGlobalChat(db);
      } else {
        return res.status(404).json({ error: 'Globaler Chat nicht gefunden' });
      }
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      chat.name = name.trim();
      chat.participantNames = [name.trim()];
    }
    if (typeof about === 'string') {
      chat.about = about.trim();
    }
    if (typeof avatar === 'string' && avatar.trim()) {
      chat.avatar = avatar.trim();
    }
    if (typeof isPinned === 'boolean') {
      chat.isPinned = isPinned;
    }
    if (disappearingTimer && ['off', '24h', '7d', '90d'].includes(disappearingTimer)) {
      chat.disappearingTimer = disappearingTimer;
    }

    saveDb(db);
    res.json({ success: true, chat });
  });

  // Admin: Delete Global Chat
  app.delete('/api/admin/global-chats/:chatId', (req, res) => {
    const { chatId } = req.params;
    const db = loadDb();

    db.chats = db.chats.filter((c) => c.id !== chatId);
    db.messages = db.messages.filter((m) => m.chatId !== chatId);

    saveDb(db);
    res.json({ success: true });
  });

  // 15. Admin: Delete User
  app.delete('/api/admin/users/:userId', (req, res) => {
    const { userId } = req.params;
    const db = loadDb();

    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (targetUser.name.toLowerCase() === 'whatsapp') {
      return res.status(400).json({ error: 'Der WhatsApp Admin-Account kann nicht gelöscht werden.' });
    }

    // Remove user
    db.users = db.users.filter((u) => u.id !== userId);

    // Remove user's chats and associated messages
    const userChatIds = db.chats
      .filter((c) => c.participants.includes(userId))
      .map((c) => c.id);

    db.chats = db.chats.filter((c) => !userChatIds.includes(c.id));
    db.messages = db.messages.filter((m) => !userChatIds.includes(m.chatId));

    saveDb(db);
    res.json({ success: true });
  });

  // 16. Admin: Delete Chat
  app.delete('/api/admin/chats/:chatId', (req, res) => {
    const { chatId } = req.params;
    const db = loadDb();

    db.chats = db.chats.filter((c) => c.id !== chatId);
    db.messages = db.messages.filter((m) => m.chatId !== chatId);

    saveDb(db);
    res.json({ success: true });
  });

  // 17. Admin: Delete Message permanently
  app.delete('/api/admin/messages/:messageId', (req, res) => {
    const { messageId } = req.params;
    const db = loadDb();

    db.messages = db.messages.filter((m) => m.id !== messageId);
    saveDb(db);
    res.json({ success: true });
  });

  // 18. Admin: System Broadcast to all Chats
  app.post('/api/admin/broadcast', (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Broadcast-Nachricht darf nicht leer sein.' });
    }

    const db = loadDb();
    const adminUser = db.users.find((u) => u.name.toLowerCase() === 'whatsapp') || {
      id: 'usr_whatsapp_admin',
      name: 'WhatsApp',
    };

    const nowStr = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    let broadcastCount = 0;

    // Ensure global chat is in database
    ensureGlobalChat(db);

    // Send to every existing chat
    db.chats.forEach((chat) => {
      const newMsg: DbMessage = {
        id: `msg_broadcast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId: chat.id,
        senderId: adminUser.id,
        senderName: 'WhatsApp (Offiziell)',
        text: `📢 [Offizielle WhatsApp-Mitteilung]:\n${text.trim()}`,
        timestamp: nowStr,
        status: 'delivered',
        type: 'text',
        createdAt: Date.now(),
      };
      db.messages.push(newMsg);
      broadcastCount++;
    });

    saveDb(db);
    res.json({ success: true, count: broadcastCount });
  });

  // Admin direct message to a specific chat (e.g. Alle-Chat)
  app.post('/api/admin/send-message', (req, res) => {
    const { chatId, text } = req.body;
    if (!chatId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Chat-ID und Nachrichtentext erforderlich.' });
    }

    const db = loadDb();
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat nicht gefunden.' });
    }

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    const newMsg: DbMessage = {
      id: `msg_admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      senderId: 'usr_whatsapp_admin',
      senderName: 'WhatsApp',
      text: text.trim(),
      timestamp: timeStr,
      status: 'delivered',
      type: 'text',
      createdAt: Date.now(),
    };

    db.messages.push(newMsg);
    saveDb(db);

    res.json({ success: true, message: newMsg });
  });

  // 19. Admin: Reset all chats and messages
  app.post('/api/admin/reset-system', (req, res) => {
    const db = loadDb();

    // Preserve admin user
    let adminUser = db.users.find((u) => u.name.toLowerCase() === 'whatsapp');
    if (!adminUser) {
      adminUser = {
        id: 'usr_whatsapp_admin',
        name: 'WhatsApp',
        password: '',
        avatar: 'icon:admin',
        about: 'Offizieller WhatsApp Administrator',
        createdAt: Date.now(),
      };
    }

    const defaultAlex = {
      id: 'usr_alex',
      name: 'Alex',
      password: '',
      avatar: 'icon:classic',
      about: 'Auf WhatsApp',
      createdAt: Date.now() - 86400000 * 2,
    };

    const defaultSarah = {
      id: 'usr_sarah',
      name: 'Sarah',
      password: '',
      avatar: 'icon:emerald',
      about: 'Beschäftigt',
      createdAt: Date.now() - 86400000 * 3,
    };

    db.users = db.users.length > 0 ? db.users : [adminUser, defaultAlex, defaultSarah];
    if (!db.users.some((u) => u.name.toLowerCase() === 'whatsapp')) {
      db.users.push(adminUser);
    }

    db.chats = [];
    db.messages = [];
    ensureGlobalChat(db);
    ensureOfficialChannel(db);

    saveDb(db);
    res.json({ success: true, message: 'System zurückgesetzt. Globaler Chat ist aktiv.' });
  });

  // Admin Code verification (Code 13243 requirement removed per user request)
  app.post('/api/admin/verify-code', (req, res) => {
    const { userId } = req.body;
    const db = loadDb();
    const user = db.users.find((u) => u.id === userId || u.name.toLowerCase() === (userId || '').toLowerCase());
    if (user) {
      user.isAdmin = true;
      saveDb(db);
      return res.json({ success: true, isAdmin: true, user: { ...user, isAdmin: true } });
    }
    return res.json({ success: true, isAdmin: true });
  });

  // User Heartbeat to keep online presence active
  app.post('/api/users/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (userId) {
      updateUserActivity(userId);
    }
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Channel helper: ensure only the official WhatsApp channel exists
  function ensureOfficialChannel(db: DatabaseSchema) {
    if (!db.channels || db.channels.length === 0) {
      db.channels = [
        {
          id: 'whatsapp-official',
          name: 'WhatsApp',
          category: 'Offiziell',
          verified: true,
          avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80',
          followers: '154 Mio. Abonnenten',
          description: 'Offizielle Neuigkeiten, exklusive Einblicke und neue Funktionen direkt vom WhatsApp-Team.',
          posts: [
            {
              id: 'p1',
              time: 'Heute, 14:30',
              text: 'Wir stellen neue WhatsApp-Funktionen für Freunde bereit: Benutzerdefinierte Chat-Hintergründe, persönliche Spitznamen, Einmal-Ansicht für Nachrichten und @Erwähnungen in Gruppen.',
              imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&auto=format&fit=crop&q=80',
              link: { title: 'WhatsApp Blog', url: 'https://whatsapp.com' },
              reactions: [
                { emoji: '👍', count: 18420 },
                { emoji: '❤️', count: 24150 },
                { emoji: '🔥', count: 9840 },
              ],
              createdAt: Date.now() - 3600000,
            },
            {
              id: 'p2',
              time: 'Gestern, 11:15',
              text: 'Alle Fake-Communitys und Fremdkanäle wurden entfernt. Dieser Kanal bleibt der einzige offizielle Update-Kanal und kann von Administratoren direkt gepflegt und erweitert werden.',
              reactions: [
                { emoji: '👍', count: 14200 },
                { emoji: '❤️', count: 19800 },
              ],
              createdAt: Date.now() - 86400000,
            },
          ],
        },
      ];
      saveDb(db);
    } else {
      // Ensure official channel exists, but preserve all other user-created channels
      const official = db.channels.find((c) => c.id === 'whatsapp-official');
      if (!official) {
        db.channels.unshift({
          id: 'whatsapp-official',
          name: 'WhatsApp',
          category: 'Offiziell',
          verified: true,
          avatar: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
          followers: '14,2 Mio.',
          description: 'Offizielle Neuigkeiten, Funktionen und Tipps direkt vom WhatsApp-Team.',
          posts: [],
        });
        saveDb(db);
      }
    }
  }

  // 20. Get Channels
  app.get('/api/channels', (req, res) => {
    const db = loadDb();
    ensureOfficialChannel(db);
    res.json(db.channels || []);
  });

  // 20b. Get Single Channel by ID
  app.get('/api/channels/:channelId', (req, res) => {
    const { channelId } = req.params;
    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find(
      (c) => c.id === channelId || c.id === 'whatsapp-official'
    );
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }
    res.json(channel);
  });

  // 21. Create Post in Channel (with Poll support)
  app.post('/api/channels/:channelId/posts', (req, res) => {
    const { channelId } = req.params;
    const {
      text,
      imageUrl,
      videoUrl,
      videoDuration,
      isVideo,
      linkTitle,
      linkUrl,
      pollQuestion,
      pollOptions,
    } = req.body;
    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }
    if ((!text || !text.trim()) && !pollQuestion) {
      return res.status(400).json({ error: 'Text oder Umfragefrage ist erforderlich' });
    }

    const nowStr = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const newPost: DbChannelPost = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: `Heute, ${nowStr}`,
      text: (text || '').trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : undefined,
      videoUrl: videoUrl && videoUrl.trim() ? videoUrl.trim() : undefined,
      videoDuration: videoDuration && videoDuration.trim() ? videoDuration.trim() : undefined,
      isVideo: isVideo !== undefined ? !!isVideo : !!videoUrl,
      link: linkTitle && linkUrl ? { title: linkTitle.trim(), url: linkUrl.trim() } : undefined,
      reactions: [],
      pollQuestion: pollQuestion && pollQuestion.trim() ? pollQuestion.trim() : undefined,
      pollOptions:
        pollOptions && Array.isArray(pollOptions)
          ? pollOptions
              .filter((o: any) => o && (o.text || '').trim())
              .map((o: any, idx: number) => ({
                id: o.id || `copt_${Date.now()}_${idx}`,
                text: String(o.text).trim(),
                votes: 0,
                voters: [],
              }))
          : undefined,
      comments: [],
      createdAt: Date.now(),
    };

    channel.posts.unshift(newPost);
    saveDb(db);
    res.json({ success: true, post: newPost });
  });

  // 21b. Admin: AI Video Generation for WhatsApp Channel (Code 13243 requirement removed per user request)
  app.post('/api/channels/:channelId/generate-video', (req, res) => {
    const { channelId } = req.params;
    const { prompt, style = 'modern', title } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Ein Thema oder Prompt für das KI-Video ist erforderlich.' });
    }

    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }

    // Curated high quality responsive MP4 tech demo & motion video templates
    const videoTemplates = [
      {
        id: 'motion-tech',
        style: 'modern',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'features-community',
        style: 'features',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'security-privacy',
        style: 'security',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'speed-network',
        style: 'speed',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '0:12',
        poster: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
      },
    ];

    const matchedTemplate =
      videoTemplates.find((t) => t.style === style) || videoTemplates[0];

    const generatedTitle =
      title && title.trim()
        ? title.trim()
        : prompt.length > 40
        ? `${prompt.trim().slice(0, 37)}...`
        : prompt.trim();

    return res.json({
      success: true,
      videoUrl: matchedTemplate.url,
      videoDuration: matchedTemplate.duration,
      posterUrl: matchedTemplate.poster,
      title: generatedTitle,
      caption: `🎬 KI-Video-Update: ${prompt.trim()}`,
      style: matchedTemplate.style,
      prompt: prompt.trim(),
    });
  });

  // 21c. Admin-Area Exclusive: AI Video Studio Generator
  app.post('/api/admin/generate-video', (req, res) => {
    const { prompt, style = 'modern', title } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Bitte gib ein Thema oder Prompt für das KI-Video ein.' });
    }

    const videoTemplates = [
      {
        id: 'motion-tech',
        style: 'modern',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'features-community',
        style: 'features',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'security-privacy',
        style: 'security',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '0:15',
        poster: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'speed-network',
        style: 'speed',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '0:12',
        poster: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
      },
    ];

    const matchedTemplate =
      videoTemplates.find((t) => t.style === style) || videoTemplates[0];

    const generatedTitle =
      title && title.trim()
        ? title.trim()
        : prompt.length > 40
        ? `${prompt.trim().slice(0, 37)}...`
        : prompt.trim();

    return res.json({
      success: true,
      videoUrl: matchedTemplate.url,
      videoDuration: matchedTemplate.duration,
      posterUrl: matchedTemplate.poster,
      title: generatedTitle,
      caption: `🎬 KI-Video-Update: ${prompt.trim()}`,
      style: matchedTemplate.style,
      prompt: prompt.trim(),
    });
  });

  // 22. Admin: Edit Post in WhatsApp Channel
  app.put('/api/channels/:channelId/posts/:postId', (req, res) => {
    const { channelId, postId } = req.params;
    const { text, imageUrl, videoUrl, videoDuration, isVideo, linkTitle, linkUrl } = req.body;
    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }
    const post = channel.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    }
    if (text !== undefined) post.text = text.trim();
    if (imageUrl !== undefined) post.imageUrl = imageUrl.trim() || undefined;
    if (videoUrl !== undefined) post.videoUrl = videoUrl.trim() || undefined;
    if (videoDuration !== undefined) post.videoDuration = videoDuration.trim() || undefined;
    if (isVideo !== undefined) post.isVideo = !!isVideo;
    if (linkTitle !== undefined || linkUrl !== undefined) {
      post.link = linkTitle && linkUrl ? { title: linkTitle.trim(), url: linkUrl.trim() } : undefined;
    }
    saveDb(db);
    res.json({ success: true, post });
  });

  // 23. Admin: Delete Post in WhatsApp Channel
  app.delete('/api/channels/:channelId/posts/:postId', (req, res) => {
    const { channelId, postId } = req.params;
    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }
    channel.posts = channel.posts.filter((p) => p.id !== postId);
    saveDb(db);
    res.json({ success: true });
  });

  // 24. React to Channel Post
  app.post('/api/channels/:channelId/posts/:postId/react', (req, res) => {
    const { channelId, postId } = req.params;
    const { userId, emoji } = req.body;
    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal nicht gefunden' });
    }
    const post = channel.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    }
    if (!post.reactions) post.reactions = [];

    const existingReaction = post.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.voters) existingReaction.voters = [];
      if (userId && existingReaction.voters.includes(userId)) {
        existingReaction.voters = existingReaction.voters.filter((id) => id !== userId);
        existingReaction.count = Math.max(0, existingReaction.count - 1);
      } else {
        if (userId) existingReaction.voters.push(userId);
        existingReaction.count += 1;
      }
    } else {
      post.reactions.push({
        emoji,
        count: 1,
        voters: userId ? [userId] : [],
      });
    }
    saveDb(db);
    res.json({ success: true, reactions: post.reactions });
  });

  // 25. Create New Channel
  app.post('/api/channels', (req, res) => {
    const { name, category, description, avatar, createdBy } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Kanalname ist erforderlich.' });
    }

    const db = loadDb();
    ensureOfficialChannel(db);

    const cleanName = name.trim();
    const idSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const channelId = `ch_${idSlug || 'custom'}_${Math.random().toString(36).slice(2, 6)}`;

    const newChannel: DbChannel = {
      id: channelId,
      name: cleanName,
      category: category && category.trim() ? category.trim() : 'Community',
      verified: false,
      avatar:
        avatar && avatar.trim()
          ? avatar.trim()
          : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
      followers: '1 Abonnent',
      description:
        description && description.trim()
          ? description.trim()
          : 'Ein neuer Kanal auf WhatsNew.',
      createdBy: createdBy || 'admin',
      posts: [
        {
          id: `p_${Date.now()}`,
          time: 'Gerade eben',
          text: `Willkommen im Kanal "${cleanName}"! Hier findest du ab sofort alle Neuigkeiten und Updates.`,
          reactions: [{ emoji: '👋', count: 1 }],
          createdAt: Date.now(),
        },
      ],
    };

    db.channels.push(newChannel);
    saveDb(db);
    res.json({ success: true, channel: newChannel });
  });

  // 26. Vote on Channel Poll
  app.post('/api/channels/:channelId/posts/:postId/vote', (req, res) => {
    const { channelId, postId } = req.params;
    const { optionId, userId } = req.body;

    if (!optionId || !userId) {
      return res.status(400).json({ error: 'Option-ID und Benutzer-ID erforderlich.' });
    }

    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) return res.status(404).json({ error: 'Kanal nicht gefunden' });
    const post = channel.posts.find((p) => p.id === postId);
    if (!post || !post.pollOptions) {
      return res.status(404).json({ error: 'Umfrage nicht gefunden' });
    }

    // Toggle vote
    post.pollOptions.forEach((opt) => {
      if (!opt.voters) opt.voters = [];
      const userVoted = opt.voters.includes(userId);
      if (opt.id === optionId) {
        if (userVoted) {
          opt.voters = opt.voters.filter((id) => id !== userId);
          opt.votes = Math.max(0, opt.votes - 1);
        } else {
          opt.voters.push(userId);
          opt.votes += 1;
        }
      } else {
        // Single vote mode: remove from other options
        if (userVoted) {
          opt.voters = opt.voters.filter((id) => id !== userId);
          opt.votes = Math.max(0, opt.votes - 1);
        }
      }
    });

    saveDb(db);
    res.json({ success: true, pollOptions: post.pollOptions });
  });

  // 27. Add Comment to Channel Post
  app.post('/api/channels/:channelId/posts/:postId/comments', (req, res) => {
    const { channelId, postId } = req.params;
    const { text, authorName, authorAvatar, authorId } = req.body;

    if (!text || !text.trim() || !authorName) {
      return res.status(400).json({ error: 'Kommentartext und Autor erforderlich.' });
    }

    const db = loadDb();
    ensureOfficialChannel(db);
    const channel = (db.channels || []).find((c) => c.id === channelId);
    if (!channel) return res.status(404).json({ error: 'Kanal nicht gefunden' });
    const post = channel.posts.find((p) => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden' });

    if (!post.comments) post.comments = [];

    const nowStr = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const newComment: DbChannelComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId,
      authorName: authorName.trim(),
      authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authorName)}`,
      text: text.trim(),
      timestamp: `Heute, ${nowStr}`,
      createdAt: Date.now(),
    };

    post.comments.push(newComment);
    saveDb(db);
    res.json({ success: true, comment: newComment, comments: post.comments });
  });

  // 28. Public and Admin System Settings (Location Sharing Limits, WIP config)
  app.get(['/api/settings', '/api/admin/settings'], (req, res) => {
    const db = loadDb();
    const limit = db.settings?.locationShareDailyLimit ?? 3;
    res.json({
      locationShareDailyLimit: limit,
      locationUsageTodayCount: 0,
    });
  });

  app.put('/api/admin/settings', (req, res) => {
    const { locationShareDailyLimit } = req.body;
    const db = loadDb();
    if (!db.settings) {
      db.settings = { locationShareDailyLimit: 3 };
    }
    if (typeof locationShareDailyLimit === 'number' && locationShareDailyLimit >= 0) {
      db.settings.locationShareDailyLimit = locationShareDailyLimit;
    }
    saveDb(db);
    res.json({ success: true, settings: db.settings });
  });

  app.post('/api/admin/settings/reset-location-usage', (req, res) => {
    const db = loadDb();
    if (db.settings) {
      db.settings.locationUsageByDate = {};
    }
    saveDb(db);
    res.json({ success: true, message: 'Tägliche Zähler erfolgreich zurückgesetzt.' });
  });

  // 29. External Notifications Step-by-Step Guide (Public & Admin configurable)
  const defaultNotificationGuide = {
    title: 'Externe Mitteilungen auf dem Smartphone aktivieren',
    subtitle: 'So empfängst du WhatsNew-Nachrichten direkt in der Mitteilungsleiste deines Handys, auch wenn der Bildschirm gesperrt ist.',
    androidSteps: [
      {
        id: 'android-1',
        title: 'Benachrichtigungen im Browser gestatten',
        description: 'Öffne die WhatsNew-Seite auf deinem Android-Handy (z.B. Google Chrome oder Samsung Internet). Wenn die Abfrage "Darf WhatsNew Benachrichtigungen senden?" erscheint, tippe sofort auf "Zulassen" oder "Erlauben".',
        badge: 'Schritt 1',
        imageUrl: '',
      },
      {
        id: 'android-2',
        title: 'Als Web-App auf dem Startbildschirm installieren (Empfohlen)',
        description: 'Tippe im Browser oben rechts auf das 3-Punkte-Menü (⋮) und wähle "Zum Startbildschirm hinzufügen" bzw. "App installieren". WhatsNew wird nun mit echtem WhatsApp-Icon als eigene App abgelegt und empfängt Systemnachrichten viel stabiler.',
        badge: 'Schritt 2',
        imageUrl: '',
      },
      {
        id: 'android-3',
        title: 'Akku-Optimierung für Hintergrundaktivität prüfen',
        description: 'Halte auf deinem Startbildschirm das WhatsNew-Icon gedrückt ➔ App-Info (i) ➔ "Akku" ➔ wähle "Nicht eingeschränkt" bzw. "Hintergrunddaten aktivieren", damit Nachrichten ohne Verzögerung aufpoppen.',
        badge: 'Schritt 3',
        imageUrl: '',
      },
    ],
    iosSteps: [
      {
        id: 'ios-1',
        title: 'WhatsNew in Safari auf dem iPhone öffnen',
        description: 'Apple erlaubt System-Mitteilungen auf dem Sperrbildschirm nur über den Safari-Browser. Öffne WhatsNew daher direkt in Apple Safari.',
        badge: 'Schritt 1',
        imageUrl: '',
      },
      {
        id: 'ios-2',
        title: 'Zum Home-Bildschirm hinzufügen (Apple Pflicht)',
        description: 'Tippe unten in der Safari-Leiste auf das Teilen-Symbol (Viereck mit Pfeil nach oben ⎋). Scrolle im Menü etwas nach unten und wähle "Zum Home-Bildschirm" (+). Bestätige oben rechts mit "Hinzufügen".',
        badge: 'Schritt 2 (Wichtig)',
        imageUrl: '',
      },
      {
        id: 'ios-3',
        title: 'WhatsNew vom Homescreen starten & Mitteilungen erlauben',
        description: 'Öffne jetzt WhatsNew über das neue Symbol direkt auf deinem Home-Bildschirm. Tippe bei der Systemabfrage auf "Mitteilungen erlauben". Ab jetzt poppen Nachrichten in deiner iOS-Mitteilungszentrale auf!',
        badge: 'Schritt 3',
        imageUrl: '',
      },
    ],
    troubleshootingTips: [
      'Falls keine Meldung kommt: Prüfe in den Handy-Einstellungen ➔ Mitteilungen ➔ Chrome / Safari, ob Benachrichtigungen erlaubt sind.',
      'Auf der GitHub-Seite (whatsnew.html) muss im <iframe> das Attribut allow="... notifications" eingetragen sein.',
      'Stelle sicher, dass der Nicht-Stören-Modus (Fokus) am Smartphone ausgeschaltet ist.',
    ],
  };

  app.get('/api/notification-guide', (req, res) => {
    const db = loadDb();
    const guide = db.notificationGuide || defaultNotificationGuide;
    res.json(guide);
  });

  app.put('/api/admin/notification-guide', (req, res) => {
    const { title, subtitle, androidSteps, iosSteps, troubleshootingTips } = req.body;
    const db = loadDb();

    db.notificationGuide = {
      title: title || defaultNotificationGuide.title,
      subtitle: subtitle || defaultNotificationGuide.subtitle,
      androidSteps: Array.isArray(androidSteps) ? androidSteps : defaultNotificationGuide.androidSteps,
      iosSteps: Array.isArray(iosSteps) ? iosSteps : defaultNotificationGuide.iosSteps,
      troubleshootingTips: Array.isArray(troubleshootingTips) ? troubleshootingTips : defaultNotificationGuide.troubleshootingTips,
    };

    saveDb(db);
    res.json({ success: true, notificationGuide: db.notificationGuide });
  });

  app.post('/api/admin/notification-guide/reset', (req, res) => {
    const db = loadDb();
    db.notificationGuide = JSON.parse(JSON.stringify(defaultNotificationGuide));
    saveDb(db);
    res.json({ success: true, notificationGuide: db.notificationGuide });
  });

  // --- Feature 1: Message Editing & Pinning ---
  app.put('/api/messages/:messageId/edit', (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text ist erforderlich.' });
    }
    const db = loadDb();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    }
    msg.text = text.trim();
    msg.isEdited = true;
    (msg as any).editedAt = Date.now();
    saveDb(db);
    res.json({ success: true, message: msg });
  });

  app.post('/api/chats/:chatId/pin-message', (req, res) => {
    const { chatId } = req.params;
    const { messageId, duration = '24h', action = 'pin' } = req.body;
    const db = loadDb();
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat nicht gefunden.' });
    }

    if (action === 'unpin') {
      chat.pinnedMessageId = undefined;
      (chat as any).pinnedMessages = [];
      const msg = db.messages.find((m) => m.id === messageId);
      if (msg) msg.isPinned = false;
      saveDb(db);
      return res.json({ success: true, pinnedMessageId: null, pinnedMessages: [] });
    }

    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    }

    let durationMs = 24 * 60 * 60 * 1000;
    if (duration === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
    if (duration === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

    chat.pinnedMessageId = messageId;
    (chat as any).pinnedMessages = [
      {
        messageId,
        pinnedUntil: Date.now() + durationMs,
        text: msg.text || (msg.type === 'image' ? '📷 Foto' : 'Medien'),
      },
    ];
    msg.isPinned = true;
    saveDb(db);
    res.json({ success: true, pinnedMessageId: messageId, pinnedMessages: (chat as any).pinnedMessages });
  });

  // --- Feature 1 (cont.): Scheduled Messages ---
  app.get('/api/scheduled-messages', (req, res) => {
    const db = loadDb();
    if (!db.scheduledMessages) db.scheduledMessages = [];
    const now = Date.now();

    const dueMessages = db.scheduledMessages.filter(
      (sm) => sm.status === 'pending' && sm.scheduledTime <= now
    );
    if (dueMessages.length > 0) {
      dueMessages.forEach((sm) => {
        sm.status = 'sent';
        const d = new Date(sm.scheduledTime);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        db.messages.push({
          id: `msg_sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          chatId: sm.chatId,
          senderId: sm.senderId,
          senderName: sm.senderName,
          text: sm.text,
          timestamp: timeStr,
          status: 'delivered',
          type: 'text',
          createdAt: sm.scheduledTime,
        });
      });
      saveDb(db);
    }

    const { chatId } = req.query;
    let list = db.scheduledMessages;
    if (chatId) {
      list = list.filter((sm) => sm.chatId === chatId);
    }
    res.json(list);
  });

  app.post('/api/scheduled-messages', (req, res) => {
    const { chatId, senderId, senderName, text, scheduledTime } = req.body;
    if (!chatId || !text || !scheduledTime) {
      return res.status(400).json({ error: 'Chat, Text und Sendezeit sind erforderlich.' });
    }
    const db = loadDb();
    if (!db.scheduledMessages) db.scheduledMessages = [];
    const newSched: DbScheduledMessage = {
      id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      senderId: senderId || 'usr_me',
      senderName: senderName || 'Ich',
      text: text.trim(),
      scheduledTime: Number(scheduledTime),
      createdAt: Date.now(),
      status: 'pending',
    };
    db.scheduledMessages.push(newSched);
    saveDb(db);
    res.json({ success: true, scheduledMessage: newSched });
  });

  app.delete('/api/scheduled-messages/:id', (req, res) => {
    const { id } = req.params;
    const db = loadDb();
    if (!db.scheduledMessages) db.scheduledMessages = [];
    const idx = db.scheduledMessages.findIndex((s) => s.id === id);
    if (idx >= 0) {
      db.scheduledMessages.splice(idx, 1);
      saveDb(db);
    }
    res.json({ success: true });
  });

  // --- Feature 2: Calls Log & WebRTC / Custom Cloud Handling ---
  app.get('/api/calls', (req, res) => {
    const db = loadDb();
    if (!db.calls) db.calls = [];
    res.json(db.calls);
  });

  app.post('/api/calls', (req, res) => {
    const {
      chatId,
      contactName,
      contactAvatar,
      type = 'voice',
      direction = 'outgoing',
      status = 'completed',
      duration = 0,
    } = req.body;

    const db = loadDb();
    if (!db.calls) db.calls = [];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newCall: DbCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId: chatId || 'unknown',
      contactName: contactName || 'Kontakt',
      contactAvatar: contactAvatar || '',
      type,
      direction,
      status,
      duration,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    db.calls.unshift(newCall);

    if (chatId) {
      db.messages.push({
        id: `msg_call_${Date.now()}`,
        chatId,
        senderId: direction === 'outgoing' ? 'usr_me' : 'them',
        senderName: contactName || 'Kontakt',
        text: type === 'video' ? 'Videoanruf' : 'Sprachanruf',
        timestamp: timeStr,
        status: 'read',
        type: 'call',
        callType: type,
        callDuration: duration,
        callStatus: status,
        createdAt: Date.now(),
      });
    }

    saveDb(db);
    res.json({ success: true, call: newCall });
  });

  // --- Feature 4: Meta AI (Admin controlled: disabled, enabled_free, enabled_user_key) ---
  app.get('/api/admin/meta-ai', (req, res) => {
    const db = loadDb();
    res.json(db.metaAiConfig || { mode: 'disabled', promptNotice: '' });
  });

  app.put('/api/admin/meta-ai', (req, res) => {
    const { mode, promptNotice } = req.body;
    if (!['disabled', 'enabled_free', 'enabled_user_key'].includes(mode)) {
      return res.status(400).json({ error: 'Ungültiger Modus.' });
    }
    const db = loadDb();
    db.metaAiConfig = {
      mode,
      promptNotice: promptNotice || 'Meta AI intelligenter WhatsApp Assistent',
    };
    saveDb(db);
    res.json({ success: true, metaAiConfig: db.metaAiConfig });
  });

  app.post('/api/meta-ai/chat', async (req, res) => {
    const { prompt, userApiKey } = req.body;
    const db = loadDb();
    const config = db.metaAiConfig || { mode: 'disabled' };

    if (config.mode === 'disabled') {
      return res.status(403).json({
        error: 'Meta AI ist derzeit vom WhatsApp-Administrator deaktiviert.',
      });
    }

    if (config.mode === 'enabled_user_key' && !userApiKey) {
      return res.status(400).json({
        error: 'Bitte gib deinen eigenen Gemini API-Schlüssel in den Einstellungen ein, um Meta AI zu verwenden.',
        requiresKey: true,
      });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Du bist Meta AI in WhatsApp Web. Antworte freundlich, präzise, hilfsbereit und auf Deutsch. Halte deine Antworten im lockeren Messenger-Ton. ${config.promptNotice || ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const replyText = response.text || 'Entschuldigung, ich konnte keine Antwort generieren.';
        return res.json({ reply: replyText });
      } catch (err: any) {
        console.error('Meta AI API Error:', err);
        return res.status(500).json({
          error: 'Fehler beim Abrufen von Meta AI: ' + (err.message || 'Unbekannter Fehler'),
        });
      }
    }

    return res.json({
      reply: `Hallo! Ich bin Meta AI in WhatsApp. Deine Frage war: "${prompt}". Es ist noch kein API-Key auf dem Server hinterlegt. Bitte trage deinen Gemini API-Key in den Einstellungen ein.`,
    });
  });

  // --- Feature 6: Storage & Data Management (Admin controlled) ---
  app.get('/api/admin/storage-data', (req, res) => {
    const db = loadDb();
    res.json({ enabled: !!db.storageDataConfig?.enabled });
  });

  app.put('/api/admin/storage-data', (req, res) => {
    const { enabled } = req.body;
    const db = loadDb();
    db.storageDataConfig = { enabled: !!enabled };
    saveDb(db);
    res.json({ success: true, storageDataConfig: db.storageDataConfig });
  });

  app.get('/api/storage-stats', (req, res) => {
    const db = loadDb();
    let totalImages = 0;
    let totalVideos = 0;
    let totalAudio = 0;
    let totalDocs = 0;
    let totalMsgBytes = 0;

    const chatStatsMap = new Map<string, { totalBytes: number; mediaCount: number; messagesCount: number }>();

    db.messages.forEach((m) => {
      let bytes = (m.text || '').length * 2;
      let isMedia = false;

      if (m.type === 'image' || m.mediaUrl?.startsWith('data:image')) {
        const imgSize = m.mediaUrl ? m.mediaUrl.length : 850000;
        totalImages += imgSize;
        bytes += imgSize;
        isMedia = true;
      } else if (m.type === 'voice' || m.audioDuration) {
        const audioSize = m.audioDuration ? m.audioDuration * 16000 : 220000;
        totalAudio += audioSize;
        bytes += audioSize;
        isMedia = true;
      } else if (m.type === 'document') {
        totalDocs += 350000;
        bytes += 350000;
        isMedia = true;
      } else if (m.type === 'poll') {
        bytes += 5000;
      }

      totalMsgBytes += bytes;

      const current = chatStatsMap.get(m.chatId) || { totalBytes: 0, mediaCount: 0, messagesCount: 0 };
      current.totalBytes += bytes;
      current.messagesCount += 1;
      if (isMedia) current.mediaCount += 1;
      chatStatsMap.set(m.chatId, current);
    });

    const chatBreakdown = db.chats.map((c) => {
      const stats = chatStatsMap.get(c.id) || { totalBytes: 2048, mediaCount: 0, messagesCount: 0 };
      return {
        chatId: c.id,
        chatName: c.name || (c.participantNames ? c.participantNames.join(', ') : 'Chat'),
        chatAvatar: c.avatar || '',
        totalBytes: stats.totalBytes,
        mediaCount: stats.mediaCount,
        messagesCount: stats.messagesCount,
      };
    }).sort((a, b) => b.totalBytes - a.totalBytes);

    const breakdown = {
      totalBytes: totalMsgBytes,
      mediaBreakdown: {
        images: totalImages,
        videos: totalVideos,
        audio: totalAudio,
        documents: totalDocs,
        messages: Math.max(0, totalMsgBytes - (totalImages + totalVideos + totalAudio + totalDocs)),
      },
      chatBreakdown,
    };

    res.json(breakdown);
  });

  app.post('/api/storage-clear', (req, res) => {
    const { chatId, type } = req.body;
    const db = loadDb();
    if (chatId) {
      if (type === 'media') {
        db.messages = db.messages.filter(
          (m) => !(m.chatId === chatId && ['image', 'voice', 'document'].includes(m.type))
        );
      } else if (type === 'all') {
        db.messages = db.messages.filter((m) => m.chatId !== chatId);
      }
    }
    saveDb(db);
    res.json({ success: true });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Web Server läuft auf http://localhost:${PORT}`);
  });
}

startServer();
