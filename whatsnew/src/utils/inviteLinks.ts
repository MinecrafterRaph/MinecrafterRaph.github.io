export interface ParsedInvite {
  type: 'chat' | 'channel';
  id: string;
  url: string;
  matchText: string;
}

export const GITHUB_PAGES_BASE = 'https://minecrafterraph.github.io/whatsnew.html';

export const getChatInviteLink = (chatId: string): string => {
  return `https://chat.whatsapp.com/invite/${chatId}`;
};

export const getChannelInviteLink = (channelId: string): string => {
  return `${GITHUB_PAGES_BASE}/channel/${channelId}`;
};

// Regex patterns for WhatsApp and WhatsNew invite links
const GITHUB_CHANNEL_REGEX =
  /https?:\/\/minecrafterraph\.github\.io\/whatsnew(?:\.html)?\/channel\/([a-zA-Z0-9_\-]+)/i;
const GITHUB_PARAM_CHANNEL_REGEX =
  /https?:\/\/minecrafterraph\.github\.io\/whatsnew(?:\.html)?\?(?:.*&)?channel=([a-zA-Z0-9_\-]+)/i;
const CHANNEL_REGEX =
  /https?:\/\/(?:www\.)?(?:chat\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_\-]+)/i;
const CHAT_INVITE_REGEX =
  /https?:\/\/chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_\-]+)/i;
const GENERAL_CHAT_REGEX =
  /https?:\/\/(?:www\.)?whatsapp\.com\/chat\/([a-zA-Z0-9_\-]+)/i;

export const parseInviteLink = (text: string): ParsedInvite | null => {
  if (!text) return null;

  // 1. GitHub Pages Channel Invite Link (https://minecrafterraph.github.io/whatsnew.html/channel/[channelid])
  const ghChannelMatch = text.match(GITHUB_CHANNEL_REGEX);
  if (ghChannelMatch) {
    return {
      type: 'channel',
      id: ghChannelMatch[1],
      url: ghChannelMatch[0],
      matchText: ghChannelMatch[0],
    };
  }

  const ghParamMatch = text.match(GITHUB_PARAM_CHANNEL_REGEX);
  if (ghParamMatch) {
    return {
      type: 'channel',
      id: ghParamMatch[1],
      url: ghParamMatch[0],
      matchText: ghParamMatch[0],
    };
  }

  // 2. Standard Channel Invite Link
  const channelMatch = text.match(CHANNEL_REGEX);
  if (channelMatch) {
    return {
      type: 'channel',
      id: channelMatch[1],
      url: channelMatch[0],
      matchText: channelMatch[0],
    };
  }

  // 2. Chat / Group Invite Link
  const chatMatch = text.match(CHAT_INVITE_REGEX);
  if (chatMatch) {
    // Avoid matching if it was channel
    if (chatMatch[1].toLowerCase() === 'channel') return null;
    return {
      type: 'chat',
      id: chatMatch[1],
      url: chatMatch[0],
      matchText: chatMatch[0],
    };
  }

  // 3. Alternative WhatsApp Chat Link
  const altChatMatch = text.match(GENERAL_CHAT_REGEX);
  if (altChatMatch) {
    return {
      type: 'chat',
      id: altChatMatch[1],
      url: altChatMatch[0],
      matchText: altChatMatch[0],
    };
  }

  return null;
};
