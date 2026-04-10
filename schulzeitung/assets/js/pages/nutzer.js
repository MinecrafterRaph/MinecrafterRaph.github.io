import { getSession, ROLES } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";

const READER_FOCUS_KEY = "sz_reader_focus_v1";

function main() {
  mountShell();
  const s = getSession();
  if (!s || s.role !== ROLES.READER) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("welcome-heading").textContent = `Hallo, ${s.displayName}`;
  document.getElementById("welcome-text").textContent =
    "Hier findest du Schnellzugriffe. Deine Daten liegen nur in diesem Browser (LocalStorage).";
  renderFocusChecklist();
}

function loadFocus() {
  try {
    const parsed = JSON.parse(localStorage.getItem(READER_FOCUS_KEY));
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (error) {
    // ignore invalid storage
  }
  return [
    { id: "f1", label: "Einen Themenvorschlag einreichen", done: false },
    { id: "f2", label: "Einen Kommentar zu einem Artikel schreiben", done: false },
    { id: "f3", label: "Die neueste Ausgabe komplett lesen", done: false },
  ];
}

function saveFocus(items) {
  localStorage.setItem(READER_FOCUS_KEY, JSON.stringify(items));
}

function renderFocusChecklist() {
  const host = document.getElementById("reader-focus-list");
  if (!host) return;
  const items = loadFocus();
  host.innerHTML = items
    .map(
      (item) => `
      <label style="display:flex;align-items:center;gap:0.55rem;margin-bottom:0.45rem">
        <input type="checkbox" data-focus-id="${item.id}" ${item.done ? "checked" : ""} />
        <span>${escapeHtml(item.label)}</span>
      </label>
    `
    )
    .join("");

  host.querySelectorAll("input[data-focus-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.getAttribute("data-focus-id");
      const next = loadFocus().map((item) => (item.id === id ? { ...item, done: input.checked } : item));
      saveFocus(next);
    });
  });
}

function escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = String(value || "");
  return el.innerHTML;
}

main();
