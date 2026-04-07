import { LS_KEYS, readJson, writeJson } from "./storage.js";

export function getPendingAds() {
  return readJson(LS_KEYS.PENDING_ADS, []);
}

export function addPendingAd(entry) {
  const list = getPendingAds();
  list.push({
    id: "pad-" + Date.now(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...entry,
  });
  writeJson(LS_KEYS.PENDING_ADS, list);
}

export function getPendingContributions() {
  return readJson(LS_KEYS.PENDING_CONTRIBUTIONS, []);
}

export function addPendingContribution(entry) {
  const list = getPendingContributions();
  list.push({
    id: "pc-" + Date.now(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...entry,
  });
  writeJson(LS_KEYS.PENDING_CONTRIBUTIONS, list);
}

export function updatePendingAd(id, patch) {
  const list = getPendingAds().map((a) => (a.id === id ? { ...a, ...patch } : a));
  writeJson(LS_KEYS.PENDING_ADS, list);
}

export function updatePendingContribution(id, patch) {
  const list = getPendingContributions().map((a) => (a.id === id ? { ...a, ...patch } : a));
  writeJson(LS_KEYS.PENDING_CONTRIBUTIONS, list);
}

export function removePendingAd(id) {
  writeJson(
    LS_KEYS.PENDING_ADS,
    getPendingAds().filter((a) => a.id !== id)
  );
}

export function removePendingContribution(id) {
  writeJson(
    LS_KEYS.PENDING_CONTRIBUTIONS,
    getPendingContributions().filter((a) => a.id !== id)
  );
}
