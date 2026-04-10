import { ROLES, getSession, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";

async function main() {
  if (!requireRole([ROLES.KLASSSPRECHER, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  mountShell();

  const session = getSession();
  const data = await loadInfo();
  const profile = data[session.id] || data.default || {};

  document.getElementById("ks-name").textContent = session.displayName || session.email;
  document.getElementById("ks-class").textContent = profile.className || "Nicht hinterlegt";
  document.getElementById("ks-role").textContent = session.role;
  document.getElementById("ks-notice").textContent =
    profile.notice || "Aktuell liegen keine neuen Hinweise vor.";

  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];
  const list = document.getElementById("ks-tasks");
  list.innerHTML = tasks.length
    ? tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")
    : "<li>Keine Aufgaben hinterlegt.</li>";
}

async function loadInfo() {
  const base = document.documentElement.dataset.base || "";
  const res = await fetch(`${base}data/klassensprecher-info.json`.replace(/\/+/g, "/"));
  if (!res.ok) return { default: {} };
  return res.json();
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = String(value || "");
  return node.innerHTML;
}

main().catch(console.error);
