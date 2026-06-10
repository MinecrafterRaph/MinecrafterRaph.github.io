export const BACKEND_CONFIG = {
  supabaseUrl: "PASTE_YOUR_SUPABASE_URL",
  supabaseAnonKey: "PASTE_YOUR_SUPABASE_ANON_KEY",
  profilesTable: "profiles",
  roomsTable: "soccer_rooms",
  queueTable: "match_queue",
};

export function hasMultiplayerBackend() {
  return (
    typeof BACKEND_CONFIG.supabaseUrl === "string" &&
    BACKEND_CONFIG.supabaseUrl.startsWith("https://") &&
    !BACKEND_CONFIG.supabaseUrl.includes("PASTE_") &&
    typeof BACKEND_CONFIG.supabaseAnonKey === "string" &&
    BACKEND_CONFIG.supabaseAnonKey.length > 20 &&
    !BACKEND_CONFIG.supabaseAnonKey.includes("PASTE_")
  );
}
