import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Shield,
  Keyboard,
  Check,
  MessageSquare,
  Palette,
  Type,
  Eye,
  Volume2,
  Lock,
  Smartphone,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  User,
  HardDrive,
  Calendar,
  LogOut,
  KeyRound,
  Sun,
  Moon,
  Monitor,
  Play,
  Sliders,
  Database,
  HelpCircle,
  ExternalLink,
  Phone,
  Server,
  Bot,
} from 'lucide-react';
import { AppSettings, FontSize, WallpaperTheme, CallConfig, MetaAiConfig } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { sounds } from '../utils/audio';
import { isIframe } from '../utils/storage';
import { ExternalNotificationsModal } from './ExternalNotificationsModal';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  userName: string;
  userAbout: string;
  userAvatar?: string;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onUpdateProfile: (name: string, about: string, avatar?: string) => void;
  onClearAllChats?: () => void;
  initialSection?: 'all' | 'profile' | 'chats' | 'notifications' | 'privacy' | 'account' | 'storage' | 'shortcuts';
  lastOnlineTimestamp?: number | null;
  onLogout?: () => void;
  onLockScreen?: () => void;
  onOpenShortcuts?: () => void;
  onOpenStorageData?: () => void;
  storageDataEnabled?: boolean;
  onOpenCallConfig?: () => void;
  callConfig?: CallConfig;
  onOpenMetaAI?: () => void;
  metaAiConfig?: MetaAiConfig;
}

const USER_ICON_OPTIONS = [
  { id: 'classic', label: 'Klassische Silhouette', iconKey: 'icon:classic' },
  { id: 'emerald', label: 'WhatsApp Smaragd', iconKey: 'icon:emerald' },
  { id: 'teal', label: 'WhatsApp Türkis', iconKey: 'icon:teal' },
  { id: 'blue', label: 'WhatsApp Ozeanblau', iconKey: 'icon:blue' },
  { id: 'purple', label: 'WhatsApp Purpur', iconKey: 'icon:purple' },
  { id: 'rose', label: 'WhatsApp Koralle', iconKey: 'icon:rose' },
  { id: 'amber', label: 'WhatsApp Bernstein', iconKey: 'icon:amber' },
  { id: 'initials', label: 'Farbige Initialen', iconKey: 'icon:initials' },
];

const WALLPAPER_PRESETS: { id: WallpaperTheme; name: string; bg: string; border: string; dark?: boolean }[] = [
  { id: 'classic', name: 'Klassik', bg: '#efeae2', border: '#d1c7b7' },
  { id: 'salbei', name: 'Salbei', bg: '#d8e8e1', border: '#b8d6cb' },
  { id: 'himmelblau', name: 'Himmelblau', bg: '#d7e8f6', border: '#b4d4f0' },
  { id: 'pfirsich', name: 'Pfirsich', bg: '#fae3d9', border: '#f3c4b1' },
  { id: 'dunkel', name: 'Dunkelmodus', bg: '#0b141a', border: '#1f2c34', dark: true },
  { id: 'dunkelgruen', name: 'Smaragd', bg: '#103629', border: '#0a231b', dark: true },
  { id: 'rein', name: 'Schlicht Weiß', bg: '#ffffff', border: '#e2e8f0' },
];

