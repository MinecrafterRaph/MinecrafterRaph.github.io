import React from 'react';
import { User, Users, Globe, ShieldCheck, MessageCircle, Star, Sparkles, Hash, Coffee, Gamepad2, Megaphone } from 'lucide-react';

export type WhatsAppIconVariant =
  | 'classic' // Iconic WhatsApp grey circle with white silhouette (#dfe5e7)
  | 'emerald' // WhatsApp official dark green (#008069)
  | 'teal' // WhatsApp bright teal (#00a884)
  | 'blue' // WhatsApp ocean blue (#0284c7)
  | 'purple' // WhatsApp royal purple (#7c3aed)
  | 'rose' // WhatsApp rose / coral (#e11d48)
  | 'amber' // WhatsApp warm amber (#d97706)
  | 'indigo' // WhatsApp deep indigo (#4f46e5)
  | 'group' // WhatsApp group silhouette icon
  | 'globe' // WhatsApp community / global chat icon
  | 'admin' // WhatsApp verified admin shield / chat badge
  | 'initials' // Deterministic colorful initials
  | 'auto'; // Automatically determine from name and flags

interface WhatsAppAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  isGroup?: boolean;
  isGlobal?: boolean;
  isAdmin?: boolean;
  variant?: WhatsAppIconVariant | string;
  className?: string;
  showOnlineBadge?: boolean;
  isOnline?: boolean;
}

const SIZE_MAP: Record<string, { container: string; icon: string; text: string; badge: string; px: number }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-[10px]', badge: 'w-2 h-2', px: 24 },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs', badge: 'w-2.5 h-2.5', px: 32 },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm font-semibold', badge: 'w-3 h-3', px: 40 },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-base font-semibold', badge: 'w-3.5 h-3.5', px: 48 },
  xl: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xl font-bold', badge: 'w-4 h-4', px: 64 },
  '2xl': { container: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-3xl font-bold', badge: 'w-5 h-5', px: 96 },
};

// Deterministic WhatsApp palette for contacts without custom icon
const WHATSAPP_COLOR_PALETTE = [
  { bg: 'bg-[#00a884]', text: 'text-white' }, // Teal
  { bg: 'bg-[#008069]', text: 'text-white' }, // Emerald
  { bg: 'bg-[#0284c7]', text: 'text-white' }, // Ocean Blue
  { bg: 'bg-[#7c3aed]', text: 'text-white' }, // Purple
  { bg: 'bg-[#e11d48]', text: 'text-white' }, // Coral / Rose
  { bg: 'bg-[#d97706]', text: 'text-white' }, // Amber
  { bg: 'bg-[#4f46e5]', text: 'text-white' }, // Indigo
  { bg: 'bg-[#059669]', text: 'text-white' }, // Forest Green
  { bg: 'bg-[#0891b2]', text: 'text-white' }, // Cyan
  { bg: 'bg-[#475569]', text: 'text-white' }, // Slate
];

// Helper to hash string deterministically
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const WhatsAppAvatar: React.FC<WhatsAppAvatarProps> = ({
  name = '',
  avatarUrl = '',
  size = 'md',
  isGroup = false,
  isGlobal = false,
  isAdmin = false,
  variant = 'auto',
  className = '',
  showOnlineBadge = false,
  isOnline = false,
}) => {
  const sizeConfig = typeof size === 'string' ? SIZE_MAP[size] || SIZE_MAP.md : {
    container: '',
    icon: '',
    text: 'text-base font-semibold',
    badge: 'w-3 h-3',
    px: size,
  };

  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {};

  // Check if name or avatarUrl indicates WhatsApp Admin / System account
  const isWhatsAppAdminAccount =
    isAdmin ||
    name.toLowerCase() === 'whatsapp' ||
    name.toLowerCase().includes('administrator') ||
    avatarUrl.includes('whatsapp') ||
    avatarUrl === 'icon:admin';

  // Determine which icon or visual to render
  let effectiveVariant: string = variant;

  if (effectiveVariant === 'auto') {
    if (avatarUrl?.startsWith('icon:')) {
      effectiveVariant = avatarUrl.replace('icon:', '') as WhatsAppIconVariant;
    } else if (isWhatsAppAdminAccount) {
      effectiveVariant = 'admin';
    } else if (isGlobal || avatarUrl === 'icon:globe' || name.toLowerCase() === 'alle') {
      effectiveVariant = 'globe';
    } else if (isGroup || avatarUrl === 'icon:group') {
      effectiveVariant = 'group';
    } else {
      // Default WhatsApp icon system:
      // Can be classic grey silhouette OR colorful WhatsApp icon based on name
      effectiveVariant = 'classic';
    }
  }

  // Generate 1-2 uppercase initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'W';

  // Color selection
  const colorIndex = hashString(name || 'user') % WHATSAPP_COLOR_PALETTE.length;
  const pickedColor = WHATSAPP_COLOR_PALETTE[colorIndex];

  // Render content according to WhatsApp Icon Variant
  let content = null;
  let bgClasses = 'bg-[#dfe5e7] text-[#ffffff]'; // Iconic WhatsApp default contact grey

  switch (effectiveVariant) {
    case 'admin':
      bgClasses = 'bg-[#008069] text-white shadow-xs';
      content = <MessageCircle className={`${sizeConfig.icon} fill-white text-white`} />;
      break;

    case 'globe':
      bgClasses = 'bg-[#008069] text-white shadow-xs';
      content = <Globe className={`${sizeConfig.icon}`} />;
      break;

    case 'group':
      bgClasses = 'bg-[#00a884]/90 text-white shadow-xs';
      content = <Users className={`${sizeConfig.icon} fill-white/80`} />;
      break;

    case 'emerald':
      bgClasses = 'bg-[#008069] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'teal':
      bgClasses = 'bg-[#00a884] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'blue':
      bgClasses = 'bg-[#0284c7] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'purple':
      bgClasses = 'bg-[#7c3aed] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'rose':
      bgClasses = 'bg-[#e11d48] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'amber':
      bgClasses = 'bg-[#d97706] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'indigo':
      bgClasses = 'bg-[#4f46e5] text-white';
      content = <User className={`${sizeConfig.icon} fill-white`} />;
      break;

    case 'initials':
      bgClasses = `${pickedColor.bg} ${pickedColor.text}`;
      content = <span className={`${sizeConfig.text} select-none leading-none`}>{initials}</span>;
      break;

    case 'classic':
    default:
      // The authentic WhatsApp default silhouette:
      // A soft neutral circular background with the clean white WhatsApp person silhouette
      bgClasses = 'bg-[#cfd9de] text-white';
      content = (
        <svg
          viewBox="0 0 24 24"
          className={`${sizeConfig.icon} fill-white shrink-0 drop-shadow-xs`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
      break;
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-hidden transition-all duration-150 ${sizeConfig.container} ${bgClasses} ${className}`}
      style={customStyle}
      title={name || 'WhatsApp Benutzer'}
    >
      {content}

      {/* Online indicator badge if requested */}
      {showOnlineBadge && isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-[#25d366] border-2 border-white ${sizeConfig.badge}`}
        />
      )}
    </div>
  );
};
