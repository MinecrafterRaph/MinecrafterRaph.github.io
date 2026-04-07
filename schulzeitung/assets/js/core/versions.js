/**
 * Artikel-Versionierung: Snapshot vor jeder speicherbaren Änderung.
 */
import { LS_KEYS, readJson, writeJson } from "./storage.js";

export function logArticleVersion(articleId, snapshot, note = "") {
  const log = readJson(LS_KEYS.VERSION_LOG, []);
  log.push({
    id: "v-" + Date.now(),
    articleId,
    note,
    snapshot: { ...snapshot, savedAt: new Date().toISOString() },
  });
  writeJson(LS_KEYS.VERSION_LOG, log);
}

export function getVersionsForArticle(articleId) {
  return readJson(LS_KEYS.VERSION_LOG, []).filter((v) => v.articleId === articleId);
}
