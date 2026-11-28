import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chat,
  Message,
  ContactStory,
  QuotedMessage,
  User,
  AppSettings,
  LocationData,
} from './types';
import { sounds } from './utils/audio';

const DEFAULT_APP_SETTINGS: AppSettings = {
  wallpaperTheme: 'classic',
  showDoodles: true,
  wallpaperDimming: 0,
  fontSize: 'medium',
  enterToSend: true,
  mediaVisibility: true,
  soundEnabled: true,
  outgoingSoundEnabled: true,
  callRingtoneEnabled: true,
  messageSound: 'whatsapp',
  soundVolume: 100,
  readReceipts: true,
  privacyLastSeen: 'everyone',
  privacyProfilePhoto: 'everyone',
  privacyAbout: 'everyone',
  securityNotifications: true,
  rememberUser: true,
  sessionTimeoutDays: 7,
  theme: 'light',
  compactMode: false,
  autoDownloadPhotos: true,
  autoDownloadAudio: true,
  autoDownloadDocuments: false,
  screenLockEnabled: false,
  screenLockPin: '1234',
  screenLockTimeoutMinutes: 15,
  locationShareDailyLimit: 3,
};

const STORAGE_KEY_USER = 'whatsapp_auth_user';
const STORAGE_KEY_SETTINGS = 'whatsapp_app_settings';
const STORAGE_KEY_LAST_ONLINE = 'whatsapp_last_online_timestamp';

import {
  isIframe,
  saveData,
  getData,
  deleteData,
  getDataSync,
} from './utils/storage';

