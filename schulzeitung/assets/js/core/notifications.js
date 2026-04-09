const NOTICE_KEY = "sz_site_notice";
const NOTICE_SIGNAL_KEY = "sz_site_notice_signal";

export function getSiteNotice() {
  try {
    return JSON.parse(localStorage.getItem(NOTICE_KEY) || "null");
  } catch {
    return null;
  }
}

export function publishSiteNotice(message) {
  const text = String(message || "").trim();
  if (!text) return null;
  const payload = {
    id: `notice-${Date.now()}`,
    message: text,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(NOTICE_KEY, JSON.stringify(payload));
  localStorage.setItem(NOTICE_SIGNAL_KEY, String(Date.now()));
  return payload;
}

export function clearSiteNotice() {
  localStorage.removeItem(NOTICE_KEY);
  localStorage.setItem(NOTICE_SIGNAL_KEY, String(Date.now()));
}

export function onNoticeSignal(handler) {
  function listener(event) {
    if (event.key === NOTICE_SIGNAL_KEY || event.key === NOTICE_KEY) {
      handler(getSiteNotice());
    }
  }
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
