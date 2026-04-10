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

function sanitizeHtml(input) {
  const template = document.createElement("template");
  template.innerHTML = String(input || "");
  template.content.querySelectorAll("script, iframe, object, embed").forEach((el) => el.remove());
  template.content.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "").toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) el.removeAttribute(attr.name);
    });
  });
  return template.innerHTML;
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
  if (aboutEl) aboutEl.innerHTML = sanitizeHtml(content.aboutHtml);

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
  const highlightCount = Math.max(1, Math.min(8, Number(content.highlightsCount || 4)));
  const top = articles.filter((a) => a.featured).slice(0, highlightCount);
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
        ${a.designedHtml ? `<div class="ad-designed-preview">${sanitizeHtml(a.designedHtml)}</div>` : `<p>${escapeHtml(a.description || "")}</p>`}
        <p class="form-hint">Kontakt: ${escapeHtml(a.contact || "-")}</p>
      </article>`
      )
      .join("");
  } else {
    adsSection.style.display = "none";
  }

  const photoGrid = document.getElementById("home-photo-grid");
  if (photoGrid) {
    const photoBandSection = photoGrid.closest(".home-photo-band");
    if (photoBandSection) photoBandSection.style.display = content.photoBandEnabled === false ? "none" : "";
    const images = [
      { src: "assets/images/avatar-team.svg", alt: "Redaktionsteam" },
      { src: "assets/images/avatar-a1.svg", alt: "Autorin 1" },
      { src: "assets/images/cover-1.svg", alt: "Cover Ausgabe 1" },
      { src: "assets/images/cover-2.svg", alt: "Cover Ausgabe 2" },
      { src: "assets/images/avatar-a2.svg", alt: "Autor 2" },
      { src: "assets/images/cover-3.svg", alt: "Cover Ausgabe 3" },
    ];
    photoGrid.innerHTML = images
      .map(
        (img, idx) => `
        <figure class="home-photo-band__item home-photo-band__item--${(idx % 3) + 1}">
          <img src="${resolveAssetUrl(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy" />
        </figure>`
      )
      .join("");
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// Expose for inline if needed
main().catch(console.error);
