import { seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";

const AD_DESIGN_DRAFT_KEY = "sz_ad_designer_draft";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = value == null ? "" : String(value);
  return el.innerHTML;
}

function buildAdHtml(data) {
  const toneClass = data.tone === "event" ? "ad-template--event" : data.tone === "job" ? "ad-template--job" : "ad-template--classic";
  return `
    <article class="ad-template ${toneClass}" style="--ad-accent:${escapeHtml(data.color)}">
      <p class="ad-template__kicker">Anzeige</p>
      <h3>${escapeHtml(data.title || "Dein Titel")}</h3>
      <p>${escapeHtml(data.description || "Hier erscheint dein Beschreibungstext.")}</p>
      <p class="ad-template__meta"><strong>Kontakt:</strong> ${escapeHtml(data.contact || "-")}</p>
      <p class="ad-template__meta"><strong>Preis:</strong> ${escapeHtml(data.price || "-")}</p>
    </article>
  `;
}

function renderPreview() {
  const payload = {
    title: byId("ad-title").value.trim(),
    description: byId("ad-desc").value.trim(),
    contact: byId("ad-contact").value.trim(),
    price: byId("ad-price").value.trim(),
    tone: byId("ad-tone").value,
    color: byId("ad-color").value || "#a67c1b",
  };
  byId("ad-preview-host").innerHTML = buildAdHtml(payload);
}

async function main() {
  await seedUsersIfNeeded();
  mountShell();

  ["ad-title", "ad-desc", "ad-contact", "ad-price", "ad-tone", "ad-color"].forEach((id) => {
    byId(id).addEventListener("input", renderPreview);
    byId(id).addEventListener("change", renderPreview);
  });
  renderPreview();

  byId("ad-save-design").addEventListener("click", () => {
    const payload = {
      title: byId("ad-title").value.trim(),
      description: byId("ad-desc").value.trim(),
      contact: byId("ad-contact").value.trim(),
      price: byId("ad-price").value.trim(),
      tone: byId("ad-tone").value,
      color: byId("ad-color").value || "#a67c1b",
    };
    const designedHtml = buildAdHtml(payload);
    localStorage.setItem(
      AD_DESIGN_DRAFT_KEY,
      JSON.stringify({
        ...payload,
        designedHtml,
      })
    );
    window.location.href = "freeeditor.html";
  });
}

main().catch(console.error);