const PRESET_ABOUTS = [
  'Auf WhatsApp',
  'Verfügbar',
  'Beschäftigt',
  'In der Arbeit',
  'Batterie fast leer',
  'Nur Notrufe',
  'Im Fitnessstudio',
  'Schlafen',
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userName,
  userAbout,
  userAvatar,
  isAdmin,
  onOpenAdminPanel,
  onUpdateProfile,
  onClearAllChats,
  initialSection = 'all',
  lastOnlineTimestamp,
  onLogout,
  onLockScreen,
  onOpenShortcuts,
  onOpenStorageData,
  storageDataEnabled = false,
  onOpenCallConfig,
  callConfig,
  onOpenMetaAI,
  metaAiConfig,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'profile' | 'chats' | 'notifications' | 'privacy' | 'account' | 'storage' | 'shortcuts'>(initialSection);
  const [nameInput, setNameInput] = useState(userName);
  const [aboutInput, setAboutInput] = useState(userAbout);
  const [selectedAvatar, setSelectedAvatar] = useState(userAvatar || 'icon:classic');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isExternalNotificationsOpen, setIsExternalNotificationsOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>(
    [0, 1, 3, 7, 14, 30, 90].includes(settings.sessionTimeoutDays) ? '' : String(settings.sessionTimeoutDays)
  );

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection || 'all');
      setNameInput(userName);
      setAboutInput(userAbout);
      setSelectedAvatar(userAvatar || 'icon:classic');
    }
  }, [isOpen, initialSection, userName, userAbout, userAvatar]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateProfile(nameInput.trim(), aboutInput.trim(), selectedAvatar);
      setIsEditingProfile(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-r border-[#d1d7db] animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#008069] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-black/10 rounded-full text-white transition-colors"
              title="Zurück"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-lg">Einstellungen</h3>
          </div>

          {isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#008069] hover:bg-white/90 rounded-md text-xs font-bold shadow-2xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin-Panel</span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f0f2f5] border-b border-[#d1d7db] overflow-x-auto shrink-0 scrollbar-none text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeSection === 'all'
                ? 'bg-[#008069] text-white shadow-xs'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            Alle
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('chats')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'chats'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Chats & Wallpaper
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'profile'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profil
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'notifications'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Mitteilungen
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('privacy')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'privacy'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Datenschutz
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'account'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Konto & Sitzung
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('storage')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'storage'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Medien & Speicher
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('shortcuts');
              if (onOpenShortcuts) onOpenShortcuts();
            }}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'shortcuts'
                ? 'bg-[#008069] text-white shadow-xs font-semibold'
                : 'bg-white text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Tastaturkürzel
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* User Profile Card */}
          {(activeSection === 'all' || activeSection === 'profile') && (
            <div className="bg-[#f0f2f5] p-4 rounded-2xl border border-[#d1d7db]">
              <div className="flex items-center gap-4">
                <WhatsAppAvatar
                  name={userName}
                  avatarUrl={userAvatar}
                  isAdmin={isAdmin}
                  size="xl"
                  className="border-2 border-[#008069] shadow-xs"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-base text-[#111b21] truncate">{userName}</h4>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#008069] text-white rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#667781] truncate mt-0.5">{userAbout || 'Auf WhatsApp'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(userName);
                      setAboutInput(userAbout);
                      setSelectedAvatar(userAvatar || 'icon:classic');
                      setIsEditingProfile((p) => !p);
                    }}
                    className="mt-1.5 text-xs font-semibold text-[#008069] hover:underline block"
                  >
                    {isEditingProfile ? 'Schließen' : 'Name & Info anpassen'}
                  </button>
                </div>
              </div>

              {/* Profile Editing Form */}
              {isEditingProfile && (
                <form onSubmit={handleSaveProfile} className="mt-4 pt-3 border-t border-[#d1d7db] space-y-3">
                  {/* WhatsApp Icon Style Selector */}
                  <div>
                    <label className="text-[10px] font-semibold text-[#54656f] uppercase block mb-1.5">
                      WhatsApp Benutzer-Icon
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {USER_ICON_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setSelectedAvatar(opt.iconKey)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                            selectedAvatar === opt.iconKey
                              ? 'border-[#008069] bg-[#008069]/10 font-semibold text-[#008069]'
                              : 'border-[#d1d7db] bg-white text-[#54656f] hover:bg-[#f5f6f6]'
                          }`}
                        >
                          <WhatsAppAvatar
                            name={nameInput || userName}
                            avatarUrl={opt.iconKey}
                            size="xs"
                          />
                          <span className="text-[10px] truncate flex-1 leading-tight">{opt.label}</span>
                          {selectedAvatar === opt.iconKey && <Check className="w-3 h-3 text-[#008069] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#54656f] uppercase block mb-1">
                      Dein Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-[#00a884] outline-none text-[#111b21]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#54656f] uppercase block mb-1">
                      Info (Status)
                    </label>
                    <input
                      type="text"
                      value={aboutInput}
                      onChange={(e) => setAboutInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-[#00a884] outline-none text-[#111b21]"
                    />
                    {/* Preset quick status pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {PRESET_ABOUTS.map((status) => (
                        <button
                          type="button"
                          key={status}
                          onClick={() => setAboutInput(status)}
                          className="text-[10px] px-2 py-0.5 bg-white hover:bg-gray-100 text-[#54656f] rounded-full border border-gray-200 transition-colors"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 text-xs text-[#54656f] hover:bg-black/5 rounded-lg"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white rounded-lg shadow-xs transition-colors"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= CHAT EINSTELLUNGEN ================= */}
          {(activeSection === 'all' || activeSection === 'chats') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Chat-Einstellungen & Design
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-4 border border-[#d1d7db]/70">
                {/* Theme Switcher: Hell, Dunkel, System */}
                <div>
                  <label className="block text-xs font-semibold text-[#111b21] mb-2 flex items-center justify-between">
                    <span>Erscheinungsbild / Thema</span>
                    <span className="text-[11px] font-normal text-[#667781] capitalize">
                      {settings.theme === 'dark' ? 'Dunkelmodus' : settings.theme === 'system' ? 'Systemeinstellung' : 'Hell'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-white rounded-xl border border-[#d1d7db]">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ theme: 'light' })}
                      className={`py-2 px-3 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                        (settings.theme || 'light') === 'light'
                          ? 'bg-[#008069] text-white shadow-xs font-semibold'
                          : 'text-[#54656f] hover:bg-gray-100'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Hell</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ theme: 'dark' })}
                      className={`py-2 px-3 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                        settings.theme === 'dark'
                          ? 'bg-[#008069] text-white shadow-xs font-semibold'
                          : 'text-[#54656f] hover:bg-gray-100'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dunkel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ theme: 'system' })}
                      className={`py-2 px-3 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                        settings.theme === 'system'
                          ? 'bg-[#008069] text-white shadow-xs font-semibold'
                          : 'text-[#54656f] hover:bg-gray-100'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Kompakte Chatliste Toggle */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Kompakte Chatliste</span>
                    <span className="text-[10px] text-[#667781]">
                      Reduziert Zeilenabstände für mehr Chats auf einen Blick
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode || false}
                    onChange={(e) => onUpdateSettings({ compactMode: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Wallpaper Themes */}
                <div className="pt-2 border-t border-[#e9edef]">
                  <label className="block text-xs font-semibold text-[#111b21] mb-2 flex items-center justify-between">
                    <span>Chat-Hintergrund (Wallpaper)</span>
                    <span className="text-[11px] font-normal text-[#667781]">
                      {WALLPAPER_PRESETS.find((p) => p.id === settings.wallpaperTheme)?.name}
                    </span>
                  </label>

                  {/* Color Swatches */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {WALLPAPER_PRESETS.map((p) => {
                      const isSelected = settings.wallpaperTheme === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => onUpdateSettings({ wallpaperTheme: p.id })}
                          className={`h-12 rounded-xl flex flex-col items-center justify-center border-2 transition-transform shadow-xs relative overflow-hidden ${
                            isSelected ? 'border-[#008069] scale-105 ring-2 ring-[#008069]/30' : 'border-black/10 hover:scale-102'
                          }`}
                          style={{ backgroundColor: p.bg }}
                          title={p.name}
                        >
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#008069] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Doodle toggle */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">WhatsApp Doodle-Muster</span>
                    <span className="text-[10px] text-[#667781]">
                      Typische WhatsApp-Symbole auf dem Hintergrund anzeigen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showDoodles}
                    onChange={(e) => onUpdateSettings({ showDoodles: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Font Size Selector */}
                <div className="pt-2 border-t border-[#e9edef]">
                  <label className="block text-xs font-medium text-[#111b21] mb-2 flex items-center justify-between">
                    <span>Schriftgröße in Chats</span>
                    <span className="text-[11px] text-[#667781] uppercase font-semibold">
                      {settings.fontSize === 'small' ? 'Klein' : settings.fontSize === 'large' ? 'Groß' : 'Mittel'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-[#d1d7db]">
                    {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => onUpdateSettings({ fontSize: size })}
                        className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                          settings.fontSize === size
                            ? 'bg-[#008069] text-white shadow-xs font-semibold'
                            : 'text-[#54656f] hover:bg-gray-100'
                        }`}
                      >
                        {size === 'small' ? 'Klein' : size === 'large' ? 'Groß' : 'Standard'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enter to send */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Enter-Taste sendet Nachricht</span>
                    <span className="text-[10px] text-[#667781]">Umschalt + Enter für neuen Zeilenabsatz</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enterToSend}
                    onChange={(e) => onUpdateSettings({ enterToSend: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Media visibility */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Mediensichtbarkeit</span>
                    <span className="text-[10px] text-[#667781]">Neu empfangene Bilder im Vollbild-Modus anzeigen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mediaVisibility}
                    onChange={(e) => onUpdateSettings({ mediaVisibility: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= BENACHRICHTIGUNGEN & TÖNE ================= */}
          {(activeSection === 'all' || activeSection === 'notifications') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Benachrichtigungen & Töne
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Nachrichtentöne abspielen</span>
                    <span className="text-[10px] text-[#667781]">Akustischer Ton bei eingehenden Nachrichten</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Ton für gesendete Nachrichten</span>
                    <span className="text-[10px] text-[#667781]">Leiser Klick beim Absenden</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.outgoingSoundEnabled}
                    onChange={(e) => onUpdateSettings({ outgoingSoundEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Anrufklingelton</span>
                    <span className="text-[10px] text-[#667781]">Klingeln bei Sprach- und Videoanrufen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.callRingtoneEnabled}
                    onChange={(e) => onUpdateSettings({ callRingtoneEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Sound Melody selector with Preview Button */}
                <div className="pt-2 border-t border-[#e9edef] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-[#111b21]">
                      Benachrichtigungsmelodie
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTone(settings.messageSound || 'whatsapp', (settings.soundVolume ?? 100) / 100);
                      }}
                      className="text-[11px] text-[#008069] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Probe anhören</span>
                    </button>
                  </div>
                  <select
                    value={settings.messageSound}
                    onChange={(e) => {
                      const newSound = e.target.value as any;
                      onUpdateSettings({ messageSound: newSound });
                      sounds.playTone(newSound, (settings.soundVolume ?? 100) / 100);
                    }}
                    className="w-full text-xs p-2 rounded-xl border border-[#d1d7db] bg-white text-[#111b21] outline-none focus:border-[#008069]"
                  >
                    <option value="whatsapp">WhatsApp Standard (Doppelton)</option>
                    <option value="bloop">Bloop Glöckchen</option>
                    <option value="pop">Sanfter Klick</option>
                    <option value="chime">Chime Glasharmonie</option>
                  </select>
                </div>

                {/* Volume Slider */}
                <div className="pt-2 border-t border-[#e9edef] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111b21] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#008069]" />
                      Lautstärke für Web-Töne
                    </span>
                    <span className="text-[11px] font-semibold text-[#008069]">
                      {settings.soundVolume ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.soundVolume ?? 100}
                    onChange={(e) => {
                      const vol = parseInt(e.target.value, 10);
                      onUpdateSettings({ soundVolume: vol });
                    }}
                    className="w-full accent-[#008069] cursor-pointer"
                  />
                </div>

                {/* Externe Nachrichten Button (Mitteilungszentrale am Handy) */}
                <div className="pt-3 border-t border-[#e9edef]">
                  <button
                    type="button"
                    onClick={() => setIsExternalNotificationsOpen(true)}
                    className="w-full p-3 bg-white hover:bg-emerald-50/70 border border-[#008069]/30 hover:border-[#008069] rounded-xl text-left transition-all group cursor-pointer shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#008069] flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#111b21]">
                            Externe Nachrichten
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                            Handy-Anleitung
                          </span>
                        </div>
                        <p className="text-[10px] text-[#667781] mt-0.5">
                          Nachrichten im Handy-Sperrbildschirm & in der Mitteilungszentrale
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#667781] group-hover:text-[#008069] transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= DATENSCHUTZ & SICHERHEIT ================= */}
          {(activeSection === 'all' || activeSection === 'privacy') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Datenschutz & Sicherheit
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                {/* Read Receipts */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Lesebestätigungen (Blaue Häkchen)</span>
                    <span className="text-[10px] text-[#667781]">
                      Wenn deaktiviert, sendest und erhältst du keine blauen Häkchen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.readReceipts}
                    onChange={(e) => onUpdateSettings({ readReceipts: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Last seen */}
                <div className="pt-2 border-t border-[#e9edef] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Zuletzt online & Online</span>
                    <span className="text-[10px] text-[#667781]">Wer deinen Online-Status sehen kann</span>
                  </div>
                  <select
                    value={settings.privacyLastSeen}
                    onChange={(e) => onUpdateSettings({ privacyLastSeen: e.target.value as any })}
                    className="text-xs p-1.5 rounded-lg border border-[#d1d7db] bg-white text-[#111b21] outline-none"
                  >
                    <option value="everyone">Jeder</option>
                    <option value="nobody">Niemand</option>
                  </select>
                </div>

                {/* Profile photo */}
                <div className="pt-2 border-t border-[#e9edef] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Profilbild sichtbar</span>
                    <span className="text-[10px] text-[#667781]">Sichtbarkeit für andere Nutzer</span>
                  </div>
                  <select
                    value={settings.privacyProfilePhoto}
                    onChange={(e) => onUpdateSettings({ privacyProfilePhoto: e.target.value as any })}
                    className="text-xs p-1.5 rounded-lg border border-[#d1d7db] bg-white text-[#111b21] outline-none"
                  >
                    <option value="everyone">Jeder</option>
                    <option value="nobody">Niemand</option>
                  </select>
                </div>

                {/* Security Notifications */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Sicherheits-Benachrichtigungen</span>
                    <span className="text-[10px] text-[#667781]">
                      Benachrichtigen, wenn sich ein Sicherheitscode ändert
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.securityNotifications}
                    onChange={(e) => onUpdateSettings({ securityNotifications: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* WhatsApp Web Bildschirmsperre (Screen Lock) */}
                <div className="pt-3 border-t border-[#e9edef] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#111b21] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#008069]" />
                        WhatsApp Web Bildschirmsperre
                      </span>
                      <span className="text-[10px] text-[#667781] block">
                        Schützt deine Chats bei Inaktivität mit PIN oder Passwort
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.screenLockEnabled || false}
                      onChange={(e) => onUpdateSettings({ screenLockEnabled: e.target.checked })}
                      className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                    />
                  </div>

                  {settings.screenLockEnabled && (
                    <div className="bg-white p-3 rounded-xl border border-[#d1d7db] space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-medium text-[#111b21] mb-1">
                          Sperr-PIN oder Passwort
                        </label>
                        <input
                          type="text"
                          value={settings.screenLockPin || '1234'}
                          onChange={(e) => onUpdateSettings({ screenLockPin: e.target.value })}
                          placeholder="z. B. 1234"
                          className="w-full text-xs p-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] text-[#111b21] outline-none font-mono tracking-wider focus:border-[#008069]"
                        />
                        <span className="text-[10px] text-[#667781] block mt-0.5">
                          Standard-PIN ist 1234
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#111b21] mb-1">
                          Automatisch sperren nach
                        </label>
                        <select
                          value={settings.screenLockTimeoutMinutes ?? 15}
                          onChange={(e) =>
                            onUpdateSettings({ screenLockTimeoutMinutes: parseInt(e.target.value, 10) })
                          }
                          className="w-full text-xs p-2 rounded-lg border border-[#d1d7db] bg-[#f0f2f5] text-[#111b21] outline-none focus:border-[#008069]"
                        >
                          <option value={1}>Nach 1 Minute Inaktivität</option>
                          <option value={5}>Nach 5 Minuten Inaktivität</option>
                          <option value={15}>Nach 15 Minuten Inaktivität (Standard)</option>
                          <option value={60}>Nach 1 Stunde Inaktivität</option>
                          <option value={0}>Nur manuell sperren</option>
                        </select>
                      </div>

                      {onLockScreen && (
                        <button
                          type="button"
                          onClick={onLockScreen}
                          className="w-full py-2 bg-[#008069]/10 hover:bg-[#008069]/20 text-[#008069] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-[#008069]/30"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bildschirm jetzt sperren</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= KONTO & SITZUNG (LOCALSTORAGE) ================= */}
          {(activeSection === 'all' || activeSection === 'account') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Konto & Sitzung ({isIframe() ? 'iFrame Bridge / GitHub Pages' : 'localStorage'})
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-4 border border-[#d1d7db]/70">
                {/* Remember User in localStorage */}
                <div className="space-y-2">
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="pr-3">
                      <span className="text-xs font-medium text-[#111b21] block">
                        Angemeldet bleiben ({isIframe() ? 'im Host-Fenster speichern' : 'im localStorage speichern'})
                      </span>
                      <span className="text-[11px] text-[#667781] block mt-0.5 leading-relaxed">
                        {isIframe()
                          ? 'Speichert deine Sitzung sicher über das postMessage-Gegenstück auf der übergeordneten GitHub-Pages-Seite.'
                          : 'Speichert dein Benutzerkonto dauerhaft im Browser. Nach dem Schließen des Tabs oder Neustart bist du direkt wieder eingeloggt.'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.rememberUser}
                      onChange={(e) => onUpdateSettings({ rememberUser: e.target.checked })}
                      className="w-4 h-4 text-[#008069] rounded accent-[#008069] shrink-0 mt-0.5"
                    />
                  </label>

                  <div className="pt-1">
                    {settings.rememberUser ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#008069]/10 text-[#008069] border border-[#008069]/20">
                        <HardDrive className="w-3 h-3" />{' '}
                        {isIframe() ? 'Über GitHub-Pages (whatsnew.html) gesichert' : 'Im localStorage gespeichert'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-200 text-[#54656f] border border-gray-300">
                        Nur für die aktuelle Sitzung
                      </span>
                    )}
                  </div>
                </div>

                {/* Last Online on this device */}
                <div className="pt-3 border-t border-[#e9edef] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#111b21] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#008069]" />
                      Zuletzt online (auf diesem Gerät)
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#008069] bg-white px-2 py-0.5 rounded-md border border-[#d1d7db]">
                      <span className="w-2 h-2 rounded-full bg-[#008069] animate-pulse" />
                      Aktive Sitzung
                    </span>
                  </div>
                  <div className="text-xs text-[#111b21] bg-white p-2.5 rounded-xl border border-[#d1d7db] flex items-center justify-between">
                    <span className="text-[#54656f]">Zeitstempel im Speicher:</span>
                    <span className="font-semibold">
                      {lastOnlineTimestamp
                        ? new Date(lastOnlineTimestamp).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'Wird jetzt initialisiert'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#667781] leading-relaxed">
                    Dieser Zeitstempel wird automatisch im localStorage aktualisiert, um Inaktivität nachzuverfolgen.
                  </p>
                </div>

                {/* Session Timeout / Re-login after X days */}
                <div className="pt-3 border-t border-[#e9edef] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-[#111b21] block">
                        Erneute Anmeldung anfordern
                      </span>
                      <span className="text-[10px] text-[#667781]">
                        Nach wie vielen Tagen Inaktivität man sich erneut anmelden muss
                      </span>
                    </div>
                  </div>

                  {/* Dropdown presets */}
                  <select
                    value={
                      [0, 1, 3, 7, 14, 30, 90].includes(settings.sessionTimeoutDays)
                        ? settings.sessionTimeoutDays
                        : 'custom'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        const parsed = parseInt(customDaysInput || '7', 10);
                        onUpdateSettings({ sessionTimeoutDays: isNaN(parsed) ? 7 : parsed });
                      } else {
                        onUpdateSettings({ sessionTimeoutDays: parseInt(val, 10) });
                      }
                    }}
                    className="w-full text-xs p-2 rounded-xl border border-[#d1d7db] bg-white text-[#111b21] outline-none focus:border-[#008069]"
                  >
                    <option value={1}>Nach 1 Tag zuletzt online</option>
                    <option value={3}>Nach 3 Tagen zuletzt online</option>
                    <option value={7}>Nach 7 Tagen zuletzt online (1 Woche - Standard)</option>
                    <option value={14}>Nach 14 Tagen zuletzt online (2 Wochen)</option>
                    <option value={30}>Nach 30 Tagen zuletzt online (1 Monat)</option>
                    <option value={90}>Nach 90 Tagen zuletzt online (3 Monate)</option>
                    <option value={0}>Nie (Immer dauerhaft angemeldet bleiben)</option>
                    <option value="custom">Benutzerdefinierte Anzahl an Tagen...</option>
                  </select>

                  {/* Custom Days Input if selected or non-preset */}
                  {(![0, 1, 3, 7, 14, 30, 90].includes(settings.sessionTimeoutDays) ||
                    (![0, 1, 3, 7, 14, 30, 90].includes(parseInt(customDaysInput || '-1', 10)) &&
                      customDaysInput !== '')) && (
                    <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                      <span className="text-xs text-[#54656f] whitespace-nowrap">Tage:</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customDaysInput || settings.sessionTimeoutDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomDaysInput(val);
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0) {
                            onUpdateSettings({ sessionTimeoutDays: num });
                          }
                        }}
                        className="w-24 text-xs p-1.5 rounded-lg border border-[#008069] bg-white text-[#111b21] outline-none"
                        placeholder="z. B. 5"
                      />
                      <span className="text-xs text-[#667781]">Tage Inaktivitäts-Limit</span>
                    </div>
                  )}

                  {/* Clarification Info Box */}
                  <div className="bg-white p-3 rounded-xl border border-[#d1d7db] text-[11px] text-[#54656f] space-y-1">
                    <div className="font-semibold text-[#111b21] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#008069]" />
                      Sicherheits-Regel:
                    </div>
                    <p className="leading-relaxed">
                      {settings.sessionTimeoutDays === 0
                        ? 'Du bleibst unbegrenzt angemeldet, bis du dich manuell abmeldest.'
                        : `Wenn du WhatsApp länger als ${settings.sessionTimeoutDays} ${
                            settings.sessionTimeoutDays === 1 ? 'Tag' : 'Tage'
                          } auf diesem Gerät nicht nutzt, wird die Sitzung beendet und du musst dich aus Sicherheitsgründen erneut anmelden.`}
                    </p>
                  </div>
                </div>

                {/* Logout / Clear Session Storage Button */}
                {onLogout && (
                  <div className="pt-2 border-t border-[#e9edef]">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-rose-200"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Jetzt abmelden & Daten aus localStorage entfernen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= MEDIEN & SPEICHER ================= */}
          {(activeSection === 'all' || activeSection === 'storage') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Medien & Speicherverwaltung
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                <div className="text-xs font-semibold text-[#111b21] mb-1">
                  Automatischer Download von Medien
                </div>

                {/* Auto Download Photos */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Fotos automatisch laden</span>
                    <span className="text-[10px] text-[#667781]">
                      Empfangene Bilder sofort in Chats in voller Auflösung anzeigen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadPhotos ?? true}
                    onChange={(e) => onUpdateSettings({ autoDownloadPhotos: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Auto Download Audio */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Sprachnachrichten & Audio</span>
                    <span className="text-[10px] text-[#667781]">
                      Audionachrichten automatisch vorladen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadAudio ?? true}
                    onChange={(e) => onUpdateSettings({ autoDownloadAudio: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Auto Download Documents */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#e9edef]">
                  <div>
                    <span className="text-xs font-medium text-[#111b21] block">Dokumente & Videos</span>
                    <span className="text-[10px] text-[#667781]">
                      Dateianhänge und PDF-Dokumente automatisch synchronisieren
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadDocuments ?? false}
                    onChange={(e) => onUpdateSettings({ autoDownloadDocuments: e.target.checked })}
                    className="w-4 h-4 text-[#008069] rounded accent-[#008069]"
                  />
                </label>

                {/* Storage usage details */}
                <div className="pt-3 border-t border-[#e9edef] space-y-2">
                  <span className="text-xs font-medium text-[#111b21] block">Speichernutzung</span>
                  <div className="bg-white p-3 rounded-xl border border-[#d1d7db] space-y-1.5 text-xs text-[#54656f]">
                    <div className="flex justify-between">
                      <span>Chats & Textnachrichten:</span>
                      <span className="font-semibold text-[#111b21]">~ 1.8 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medien & Bilder-Cache:</span>
                      <span className="font-semibold text-[#111b21]">~ 4.2 MB</span>
                    </div>
                    <div className="flex justify-between border-t border-[#f0f2f5] pt-1 font-bold text-[#111b21]">
                      <span>Gesamt belegt:</span>
                      <span className="text-[#008069]">~ 6.0 MB</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Temporärer Medien-Cache wurde erfolgreich bereinigt.');
                    }}
                    className="w-full py-2 bg-white hover:bg-gray-50 text-[#54656f] text-xs font-medium rounded-xl border border-[#d1d7db] transition-colors"
                  >
                    Temporären Medien-Cache bereinigen
                  </button>
                </div>

                {/* Storage Data Integration per User Request (Admin controlled) */}
                {storageDataEnabled ? (
                  <div className="pt-3 border-t border-[#e9edef]">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenStorageData?.();
                      }}
                      className="w-full p-3 bg-white hover:bg-emerald-50/70 border border-[#008069]/40 hover:border-[#008069] rounded-xl text-left transition-all group cursor-pointer shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#008069] flex items-center justify-center shrink-0">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111b21]">
                              Detaillierte Speicherdaten
                            </span>
                            <span className="bg-[#008069] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              Freigegeben
                            </span>
                          </div>
                          <p className="text-[10px] text-[#667781] mt-0.5">
                            Aufschlüsselung nach Chats, Fotos, Videos & Dokumenten
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#667781] group-hover:text-[#008069] transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#e9edef]">
                    <div className="p-3 bg-white rounded-xl border border-[#d1d7db] text-xs text-[#54656f] flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-[#667781] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#111b21] block">
                          Detaillierte Speicherdaten
                        </span>
                        <span className="text-[10px] text-[#667781] block mt-0.5 leading-relaxed">
                          Standardmäßig deaktiviert. Der Administrator kann die detaillierte Speicherverwaltung im Admin-Bereich aktivieren.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ANRUFE & CLOUD / API ================= */}
          {(activeSection === 'all' || activeSection === 'chats') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Anrufe & Eigene Cloud / API
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                <p className="text-xs text-[#54656f] leading-relaxed">
                  Für Audio- und Videoanrufe nutzt WhatsApp deine eigene WebRTC-Cloud oder eigene API (LiveKit, Twilio, Agora oder eigene Server-URL).
                </p>

                <div className="bg-white p-3 rounded-xl border border-[#d1d7db] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#667781]">Provider:</span>
                    <span className="font-semibold text-[#111b21] flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#008069]" />
                      {callConfig?.provider === 'demo'
                        ? 'Demo WebRTC Cloud'
                        : callConfig?.provider === 'livekit'
                        ? 'LiveKit Cloud'
                        : callConfig?.provider === 'twilio'
                        ? 'Twilio Network'
                        : callConfig?.provider === 'agora'
                        ? 'Agora RTC'
                        : 'Eigene WebRTC Cloud'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#f0f2f5] pt-1.5">
                    <span className="text-[#667781]">Status:</span>
                    <span className="text-[11px] font-semibold text-[#008069] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {callConfig?.isConfigured ? 'Konfiguriert & Bereit' : 'Eigene Cloud aktiv'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCallConfig?.();
                  }}
                  className="w-full py-2 px-3 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Eigene Cloud / API anpassen</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= META AI ================= */}
          {(activeSection === 'all' || activeSection === 'chats') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Meta AI Assistent
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#667781]">Status:</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    metaAiConfig?.mode === 'disabled'
                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-emerald-50 text-[#008069] border-emerald-200'
                  }`}>
                    {metaAiConfig?.mode === 'disabled'
                      ? 'Standardmäßig deaktiviert'
                      : metaAiConfig?.mode === 'enabled_user_key'
                      ? 'Aktiv (Eigener API-Key)'
                      : 'Aktiv & Frei nutzbar'}
                  </span>
                </div>

                {metaAiConfig?.mode !== 'disabled' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMetaAI?.();
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Meta AI öffnen</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-[#667781] leading-relaxed">
                    Meta AI ist standardmäßig deaktiviert. Der Administrator kann Meta AI im Admin-Bereich freischalten oder festlegen, dass Nutzer ihren eigenen API-Schlüssel verwenden.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= TASTATURKÜRZEL & HILFE ================= */}
          {(activeSection === 'all' || activeSection === 'shortcuts') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#008069]" />
                <h4 className="text-xs font-bold text-[#111b21] uppercase tracking-wide">
                  Tastaturkürzel & Hilfe
                </h4>
              </div>

              <div className="bg-[#f0f2f5] p-4 rounded-2xl space-y-3 border border-[#d1d7db]/70">
                <p className="text-xs text-[#54656f] leading-relaxed">
                  Mit Tastenkombinationen bedienst du WhatsApp Web viel schneller, ganz ohne Maus.
                </p>

                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-[#d1d7db] text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f2f5]">
                    <span className="text-[#54656f]">Neuer Chat</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f0f2f5] border text-[11px] font-mono">Strg + Alt + N</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f2f5]">
                    <span className="text-[#54656f]">Chats durchsuchen</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f0f2f5] border text-[11px] font-mono">Strg + Alt + F</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#f0f2f5]">
                    <span className="text-[#54656f]">Bildschirm sperren</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f0f2f5] border text-[11px] font-mono">Strg + Alt + L</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#54656f]">Emoji-Auswahl</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f0f2f5] border text-[11px] font-mono">Strg + Alt + E</kbd>
                  </div>
                </div>

                {onOpenShortcuts && (
                  <button
                    type="button"
                    onClick={onOpenShortcuts}
                    className="w-full py-2 bg-[#008069] hover:bg-[#00705a] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Alle Tastaturkurzbefehle anzeigen</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Encryption Note */}
          <div className="p-3.5 rounded-2xl bg-[#efeae2]/70 text-[#54656f] text-xs flex items-start gap-3 border border-[#d1d7db]/60">
            <Lock className="w-4 h-4 text-[#008069] shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Deine persönlichen Chats und Anrufe sind durch Ende-zu-Ende-Verschlüsselung geschützt. Niemand außerhalb dieses Chats kann sie mitlesen.
            </p>
          </div>
        </div>
      </div>

      {/* External Notifications Step-by-Step Guide Modal */}
      <ExternalNotificationsModal
        isOpen={isExternalNotificationsOpen}
        onClose={() => setIsExternalNotificationsOpen(false)}
        isAdmin={isAdmin}
        onOpenAdminEditor={() => {
          setIsExternalNotificationsOpen(false);
          if (onOpenAdminPanel) {
            onOpenAdminPanel();
          }
        }}
      />
    </div>
  );
};
