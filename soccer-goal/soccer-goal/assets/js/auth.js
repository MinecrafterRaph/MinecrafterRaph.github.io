import { BACKEND_CONFIG, hasMultiplayerBackend } from "./config/backend.js";

let supabase = null;

async function client() {
  if (!hasMultiplayerBackend()) return null;
  if (!supabase) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supabase = createClient(BACKEND_CONFIG.supabaseUrl, BACKEND_CONFIG.supabaseAnonKey);
  }
  return supabase;
}

export async function getSession() {
  const sb = await client();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const sb = await client();
  const { data, error } = await sb
    .from(BACKEND_CONFIG.profilesTable)
    .select("id, alias")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isAliasAvailable(alias) {
  const clean = alias.trim();
  if (clean.length < 2 || clean.length > 16) return { ok: false, reason: "Alias: 2–16 Zeichen." };
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { ok: false, reason: "Nur Buchstaben, Zahlen, _ und -." };
  }

  const sb = await client();
  if (!sb) return { ok: false, reason: "Supabase nicht konfiguriert." };

  const { data, error } = await sb
    .from(BACKEND_CONFIG.profilesTable)
    .select("alias")
    .ilike("alias", clean)
    .maybeSingle();

  if (error) throw error;
  if (data) return { ok: false, reason: "Alias ist schon vergeben." };
  return { ok: true };
}

export async function signUp(email, password, alias) {
  const check = await isAliasAvailable(alias);
  if (!check.ok) throw new Error(check.reason);

  const sb = await client();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Registrierung fehlgeschlagen.");

  const { error: profileErr } = await sb.from(BACKEND_CONFIG.profilesTable).insert({
    id: data.user.id,
    alias: alias.trim(),
  });
  if (profileErr) throw profileErr;

  return data;
}

export async function signIn(email, password) {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = await client();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getSupabaseClient() {
  return client();
}
