/**
 * Zentrale LocalStorage-Schlüssel und Hilfsfunktionen.
 */
export const LS_KEYS = {
  USERS: "sz_users",
  SESSION: "sz_session",
  ARTICLES_OVERRIDE: "sz_articles_override",
  EDITIONS_OVERRIDE: "sz_editions_override",
  SITE_CONTENT: "sz_site_content",
  PENDING_ADS: "sz_pending_ads",
  PENDING_CONTRIBUTIONS: "sz_pending_contributions",
  COMMENTS: "sz_comments",
  POLLS: "sz_polls",
  STATS: "sz_stats",
  ADS_OVERRIDE: "sz_ads_override",
  SEED_DONE: "sz_seed_done",
  ADMIN_UNLOCK: "sz_admin_unlock",
  VERSION_LOG: "sz_article_version_log",
  WORKFLOW_ITEMS: "sz_workflow_items",
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key) {
  localStorage.removeItem(key);
}
