import { LS_KEYS, readJson, writeJson } from "./storage.js";
import { BACKEND_CONFIG, hasGlobalCommentsBackend } from "../config/backend.js";

let publicComments = {};
let publicLoaded = false;
let supabaseClientPromise = null;

async function getSupabaseClient() {
  if (!hasGlobalCommentsBackend()) return null;
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(BACKEND_CONFIG.supabaseUrl, BACKEND_CONFIG.supabaseAnonKey))
      .catch(() => null);
  }
  return supabaseClientPromise;
}

async function fetchRemoteComments(articleId) {
  const table = encodeURIComponent(BACKEND_CONFIG.commentsTable || "comments");
  const url =
    `${BACKEND_CONFIG.supabaseUrl}/rest/v1/${table}` +
    `?select=id,article_id,author_name,text,created_at&article_id=eq.${encodeURIComponent(articleId)}&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: BACKEND_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${BACKEND_CONFIG.supabaseAnonKey}`,
    },
  });
  if (!res.ok) throw new Error("Remote comments fetch failed");
  const rows = await res.json();
  return rows.map((r) => ({
    id: String(r.id),
    articleId: r.article_id,
    authorName: r.author_name,
    text: r.text,
    createdAt: r.created_at,
  }));
}

async function insertRemoteComment(articleId, { authorName, text }) {
  const table = encodeURIComponent(BACKEND_CONFIG.commentsTable || "comments");
  const url = `${BACKEND_CONFIG.supabaseUrl}/rest/v1/${table}`;
  const payload = {
    article_id: articleId,
    author_name: String(authorName || "Gast").trim() || "Gast",
    text: String(text || "").trim(),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: BACKEND_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${BACKEND_CONFIG.supabaseAnonKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Remote comment insert failed");
  const rows = await res.json();
  return rows?.[0] || null;
}

export async function loadPublicComments() {
  if (publicLoaded) return publicComments;
  publicLoaded = true;
  const base = document.documentElement.dataset.base || "";
  try {
    const res = await fetch(`${base}data/comments-public.json`.replace(/\/+/g, "/"));
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === "object") publicComments = json;
    }
  } catch {
    publicComments = {};
  }
  return publicComments;
}

export async function getComments(articleId) {
  if (hasGlobalCommentsBackend()) {
    try {
      return await fetchRemoteComments(articleId);
    } catch {
      // fallback to local/public below
    }
  }
  const all = readJson(LS_KEYS.COMMENTS, {});
  const shared = publicComments[articleId] || [];
  const local = all[articleId] || [];
  return [...shared, ...local];
}

export function removeComment(articleId, commentId) {
  const all = readJson(LS_KEYS.COMMENTS, {});
  const list = (all[articleId] || []).filter((c) => c.id !== commentId);
  if (list.length === 0) delete all[articleId];
  else all[articleId] = list;
  writeJson(LS_KEYS.COMMENTS, all);
}

export function getAllCommentsFlat() {
  const all = readJson(LS_KEYS.COMMENTS, {});
  const rows = [];
  Object.keys(all).forEach((articleId) => {
    (all[articleId] || []).forEach((c) => {
      rows.push({ articleId, ...c });
    });
  });
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addComment(articleId, { authorName, text }) {
  if (hasGlobalCommentsBackend()) {
    try {
      const remote = await insertRemoteComment(articleId, { authorName, text });
      if (remote) {
        return await fetchRemoteComments(articleId);
      }
    } catch {
      // fallback to local storage below
    }
  }
  const all = readJson(LS_KEYS.COMMENTS, {});
  const list = all[articleId] || [];
  list.push({
    id: "c-" + Date.now(),
    authorName: authorName.trim() || "Gast",
    text: text.trim(),
    createdAt: new Date().toISOString(),
  });
  all[articleId] = list;
  writeJson(LS_KEYS.COMMENTS, all);
  return list;
}

export async function subscribeToCommentsRealtime(articleId, onChange) {
  if (!hasGlobalCommentsBackend()) return () => {};
  const client = await getSupabaseClient();
  if (!client) return () => {};

  const channel = client.channel(`comments-${articleId}-${Date.now()}`);
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: BACKEND_CONFIG.commentsSchema || "public",
      table: BACKEND_CONFIG.commentsTable || "comments",
      filter: `article_id=eq.${articleId}`,
    },
    () => onChange()
  );
  await channel.subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
