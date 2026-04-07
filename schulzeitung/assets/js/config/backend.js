export const BACKEND_CONFIG = {
  // Fill these values to enable global comments via Supabase.
  supabaseUrl: "https://iaphrxjusnygyghasdyh.supabase.co",

  supabaseAnonKey: "sb_publishable_vQOvZUwVRasCg9QQcVmu7Q_d_BxhztL",
  commentsTable: "comments",
  commentsSchema: "public",
};

export function hasGlobalCommentsBackend() {
  return (
    typeof BACKEND_CONFIG.supabaseUrl === "string" &&
    BACKEND_CONFIG.supabaseUrl.startsWith("https://") &&
    typeof BACKEND_CONFIG.supabaseAnonKey === "string" &&
    BACKEND_CONFIG.supabaseAnonKey.length > 20
  );
}
