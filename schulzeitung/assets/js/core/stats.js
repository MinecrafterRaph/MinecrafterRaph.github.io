import { LS_KEYS, readJson, writeJson } from "./storage.js";

const defaultStats = {
  pageViews: {},
  articleViews: {},
  lastVisit: null,
};

export function getStats() {
  return { ...defaultStats, ...readJson(LS_KEYS.STATS, {}) };
}

export function saveStats(s) {
  writeJson(LS_KEYS.STATS, s);
}

export function trackPageView(path) {
  const s = getStats();
  s.pageViews[path] = (s.pageViews[path] || 0) + 1;
  s.lastVisit = new Date().toISOString();
  saveStats(s);
}

export function trackArticleView(articleId) {
  const s = getStats();
  s.articleViews[articleId] = (s.articleViews[articleId] || 0) + 1;
  saveStats(s);
}
