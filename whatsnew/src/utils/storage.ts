/**
 * storage.ts
 *
 * Hybrid Storage Wrapper for WhatsNew (my-whatsapp.ai.studio)
 * Target host: https://minecrafterraph.github.io/whatsnew.html
 *
 * Supports:
 * 1. Direct Mode: standard native localStorage (getItem, setItem, removeItem)
 * 2. iFrame Mode (e.g. embedded on GitHub Pages: https://minecrafterraph.github.io/whatsnew.html):
 *    Sends & receives postMessage events to/from window.parent:
 *    - Save:   { type: 'LOCAL_STORAGE_SET', key, value }
 *    - Load:   { type: 'LOCAL_STORAGE_GET', key }
 *      <- Response: { type: 'LOCAL_STORAGE_RESPONSE', key, value }
 *    - Delete: { type: 'LOCAL_STORAGE_REMOVE', key }
 */

export const GITHUB_PAGES_URL = 'https://minecrafterraph.github.io/whatsnew.html';
export const GITHUB_PAGES_ORIGIN = 'https://minecrafterraph.github.io';

// In-memory fallback cache to allow synchronous access and faster lookups
const memoryCache = new Map<string, string>();

/**
 * 1. Automatically detects whether the app runs inside an iFrame or directly.
 */
export function isIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // If accessing window.top throws a SecurityError (cross-origin iframe), we are definitely in an iframe
    return true;
  }
}

/**
 * Safe helper to read from native localStorage without crashing in restricted environments.
 */
function getLocalItemSafe(key: string): string | null {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/**
 * Safe helper to write to native localStorage.
 */
function setLocalItemSafe(key: string, value: string): void {
  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore restricted storage exceptions
  }
}

/**
 * Safe helper to remove from native localStorage.
 */
function removeLocalItemSafe(key: string): void {
  try {
    if (window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore restricted storage exceptions
  }
}

/**
 * 2. Save data (saveData)
 * Supports string, object, number, boolean.
 * - In direct mode: saves to localStorage.
 * - In iFrame mode: sends LOCAL_STORAGE_SET to window.parent and caches locally.
 */
export async function saveData(key: string, value: any): Promise<void> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  // Always update memory cache for instant availability
  memoryCache.set(key, stringValue);

  if (isIframe()) {
    // Also try local storage safely in case it is permitted
    setLocalItemSafe(key, stringValue);

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'LOCAL_STORAGE_SET',
            key,
            value: stringValue,
          },
          '*'
        );
      }
    } catch (err) {
      console.error('Error posting LOCAL_STORAGE_SET to parent:', err);
    }
  } else {
    setLocalItemSafe(key, stringValue);
  }
}

/**
 * 3. Load data (getData)
 * Returns a Promise resolving to string | null.
 * - In direct mode: reads directly from localStorage.
 * - In iFrame mode: asks window.parent via LOCAL_STORAGE_GET and waits for LOCAL_STORAGE_RESPONSE.
 */
export function getData(key: string, timeoutMs = 2500): Promise<string | null> {
  // If not in iframe, read directly from native localStorage
  if (!isIframe()) {
    const val = getLocalItemSafe(key) ?? memoryCache.get(key) ?? null;
    return Promise.resolve(val);
  }

  // In iFrame mode: send LOCAL_STORAGE_GET to parent and await LOCAL_STORAGE_RESPONSE
  return new Promise<string | null>((resolve) => {
    let settled = false;

    // Timeout fallback if parent does not respond in time
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener('message', messageListener);
        // Fallback to memory cache or local item
        const fallback = memoryCache.get(key) ?? getLocalItemSafe(key) ?? null;
        resolve(fallback);
      }
    }, timeoutMs);

    function messageListener(event: MessageEvent) {
      let data = event.data;

      // Some wrappers serialize data as a JSON string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // not JSON string
        }
      }

      if (
        data &&
        typeof data === 'object' &&
        data.type === 'LOCAL_STORAGE_RESPONSE' &&
        data.key === key
      ) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          window.removeEventListener('message', messageListener);

          const rawVal = data.value;
          const finalVal =
            rawVal !== undefined && rawVal !== null ? String(rawVal) : null;

          if (finalVal !== null) {
            memoryCache.set(key, finalVal);
          } else {
            memoryCache.delete(key);
          }

          resolve(finalVal);
        }
      }
    }

    window.addEventListener('message', messageListener);

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'LOCAL_STORAGE_GET',
            key,
          },
          '*'
        );
      } else {
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', messageListener);
        resolve(memoryCache.get(key) ?? getLocalItemSafe(key) ?? null);
      }
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', messageListener);
        resolve(memoryCache.get(key) ?? getLocalItemSafe(key) ?? null);
      }
    }
  });
}

/**
 * 4. Delete data (deleteData)
 * - In direct mode: removes from localStorage.
 * - In iFrame mode: sends LOCAL_STORAGE_REMOVE to window.parent and clears memory.
 */
export async function deleteData(key: string): Promise<void> {
  memoryCache.delete(key);
  removeLocalItemSafe(key);

  if (isIframe()) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'LOCAL_STORAGE_REMOVE',
            key,
          },
          '*'
        );
      }
    } catch (err) {
      console.error('Error posting LOCAL_STORAGE_REMOVE to parent:', err);
    }
  }
}

/**
 * Synchronous read helper (returns from memory cache or safe localStorage read).
 * Useful for initial sync React state before async hydration completes.
 */
export function getDataSync(key: string): string | null {
  return memoryCache.get(key) ?? getLocalItemSafe(key) ?? null;
}

// Attach to global window for testing or console access
if (typeof window !== 'undefined') {
  (window as any).myWhatsAppStorage = {
    isIframe,
    saveData,
    getData,
    deleteData,
    getDataSync,
  };
}
