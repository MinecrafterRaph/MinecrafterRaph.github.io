import {
  loadAllData,
  getCached,
  getSiteContent,
  publishedArticles,
  categoryById,
  resolveAssetUrl,
} from "../core/data-service.js";
import { seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { trackPageView } from "../core/stats.js";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function main() {
  await seedUsersIfNeeded();
  await loadAllData();
  mountShell();
  trackPageView("index.html");

  const content = getSiteContent();
  document.getElementById("hero-eyebrow").textContent = content.heroEyebrow;
  document.getElementById("hero-title").textContent = content.heroTitle;
  document.getElementById("hero-subtitle").textContent = content.heroSubtitle;

  const aboutEl = document.getElementById("about-html");
  if (aboutEl) aboutEl.innerHTML = content.aboutHtml;

  document.getElementById("contact-email").textContent = content.contactEmail;
  document.getElementById("contact-email").href = "mailto:" + content.contactEmail;
  document.getElementById("contact-phone").textContent = content.contactPhone;
  document.getElementById("contact-room").textContent = content.contactRoom;

  const { editions, categories } = getCached();
  const editionsRoot = document.getElementById("editions-grid");
  editionsRoot.innerHTML = editions
    .map((e, idx) => {
      const variant = idx % 3 === 0 ? "edition-card--offset-a" : idx % 3 === 1 ? "edition-card--offset-b" : "";
      return `
    <article class="edition-card ${variant}">
      <div class="edition-card__frame">
        <img class="edition-card__cover" src="${resolveAssetUrl(e.coverImage)}" alt="" width="400" height="520" loading="lazy" />
      </div>
      <div class="edition-card__body">
        <p class="edition-card__meta">Nr. ${e.issueNumber} · ${formatDate(e.publishedAt)}</p>
        <h3>${escapeHtml(e.title)}</h3>
        <p class="edition-card__teaser">${escapeHtml(e.description)}</p>
        <p class="edition-card__lede">
          Diese Ausgabe kombiniert Reportagen, Meinungen und Schulleben in einem gestalteten Magazin-Look mit klarer Navigation.
        </p>
        <a class="btn btn--primary" href="zeitung${e.id}.html">Ausgabe lesen</a>
      </div>
    </article>`;
    })
    .join("");

  const articles = publishedArticles()
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const highlights = document.getElementById("highlights");
  const top = articles.filter((a) => a.featured).slice(0, 4);
  highlights.innerHTML = top
    .map((a, idx) => {
      const cat = categoryById(a.categoryId);
      const klass = idx === 0 ? "home-highlight home-highlight--lead" : "home-highlight";
      return `
      <article class="${klass}">
        <span class="badge" style="background:${cat?.color}22;color:${cat?.color}">${escapeHtml(cat?.label || "")}</span>
        <h3 style="margin-top:0.75rem"><a href="artikel.html?id=${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a></h3>
        <p>${escapeHtml(a.excerpt)}</p>
        <p style="font-size:0.85rem;color:var(--color-ink-muted)">${formatDate(a.publishedAt)}</p>
      </article>`;
    })
    .join("");

  const catNav = document.getElementById("category-chips");
  const cats = categories || [];
  catNav.innerHTML = cats
    .map(
      (c) =>
        `<a class="badge" style="text-decoration:none;background:${c.color}22;color:${c.color}" href="suche.html?kat=${encodeURIComponent(c.id)}">${escapeHtml(c.label)}</a>`
    )
    .join(" ");

  const adsSection = document.getElementById("ads-section");
  const adsGrid = document.getElementById("ads-grid");
  const ads = (getCached().ads || []).filter((a) => a.status === "approved");
  if (content.adsEnabled && ads.length) {
    adsSection.style.display = "";
    adsGrid.innerHTML = ads
      .map(
        (a) => `<article class="card">
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.description || "")}</p>
        <p class="form-hint">Kontakt: ${escapeHtml(a.contact || "-")}</p>
      </article>`
      )
      .join("");
  } else {
    adsSection.style.display = "none";
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// Expose for inline if needed
main().catch(console.error);
