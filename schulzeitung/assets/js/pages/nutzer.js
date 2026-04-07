import { getSession, ROLES } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";

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
}

main();