import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatArea } from './components/ChatArea';
import { ContactInfoDrawer } from './components/ContactInfoDrawer';
import { EmptyChatState } from './components/EmptyChatState';
import { StatusModal } from './components/StatusModal';
import { NewChatModal } from './components/NewChatModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { PollModal } from './components/PollModal';
import { MediaLightbox } from './components/MediaLightbox';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { StarredMessagesModal } from './components/StarredMessagesModal';
import { NavigationRail, ActiveNavTab } from './components/NavigationRail';
import { ChannelsView } from './components/ChannelsView';
import { LinkedDevicesModal } from './components/LinkedDevicesModal';
import { DisappearingMessagesModal } from './components/DisappearingMessagesModal';
import { ForwardModal } from './components/ForwardModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ScreenLockOverlay } from './components/ScreenLockOverlay';
import { MuteModal } from './components/MuteModal';
import { ViewOnceModal } from './components/ViewOnceModal';
import { ChannelInviteModal } from './components/ChannelInviteModal';
import { CallModal } from './components/CallModal';
import { CallConfigModal } from './components/CallConfigModal';
import { CallsView } from './components/CallsView';
import { StorageDataModal } from './components/StorageDataModal';
import { MetaAIChatModal } from './components/MetaAIChatModal';
import { CallConfig, CallRecord, MetaAiConfig } from './types';
import {
  detectUrlChannelInvite,
  requestChannelInviteFromParent,
  listenForChannelInvites,
  savePendingChannelInvite,
  getPendingChannelInvite,
  clearPendingChannelInvite,
} from './utils/channelInviteBridge';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  // Track if session expired notice should be displayed to the user
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<{
    daysPassed: number;
    timeoutDays: number;
    lastOnlineDate: string;
  } | null>(null);

  const [lastOnlineTimestamp, setLastOnlineTimestamp] = useState<number | null>(() => {
    try {
      const saved = getDataSync(STORAGE_KEY_LAST_ONLINE);
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  // App Settings with localStorage/iframe persistence
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = getDataSync(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings from storage:', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Authentication State with storage persistence and inactivity timeout check
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSettingsRaw = getDataSync(STORAGE_KEY_SETTINGS);
      const currentSettings = savedSettingsRaw
        ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(savedSettingsRaw) }
        : DEFAULT_APP_SETTINGS;

      if (!currentSettings.rememberUser) {
        return null;
      }

      const savedUserRaw = getDataSync(STORAGE_KEY_USER);
      if (!savedUserRaw) return null;

      const user: User = JSON.parse(savedUserRaw);
      const lastOnlineRaw = getDataSync(STORAGE_KEY_LAST_ONLINE);

      if (lastOnlineRaw && currentSettings.sessionTimeoutDays > 0) {
        const lastOnlineMs = parseInt(lastOnlineRaw, 10);
        const now = Date.now();
        const daysPassed = (now - lastOnlineMs) / (1000 * 60 * 60 * 24);

        if (daysPassed >= currentSettings.sessionTimeoutDays) {
          // Inactivity limit exceeded -> expire session
          deleteData(STORAGE_KEY_USER);
          return null;
        }
      }

      return user;
    } catch (e) {
      console.error('Failed to restore user from storage:', e);
      return null;
    }
  });

  // Check on startup if an expired session occurred and notify the user
  useEffect(() => {
    try {
      const savedSettingsRaw = getDataSync(STORAGE_KEY_SETTINGS);
      const currentSettings = savedSettingsRaw
        ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(savedSettingsRaw) }
        : DEFAULT_APP_SETTINGS;

      const lastOnlineRaw = getDataSync(STORAGE_KEY_LAST_ONLINE);

      if (lastOnlineRaw && currentSettings.sessionTimeoutDays > 0) {
        const lastOnlineMs = parseInt(lastOnlineRaw, 10);
        const now = Date.now();
        const daysPassed = (now - lastOnlineMs) / (1000 * 60 * 60 * 24);

        if (daysPassed >= currentSettings.sessionTimeoutDays) {
          deleteData(STORAGE_KEY_USER);
          setSessionExpiredNotice({
            daysPassed: Math.max(1, Math.round(daysPassed * 10) / 10),
            timeoutDays: currentSettings.sessionTimeoutDays,
            lastOnlineDate: new Date(lastOnlineMs).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        }
      }
    } catch (e) {
      console.error('Session expiration check error:', e);
    }
  }, []);

  // Hydrate from parent window postMessage when embedded in an iFrame (e.g. GitHub Pages)
  useEffect(() => {
    if (!isIframe()) return;
    let isMounted = true;

    async function hydrateIframeStorage() {
      try {
        const [savedSettingsRaw, savedUserRaw, lastOnlineRaw] = await Promise.all([
          getData(STORAGE_KEY_SETTINGS),
          getData(STORAGE_KEY_USER),
          getData(STORAGE_KEY_LAST_ONLINE),
        ]);

        if (!isMounted) return;

        let currentSettings = DEFAULT_APP_SETTINGS;
        if (savedSettingsRaw) {
          try {
            currentSettings = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(savedSettingsRaw) };
            setAppSettings(currentSettings);
          } catch (e) {
            console.error('Failed to parse settings from iframe storage:', e);
          }
        }

        if (lastOnlineRaw) {
          const ts = parseInt(lastOnlineRaw, 10);
          if (!isNaN(ts)) {
            setLastOnlineTimestamp(ts);
          }
        }

        if (savedUserRaw && currentSettings.rememberUser) {
          try {
            const user: User = JSON.parse(savedUserRaw);
            if (lastOnlineRaw && currentSettings.sessionTimeoutDays > 0) {
              const lastOnlineMs = parseInt(lastOnlineRaw, 10);
              const now = Date.now();
              const daysPassed = (now - lastOnlineMs) / (1000 * 60 * 60 * 24);

              if (daysPassed >= currentSettings.sessionTimeoutDays) {
                deleteData(STORAGE_KEY_USER);
                setSessionExpiredNotice({
                  daysPassed: Math.max(1, Math.round(daysPassed * 10) / 10),
                  timeoutDays: currentSettings.sessionTimeoutDays,
                  lastOnlineDate: new Date(lastOnlineMs).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                });
                return;
              }
            }
            setCurrentUser(user);
          } catch (e) {
            console.error('Failed to parse user from iframe storage:', e);
          }
        }
      } catch (err) {
        console.error('Error hydrating storage in iframe mode:', err);
      }
    }

    hydrateIframeStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch dynamic system settings from server (e.g. locationShareDailyLimit configured by Admin)
  useEffect(() => {
    const fetchServerSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.locationShareDailyLimit === 'number') {
            setAppSettings((prev) => ({
              ...prev,
              locationShareDailyLimit: data.locationShareDailyLimit,
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching server settings:', err);
      }
    };
    fetchServerSettings();
  }, []);

  // Continuously keep last online timestamp updated while user is active
  useEffect(() => {
    if (!currentUser) return;

    const recordActivity = () => {
      const now = Date.now();
      setLastOnlineTimestamp(now);
      saveData(STORAGE_KEY_LAST_ONLINE, now.toString());
    };

    recordActivity();
    const interval = setInterval(recordActivity, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordActivity();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', recordActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', recordActivity);
    };
  }, [currentUser]);

  // Core Data States - synchronized with server backend
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [stories, setStories] = useState<ContactStory[]>([]);

  const handleUpdateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setAppSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        saveData(STORAGE_KEY_SETTINGS, JSON.stringify(updated));

        if (newSettings.rememberUser !== undefined) {
          if (newSettings.rememberUser && currentUser) {
            saveData(STORAGE_KEY_USER, JSON.stringify(currentUser));
            const now = Date.now();
            saveData(STORAGE_KEY_LAST_ONLINE, now.toString());
            setLastOnlineTimestamp(now);
          } else if (!newSettings.rememberUser) {
            deleteData(STORAGE_KEY_USER);
          }
        }
        return updated;
      });
    },
    [currentUser]
  );

  const handleLogout = useCallback(() => {
    const now = Date.now();
    saveData(STORAGE_KEY_LAST_ONLINE, now.toString());
    deleteData(STORAGE_KEY_USER);
    setLastOnlineTimestamp(now);
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    setActiveChatId(null);
  }, []);

  const handleLoginSuccess = (user: User, rememberMe: boolean) => {
    setCurrentUser(user);
    setSessionExpiredNotice(null);
    const now = Date.now();
    setLastOnlineTimestamp(now);
    saveData(STORAGE_KEY_LAST_ONLINE, now.toString());

    setAppSettings((prev) => {
      const updated = { ...prev, rememberUser: rememberMe };
      saveData(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });

    if (rememberMe) {
      saveData(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      deleteData(STORAGE_KEY_USER);
    }

    if (user.isAdmin) {
      setIsAdminPanelOpen(true);
    }

    // If there is an existing pending channel invite, prompt with channel invite modal upon login
    if (pendingChannelInvite) {
      setActiveInviteModalChannelId(pendingChannelInvite);
      setPendingChannelInvite(null);
      clearPendingChannelInvite();
    }
  };

  // Channel Invite Bridge States
  const [pendingChannelInvite, setPendingChannelInvite] = useState<string | null>(null);
  const [activeInviteModalChannelId, setActiveInviteModalChannelId] = useState<string | null>(null);

  // Detect and synchronize channel invites from URL & GitHub Pages postMessage
  useEffect(() => {
    // 1. Check URL (path: /channel/:id, query: ?channel=:id, hash: #channel=:id)
    const urlChannel = detectUrlChannelInvite();
    if (urlChannel) {
      if (currentUser) {
        setActiveInviteModalChannelId(urlChannel);
      } else {
        setPendingChannelInvite(urlChannel);
        savePendingChannelInvite(urlChannel);
      }
    }

    // 2. Query parent window if in iframe (GitHub Pages whatsnew.html)
    requestChannelInviteFromParent();

    // 3. Listen for postMessage from parent
    const unsubscribe = listenForChannelInvites((incomingChannelId) => {
      if (!incomingChannelId) return;
      if (currentUser) {
        setActiveInviteModalChannelId(incomingChannelId);
      } else {
        setPendingChannelInvite(incomingChannelId);
        savePendingChannelInvite(incomingChannelId);
      }
    });

    // 4. Check persisted pending invite from previous session/reload
    getPendingChannelInvite().then((saved) => {
      if (saved && saved.trim()) {
        if (currentUser) {
          setActiveInviteModalChannelId(saved.trim());
          clearPendingChannelInvite();
        } else {
          setPendingChannelInvite(saved.trim());
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleJoinAndOpenChannel = (channelId: string) => {
    setActiveRailTab('channels');
    sounds.playReceivedSound();
    setActiveInviteModalChannelId(null);
    clearPendingChannelInvite();
  };

  // UI Selection & Modal states
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatInitialTab, setNewChatInitialTab] = useState<'direct' | 'group'>('direct');

  const handleOpenNewChat = (tab: 'direct' | 'group' = 'direct') => {
    setNewChatInitialTab(tab);
    setIsNewChatOpen(true);
  };
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; caption?: string } | null>(null);
  const [activeRailTab, setActiveRailTab] = useState<ActiveNavTab>('chats');
  const [isLinkedDevicesOpen, setIsLinkedDevicesOpen] = useState(false);
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [muteModalChatId, setMuteModalChatId] = useState<string | null>(null);
  const [viewOnceModalData, setViewOnceModalData] = useState<{
    text?: string;
    mediaUrl?: string;
    senderName?: string;
    type?: string;
  } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Calls State (Audio & Video with custom cloud / API)
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [activeCall, setActiveCall] = useState<{
    chatId: string;
    contactName: string;
    contactAvatar: string;
    type: 'voice' | 'video';
  } | null>(null);
  const [isCallConfigOpen, setIsCallConfigOpen] = useState(false);
  const [pendingCallAction, setPendingCallAction] = useState<{
    chatId: string;
    contactName: string;
    contactAvatar: string;
    type: 'voice' | 'video';
  } | null>(null);

  // Meta AI State (Admin controlled: disabled / enabled_free / enabled_user_key)
  const [isMetaAiOpen, setIsMetaAiOpen] = useState(false);
  const [metaAiConfig, setMetaAiConfig] = useState<MetaAiConfig>({ mode: 'disabled' });

  // Storage Data State (Admin controlled)
  const [isStorageDataOpen, setIsStorageDataOpen] = useState(false);
  const [storageDataEnabled, setStorageDataEnabled] = useState(false);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/calls');
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (e) {
      console.error('Error fetching calls:', e);
    }
  }, []);

  const fetchMetaAiAndStorageConfig = useCallback(async () => {
    try {
      const [metaRes, storageRes] = await Promise.all([
        fetch('/api/admin/meta-ai'),
        fetch('/api/admin/storage-data'),
      ]);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMetaAiConfig(metaData);
      }
      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageDataEnabled(!!storageData.enabled);
      }
    } catch (e) {
      console.error('Error fetching meta-ai / storage config:', e);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
    fetchMetaAiAndStorageConfig();
    const interval = setInterval(() => {
      fetchCalls();
      fetchMetaAiAndStorageConfig();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchCalls, fetchMetaAiAndStorageConfig]);

  const handleSaveCallConfig = (newConfig: CallConfig) => {
    setAppSettings((prev) => {
      const updated = { ...prev, callConfig: newConfig };
      saveData(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });
    if (pendingCallAction) {
      setActiveCall(pendingCallAction);
      setPendingCallAction(null);
    }
  };

  const handleStartCall = (
    chatId: string,
    contactName: string,
    contactAvatar: string,
    type: 'voice' | 'video'
  ) => {
    const config = appSettings.callConfig;
    if (!config || !config.isConfigured) {
      setPendingCallAction({ chatId, contactName, contactAvatar, type });
      setIsCallConfigOpen(true);
      return;
    }

    setActiveCall({ chatId, contactName, contactAvatar, type });
  };

  const handleEndCall = async (durationSeconds: number) => {
    if (!activeCall) return;

    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeCall.chatId,
          contactName: activeCall.contactName,
          contactAvatar: activeCall.contactAvatar,
          type: activeCall.type,
          direction: 'outgoing',
          status: 'completed',
          duration: durationSeconds,
        }),
      });
      fetchCalls();
    } catch (e) {
      console.error('Error saving call record:', e);
    } finally {
      setActiveCall(null);
    }
  };
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const isDarkMode =
    appSettings.theme === 'dark' ||
    (appSettings.theme === 'system' && systemPrefersDark);

  // Sync master sound volume
  useEffect(() => {
    sounds.setVolume((appSettings.soundVolume ?? 100) / 100);
  }, [appSettings.soundVolume]);

  const handleLockScreen = useCallback(() => {
    setIsScreenLocked(true);
    sounds.playLockSound();
  }, []);

  const handleUnlockScreen = useCallback(() => {
    setIsScreenLocked(false);
  }, []);

  // Inactivity timeout for Screen Lock
  useEffect(() => {
    if (
      !currentUser ||
      !appSettings.screenLockEnabled ||
      (appSettings.screenLockTimeoutMinutes || 0) <= 0 ||
      isScreenLocked
    ) {
      return;
    }

    const timeoutMs = (appSettings.screenLockTimeoutMinutes || 15) * 60 * 1000;
    let timer: number | null = null;

    const resetLockTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsScreenLocked(true);
        sounds.playLockSound();
      }, timeoutMs);
    };

    resetLockTimer();

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetLockTimer, { passive: true }));

    return () => {
      if (timer !== null) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetLockTimer));
    };
  }, [
    currentUser,
    appSettings.screenLockEnabled,
    appSettings.screenLockTimeoutMinutes,
    isScreenLocked,
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!currentUser || isScreenLocked) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNewChatOpen(false);
        setIsSettingsOpen(false);
        setIsStatusOpen(false);
        setIsAdminPanelOpen(false);
        setIsPollModalOpen(false);
        setIsStarredModalOpen(false);
        setLightboxMedia(null);
        setIsShortcutsOpen(false);
        setIsLinkedDevicesOpen(false);
        setIsDisappearingModalOpen(false);
        setForwardingMessage(null);
        return;
      }

      // Strg + Alt + L -> Lock Screen
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        (e.key.toLowerCase() === 'l' || e.code === 'KeyL')
      ) {
        e.preventDefault();
        handleLockScreen();
        return;
      }

      // Strg + Alt + N -> New Chat
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        (e.key.toLowerCase() === 'n' || e.code === 'KeyN')
      ) {
        e.preventDefault();
        setIsNewChatOpen(true);
        return;
      }

      // Strg + Alt + S -> Settings
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        (e.key.toLowerCase() === 's' || e.code === 'KeyS')
      ) {
        e.preventDefault();
        setIsSettingsOpen((p) => !p);
        return;
      }

      // Strg + Alt + / or ? -> Shortcuts Modal
      if (
        ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === '/' || e.key === '?')) ||
        ((e.ctrlKey || e.metaKey) && e.key === '?')
      ) {
        e.preventDefault();
        setIsShortcutsOpen((p) => !p);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentUser, isScreenLocked, handleLockScreen]);

  const activeChatIdRef = useRef<string | null>(null);
  activeChatIdRef.current = activeChatId;

  // 1. Fetch Chats for the logged-in user from backend
  const fetchChats = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/chats?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Error fetching chats from server:', err);
    }
  }, []);

  // 2. Fetch Messages for active chat from backend
  const fetchActiveMessages = useCallback(async (chatId: string, userId: string) => {
    try {
      const res = await fetch(
        `/api/chats/${chatId}/messages?userId=${encodeURIComponent(userId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const oldList = prev[chatId] || [];
          if (
            oldList.length > 0 &&
            data.length > oldList.length &&
            appSettings.soundEnabled
          ) {
            const lastMsg = data[data.length - 1];
            if (lastMsg && lastMsg.sender !== 'me') {
              sounds.playReceivedSound();
            }
          }
          return {
            ...prev,
            [chatId]: data,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching messages from server:', err);
    }
  }, [appSettings.soundEnabled]);

  // Initial load on user login
  useEffect(() => {
    if (currentUser) {
      fetchChats(currentUser.id);
    } else {
      setChats([]);
      setMessages({});
      setActiveChatId(null);
    }
  }, [currentUser, fetchChats]);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    if (currentUser && activeChatId) {
      fetchActiveMessages(activeChatId, currentUser.id);
      setIsContactInfoOpen(false);
      setIsSearchingInChat(false);
    }
  }, [activeChatId, currentUser, fetchActiveMessages]);

  // Real-time polling every 1.5 seconds - ensures real multi-user updates across tabs without localStorage
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      fetchChats(currentUser.id);
      if (activeChatIdRef.current) {
        fetchActiveMessages(activeChatIdRef.current, currentUser.id);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser, fetchChats, fetchActiveMessages]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const currentChatMessages = activeChatId ? messages[activeChatId] || [] : [];

  // Last messages map for sidebar preview
  const lastMessagesMap: Record<string, Message | undefined> = {};
  chats.forEach((c) => {
    const list = messages[c.id];
    if (list && list.length > 0) {
      lastMessagesMap[c.id] = list[list.length - 1];
    } else if (c.lastMessage) {
      lastMessagesMap[c.id] = c.lastMessage;
    }
  });

  // Handle selecting chat
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    handleMarkChatAsRead(chatId);
  };

  // Add a new chat by name (finds or creates user and initiates chat on backend)
  const handleAddNewPerson = async (targetName: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currentUserId: currentUser.id,
          targetName,
        }),
      });

      if (res.ok) {
        const newChat = await res.json();
        // Immediately add to local state so the chat displays without delay
        setChats((prev) => {
          const filtered = prev.filter((c) => c.id !== newChat.id);
          return [newChat, ...filtered];
        });
        setActiveChatId(newChat.id);
        setIsNewChatOpen(false);
        // Also re-sync with backend
        fetchChats(currentUser.id);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Erstellen des Chats');
      }
    } catch (err: any) {
      console.error('Error adding new person:', err);
      throw err;
    }
  };

  // Create New Group Chat
  const handleCreateGroup = async (groupName: string, memberNames: string[]) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          isGroup: true,
          groupName,
          members: memberNames,
        }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        setChats((prev) => {
          const filtered = prev.filter((c) => c.id !== newGroup.id);
          return [newGroup, ...filtered];
        });
        setActiveChatId(newGroup.id);
        setIsNewChatOpen(false);
        fetchChats(currentUser.id);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Erstellen der Gruppe');
      }
    } catch (err: any) {
      console.error('Error creating group:', err);
      throw err;
    }
  };

  // Send Message via Backend API
  const handleSendMessage = async (
    text: string,
    type: 'text' | 'image' | 'voice' | 'document' | 'sticker' | 'call' | 'poll' | 'location' = 'text',
    extra?: {
      mediaUrl?: string;
      mediaCaption?: string;
      audioDuration?: number;
      documentName?: string;
      documentSize?: string;
      replyTo?: QuotedMessage;
      callType?: 'voice' | 'video';
      callDuration?: number;
      callStatus?: 'completed' | 'missed' | 'declined';
      isForwarded?: boolean;
      isViewOnce?: boolean;
      locationData?: LocationData;
    }
  ) => {
    if (!activeChatId || !currentUser) return;

    // Optimistic local update for instant user feedback
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const optimisticMessage: Message = {
      id: `msg_opt_${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: timeStr,
      status: 'sent',
      type,
      mediaUrl: extra?.mediaUrl,
      mediaCaption: extra?.mediaCaption,
      audioDuration: extra?.audioDuration,
      documentName: extra?.documentName,
      documentSize: extra?.documentSize,
      replyTo: extra?.replyTo,
      isForwarded: extra?.isForwarded,
      isViewOnce: extra?.isViewOnce,
      locationData: extra?.locationData,
      viewedOnce: false,
      sender: 'me',
      reactions: [],
      pollOptions: [],
      createdAt: Date.now(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), optimisticMessage],
    }));

    if (appSettings.outgoingSoundEnabled) {
      sounds.playSentSound();
    }

    const payload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      type,
      mediaUrl: extra?.mediaUrl,
      mediaCaption: extra?.mediaCaption,
      audioDuration: extra?.audioDuration,
      documentName: extra?.documentName,
      documentSize: extra?.documentSize,
      replyTo: extra?.replyTo,
      isForwarded: extra?.isForwarded,
      isViewOnce: extra?.isViewOnce,
      locationData: extra?.locationData,
    };

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
        fetchChats(currentUser.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Toggle pin message on backend
  const handleTogglePinMessage = async (messageId: string) => {
    if (!currentUser || !activeChatId) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
        fetchChats(currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  // Toggle archive chat on backend
  const handleToggleArchiveChat = async (chatId: string) => {
    if (!currentUser) return;
    const targetChat = chats.find((c) => c.id === chatId);
    if (!targetChat) return;
    const newArchived = !targetChat.isArchived;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isArchived: newArchived } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isArchived: newArchived }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error toggling archive chat:', err);
    }
  };

  // Set disappearing messages timer on backend
  const handleSaveDisappearingTimer = async (timer: 'off' | '24h' | '7d' | '90d') => {
    if (!activeChatId) return;
    try {
      await fetch(`/api/chats/${activeChatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disappearingTimer: timer }),
      });
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, disappearingTimer: timer } : c))
      );
    } catch (err) {
      console.error('Error saving disappearing timer:', err);
    }
  };

  // Forward message to selected chats
  const handleForwardMessage = async (targetChatIds: string[], origMsg: Message) => {
    if (!currentUser) return;
    for (const tId of targetChatIds) {
      try {
        await fetch(`/api/chats/${tId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: origMsg.text,
            type: origMsg.type,
            mediaUrl: origMsg.mediaUrl,
            mediaCaption: origMsg.mediaCaption,
            audioDuration: origMsg.audioDuration,
            documentName: origMsg.documentName,
            documentSize: origMsg.documentSize,
            isForwarded: true,
          }),
        });
      } catch (err) {
        console.error('Error forwarding message:', err);
      }
    }
    fetchChats(currentUser.id);
    if (activeChatId) {
      fetchActiveMessages(activeChatId, currentUser.id);
    }
  };

  // View Once Message Handler
  const handleViewOnce = async (messageId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/view-once`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = currentChatMessages.find((m) => m.id === messageId);
        setViewOnceModalData({
          text: data.text || msg?.text,
          mediaUrl: data.mediaUrl || msg?.mediaUrl,
          senderName: msg?.senderName || activeChat?.name || 'Freund',
          type: msg?.type,
        });
        if (activeChatId) {
          setMessages((prev) => ({
            ...prev,
            [activeChatId]: (prev[activeChatId] || []).map((m) =>
              m.id === messageId ? { ...m, viewedOnce: true } : m
            ),
          }));
          fetchActiveMessages(activeChatId, currentUser.id);
        }
      }
    } catch (err) {
      console.error('Error viewing view-once message:', err);
    }
  };

  // Set Nickname Handler
  const handleSetNickname = async (chatId: string, nickname: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, nickname: nickname || undefined } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, nickname }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error setting nickname:', err);
    }
  };

  // Set Custom Wallpaper Handler
  const handleSetWallpaper = async (chatId: string, wallpaper: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, customWallpaper: wallpaper || undefined } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, customWallpaper: wallpaper }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error setting wallpaper:', err);
    }
  };

  // React to Message via Backend
  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeChatId) return;

    try {
      const res = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          emoji,
        }),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  // Delete Message via Backend
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser || !activeChatId) return;

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Edit Message via Backend
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!currentUser || !activeChatId) return;

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, newText }),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
      }
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  // Toggle Star (persists to server)
  const handleToggleStar = async (messageId: string) => {
    if (!activeChatId || !currentUser) return;

    // Optimistic UI update
    setMessages((prev) => {
      const list = prev[activeChatId];
      if (!list) return prev;
      return {
        ...prev,
        [activeChatId]: list.map((m) =>
          m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
        ),
      };
    });

    try {
      await fetch(`/api/messages/${messageId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Error starring message:', err);
    }
  };

  // Vote on Poll
  const handleVotePoll = async (messageId: string, optionId: string) => {
    if (!currentUser || !activeChatId) return;

    try {
      const res = await fetch(`/api/messages/${messageId}/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          optionId,
        }),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
      }
    } catch (err) {
      console.error('Error voting on poll:', err);
    }
  };

  // Create Poll Message
  const handleCreatePoll = async (question: string, optionsText: string[], multipleAnswers: boolean) => {
    if (!activeChatId || !currentUser) return;

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          text: `Umfrage: ${question}`,
          type: 'poll',
          pollQuestion: question,
          pollOptions: optionsText.map((t) => ({ text: t })),
          pollMultipleAnswers: multipleAnswers,
        }),
      });

      if (res.ok) {
        fetchActiveMessages(activeChatId, currentUser.id);
        if (appSettings.outgoingSoundEnabled) {
          sounds.playSentSound();
        }
      }
    } catch (err) {
      console.error('Error creating poll:', err);
    }
  };

  // Chat Actions
  const handleTogglePinChat = async (chatId: string) => {
    if (!currentUser) return;
    const targetChat = chats.find((c) => c.id === chatId);
    const newPinned = !targetChat?.isPinned;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isPinned: newPinned } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isPinned: newPinned }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error pinning chat:', err);
    }
  };

  const handleDraftChange = (chatId: string, text: string) => {
    setDrafts((prev) => {
      if (!text.trim()) {
        const next = { ...prev };
        delete next[chatId];
        return next;
      }
      return { ...prev, [chatId]: text };
    });
  };

  const handleToggleMuteChat = async (chatId: string) => {
    if (!currentUser) return;
    const targetChat = chats.find((c) => c.id === chatId);
    const newMuted = !targetChat?.isMuted;
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, isMuted: newMuted, mutedUntil: newMuted ? c.mutedUntil || 'always' : undefined }
          : c
      )
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          isMuted: newMuted,
          mutedUntil: newMuted ? targetChat?.mutedUntil || 'always' : null,
        }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error muting chat:', err);
    }
  };

  const handleConfirmMute = async (chatId: string, duration: '8h' | '1w' | 'always') => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isMuted: true, mutedUntil: duration } : c
      )
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          isMuted: true,
          mutedUntil: duration,
        }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error confirming mute:', err);
    }
  };

  const handleSetChatLabel = async (chatId: string, label?: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, label } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, label: label || null }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error setting chat label:', err);
    }
  };

  const handleToggleLockChat = async (chatId: string) => {
    if (!currentUser) return;
    const targetChat = chats.find((c) => c.id === chatId);
    const newLocked = !targetChat?.isLocked;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isLocked: newLocked } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isLocked: newLocked }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error toggling lock chat:', err);
    }
  };

  const handleToggleFavoriteChat = async (chatId: string) => {
    if (!currentUser) return;
    const targetChat = chats.find((c) => c.id === chatId);
    const newFav = !targetChat?.isFavorite;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isFavorite: newFav } : c))
    );
    try {
      await fetch(`/api/chats/${chatId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isFavorite: newFav }),
      });
      fetchChats(currentUser.id);
    } catch (err) {
      console.error('Error favoriting chat:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (currentUser) {
        fetchChats(currentUser.id);
      }
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setIsContactInfoOpen(false);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleClearChat = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}/clear`, { method: 'POST' });
      if (currentUser) {
        fetchActiveMessages(chatId, currentUser.id);
        fetchChats(currentUser.id);
      }
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const handleMarkChatAsRead = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleMarkChatAsUnread = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 1 } : c))
    );
  };

  const handleMarkAllAsRead = () => {
    setChats((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
  };

  // Export Chat as .txt File
  const handleExportChat = useCallback(
    (chatId: string) => {
      const targetChat = chats.find((c) => c.id === chatId);
      const chatMsgs = messages[chatId] || [];
      if (!targetChat) return;

      let content = `========================================================\n`;
      content += `WhatsApp Chat-Export: ${targetChat.name}\n`;
      content += `Exportiert am: ${new Date().toLocaleString('de-DE')}\n`;
      content += `Gesamtanzahl Nachrichten: ${chatMsgs.length}\n`;
      content += `========================================================\n\n`;

      chatMsgs.forEach((msg) => {
        const sender =
          msg.sender === 'me'
            ? currentUser?.name || 'Du'
            : msg.senderName || targetChat.name;
        let text = msg.text || '';
        if (msg.type === 'image') text = `[Foto: ${msg.mediaCaption || 'Bild'}]`;
        else if (msg.type === 'voice') text = `[Sprachnachricht (${msg.audioDuration || 15}s)]`;
        else if (msg.type === 'document') text = `[Dokument: ${msg.documentName || 'Datei'}]`;
        else if (msg.type === 'poll') text = `[Umfrage: ${msg.pollQuestion || 'Frage'}]`;
        else if (msg.type === 'sticker') text = `[Sticker: ${msg.text}]`;
        else if (msg.type === 'call') text = `[Anruf: ${msg.callType || 'Audio'}]`;
        else if (msg.type === 'location') text = `[Standort (WIP): ${msg.locationData?.address || msg.text || 'GPS'}]`;

        content += `[${msg.timestamp}] ${sender}: ${text}\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WhatsApp-Chat-${targetChat.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [chats, messages, currentUser]
  );

  // Update Profile on Backend
  const handleUpdateProfile = async (name: string, about: string, avatar?: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, about, avatar }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        if (appSettings.rememberUser) {
          saveData(STORAGE_KEY_USER, JSON.stringify(updated));
        }
        fetchChats(currentUser.id);
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  // Stories management
  const handleAddStory = (mediaUrl: string, caption?: string) => {
    if (!currentUser) return;
    const newStory: ContactStory = {
      id: `story_${Date.now()}`,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      timestamp: 'Gerade eben',
      mediaUrl,
      caption,
      viewed: false,
    };
    setStories((prev) => [newStory, ...prev]);
  };

  const handleReplyToStory = (chatId: string, replyText: string) => {
    handleSelectChat(chatId);
    handleSendMessage(replyText, 'text');
    setIsStatusOpen(false);
  };

  // If user is not authenticated, show login/signup screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        defaultRememberMe={appSettings.rememberUser}
        sessionExpiredNotice={sessionExpiredNotice}
        onClearExpiredNotice={() => setSessionExpiredNotice(null)}
        lastOnlineTimestamp={lastOnlineTimestamp}
        pendingChannelInvite={pendingChannelInvite}
      />
    );
  }

  return (
    <div
      className={`w-full h-screen ${
        isDarkMode ? 'bg-[#0c1317] text-[#e9edef]' : 'bg-[#f0f2f5] text-[#41525d]'
      } flex items-center justify-center overflow-hidden font-sans antialiased select-none`}
    >
      {/* WhatsApp Web Container */}
      <div
        className={`w-full h-full md:h-[96vh] md:w-[98vw] max-w-[1680px] ${
          isDarkMode ? 'bg-[#111b21] border-[#222e35]' : 'bg-white border-[#d1d7db]'
        } md:rounded-lg shadow-xl flex flex-col overflow-hidden border`}
      >
        {/* Admin Bar Notification if logged in as Admin */}
        {currentUser?.isAdmin && !isAdminPanelOpen && (
          <div className="bg-[#008069] text-white px-4 py-1.5 flex items-center justify-between text-xs shrink-0 z-30">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Offizieller WhatsApp Administrator-Modus aktiv
            </span>
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(true)}
              className="px-3 py-1 bg-white text-[#008069] hover:bg-white/90 rounded-md text-[11px] font-bold shadow-2xs transition-colors"
            >
              Admin-Bereich öffnen
            </button>
          </div>
        )}

        {/* View Switcher: Admin Panel vs Chat Messenger */}
        {isAdminPanelOpen && currentUser?.isAdmin ? (
          <AdminPanel
            currentUser={currentUser}
            onCloseToChat={() => setIsAdminPanelOpen(false)}
            onLogout={handleLogout}
            onSelectChat={(chatId) => {
              setIsAdminPanelOpen(false);
              handleSelectChat(chatId);
            }}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden w-full h-full">
            {/* WhatsApp Navigation Rail */}
            <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} shrink-0 h-full`}>
              <NavigationRail
                activeTab={activeRailTab}
                onSelectTab={(tab) => {
                  if (tab === 'status') {
                    setIsStatusOpen(true);
                    return;
                  }
                  setActiveRailTab(tab);
                }}
                currentUser={currentUser}
                unreadChatsCount={chats.filter((c) => !c.isArchived && (c.unreadCount || 0) > 0).length}
                archivedChatsCount={chats.filter((c) => c.isArchived).length}
                hasUnviewedStories={stories.some((s) => !s.viewed)}
                missedCallsCount={calls.filter((c) => c.status === 'missed').length}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenStarredMessages={() => setIsStarredModalOpen(true)}
                onOpenLinkedDevices={() => setIsLinkedDevicesOpen(true)}
                onOpenProfile={() => setIsSettingsOpen(true)}
              />
            </div>

            {/* Main Content Area based on Navigation Tab */}
            {activeRailTab === 'channels' ? (
              <ChannelsView
                currentUser={currentUser}
                onOpenInviteModal={(id) => setActiveInviteModalChannelId(id)}
              />
            ) : activeRailTab === 'calls' ? (
              <CallsView
                calls={calls}
                chats={chats}
                callConfig={appSettings.callConfig}
                onOpenConfig={() => setIsCallConfigOpen(true)}
                onStartCall={(chatId, contactName, contactAvatar, type) =>
                  handleStartCall(chatId, contactName, contactAvatar, type)
                }
                onSelectChat={(chat) => {
                  setActiveRailTab('chats');
                  handleSelectChat(chat.id);
                }}
              />
            ) : (
              <div className="flex-1 flex overflow-hidden w-full h-full">
                {/* Sidebar (Left Column) */}
                <div
                  className={`${
                    activeChatId ? 'hidden md:flex' : 'flex'
                  } h-full w-full md:w-auto shrink-0`}
                >
                  <Sidebar
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    chats={activeRailTab === 'archived' ? chats.filter((c) => c.isArchived) : chats.filter((c) => !c.isArchived)}
                    activeChatId={activeChatId}
                    lastMessages={lastMessagesMap}
                    hasUnviewedStories={stories.some((s) => !s.viewed)}
                    onSelectChat={handleSelectChat}
                    onOpenNewChatModal={handleOpenNewChat}
                    onOpenStatusModal={() => setIsStatusOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
                    onTogglePinChat={handleTogglePinChat}
                    onToggleMuteChat={handleToggleMuteChat}
                    onToggleFavoriteChat={handleToggleFavoriteChat}
                    onDeleteChat={handleDeleteChat}
                    onMarkChatAsRead={handleMarkChatAsRead}
                    onMarkChatAsUnread={handleMarkChatAsUnread}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onToggleArchiveChat={handleToggleArchiveChat}
                    isArchivedView={activeRailTab === 'archived'}
                    onBackFromArchived={() => setActiveRailTab('chats')}
                    onOpenArchived={() => setActiveRailTab('archived')}
                    archivedCount={chats.filter((c) => c.isArchived).length}
                    onOpenLinkedDevices={() => setIsLinkedDevicesOpen(true)}
                    compactMode={appSettings.compactMode || false}
                    drafts={drafts}
                    onSetChatLabel={handleSetChatLabel}
                    onToggleLockChat={handleToggleLockChat}
                    onOpenMuteModal={(cId) => setMuteModalChatId(cId)}
                    screenLockPin={appSettings.screenLockPin || '1234'}
                    onOpenMetaAI={() => setIsMetaAiOpen(true)}
                    metaAiConfig={metaAiConfig}
                    onOpenStorageData={() => setIsStorageDataOpen(true)}
                    storageDataEnabled={storageDataEnabled}
                  />
                </div>

                {/* Chat Area (Right Column) */}
                <div
                  className={`${
                    !activeChatId ? 'hidden md:flex' : 'flex'
                  } flex-1 h-full flex-col min-w-0 relative`}
                  style={{ backgroundColor: '#efeae2' }}
                >
                  {activeChat ? (
                    <>
                      <ChatHeader
                        chat={activeChat}
                        onBack={() => setActiveChatId(null)}
                        onOpenContactInfo={() => setIsContactInfoOpen((p) => !p)}
                        onToggleSearchInChat={() => setIsSearchingInChat((p) => !p)}
                        onClearChat={handleClearChat}
                        onDeleteChat={handleDeleteChat}
                        onToggleMute={handleToggleMuteChat}
                        onMarkAllRead={handleMarkChatAsRead}
                        onOpenStarredMessages={() => setIsStarredModalOpen(true)}
                        onOpenDisappearingMessages={() => setIsDisappearingModalOpen(true)}
                        onSetChatLabel={handleSetChatLabel}
                        onToggleLockChat={handleToggleLockChat}
                        onOpenMuteModal={(cId) => setMuteModalChatId(cId)}
                        onStartCall={(type) =>
                          handleStartCall(
                            activeChat.id,
                            activeChat.name,
                            activeChat.avatar,
                            type
                          )
                        }
                        onOpenCallConfig={() => setIsCallConfigOpen(true)}
                      />
                      <ChatArea
                        chat={activeChat}
                        messages={currentChatMessages}
                        wallpaperTheme={appSettings.wallpaperTheme}
                        showDoodles={appSettings.showDoodles}
                        fontSize={appSettings.fontSize}
                        enterToSend={appSettings.enterToSend}
                        isSearchingInChat={isSearchingInChat}
                        onCloseSearch={() => setIsSearchingInChat(false)}
                        onSendMessage={handleSendMessage}
                        onReactMessage={handleReactMessage}
                        onDeleteMessage={handleDeleteMessage}
                        onToggleStar={handleToggleStar}
                        onTogglePinMessage={handleTogglePinMessage}
                        onForwardMessage={(msg) => setForwardingMessage(msg)}
                        onEditMessage={handleEditMessage}
                        onVotePoll={handleVotePoll}
                        onOpenPollModal={() => setIsPollModalOpen(true)}
                        onOpenMedia={(url, caption) => setLightboxMedia({ url, caption })}
                        onViewOnce={handleViewOnce}
                        onNavigateToChat={handleSelectChat}
                        onNavigateToChannel={() => setActiveRailTab('channels')}
                        draftText={drafts[activeChat.id] || ''}
                        onDraftChange={(text) => handleDraftChange(activeChat.id, text)}
                        dailyLocationLimit={appSettings.locationShareDailyLimit ?? 3}
                      />
                      {/* WhatsApp Web Contact Info Drawer */}
                      <ContactInfoDrawer
                        isOpen={isContactInfoOpen}
                        onClose={() => setIsContactInfoOpen(false)}
                        chat={activeChat}
                        messages={currentChatMessages}
                        onToggleMute={handleToggleMuteChat}
                        onClearChat={handleClearChat}
                        onDeleteChat={handleDeleteChat}
                        onOpenMedia={(url, caption) => setLightboxMedia({ url, caption })}
                        onOpenDisappearingMessages={() => setIsDisappearingModalOpen(true)}
                        onSetChatLabel={handleSetChatLabel}
                        onToggleLockChat={handleToggleLockChat}
                        onOpenMuteModal={(cId) => setMuteModalChatId(cId)}
                        onSetNickname={handleSetNickname}
                        onSetWallpaper={handleSetWallpaper}
                      />
                    </>
                  ) : (
                    <EmptyChatState onOpenNewChat={() => setIsNewChatOpen(true)} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <StarredMessagesModal
        isOpen={isStarredModalOpen}
        onClose={() => setIsStarredModalOpen(false)}
        chat={activeChat || undefined}
        messages={currentChatMessages}
        onToggleStar={handleToggleStar}
        onJumpToMessage={(msgId) => {
          setIsStarredModalOpen(false);
          const el = document.getElementById(`msg-${msgId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />

      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        stories={stories}
        onAddStory={handleAddStory}
        onReplyToStory={handleReplyToStory}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        currentUserId={currentUser.id}
        onAddNewPerson={handleAddNewPerson}
        onCreateGroup={handleCreateGroup}
        initialTab={newChatInitialTab}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onUpdateSettings={handleUpdateSettings}
        userName={currentUser.name}
        userAbout={currentUser.about || 'Verfügbar'}
        userAvatar={currentUser.avatar}
        isAdmin={currentUser.isAdmin}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onUpdateProfile={handleUpdateProfile}
        lastOnlineTimestamp={lastOnlineTimestamp}
        onLogout={handleLogout}
        onLockScreen={handleLockScreen}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenStorageData={() => setIsStorageDataOpen(true)}
        storageDataEnabled={storageDataEnabled}
        onOpenCallConfig={() => setIsCallConfigOpen(true)}
        callConfig={appSettings.callConfig}
        onOpenMetaAI={() => setIsMetaAiOpen(true)}
        metaAiConfig={metaAiConfig}
      />

      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />

      <MediaLightbox
        mediaUrl={lightboxMedia?.url || null}
        caption={lightboxMedia?.caption}
        onClose={() => setLightboxMedia(null)}
      />

      {/* Linked Devices Modal */}
      <LinkedDevicesModal
        isOpen={isLinkedDevicesOpen}
        onClose={() => setIsLinkedDevicesOpen(false)}
      />

      {/* Disappearing Messages Modal */}
      {activeChat && (
        <DisappearingMessagesModal
          isOpen={isDisappearingModalOpen}
          onClose={() => setIsDisappearingModalOpen(false)}
          currentTimer={activeChat.disappearingTimer || 'off'}
          onSaveTimer={handleSaveDisappearingTimer}
          chatName={activeChat.name}
        />
      )}

      {/* Forward Modal */}
      <ForwardModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        chats={chats}
        onForward={handleForwardMessage}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Mute Duration Modal */}
      {muteModalChatId && (
        <MuteModal
          isOpen={!!muteModalChatId}
          onClose={() => setMuteModalChatId(null)}
          onConfirmMute={(duration) => {
            handleConfirmMute(muteModalChatId, duration);
            setMuteModalChatId(null);
          }}
          chatName={chats.find((c) => c.id === muteModalChatId)?.name || 'Chat'}
        />
      )}

      {/* View Once Immersive Modal */}
      {viewOnceModalData && (
        <ViewOnceModal
          isOpen={!!viewOnceModalData}
          onClose={() => setViewOnceModalData(null)}
          mediaUrl={viewOnceModalData.mediaUrl}
          text={viewOnceModalData.text}
          senderName={viewOnceModalData.senderName || 'Freund'}
          type={viewOnceModalData.type}
        />
      )}

      {/* Channel Invite Popup Modal */}
      {activeInviteModalChannelId && (
        <ChannelInviteModal
          channelId={activeInviteModalChannelId}
          isOpen={!!activeInviteModalChannelId}
          onClose={() => {
            setActiveInviteModalChannelId(null);
            clearPendingChannelInvite();
          }}
          onJoinAndOpenChannel={handleJoinAndOpenChannel}
        />
      )}

      {/* Live Voice & Video Call Modal */}
      {activeCall && (
        <CallModal
          isOpen={!!activeCall}
          chatId={activeCall.chatId}
          contactName={activeCall.contactName}
          contactAvatar={activeCall.contactAvatar}
          callType={activeCall.type}
          callConfig={appSettings.callConfig}
          onEndCall={handleEndCall}
          onOpenConfig={() => setIsCallConfigOpen(true)}
        />
      )}

      {/* Call Custom Cloud & WebRTC Configuration Modal */}
      <CallConfigModal
        isOpen={isCallConfigOpen}
        onClose={() => {
          setIsCallConfigOpen(false);
          setPendingCallAction(null);
        }}
        currentConfig={appSettings.callConfig}
        onSaveConfig={handleSaveCallConfig}
      />

      {/* Storage Data Breakdown & Cleaner Modal */}
      <StorageDataModal
        isOpen={isStorageDataOpen}
        onClose={() => setIsStorageDataOpen(false)}
      />

      {/* Meta AI Chat Assistant Modal */}
      <MetaAIChatModal
        isOpen={isMetaAiOpen}
        onClose={() => setIsMetaAiOpen(false)}
        currentUser={currentUser}
        metaAiConfig={metaAiConfig}
        userApiKey={appSettings.userMetaAiKey || ''}
        onSaveUserApiKey={(key) => {
          setAppSettings((prev) => {
            const updated = { ...prev, userMetaAiKey: key };
            saveData(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
            return updated;
          });
        }}
        onSendMessageToChat={(text) => {
          if (activeChatId) {
            handleSendMessage(text);
          }
        }}
      />

      {/* WhatsApp Screen Lock Protection */}
      <ScreenLockOverlay
        isLocked={isScreenLocked}
        requiredPin={appSettings.screenLockPin || '1234'}
        userName={currentUser.name}
        userAvatar={currentUser.avatar}
        onUnlock={handleUnlockScreen}
        onLogout={handleLogout}
      />
    </div>
  );
}
