import { isIframe, saveData, getData } from './storage';

export const PENDING_CHANNEL_INVITE_KEY = 'pending_channel_invite';

/**
 * Parses channel ID from the current window's URL if passed directly or via iframe src.
 * Supports formats:
 * - https://.../channel/[channelId]
 * - https://...?channel=[channelId]
 * - https://...?invite=[channelId]
 * - https://...#channel=[channelId]
 * - https://...#/channel/[channelId]
 */
export function detectUrlChannelInvite(): string | null {
  try {
    if (typeof window === 'undefined') return null;

    // 1. Pathname check: /channel/[channelId]
    const pathMatch = window.location.pathname.match(/\/channel\/([a-zA-Z0-9_\-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // 2. Query search parameter check: ?channel=... or ?channelId=... or ?invite=...
    const searchParams = new URLSearchParams(window.location.search);
    const channelParam =
      searchParams.get('channel') ||
      searchParams.get('channelId') ||
      searchParams.get('invite');
    if (channelParam && channelParam.trim()) {
      return channelParam.trim();
    }

    // 3. Hash parameter check: #channel=... or #/channel/...
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/(?:channel|invite)[=/]([a-zA-Z0-9_\-]+)/i);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1];
    }
  } catch (err) {
    console.error('Error detecting URL channel invite:', err);
  }
  return null;
}

/**
 * Requests the current invite channel from the parent window if running inside an iframe.
 * The GitHub Pages host (whatsnew.html) receives:
 * { type: 'GET_INVITE_CHANNEL' } and { type: 'GET_CHANNEL_INVITE' }
 */
export function requestChannelInviteFromParent(): void {
  if (!isIframe()) return;

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GET_INVITE_CHANNEL' }, '*');
      window.parent.postMessage({ type: 'GET_CHANNEL_INVITE' }, '*');
      window.parent.postMessage(
        { type: 'LOCAL_STORAGE_GET', key: PENDING_CHANNEL_INVITE_KEY },
        '*'
      );
    }
  } catch (err) {
    console.error('Error requesting channel invite from parent:', err);
  }
}

/**
 * Subscribes to incoming postMessage events from the parent window.
 * Catches message formats:
 * - { type: 'CHANNEL_INVITE', channelId: '...' }
 * - { type: 'INVITE_CHANNEL', channelId: '...' }
 * - { type: 'CHANNEL_INVITE_RESPONSE', channelId: '...' }
 * - { type: 'OPEN_CHANNEL', channelId: '...' }
 * - { type: 'LOCAL_STORAGE_RESPONSE', key: 'pending_channel_invite', value: '...' }
 */
export function listenForChannelInvites(
  onInvite: (channelId: string) => void
): () => void {
  function handleMessage(event: MessageEvent) {
    try {
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // not json string
        }
      }

      if (!data || typeof data !== 'object') return;

      // 1. Direct channel invite message types
      const directTypes = [
        'CHANNEL_INVITE',
        'INVITE_CHANNEL',
        'CHANNEL_INVITE_RESPONSE',
        'OPEN_CHANNEL',
      ];
      if (directTypes.includes(data.type)) {
        const id = data.channelId || data.id || data.value;
        if (id && typeof id === 'string' && id.trim()) {
          onInvite(id.trim());
          return;
        }
      }

      // 2. Local storage response for pending_channel_invite
      if (
        data.type === 'LOCAL_STORAGE_RESPONSE' &&
        data.key === PENDING_CHANNEL_INVITE_KEY &&
        data.value
      ) {
        const id = String(data.value).trim();
        if (id) {
          onInvite(id);
        }
      }
    } catch (err) {
      console.error('Error processing postMessage channel invite:', err);
    }
  }

  window.addEventListener('message', handleMessage);
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Saves pending channel invite for when the user is not yet logged in.
 */
export async function savePendingChannelInvite(channelId: string): Promise<void> {
  await saveData(PENDING_CHANNEL_INVITE_KEY, channelId);
}

/**
 * Loads pending channel invite from storage.
 */
export async function getPendingChannelInvite(): Promise<string | null> {
  return await getData(PENDING_CHANNEL_INVITE_KEY);
}

/**
 * Clears pending channel invite once handled.
 */
export async function clearPendingChannelInvite(): Promise<void> {
  await saveData(PENDING_CHANNEL_INVITE_KEY, '');
}
