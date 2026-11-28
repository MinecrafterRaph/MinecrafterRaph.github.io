import React from 'react';
import {
  MessageSquare,
  CircleDashed,
  Radio,
  Users2,
  Phone,
  Archive,
  Star,
  Laptop,
  Settings,
} from 'lucide-react';
import { User } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

export type ActiveNavTab = 'chats' | 'status' | 'channels' | 'calls' | 'archived';

interface NavigationRailProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  currentUser: User | null;
  unreadChatsCount: number;
  archivedChatsCount: number;
  hasUnviewedStories: boolean;
  missedCallsCount?: number;
  onOpenSettings: () => void;
  onOpenStarredMessages: () => void;
  onOpenLinkedDevices: () => void;
  onOpenProfile: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  unreadChatsCount,
  archivedChatsCount,
  hasUnviewedStories,
  missedCallsCount = 0,
  onOpenSettings,
  onOpenStarredMessages,
  onOpenLinkedDevices,
  onOpenProfile,
}) => {
  const navItems: {
    id: ActiveNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | boolean;
    badgeColor?: string;
  }[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
      badgeColor: 'bg-[#25d366]',
    },
    {
      id: 'status',
      label: 'Status',
      icon: CircleDashed,
      badge: hasUnviewedStories,
      badgeColor: 'bg-[#00a884]',
    },
    {
      id: 'channels',
      label: 'Aktuelles & Updates',
      icon: Radio,
    },
    {
      id: 'calls',
      label: 'Anrufe',
      icon: Phone,
      badge: missedCallsCount > 0 ? missedCallsCount : undefined,
      badgeColor: 'bg-[#ea0038]',
    },
    {
      id: 'archived',
      label: 'Archiviert',
      icon: Archive,
      badge: archivedChatsCount > 0 ? archivedChatsCount : undefined,
      badgeColor: 'bg-[#54656f]',
    },
  ];

  return (
    <nav
      aria-label="WhatsApp Navigation"
      className="w-15 md:w-16 bg-[#f0f2f5] border-r border-[#d1d7db] flex flex-col items-center justify-between py-3 select-none shrink-0 z-20"
    >
      {/* Top Primary Tabs */}
      <div className="flex flex-col items-center gap-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`relative group w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#d9fdd3] text-[#008069] shadow-2xs font-semibold'
                  : 'text-[#54656f] hover:bg-black/5 hover:text-[#111b21]'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'stroke-[2.5px]' : 'stroke-2'
                }`}
              />

              {/* Active Indicator Bar on left edge */}
              {isActive && (
                <span className="absolute -left-2.5 md:-left-3 top-2 bottom-2 w-1 bg-[#008069] rounded-r-full" />
              )}

              {/* Badge (count or dot) */}
              {item.badge !== undefined && (
                <span
                  className={`absolute -top-0.5 -right-0.5 ${
                    typeof item.badge === 'number'
                      ? 'min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white flex items-center justify-center rounded-full'
                      : 'w-2.5 h-2.5 rounded-full ring-2 ring-[#f0f2f5]'
                  } ${item.badgeColor || 'bg-[#25d366]'}`}
                >
                  {typeof item.badge === 'number' ? item.badge : ''}
                </span>
              )}

              {/* Tooltip on hover */}
              <span className="absolute left-14 bg-[#111b21] text-white text-xs font-normal px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Items */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#d1d7db]/60">
        {/* Starred Messages */}
        <button
          type="button"
          onClick={onOpenStarredMessages}
          title="Mit Stern markiert"
          className="relative group w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[#54656f] hover:bg-black/5 hover:text-[#111b21] transition-all"
        >
          <Star className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute left-14 bg-[#111b21] text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Mit Stern markiert
          </span>
        </button>

        {/* Linked Devices */}
        <button
          type="button"
          onClick={onOpenLinkedDevices}
          title="Verknüpfte Geräte"
          className="relative group w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[#54656f] hover:bg-black/5 hover:text-[#111b21] transition-all"
        >
          <Laptop className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute left-14 bg-[#111b21] text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Verknüpfte Geräte
          </span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Einstellungen"
          className="relative group w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[#54656f] hover:bg-black/5 hover:text-[#111b21] transition-all"
        >
          <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute left-14 bg-[#111b21] text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Einstellungen
          </span>
        </button>

        {/* User Profile */}
        <button
          type="button"
          onClick={onOpenProfile}
          title={`Profil: ${currentUser?.name || 'Ich'}`}
          className="relative group mt-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#00a884] transition-all"
        >
          <WhatsAppAvatar
            avatarUrl={currentUser?.avatar}
            size="sm"
          />
          <span className="absolute left-14 bg-[#111b21] text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Profil ({currentUser?.name})
          </span>
        </button>
      </div>
    </nav>
  );
};
