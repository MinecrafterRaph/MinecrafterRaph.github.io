import { ROLES, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getSiteContent } from "../core/data-service.js";

const VIP_NOTE_KEY = "sz_vip_note";
const VIP_MOOD_KEY = "sz_vip_mood";

const topics = [
  { icon: "📰", title: "Exklusive Story", text: "Vorabzugang zu der nächsten Titelgeschichte." },
  { icon: "🎙️", title: "Interview-Preview", text: "Sehe Fragen und Zitate vor Veröffentlichung." },
  { icon: "📸", title: "Behind the Scenes", text: "Einblicke in Layout, Fotos und Teamarbeit." },
  { icon: "🏆", title: "Schulhelden", text: "Nominierungen für die nächste Ehrenseite." },
];

async function main() {
  if (!requireRole([ROLES.VIP, ROLES.ADMIN, ROLES.KLASSSPRECHER])) return;
  await seedUsersIfNeeded();
  mountShell();
  document.getElementById("vip-notice").textContent =
    getSiteContent().vipNotice || "Willkommen im VIP-Bereich.";

  renderTopicCards();
  initMood();
  initNote();
}

function renderTopicCards() {
  const host = document.getElementById("vip-icon-grid");
  host.innerHTML = topics
    .map(
      (topic) => `
        <article class="vip-topic">
          <span class="vip-topic__icon" aria-hidden="true">${topic.icon}</span>
          <h3>${topic.title}</h3>
          <p>${topic.text}</p>
        </article>
      `
    )
    .join("");
}

function initMood() {
  const result = document.getElementById("vip-mood-result");
  const host = document.getElementById("vip-mood");
  if (!host || !result) return;
  const saved = localStorage.getItem(VIP_MOOD_KEY);
  if (saved) {
    result.textContent = `Gespeichert: ${saved}`;
  }
  host.querySelectorAll("button[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mood = btn.getAttribute("data-mood");
      localStorage.setItem(VIP_MOOD_KEY, mood);
      result.textContent = `Danke, deine aktuelle Stimmung ist: ${mood}`;
    });
  });
}

function initNote() {
  const input = document.getElementById("vip-note-input");
  const save = document.getElementById("vip-note-save");
  const clear = document.getElementById("vip-note-clear");
  if (!input || !save || !clear) return;
  input.value = localStorage.getItem(VIP_NOTE_KEY) || "";
  save.addEventListener("click", () => {
    localStorage.setItem(VIP_NOTE_KEY, input.value.trim());
  });
  clear.addEventListener("click", () => {
    localStorage.removeItem(VIP_NOTE_KEY);
    input.value = "";
  });
}

main().catch(console.error);
