import { seedUsersIfNeeded, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";

const CONFIRM_TOKEN_KEY = "sz_freeeditor_confirm_token";

async function main() {
  await seedUsersIfNeeded();
  if (!getSession()) {
    window.location.href = "freeeditor.html";
    return;
  }
  if (!sessionStorage.getItem(CONFIRM_TOKEN_KEY)) {
    window.location.href = "freeeditor.html";
    return;
  }
  sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
  mountShell();
  const p = new URLSearchParams(window.location.search).get("typ");
  const el = document.getElementById("confirm-text");
  if (p === "anzeige") el.textContent = "Deine Anzeige wurde zur Prüfung gespeichert.";
  else if (p === "beitrag") el.textContent = "Dein Leserbeitrag wurde zur Prüfung gespeichert.";
}

main();
