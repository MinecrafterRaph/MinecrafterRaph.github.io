import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  BarChart3,
  Radio,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Mic,
  Clock,
  Send,
  LogOut,
  Sliders,
  Globe,
  Plus,
  Edit2,
  ExternalLink,
  Pin,
  Sparkles,
  Check,
  X,
  Film,
  Play,
  Share2,
  Copy,
  Link,
  MapPin,
  ShieldAlert,
  Navigation,
  Bot,
  HardDrive,
  KeyRound,
  Database,
} from 'lucide-react';
import { AdminStats, GlobalChatInfo, User } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface AdminPanelProps {
  currentUser: User;
  onCloseToChat: () => void;
  onLogout: () => void;
  onSelectChat?: (chatId: string) => void;
}

const PRESET_AVATARS = [
  { label: 'Community (Weltkugel)', iconKey: 'icon:globe' },
  { label: 'WhatsApp Gruppe', iconKey: 'icon:group' },
  { label: 'Offiziell (WhatsApp)', iconKey: 'icon:admin' },
  { label: 'Smaragdgrün (Klassik)', iconKey: 'icon:emerald' },
  { label: 'Ozeanblau', iconKey: 'icon:blue' },
  { label: 'Purpur', iconKey: 'icon:purple' },
  { label: 'Bernstein', iconKey: 'icon:amber' },
  { label: 'Klassische Silhouette', iconKey: 'icon:classic' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onCloseToChat,
  onLogout,
  onSelectChat,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'global_chats' | 'users' | 'chats' | 'broadcast' | 'ai_video' | 'messages' | 'settings'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Settings & Credit Limit States (WIP)
  const [locationLimit, setLocationLimit] = useState<number>(3);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

  // Meta AI & Storage Data Admin States
  const [metaAiMode, setMetaAiMode] = useState<'disabled' | 'enabled_free' | 'enabled_user_key'>('disabled');
  const [metaAiPromptNotice, setMetaAiPromptNotice] = useState('Meta AI intelligenter Assistent für WhatsApp');
  const [storageDataEnabled, setStorageDataEnabled] = useState(false);

  // AI Video Studio States (Admin Exclusive)
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStyle, setVideoStyle] = useState('modern');
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{
    videoUrl: string;
    posterUrl: string;
    title: string;
    caption: string;
    duration: string;
  } | null>(null);
  const [videoPostStatus, setVideoPostStatus] = useState<string | null>(null);

  // Admin Direct Message to Alle-Chat
  const [adminDirectMsgText, setAdminDirectMsgText] = useState('');
  const [adminDirectMsgSending, setAdminDirectMsgSending] = useState(false);
  const [adminDirectMsgStatus, setAdminDirectMsgStatus] = useState<string | null>(null);

  // Invite Link Copy
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Global Chat Management States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChat, setEditingChat] = useState<GlobalChatInfo | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createAbout, setCreateAbout] = useState('');
  const [createAvatar, setCreateAvatar] = useState(PRESET_AVATARS[0].iconKey);
  const [createIsPinned, setCreateIsPinned] = useState(true);
  const [createTimer, setCreateTimer] = useState<'off' | '24h' | '7d' | '90d'>('off');
  const [createInitialMsg, setCreateInitialMsg] = useState('');
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(true);
  const [editTimer, setEditTimer] = useState<'off' | '24h' | '7d' | '90d'>('off');

  // In-App confirmation and toast states (iFrame safe, replaces blocked window.confirm / window.alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.locationShareDailyLimit === 'number') {
          setLocationLimit(data.locationShareDailyLimit);
        }
      }

      // Fetch Meta AI config
      const metaRes = await fetch('/api/admin/meta-ai');
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMetaAiMode(metaData.mode || 'disabled');
        setMetaAiPromptNotice(metaData.promptNotice || 'Meta AI intelligenter Assistent für WhatsApp');
      }

      // Fetch Storage Data config
      const storageRes = await fetch('/api/admin/storage-data');
      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageDataEnabled(!!storageData.enabled);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const handleSaveMetaAi = async (newMode: 'disabled' | 'enabled_free' | 'enabled_user_key') => {
    try {
      const res = await fetch('/api/admin/meta-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode, promptNotice: metaAiPromptNotice }),
      });
      if (res.ok) {
        setMetaAiMode(newMode);
        setSettingsToast(`Meta AI Modus aktualisiert: ${
          newMode === 'disabled'
            ? 'Deaktiviert (Standard)'
            : newMode === 'enabled_user_key'
            ? 'Aktiviert (Eigener API-Key erforderlich)'
            : 'Aktiviert (Freie Nutzung)'
        }`);
        setTimeout(() => setSettingsToast(null), 4000);
      }
    } catch (err) {
      console.error('Error saving Meta AI config:', err);
    }
  };

  const handleToggleStorageData = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/storage-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setStorageDataEnabled(enabled);
        setSettingsToast(`Speicherdaten-Verwaltung für Nutzer ${enabled ? 'freigegeben' : 'gesperrt (Standard)'}`);
        setTimeout(() => setSettingsToast(null), 4000);
      }
    } catch (err) {
      console.error('Error toggling storage data:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsToast(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationShareDailyLimit: Number(locationLimit) }),
      });
      if (res.ok) {
        setSettingsToast('✅ Einstellungen erfolgreich gespeichert!');
        setToastMessage('Standort-Limit gespeichert.');
        setTimeout(() => setSettingsToast(null), 4000);
      } else {
        setSettingsToast('❌ Fehler beim Speichern der Einstellungen');
      }
    } catch {
      setSettingsToast('❌ Netzwerkfehler beim Speichern');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleResetLocationUsage = async () => {
    try {
      const res = await fetch('/api/admin/settings/reset-location-usage', {
        method: 'POST',
      });
      if (res.ok) {
        const todayKey = `whatsnew_loc_shares_${new Date().toISOString().slice(0, 10)}`;
        try {
          localStorage.removeItem(todayKey);
        } catch {
          // ignore
        }
        setSettingsToast('✅ Heutige Standort-Zähler wurden für alle Nutzer zurückgesetzt.');
        setToastMessage('Heutige Zähler zurückgesetzt.');
        setTimeout(() => setSettingsToast(null), 4000);
      }
    } catch {
      setSettingsToast('❌ Fehler beim Zurücksetzen der Zähler.');
    }
  };

  // Admin delete user
  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      title: 'Benutzer löschen?',
      message: `Möchtest du den Benutzer "${userName}" und alle zugehörigen Chats wirklich endgültig löschen?`,
      confirmText: 'Benutzer löschen',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStats();
            setToastMessage(`Benutzer "${userName}" wurde gelöscht.`);
          } else {
            const data = await res.json();
            setToastMessage(data.error || 'Fehler beim Löschen');
          }
        } catch (err) {
          console.error('Error deleting user:', err);
          setToastMessage('Verbindungsfehler beim Löschen des Benutzers.');
        }
      },
    });
  };

  // Admin delete chat
  const handleDeleteChat = (chatId: string) => {
    setConfirmDialog({
      title: 'Chat löschen?',
      message: 'Diesen Chat und alle zugehörigen Nachrichten unwiderruflich löschen?',
      confirmText: 'Chat löschen',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/chats/${chatId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStats();
            setToastMessage('Chat wurde gelöscht.');
          } else {
            const data = await res.json();
            setToastMessage(data.error || 'Fehler beim Löschen des Chats');
          }
        } catch (err) {
          console.error('Error deleting chat:', err);
          setToastMessage('Verbindungsfehler beim Löschen des Chats.');
        }
      },
    });
  };

  // Admin: Create Global Chat
  const handleCreateGlobalChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || createName.trim().length < 2) {
      setToastMessage('Bitte gib einen Raumnamen mit mindestens 2 Zeichen ein.');
      return;
    }

    setIsSubmittingGlobal(true);
    try {
      const res = await fetch('/api/admin/global-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          about: createAbout.trim() || 'Offizieller globaler Gruppenchat',
          avatar: createAvatar.trim(),
          isPinned: createIsPinned,
          disappearingTimer: createTimer,
          initialMessage: createInitialMsg.trim(),
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setCreateName('');
        setCreateAbout('');
        setCreateAvatar(PRESET_AVATARS[0].iconKey);
        setCreateIsPinned(true);
        setCreateTimer('off');
        setCreateInitialMsg('');
        fetchStats();
        setToastMessage('Globaler Chat erfolgreich erstellt.');
      } else {
        const data = await res.json();
        setToastMessage(data.error || 'Fehler beim Erstellen des globalen Chats');
      }
    } catch (err) {
      console.error('Error creating global chat:', err);
      setToastMessage('Netzwerkfehler beim Erstellen des globalen Chats');
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  // Open Edit Global Chat Modal
  const handleOpenEditChat = (chat: GlobalChatInfo) => {
    setEditingChat(chat);
    setEditName(chat.name);
    setEditAbout(chat.about || '');
    setEditAvatar(chat.avatar || PRESET_AVATARS[0].iconKey);
    setEditIsPinned(chat.isPinned !== false);
    setEditTimer(chat.disappearingTimer || 'off');
  };

  // Admin: Save Edit Global Chat
  const handleSaveEditGlobalChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChat) return;
    if (!editName.trim() || editName.trim().length < 2) {
      setToastMessage('Der Name muss mindestens 2 Zeichen lang sein.');
      return;
    }

    setIsSubmittingGlobal(true);
    try {
      const res = await fetch(`/api/admin/global-chats/${editingChat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          about: editAbout.trim(),
          avatar: editAvatar.trim(),
          isPinned: editIsPinned,
          disappearingTimer: editTimer,
        }),
      });

      if (res.ok) {
        setEditingChat(null);
        fetchStats();
        setToastMessage('Globaler Chat erfolgreich aktualisiert.');
      } else {
        const data = await res.json();
        setToastMessage(data.error || 'Fehler beim Aktualisieren des globalen Chats');
      }
    } catch (err) {
      console.error('Error updating global chat:', err);
      setToastMessage('Netzwerkfehler beim Speichern des globalen Chats');
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  // Admin: Delete Global Chat
  const handleDeleteGlobalChat = (chatId: string, chatName: string) => {
    const isMain = chatId === 'chat_global_all';
    setConfirmDialog({
      title: isMain ? 'Haupt-Chat zurücksetzen?' : 'Globalen Chat löschen?',
      message: isMain
        ? `Achtung: "${chatName}" ist der Standard-Hauptchat. Wenn du ihn löschst, wird sein Verlauf geleert und er wird automatisch zurückgesetzt.`
        : `Möchtest du den globalen Chat "${chatName}" und alle darin enthaltenen Nachrichten unwiderruflich löschen?`,
      confirmText: 'Löschen',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/global-chats/${chatId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStats();
            setToastMessage(`Chat "${chatName}" wurde gelöscht.`);
          } else {
            const data = await res.json();
            setToastMessage(data.error || 'Fehler beim Löschen');
          }
        } catch (err) {
          console.error('Error deleting global chat:', err);
          setToastMessage('Verbindungsfehler beim Löschen');
        }
      },
    });
  };

  // Admin delete message
  const handleDeleteMessage = (messageId: string) => {
    setConfirmDialog({
      title: 'Nachricht löschen?',
      message: 'Diese Nachricht endgültig aus der Datenbank entfernen?',
      confirmText: 'Löschen',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStats();
            setToastMessage('Nachricht wurde gelöscht.');
          } else {
            const data = await res.json();
            setToastMessage(data.error || 'Fehler beim Löschen');
          }
        } catch (err) {
          console.error('Error deleting message:', err);
          setToastMessage('Verbindungsfehler beim Löschen');
        }
      },
    });
  };

  // Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsBroadcasting(true);
    setBroadcastStatus(null);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setBroadcastText('');
        setBroadcastStatus(`Erfolgreich an ${data.count} Chat(s) gesendet.`);
        fetchStats();
        setTimeout(() => setBroadcastStatus(null), 4000);
      } else {
        const data = await res.json();
        setBroadcastStatus(`Fehler: ${data.error || 'Broadcast fehlgeschlagen'}`);
      }
    } catch (err) {
      setBroadcastStatus('Netzwerkfehler beim Senden des Broadcasts');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Reset system
  const handleResetSystem = () => {
    setConfirmDialog({
      title: 'Gesamtes System zurücksetzen?',
      message: 'WARNUNG: Möchtest du wirklich alle Chats und Nachrichten zurücksetzen? Der WhatsApp-Admin-Account bleibt erhalten und der globale Chat wird sauber neu aufgesetzt.',
      confirmText: 'System zurücksetzen',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/reset-system', { method: 'POST' });
          if (res.ok) {
            fetchStats();
            setToastMessage('System wurde erfolgreich zurückgesetzt.');
          } else {
            const data = await res.json();
            setToastMessage(data.error || 'Fehler beim Zurücksetzen');
          }
        } catch (err) {
          console.error('Error resetting system:', err);
          setToastMessage('Verbindungsfehler beim Zurücksetzen.');
        }
      },
    });
  };

  // Direct Message to "Alle" Chat as WhatsApp Admin
  const handleSendAdminGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDirectMsgText.trim()) return;
    setAdminDirectMsgSending(true);
    setAdminDirectMsgStatus(null);
    try {
      const res = await fetch('/api/chats/chat_global_all/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'usr_whatsapp_admin',
          senderName: 'WhatsApp',
          text: adminDirectMsgText.trim(),
          type: 'text',
        }),
      });
      if (res.ok) {
        setAdminDirectMsgText('');
        setAdminDirectMsgStatus('✅ Nachricht erfolgreich als WhatsApp in den "Alle"-Chat gesendet!');
        fetchStats();
        setTimeout(() => setAdminDirectMsgStatus(null), 4000);
      } else {
        setAdminDirectMsgStatus('❌ Fehler beim Senden in den Chat.');
      }
    } catch (err) {
      console.error('Admin direct send error:', err);
      setAdminDirectMsgStatus('❌ Netzwerkfehler beim Senden.');
    } finally {
      setAdminDirectMsgSending(false);
    }
  };

  // AI Video Studio Generation (Admin Exclusive)
  const handleGenerateAiVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim()) return;
    setVideoGenerating(true);
    setVideoPostStatus(null);
    try {
      const res = await fetch('/api/admin/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          style: videoStyle,
          title: videoPrompt.trim().slice(0, 40),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedVideo({
          videoUrl: data.videoUrl,
          posterUrl: data.posterUrl,
          title: data.title,
          caption: data.caption,
          duration: data.videoDuration || '0:15',
        });
      } else {
        setVideoPostStatus(data.error || 'Fehler bei der Video-Erstellung');
      }
    } catch (err) {
      console.error('Error generating AI video:', err);
      setVideoPostStatus('Netzwerkfehler bei der Video-Generierung');
    } finally {
      setVideoGenerating(false);
    }
  };

  const handlePostVideoToChannel = async () => {
    if (!generatedVideo) return;
    try {
      const res = await fetch('/api/channels/whatsapp-official/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          title: generatedVideo.title,
          text: generatedVideo.caption,
          mediaUrl: generatedVideo.videoUrl,
          posterUrl: generatedVideo.posterUrl,
          videoDuration: generatedVideo.duration,
          author: 'WhatsApp',
        }),
      });
      if (res.ok) {
        setVideoPostStatus('✅ Video erfolgreich im offiziellen WhatsApp-Kanal veröffentlicht!');
        setTimeout(() => setVideoPostStatus(null), 4000);
      }
    } catch (err) {
      setVideoPostStatus('Fehler beim Veröffentlichen im Kanal.');
    }
  };

  const handlePostVideoToGlobalChat = async () => {
    if (!generatedVideo) return;
    try {
      const res = await fetch('/api/chats/chat_global_all/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'usr_whatsapp_admin',
          senderName: 'WhatsApp',
          text: `🎬 ${generatedVideo.title}\n${generatedVideo.caption}`,
          type: 'video',
          mediaUrl: generatedVideo.videoUrl,
        }),
      });
      if (res.ok) {
        setVideoPostStatus('✅ Video erfolgreich in den "Alle"-Chat gepostet!');
        setTimeout(() => setVideoPostStatus(null), 4000);
      }
    } catch (err) {
      setVideoPostStatus('Fehler beim Senden in den Chat.');
    }
  };

  const handleCopyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="w-full h-full bg-[#f0f2f5] flex flex-col text-[#111b21] overflow-hidden select-none">
      {/* Top Admin Header */}
      <header className="h-[60px] bg-[#008069] text-white px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base leading-tight">WhatsApp Admin-Bereich</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#008069] rounded-full uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-white/80 leading-tight">
              Eingeloggt als {currentUser.name} (Passwort geschützt)
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={fetchStats}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onCloseToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
            title="Zu den Chats zurückkehren"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zu den Chats</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 hover:bg-rose-500/20 text-white rounded-full transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header */}
      <div className="bg-white border-b border-[#d1d7db] px-4 sm:px-6 flex items-center gap-1 sm:gap-4 overflow-x-auto text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Übersicht & Statistik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('global_chats')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'global_chats'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Globale Chats ({stats?.globalChats?.length ?? 1})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Nutzerverwaltung ({stats?.totalUsers ?? '...'})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'chats'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chats ({stats?.totalChats ?? '...'})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>System-Broadcast</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_video')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ai_video'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>KI-Videostudio</span>
          <span className="px-1.5 py-0.5 bg-[#008069]/10 text-[#008069] text-[10px] font-bold rounded-full">
            Admin
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'messages'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Nachrichten-Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-2.5 sm:px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-[#008069] text-[#008069] font-semibold'
              : 'border-transparent text-[#54656f] hover:text-[#111b21]'
          }`}
        >
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>Standort & Limits</span>
          <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full shadow-2xs">
            WIP
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#d1d7db] shadow-xs">
                <div className="flex items-center justify-between text-[#54656f] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide">Registrierte Nutzer</span>
                  <Users className="w-4 h-4 text-[#008069]" />
                </div>
                <div className="text-2xl font-bold text-[#111b21]">
                  {stats ? stats.totalUsers : '-'}
                </div>
                <div className="text-[11px] text-[#667781] mt-1">Im Backend gespeichert</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#d1d7db] shadow-xs">
                <div className="flex items-center justify-between text-[#54656f] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide">Aktive Chats</span>
                  <MessageSquare className="w-4 h-4 text-[#008069]" />
                </div>
                <div className="text-2xl font-bold text-[#111b21]">
                  {stats ? stats.totalChats : '-'}
                </div>
                <div className="text-[11px] text-[#667781] mt-1">Konversationen</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#d1d7db] shadow-xs">
                <div className="flex items-center justify-between text-[#54656f] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide">Nachrichten gesamt</span>
                  <FileText className="w-4 h-4 text-[#008069]" />
                </div>
                <div className="text-2xl font-bold text-[#111b21]">
                  {stats ? stats.totalMessages : '-'}
                </div>
                <div className="text-[11px] text-[#667781] mt-1">Echtzeit synchronisiert</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#d1d7db] shadow-xs">
                <div className="flex items-center justify-between text-[#54656f] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide">Medien & Umfragen</span>
                  <ImageIcon className="w-4 h-4 text-[#008069]" />
                </div>
                <div className="text-2xl font-bold text-[#111b21]">
                  {stats ? `${stats.totalMedia} Medien, ${stats.totalPolls} Umfragen` : '-'}
                </div>
                <div className="text-[11px] text-[#667781] mt-1">Bilder, Audio, Dokumente</div>
              </div>
            </div>

            {/* Quick Broadcast Box */}
            <div className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#111b21]">
                <Radio className="w-4 h-4 text-[#008069]" />
                <h3 className="font-semibold text-sm">Schnelle offizielle Durchsage an alle Chats</h3>
              </div>
              <p className="text-xs text-[#667781] mb-3">
                Sende eine verifizierte Nachricht als WhatsApp Administrator direkt in alle laufenden Chats.
              </p>
              <form onSubmit={handleSendBroadcast} className="flex gap-2">
                <input
                  type="text"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Mitteilung an alle Benutzer eingeben..."
                  className="flex-1 px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none"
                />
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastText.trim()}
                  className="px-4 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Senden</span>
                </button>
              </form>
              {broadcastStatus && (
                <div className="mt-2 text-xs text-[#008069] font-medium animate-in fade-in">
                  {broadcastStatus}
                </div>
              )}
            </div>

            {/* Direct Message to 'Alle' Chat as WhatsApp Admin */}
            <div className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#111b21]">
                  <MessageSquare className="w-4 h-4 text-[#008069]" />
                  <h3 className="font-semibold text-sm">Offizielle Nachricht in den "Alle"-Chat (Community)</h3>
                </div>
                {onSelectChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChat('chat_global_all');
                      onCloseToChat();
                    }}
                    className="text-xs text-[#008069] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Im Messenger öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-[#667781] mb-3">
                Poste direkt als offizieller WhatsApp-Administrator in den Community-Raum. Die Nachricht wird sofort im Chat und für alle Teilnehmer angezeigt.
              </p>
              <form onSubmit={handleSendAdminGlobalMessage} className="flex gap-2">
                <input
                  type="text"
                  value={adminDirectMsgText}
                  onChange={(e) => setAdminDirectMsgText(e.target.value)}
                  placeholder="Nachricht an den 'Alle'-Chat als WhatsApp Admin schreiben..."
                  className="flex-1 px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none"
                />
                <button
                  type="submit"
                  disabled={adminDirectMsgSending || !adminDirectMsgText.trim()}
                  className="px-4 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{adminDirectMsgSending ? 'Sendet...' : 'In Alle posten'}</span>
                </button>
              </form>
              {adminDirectMsgStatus && (
                <div className="mt-2 text-xs font-medium animate-in fade-in text-[#008069]">
                  {adminDirectMsgStatus}
                </div>
              )}
            </div>

            {/* WhatsApp Invite Links Manager */}
            <div className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#111b21]">
                <Link className="w-4 h-4 text-[#008069]" />
                <h3 className="font-semibold text-sm">Offizielle WhatsApp Einladungslinks</h3>
              </div>
              <p className="text-xs text-[#667781] mb-4">
                Kopiere diese offiziellen Einladungslinks, um sie in Chats oder Mitteilungen zu teilen. Beim Einfügen in eine Nachricht wird automatisch das WhatsApp-Einladefenster gerendert.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Channel Link */}
                <div className="p-3 bg-[#f0f2f5] rounded-xl border border-[#d1d7db]/80 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#111b21] flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#008069]" />
                        WhatsApp Offizieller Kanal
                      </span>
                      <span className="text-[10px] bg-[#d9fdd3] text-[#008069] font-medium px-2 py-0.5 rounded-full">
                        Verifiziert
                      </span>
                    </div>
                    <code className="text-[11px] text-[#54656f] block mt-1 break-all bg-white/70 px-2 py-1 rounded">
                      https://minecrafterraph.github.io/whatsnew.html/channel/whatsapp-official
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink('https://minecrafterraph.github.io/whatsnew.html/channel/whatsapp-official', 'channel')}
                    className="self-end px-3 py-1.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedLink === 'channel' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'channel' ? 'Kopiert!' : 'Kanal-Link kopieren'}</span>
                  </button>
                </div>

                {/* Group Link */}
                <div className="p-3 bg-[#f0f2f5] rounded-xl border border-[#d1d7db]/80 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#111b21] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#008069]" />
                        'Alle' Community Chat (Gruppe)
                      </span>
                      <span className="text-[10px] bg-[#d9fdd3] text-[#008069] font-medium px-2 py-0.5 rounded-full">
                        Global
                      </span>
                    </div>
                    <code className="text-[11px] text-[#54656f] block mt-1 break-all bg-white/70 px-2 py-1 rounded">
                      https://chat.whatsapp.com/invite/chat_global_all
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink('https://chat.whatsapp.com/invite/chat_global_all', 'chat')}
                    className="self-end px-3 py-1.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedLink === 'chat' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'chat' ? 'Kopiert!' : 'Chat-Link kopieren'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* System Status & Danger Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs">
                <h3 className="font-semibold text-sm text-[#111b21] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008069]" />
                  System-Status
                </h3>
                <div className="space-y-2 text-xs text-[#54656f]">
                  <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                    <span>Server-Status</span>
                    <span className="text-[#008069] font-semibold">Online (Port 3000)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                    <span>Persistenz</span>
                    <span className="font-medium text-[#111b21]">Server-JSON-Datenbank</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                    <span>Admin-Konto</span>
                    <span className="font-medium text-[#111b21]">WhatsApp (Administrator)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Echtzeit-Synchronisierung</span>
                    <span className="text-[#008069] font-medium">Aktiv (1.5s Polling)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs">
                <h3 className="font-semibold text-sm text-rose-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Gefahrenbereich (System bereinigen)
                </h3>
                <p className="text-xs text-[#667781] mb-4">
                  Setzt alle Chats und Nachrichten zurück. Der Administrator-Account bleibt dabei unberührt.
                </p>
                <button
                  type="button"
                  onClick={handleResetSystem}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Alle Chats & Nachrichten leeren</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= GLOBAL CHATS TAB ================= */}
        {activeTab === 'global_chats' && (
          <div className="space-y-6">
            {/* Header / Action Bar */}
            <div className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#008069]/10 text-[#008069] flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#111b21] flex items-center gap-2">
                    Globale Community-Chats
                    <span className="text-xs px-2 py-0.5 bg-[#008069]/10 text-[#008069] font-medium rounded-full">
                      {stats?.globalChats?.length ?? 1} aktiv
                    </span>
                  </h3>
                  <p className="text-xs text-[#667781] mt-0.5">
                    Globale Chats sind für jeden registrierten Nutzer in seiner Chatliste sichtbar und vernetzen die gesamte Community.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateName('');
                  setCreateAbout('');
                  setCreateAvatar(PRESET_AVATARS[0].iconKey);
                  setCreateIsPinned(true);
                  setCreateTimer('off');
                  setCreateInitialMsg('');
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Neuer globaler Chat</span>
              </button>
            </div>

            {/* Global Chats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.globalChats && stats.globalChats.length > 0 ? (
                stats.globalChats.map((chat) => {
                  const isMainGlobal = chat.id === 'chat_global_all';
                  return (
                    <div
                      key={chat.id}
                      className="bg-white rounded-xl border border-[#d1d7db] p-5 shadow-xs flex flex-col justify-between hover:border-[#008069]/50 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <WhatsAppAvatar
                              name={chat.name}
                              avatarUrl={chat.avatar}
                              isGlobal={chat.isGlobal}
                              isGroup={chat.isGroup}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-semibold text-sm text-[#111b21]">{chat.name}</h4>
                                {isMainGlobal && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#008069] text-white rounded">
                                    HAUPT-CHAT
                                  </span>
                                )}
                                {chat.isPinned && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded flex items-center gap-1">
                                    <Pin className="w-2.5 h-2.5" /> Angepinnt
                                  </span>
                                )}
                                {chat.disappearingTimer && chat.disappearingTimer !== 'off' && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {chat.disappearingTimer}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#54656f] mt-0.5 line-clamp-2">
                                {chat.about || 'Öffentlicher Gruppenchat'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="bg-[#f0f2f5] p-2.5 rounded-lg text-[11px] text-[#54656f] flex items-center justify-between my-3">
                          <span>{chat.messageCount} Nachrichten im Verlauf</span>
                          <span className="font-mono text-[10px] text-[#8696a0] truncate max-w-[140px]">
                            {chat.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#f0f2f5]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditChat(chat)}
                            className="px-3 py-1.5 bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                            title="Chat-Einstellungen bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#54656f]" />
                            <span>Bearbeiten</span>
                          </button>

                          {onSelectChat && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectChat(chat.id);
                                onCloseToChat();
                              }}
                              className="px-3 py-1.5 bg-[#008069]/10 hover:bg-[#008069]/20 text-[#008069] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                              title="Direkt in den Chat wechseln"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Öffnen</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGlobalChat(chat.id, chat.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={isMainGlobal ? 'Hauptchat zurücksetzen' : 'Globalen Chat löschen'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[#8696a0] bg-white rounded-xl border border-[#d1d7db] col-span-2">
                  Keine globalen Chats gefunden.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= USERS TAB ================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#d1d7db] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-[#111b21]">Registrierte Benutzer</h3>
                <p className="text-xs text-[#667781]">Übersicht aller Konten im System</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8696a0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nutzer suchen..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f0f2f5] rounded-lg border border-transparent focus:border-[#008069] outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-[#f0f2f5]">
              {stats?.users
                .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((u) => {
                  const isWhatsAppAdminUser = u.name.toLowerCase() === 'whatsapp';
                  return (
                    <div
                      key={u.id}
                      className="p-4 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <WhatsAppAvatar
                          name={u.name}
                          avatarUrl={u.avatar}
                          isAdmin={isWhatsAppAdminUser}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[#111b21]">{u.name}</span>
                            {isWhatsAppAdminUser && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#008069] text-white rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#667781]">{u.about || 'Verfügbar'}</p>
                          <div className="text-[10px] text-[#8696a0] mt-0.5">
                            ID: {u.id} • {u.messageCount} Nachrichten gesendet
                          </div>
                        </div>
                      </div>

                      <div>
                        {!isWhatsAppAdminUser ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#008069] font-medium px-2 py-1 bg-[#008069]/10 rounded">
                            Geschützt
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ================= CHATS TAB ================= */}
        {activeTab === 'chats' && (
          <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#d1d7db]">
              <h3 className="font-semibold text-sm text-[#111b21]">Laufende Chats</h3>
              <p className="text-xs text-[#667781]">Alle bestehenden Konversationen im System</p>
            </div>

            {stats?.chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8696a0]">
                Es existieren aktuell noch keine aktiven Chats.
              </div>
            ) : (
              <div className="divide-y divide-[#f0f2f5]">
                {stats?.chats.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#111b21]">
                        {c.participantNames && c.participantNames.length > 0
                          ? c.participantNames.join(' ↔ ')
                          : c.id === 'chat_global_all'
                          ? 'Alle (Offizieller Community-Chat)'
                          : 'Gruppenchat'}
                      </div>
                      <div className="text-xs text-[#667781] mt-0.5">
                        {c.messageCount} {c.messageCount === 1 ? 'Nachricht' : 'Nachrichten'} • Chat-ID: {c.id}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteChat(c.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Chat löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= BROADCAST TAB ================= */}
        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-xl border border-[#d1d7db] p-6 shadow-xs max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#111b21]">Offizieller System-Broadcast</h3>
                <p className="text-xs text-[#667781]">
                  Erreiche alle Benutzer durch eine Nachricht von "WhatsApp (Offiziell)".
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1.5">
                  Nachrichteninhalt
                </label>
                <textarea
                  rows={5}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="z.B.: Wichtiges Systemupdate: Neue Funktionen sind ab sofort verfügbar!"
                  className="w-full p-3 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                  required
                />
              </div>

              {/* Message preview card */}
              <div>
                <div className="text-[11px] font-medium text-[#667781] mb-1">Vorschau in den Chats:</div>
                <div className="p-3 bg-[#d9fdd3] rounded-lg border border-[#b2e8b0] text-xs text-[#111b21] max-w-md">
                  <div className="font-semibold text-[#008069] mb-1">📢 [Offizielle WhatsApp-Mitteilung]:</div>
                  <p className="whitespace-pre-wrap">{broadcastText || 'Hier erscheint dein Text...'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastText.trim()}
                  className="px-5 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Jetzt an alle Chats senden</span>
                </button>

                {broadcastStatus && (
                  <span className="text-xs font-medium text-[#008069]">
                    {broadcastStatus}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ================= AI VIDEO STUDIO TAB ================= */}
        {activeTab === 'ai_video' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#d1d7db] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#d1d7db] mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#008069]" />
                    <h3 className="font-semibold text-base text-[#111b21]">WhatsApp KI-Videostudio</h3>
                    <span className="px-2 py-0.5 bg-[#008069]/10 text-[#008069] text-[10px] font-bold rounded-full">
                      Admin Exklusiv
                    </span>
                  </div>
                  <p className="text-xs text-[#667781] mt-0.5">
                    Generiere professionelle Videos mit KI-Inhalten für den offiziellen WhatsApp-Kanal oder den globalen Chat.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateAiVideo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1.5">
                    Video-Thema & Prompts
                  </label>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="z.B.: Vorstellung des neuen WhatsApp Datenschutzes und Ende-zu-Ende-Verschlüsselung..."
                    className="w-full p-3 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                    required
                  />
                  {/* Quick Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] text-[#667781] self-center mr-1">Vorschläge:</span>
                    {[
                      'Ende-zu-Ende Verschlüsselung Update',
                      'Willkommen in der Community',
                      'Tipps für sichere Chats',
                      'Neue WhatsApp Web Funktionen',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setVideoPrompt(suggestion)}
                        className="px-2.5 py-1 text-[11px] bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21] rounded-full transition-colors cursor-pointer border border-[#d1d7db]/60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1.5">
                      Videostil & Look
                    </label>
                    <select
                      value={videoStyle}
                      onChange={(e) => setVideoStyle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                    >
                      <option value="modern">Modern & Clean (Official Tech)</option>
                      <option value="cinematic">Cinematic 4K (Dramatisch & Dunkel)</option>
                      <option value="vibrant">Vibrant & Social (Bunt & Lebendig)</option>
                      <option value="minimal">Minimalist WhatsApp Green</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={videoGenerating || !videoPrompt.trim()}
                    className="px-5 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${videoGenerating ? 'animate-spin' : ''}`} />
                    <span>{videoGenerating ? 'Video wird gerendert...' : 'KI-Video generieren'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Generated Video Preview & Publishing */}
            {generatedVideo && (
              <div className="bg-white rounded-xl border border-[#d1d7db] p-6 shadow-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-[#111b21] flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#008069]" />
                    <span>Generiertes Video-Ergebnis</span>
                  </h4>
                  <span className="text-xs text-[#667781]">Dauer: {generatedVideo.duration}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-[#d1d7db]">
                    <video
                      controls
                      src={generatedVideo.videoUrl}
                      poster={generatedVideo.posterUrl}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-sm text-[#111b21]">{generatedVideo.title}</h5>
                      <p className="text-xs text-[#54656f] mt-1 leading-relaxed whitespace-pre-wrap">
                        {generatedVideo.caption}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#f0f2f5] space-y-2">
                      <div className="text-xs font-semibold text-[#54656f] uppercase">
                        Veröffentlichungs-Optionen
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handlePostVideoToChannel}
                          className="px-4 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Im WhatsApp-Kanal posten</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePostVideoToGlobalChat}
                          className="px-4 py-2 bg-[#f0f2f5] hover:bg-[#e9edef] text-[#111b21] text-xs font-semibold rounded-lg border border-[#d1d7db] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#008069]" />
                          <span>In "Alle"-Chat senden</span>
                        </button>
                      </div>

                      {videoPostStatus && (
                        <p className="text-xs font-semibold text-[#008069] pt-2">
                          {videoPostStatus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MESSAGES LOG TAB ================= */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#d1d7db]">
              <h3 className="font-semibold text-sm text-[#111b21]">Echtzeit-Nachrichtenprotokoll</h3>
              <p className="text-xs text-[#667781]">Die letzten 40 Nachrichten systemweit</p>
            </div>

            <div className="divide-y divide-[#f0f2f5]">
              {stats?.recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 flex items-start justify-between hover:bg-[#f9fafb] transition-colors text-xs"
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#008069]">{msg.senderName}</span>
                      <span className="text-[10px] text-[#8696a0]">{msg.timestamp}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#f0f2f5] text-[#54656f] rounded">
                        {msg.type}
                      </span>
                    </div>
                    <p className={`text-[#111b21] break-words ${msg.deleted ? 'italic text-[#8696a0]' : ''}`}>
                      {msg.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1.5 text-[#8696a0] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Nachricht endgültig löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SETTINGS & LOCATION LIMITS TAB [WIP] ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-[#e9edef] flex items-center justify-between bg-linear-to-r from-white via-white to-amber-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#111b21]">
                        Standort-Freigabe & Integrations-Limits
                      </h3>
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                        WIP / Beta
                      </span>
                    </div>
                    <p className="text-xs text-[#54656f] mt-0.5">
                      Tägliches Kontingent für GPS-Standortnachrichten zur Einsparung von Integrations-Credits
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 space-y-6">
                {/* Credit conservation notice */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-emerald-900">
                      Credit-Schutz & API-Optimierung aktiv
                    </div>
                    <p className="text-emerald-800 leading-relaxed text-[11px]">
                      Jedes Abrufen und Versenden von echten GPS-Standortkoordinaten und Kartenkacheln kann Integrations-Credits beanspruchen. Mit der folgenden Einstellung legst du fest, wie oft normale Benutzer ihren Standort pro Tag maximal teilen dürfen.
                    </p>
                  </div>
                </div>

                {/* Daily limit configuration */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#111b21] uppercase tracking-wide">
                    Max. Standort-Freigaben pro Nutzer & Tag
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative max-w-xs">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={locationLimit}
                        onChange={(e) => setLocationLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full text-sm font-semibold px-4 py-2.5 bg-white border border-[#d1d7db] rounded-lg focus:outline-none focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-[#111b21]"
                      />
                      <div className="absolute right-3 top-2.5 text-xs text-[#667781] pointer-events-none">
                        Freigaben / Tag
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="px-5 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{settingsSaving ? 'Speichere...' : 'Limit speichern'}</span>
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-[#667781] block mb-1.5">
                      Schnellauswahl:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setLocationLimit(preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            locationLimit === preset
                              ? 'bg-[#008069] text-white border-[#008069]'
                              : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef] hover:bg-[#e9edef]'
                          }`}
                        >
                          {preset}x täglich {preset === 3 ? '(Standard)' : ''}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setLocationLimit(0)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          locationLimit === 0
                            ? 'bg-[#008069] text-white border-[#008069]'
                            : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef] hover:bg-[#e9edef]'
                        }`}
                      >
                        0 (Deaktiviert)
                      </button>
                    </div>
                  </div>
                </div>

                {settingsToast && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold">
                    {settingsToast}
                  </div>
                )}
              </form>

              {/* Reset Counters Section */}
              <div className="p-5 sm:p-6 bg-[#f9fafb] border-t border-[#e9edef] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-[#111b21]">
                      Tageszähler zurücksetzen
                    </h4>
                    <p className="text-[11px] text-[#667781] mt-0.5">
                      Setzt die bisherigen Freigaben für den heutigen Tag sofort auf 0 zurück (z. B. für Tests).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetLocationUsage}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-[#d1d7db] hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Zähler jetzt leeren</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Meta AI Configuration Card per User Request */}
            <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#111b21] font-semibold text-sm">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <span>Meta AI Konfiguration & Freigabe</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    metaAiMode === 'disabled'
                      ? 'bg-gray-100 text-gray-700'
                      : metaAiMode === 'enabled_user_key'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {metaAiMode === 'disabled'
                      ? 'Deaktiviert (Standard)'
                      : metaAiMode === 'enabled_user_key'
                      ? 'Nutzer-API aktiv'
                      : 'Frei nutzbar'}
                  </span>
                </div>

                <p className="text-xs text-[#54656f] leading-relaxed">
                  Steuere, wie Meta AI in WhatsApp Web genutzt werden kann. Standardmäßig ist Meta AI deaktiviert.
                  Als Administrator kannst du festlegen, ob Meta AI frei nutzbar ist oder ob jeder Nutzer seinen eigenen API-Schlüssel eingeben muss.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Mode 1: Disabled */}
                  <button
                    type="button"
                    onClick={() => handleSaveMetaAi('disabled')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      metaAiMode === 'disabled'
                        ? 'border-[#008069] bg-[#008069]/10 text-[#008069] font-semibold'
                        : 'border-[#d1d7db] bg-[#f9fafb] text-[#54656f] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#111b21]">Standard: Nein</span>
                      {metaAiMode === 'disabled' && <Check className="w-4 h-4 text-[#008069]" />}
                    </div>
                    <p className="text-[11px] leading-snug">
                      Meta AI ist für alle Nutzer deaktiviert (Standardeinstellung).
                    </p>
                  </button>

                  {/* Mode 2: Free / WhatsApp server */}
                  <button
                    type="button"
                    onClick={() => handleSaveMetaAi('enabled_free')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      metaAiMode === 'enabled_free'
                        ? 'border-[#008069] bg-[#008069]/10 text-[#008069] font-semibold'
                        : 'border-[#d1d7db] bg-[#f9fafb] text-[#54656f] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#111b21]">Frei nutzbar</span>
                      {metaAiMode === 'enabled_free' && <Check className="w-4 h-4 text-[#008069]" />}
                    </div>
                    <p className="text-[11px] leading-snug">
                      WhatsApp erlaubt direkte Nutzung ohne eigene API-Eingabe.
                    </p>
                  </button>

                  {/* Mode 3: User must provide own API Key */}
                  <button
                    type="button"
                    onClick={() => handleSaveMetaAi('enabled_user_key')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      metaAiMode === 'enabled_user_key'
                        ? 'border-[#008069] bg-[#008069]/10 text-[#008069] font-semibold'
                        : 'border-[#d1d7db] bg-[#f9fafb] text-[#54656f] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#111b21]">Eigener API-Key</span>
                      {metaAiMode === 'enabled_user_key' && <Check className="w-4 h-4 text-[#008069]" />}
                    </div>
                    <p className="text-[11px] leading-snug">
                      Nutzer müssen ihren eigenen Gemini API-Key eingeben.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Storage Data Administration Card per User Request */}
            <div className="bg-white rounded-xl border border-[#d1d7db] shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#111b21] font-semibold text-sm">
                    <HardDrive className="w-5 h-5 text-[#008069]" />
                    <span>Speicherdaten-Verwaltung für Nutzer</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    storageDataEnabled
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {storageDataEnabled ? 'Für Nutzer freigegeben' : 'Standardmäßig deaktiviert'}
                  </span>
                </div>

                <p className="text-xs text-[#54656f] leading-relaxed">
                  Steuert, ob Nutzer in ihren WhatsApp-Einstellungen die detaillierte Speicherdaten-Verwaltung aufrufen können (Chat-Größen, Fotos, Videos, Dokumente und selektive Bereinigung). Standardmäßig deaktiviert.
                </p>

                <div className="flex items-center justify-between p-3 bg-[#f0f2f5] rounded-xl border border-[#d1d7db]">
                  <div>
                    <span className="text-xs font-semibold text-[#111b21] block">
                      Detaillierte Speicherdaten freischalten
                    </span>
                    <span className="text-[11px] text-[#667781]">
                      {storageDataEnabled
                        ? 'Nutzer sehen den Button "Detaillierte Speicherdaten" in den Einstellungen.'
                        : 'Nutzer sehen den Hinweis, dass die Speicherdaten vom Admin gesperrt sind.'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storageDataEnabled}
                      onChange={(e) => handleToggleStorageData(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008069]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Feature Status & Documentation Box */}
            <div className="bg-white p-5 rounded-xl border border-[#d1d7db] shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#111b21] font-semibold">
                <Navigation className="w-4 h-4 text-[#008069]" />
                <span>Status der Standort-Integration (WIP)</span>
              </div>
              <ul className="space-y-1.5 text-[#54656f] text-[11px] list-disc list-inside">
                <li>
                  <strong className="text-[#111b21]">Echter GPS-Sensor:</strong> Nutzt <code className="bg-[#f0f2f5] px-1 py-0.5 rounded text-[#008069]">navigator.geolocation.getCurrentPosition</code> mit hoher Genauigkeit (<code className="bg-[#f0f2f5] px-1 py-0.5 rounded text-[#008069]">enableHighAccuracy: true</code>).
                </li>
                <li>
                  <strong className="text-[#111b21]">Karten-Verknüpfung:</strong> Empfänger können geteilte Standorte direkt per Klick in Google Maps und OpenStreetMap aufrufen.
                </li>
                <li>
                  <strong className="text-[#111b21]">Kennzeichnung:</strong> Alle Standort-Nachrichten tragen den geforderten <span className="bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded text-[9px]">WIP</span>-Tag.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ================= CREATE GLOBAL CHAT MODAL ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#d1d7db] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5" />
                <h3 className="font-semibold text-sm">Neuen globalen Chat erstellen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateGlobalChat} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Chat Name */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1">
                  Name des Raumes *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="z.B. Gaming & Talk, Ankündigungen, Support"
                  className="w-full px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                />
              </div>

              {/* Chat Description */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1">
                  Beschreibung / Info
                </label>
                <textarea
                  rows={2}
                  value={createAbout}
                  onChange={(e) => setCreateAbout(e.target.value)}
                  placeholder="z.B. Öffentlicher Gruppenraum für alle Community-Mitglieder..."
                  className="w-full px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1.5">
                  WhatsApp Raum-Icon
                </label>
                <div className="flex items-center gap-3 mb-3 p-2 bg-[#f0f2f5] rounded-xl border border-[#d1d7db]">
                  <WhatsAppAvatar
                    name={createName || 'Chat'}
                    avatarUrl={createAvatar}
                    isGlobal
                    size="lg"
                  />
                  <div className="flex-1 text-xs text-[#54656f]">
                    <span className="font-semibold text-[#111b21] block">
                      {PRESET_AVATARS.find((p) => p.iconKey === createAvatar)?.label || 'Ausgewähltes Symbol'}
                    </span>
                    Authentisches WhatsApp Icon-System aktiv
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setCreateAvatar(preset.iconKey)}
                      className={`text-[11px] p-2 rounded-lg border flex items-center gap-2 transition-all ${
                        createAvatar === preset.iconKey
                          ? 'border-[#008069] bg-[#008069]/10 text-[#008069] font-semibold ring-1 ring-[#008069]'
                          : 'border-[#d1d7db] bg-white text-[#54656f] hover:bg-[#f0f2f5]'
                      }`}
                    >
                      <WhatsAppAvatar name={preset.label} avatarUrl={preset.iconKey} size="xs" />
                      <span className="truncate flex-1 text-left">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings: Pinned & Disappearing Messages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Pinned toggle */}
                <label className="flex items-center gap-2.5 p-2.5 bg-[#f0f2f5] rounded-lg cursor-pointer hover:bg-[#e9edef] transition-colors">
                  <input
                    type="checkbox"
                    checked={createIsPinned}
                    onChange={(e) => setCreateIsPinned(e.target.checked)}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#111b21] block">Oben anpinnen</span>
                    <span className="text-[10px] text-[#667781]">Bleibt oben in der Chatliste</span>
                  </div>
                </label>

                {/* Disappearing timer */}
                <div className="p-2.5 bg-[#f0f2f5] rounded-lg">
                  <label className="block text-[11px] font-semibold text-[#111b21] mb-1">
                    Selbstlöschende Nachrichten
                  </label>
                  <select
                    value={createTimer}
                    onChange={(e) => setCreateTimer(e.target.value as any)}
                    className="w-full text-xs p-1.5 rounded border border-[#d1d7db] bg-white text-[#111b21] outline-none focus:border-[#008069]"
                  >
                    <option value="off">Aus (Dauerhaft)</option>
                    <option value="24h">24 Stunden</option>
                    <option value="7d">7 Tage</option>
                    <option value="90d">90 Tage</option>
                  </select>
                </div>
              </div>

              {/* Initial Admin Broadcast Message */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1">
                  Erste Nachricht von "WhatsApp" (Optional)
                </label>
                <input
                  type="text"
                  value={createInitialMsg}
                  onChange={(e) => setCreateInitialMsg(e.target.value)}
                  placeholder="z.B. Willkommen im neuen Chatraum! Schön, dass ihr da seid."
                  className="w-full px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGlobal || !createName.trim()}
                  className="px-5 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Globalen Chat erstellen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT GLOBAL CHAT MODAL ================= */}
      {editingChat && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#d1d7db] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-semibold text-sm">Globalen Chat bearbeiten: {editingChat.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingChat(null)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditGlobalChat} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Chat Name */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1">
                  Name des Raumes *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                />
              </div>

              {/* Chat Description */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1">
                  Beschreibung / Info
                </label>
                <textarea
                  rows={2}
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#54656f] uppercase mb-1.5">
                  WhatsApp Raum-Icon
                </label>
                <div className="flex items-center gap-3 mb-3 p-2 bg-[#f0f2f5] rounded-xl border border-[#d1d7db]">
                  <WhatsAppAvatar
                    name={editName || 'Chat'}
                    avatarUrl={editAvatar}
                    isGlobal
                    size="lg"
                  />
                  <div className="flex-1 text-xs text-[#54656f]">
                    <span className="font-semibold text-[#111b21] block">
                      {PRESET_AVATARS.find((p) => p.iconKey === editAvatar)?.label || 'Ausgewähltes Symbol'}
                    </span>
                    Authentisches WhatsApp Icon-System aktiv
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setEditAvatar(preset.iconKey)}
                      className={`text-[11px] p-2 rounded-lg border flex items-center gap-2 transition-all ${
                        editAvatar === preset.iconKey
                          ? 'border-[#008069] bg-[#008069]/10 text-[#008069] font-semibold ring-1 ring-[#008069]'
                          : 'border-[#d1d7db] bg-white text-[#54656f] hover:bg-[#f0f2f5]'
                      }`}
                    >
                      <WhatsAppAvatar name={preset.label} avatarUrl={preset.iconKey} size="xs" />
                      <span className="truncate flex-1 text-left">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings: Pinned & Disappearing Messages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Pinned toggle */}
                <label className="flex items-center gap-2.5 p-2.5 bg-[#f0f2f5] rounded-lg cursor-pointer hover:bg-[#e9edef] transition-colors">
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#111b21] block">Oben anpinnen</span>
                    <span className="text-[10px] text-[#667781]">Fixiert in der Chatliste</span>
                  </div>
                </label>

                {/* Disappearing timer */}
                <div className="p-2.5 bg-[#f0f2f5] rounded-lg">
                  <label className="block text-[11px] font-semibold text-[#111b21] mb-1">
                    Selbstlöschende Nachrichten
                  </label>
                  <select
                    value={editTimer}
                    onChange={(e) => setEditTimer(e.target.value as any)}
                    className="w-full text-xs p-1.5 rounded border border-[#d1d7db] bg-white text-[#111b21] outline-none focus:border-[#008069]"
                  >
                    <option value="off">Aus (Dauerhaft)</option>
                    <option value="24h">24 Stunden</option>
                    <option value="7d">7 Tage</option>
                    <option value="90d">90 Tage</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setEditingChat(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGlobal || !editName.trim()}
                  className="px-5 py-2 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Dialog (replaces blocked browser confirm() inside iFrames) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-[#d1d7db] space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-[#d9fdd3] text-[#008069]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#111b21] text-base">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-[#54656f] leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2f5]">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  cb();
                }}
                className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#008069] hover:bg-[#00a884]'
                }`}
              >
                {confirmDialog.confirmText || 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111b21] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border border-white/10 animate-in slide-in-from-bottom-2 duration-200">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
