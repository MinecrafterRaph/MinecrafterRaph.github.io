import React, { useState } from 'react';
import {
  Users,
  Radio,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { ParsedInvite } from '../utils/inviteLinks';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface WhatsAppInviteCardProps {
  invite: ParsedInvite;
  onNavigateToChat?: (chatId: string) => void;
  onNavigateToChannel?: (channelId: string) => void;
}

export const WhatsAppInviteCard: React.FC<WhatsAppInviteCardProps> = ({
  invite,
  onNavigateToChat,
  onNavigateToChannel,
}) => {
  const [copied, setCopied] = useState(false);

  const isChannel = invite.type === 'channel';
  const isGlobalChat = invite.id === 'chat_global_all' || invite.id.toLowerCase() === 'alle';

  // Derived Title & Details
  let title = isChannel
    ? 'WhatsApp'
    : isGlobalChat
    ? 'Alle (Community Chat)'
    : `Gruppe ${invite.id.replace('chat_', '').slice(0, 10)}`;

  let subtitle = isChannel
    ? 'Offizieller WhatsApp-Kanal • 154 Mio. Abonnenten'
    : isGlobalChat
    ? 'Öffentliche Gruppe • Alle registrierten Nutzer'
    : 'WhatsApp-Gruppe • Einladung via Link';

  let description = isChannel
    ? 'Offizielle Produkt-Neuigkeiten, Ankündigungen und Feature-Updates direkt vom WhatsApp Team.'
    : isGlobalChat
    ? 'Tritt dem Hauptchat bei, um mit der gesamten Community in Echtzeit zu schreiben.'
    : 'Du wurdest eingeladen, dieser WhatsApp-Gruppe beizutreten.';

  let avatarIcon = isChannel ? 'icon:admin' : isGlobalChat ? 'icon:globe' : 'icon:group';

  const handleAction = () => {
    if (isChannel) {
      if (onNavigateToChannel) {
        onNavigateToChannel(invite.id);
      }
    } else {
      if (onNavigateToChat) {
        const targetChatId = isGlobalChat ? 'chat_global_all' : invite.id;
        onNavigateToChat(targetChatId);
      }
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 max-w-[340px] sm:max-w-[380px] bg-white rounded-xl border border-[#d1d7db] shadow-sm overflow-hidden text-[#111b21] select-none hover:border-[#00a884] transition-all">
      {/* WhatsApp Invite Card Header */}
      <div className="bg-[#008069] text-white px-3.5 py-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wide">
        <div className="flex items-center gap-1.5">
          {isChannel ? (
            <Radio className="w-3.5 h-3.5 text-white" />
          ) : (
            <Users className="w-3.5 h-3.5 text-white" />
          )}
          <span>{isChannel ? 'WhatsApp-Kanal' : 'WhatsApp-Gruppeneinladung'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className="hover:text-emerald-100 flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
          title="Link kopieren"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>Kopiert</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Link</span>
            </>
          )}
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <WhatsAppAvatar
              avatarKey={avatarIcon}
              name={title}
              size="md"
              className="rounded-full shadow-xs border border-black/5"
            />
            {isChannel && (
              <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884] fill-[#00a884] text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-[#111b21] truncate flex items-center gap-1">
              <span>{title}</span>
            </h4>
            <p className="text-[11px] font-medium text-[#008069] mt-0.5 truncate">
              {subtitle}
            </p>
            <p className="text-xs text-[#54656f] mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-2.5 border-t border-[#f0f2f5] flex items-center gap-2">
          <button
            type="button"
            onClick={handleAction}
            className="flex-1 py-2 px-3 bg-[#008069] hover:bg-[#00a884] active:bg-[#00705a] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <span>{isChannel ? 'Kanal ansehen & abonnieren' : 'Gruppe beitreten'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
