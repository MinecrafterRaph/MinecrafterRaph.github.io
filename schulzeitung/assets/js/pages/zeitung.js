import { loadAllData, getCached, categoryById, resolveAssetUrl } from "../core/data-service.js";
import { seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { trackPageView } from "../core/stats.js";
import { getPuzzles } from "../core/puzzles.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

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

function normalizeAnswer(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss");
}

function renderEditionPdfs(edition, articles) {
  const withPdf = articles.filter((a) => a.pdfDataUrl);
  if (!withPdf.length) return;
  const host = document.createElement("section");
  host.className = "card";
  host.style.marginBottom = "var(--space-lg)";
  host.setAttribute("aria-labelledby", "edition-pdf-heading");
  host.innerHTML = `
    <h2 id="edition-pdf-heading">Digitale Zeitung (PDF)</h2>
    <p class="form-hint">Hier findest du gestaltete PDF-Seiten der Ausgabe ${escapeHtml(String(edition.issueNumber || ""))}. Du kannst sie direkt lesen oder herunterladen.</p>
    <div class="edition-pdf-grid">
      ${withPdf
        .map(
          (a, idx) => `
          <article class="edition-pdf-item">
            <h3>${escapeHtml(a.title)}</h3>
            <div class="edition-pdf-frame">
              <iframe title="PDF ${escapeHtml(a.title)}" src="${escapeHtml(a.pdfDataUrl)}#toolbar=0&view=FitH" loading="lazy"></iframe>
            </div>
            <p>
              <a class="btn btn--primary btn--small" href="${escapeHtml(a.pdfDataUrl)}" target="_blank" rel="noopener">PDF lesen</a>
              <a class="btn btn--ghost btn--small" href="${escapeHtml(a.pdfDataUrl)}" download="${escapeHtml(a.pdfFileName || `ausgabe-${edition.id}-${idx + 1}.pdf`)}">Download</a>
            </p>
          </article>`
        )
        .join("")}
    </div>
  `;
  const slider = document.getElementById("slider");
  slider?.insertAdjacentElement("beforebegin", host);
}

function renderPuzzle(editionId) {
  const puzzle = getPuzzles()[editionId];
  if (!puzzle) return;
  const host = document.createElement("section");
  host.className = "card puzzle-card";
  host.setAttribute("aria-labelledby", "puzzle-heading");
  host.innerHTML = `
    <h2 id="puzzle-heading">${escapeHtml(puzzle.title)}</h2>
    <p class="form-hint">${escapeHtml(puzzle.intro)}</p>
    <form id="puzzle-form" class="puzzle-grid"></form>
    <div class="puzzle-actions">
      <button class="btn btn--primary" type="button" id="puzzle-check">Rätsel prüfen</button>
      <button class="btn btn--ghost" type="button" id="puzzle-reset">Zurücksetzen</button>
    </div>
    <p id="puzzle-result" class="form-hint"></p>
  `;
  const form = host.querySelector("#puzzle-form");
  form.innerHTML = puzzle.questions
    .map(
      (q, i) => `
      <div class="puzzle-item">
        <label for="pz-${i}">${i + 1}. ${escapeHtml(q.prompt)}</label>
        <input id="pz-${i}" data-idx="${i}" autocomplete="off" />
      </div>`
    )
    .join("");

  const key = `sz_puzzle_${editionId}`;
  const saved = JSON.parse(localStorage.getItem(key) || "null");
  if (saved?.values) {
    saved.values.forEach((v, i) => {
      const input = host.querySelector(`#pz-${i}`);
      if (input) input.value = v;
    });
  }
  if (saved?.completed) {
    host.querySelector("#puzzle-result").textContent = `Bereits gelöst: ${saved.score}/${puzzle.questions.length} richtig.`;
  }

  host.querySelector("#puzzle-check").addEventListener("click", () => {
    const values = puzzle.questions.map((_, i) => host.querySelector(`#pz-${i}`)?.value || "");
    let score = 0;
    values.forEach((v, i) => {
      if (normalizeAnswer(v) === normalizeAnswer(puzzle.questions[i].answer)) score += 1;
    });
    const result = host.querySelector("#puzzle-result");
    result.textContent =
      score === puzzle.questions.length
        ? `Perfekt! Alle ${score} Antworten sind richtig.`
        : `${score} von ${puzzle.questions.length} richtig. Versuche es nochmal.`;
    localStorage.setItem(
      key,
      JSON.stringify({
        values,
        score,
        completed: score === puzzle.questions.length,
        updatedAt: new Date().toISOString(),
      })
    );
  });

  host.querySelector("#puzzle-reset").addEventListener("click", () => {
    localStorage.removeItem(key);
    puzzle.questions.forEach((_, i) => {
      const input = host.querySelector(`#pz-${i}`);
      if (input) input.value = "";
    });
    host.querySelector("#puzzle-result").textContent = "Rätsel zurückgesetzt.";
  });

  const main = document.getElementById("main");
  main.appendChild(host);
}

async function main() {
  await seedUsersIfNeeded();
  await loadAllData();
  mountShell();

  const editionId = document.body.dataset.editionId;
  const edition = (getCached().editions || []).find((e) => e.id === editionId);
  if (!edition) {
    document.getElementById("edition-h1").textContent = "Ausgabe nicht gefunden";
    return;
  }

  trackPageView(`zeitung${editionId}.html`);
  document.title = `${edition.title} – Schulzeitung`;
  document.getElementById("edition-title").textContent = edition.title;
  document.getElementById("edition-h1").textContent = edition.title;
  document.getElementById("edition-desc").textContent = edition.description;
  const cover = document.getElementById("edition-cover");
  cover.src = resolveAssetUrl(edition.coverImage);
  cover.alt = `Titelbild ${edition.title}`;
  const visuals = document.getElementById("edition-visuals");
  if (visuals) {
    visuals.innerHTML = `
      <figure class="edition-visual-grid__main">
        <img src="${resolveAssetUrl(edition.coverImage)}" alt="Titelbild ${escapeHtml(edition.title)}" loading="lazy" />
      </figure>
      <figure><img src="${resolveAssetUrl("assets/images/avatar-team.svg")}" alt="Redaktionsteam" loading="lazy" /></figure>
      <figure><img src="${resolveAssetUrl("assets/images/avatar-a1.svg")}" alt="Autorin" loading="lazy" /></figure>
      <figure><img src="${resolveAssetUrl("assets/images/avatar-a2.svg")}" alt="Autor" loading="lazy" /></figure>
    `;
  }

  const articles = (getCached().articles || [])
    .filter((a) => a.editionId === editionId && a.status === "published")
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  renderEditionPdfs(edition, articles);

  const track = document.getElementById("slider-track");
  track.innerHTML = articles
    .map((a) => {
      const cat = categoryById(a.categoryId);
      const url = window.location.origin + window.location.pathname.replace(/[^/]+$/, `artikel.html?id=${encodeURIComponent(a.id)}`);
      const excerpt = escapeHtml(a.excerpt || "In diesem Beitrag findest du Hintergründe, Stimmen und spannende Details aus dem Schulalltag.");
      return `
      <article class="issue-slide">
        <div class="issue-slide__ornament" aria-hidden="true">✦ ✦ ✦</div>
        <p class="issue-slide__kicker">${escapeHtml(cat?.label || "Schulzeitung")}</p>
        <h3 class="issue-slide__title">${escapeHtml(a.title)}</h3>
        <p class="issue-slide__meta">${formatDate(a.publishedAt)} · Ausgabe ${escapeHtml(edition.issueNumber)}</p>
        <div class="issue-slide__columns">
          <p>${excerpt}</p>
          <p>
            ${excerpt}
            Der Artikel bringt Perspektiven aus Unterricht, Projekten und Schulalltag zusammen und ist als lange Magazinseite gedacht.
          </p>
        </div>
        <blockquote class="issue-slide__quote">
          „${escapeHtml(a.title)}“ ist eine Geschichte, die unsere Schulgemeinschaft direkt betrifft.
        </blockquote>
        <p class="issue-slide__cta">
          <a class="btn btn--primary" href="artikel.html?id=${encodeURIComponent(a.id)}">Vollständig lesen</a>
        </p>
        <div class="share-row issue-slide__share">
          <span>Teilen:</span>
          <a class="btn btn--ghost btn--small" href="mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(url)}">E-Mail</a>
          <a class="btn btn--ghost btn--small" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(url)}" rel="noopener">X</a>
        </div>
      </article>`;
    })
    .join("");

  let index = 0;
  const total = articles.length;
  function updateSlider() {
    if (total === 0) return;
    const slides = Array.from(track.querySelectorAll(".issue-slide"));
    slides.forEach((slide, i) => {
      const rel = i - index;
      slide.classList.remove("is-active", "is-prev", "is-next");
      if (rel === 0) slide.classList.add("is-active");
      else if (rel < 0) slide.classList.add("is-prev");
      else slide.classList.add("is-next");
    });
  }

  document.getElementById("slider-prev").addEventListener("click", () => {
    if (!total) return;
    index = (index - 1 + total) % total;
    updateSlider();
  });
  document.getElementById("slider-next").addEventListener("click", () => {
    if (!total) return;
    index = (index + 1) % total;
    updateSlider();
  });

  const list = document.getElementById("article-list");
  list.innerHTML = articles.length
    ? articles
        .map(
          (a) => `
      <li class="card" style="margin-bottom:var(--space-md)">
        <a href="artikel.html?id=${encodeURIComponent(a.id)}"><strong>${escapeHtml(a.title)}</strong></a>
        <p style="margin:0.35rem 0 0;font-size:0.9rem;color:var(--color-ink-muted)">${formatDate(a.publishedAt)}</p>
      </li>`
        )
        .join("")
    : "<li>Keine Artikel in dieser Ausgabe.</li>";

  updateSlider();

  const editionsSorted = [...(getCached().editions || [])].sort((a, b) => Number(a.id) - Number(b.id));
  const currentIdx = editionsSorted.findIndex((e) => e.id === editionId);
  const prevEdition = currentIdx > 0 ? editionsSorted[currentIdx - 1] : null;
  const nextEdition = currentIdx >= 0 && currentIdx < editionsSorted.length - 1 ? editionsSorted[currentIdx + 1] : null;
  const navLinks = document.getElementById("edition-nav-links");
  if (navLinks) {
    navLinks.innerHTML = `
      ${prevEdition ? `<a href="zeitung${prevEdition.id}.html">← Vorherige Ausgabe</a>` : "Keine vorherige Ausgabe"}
      <br />
      ${nextEdition ? `<a href="zeitung${nextEdition.id}.html">Naechste Ausgabe →</a>` : "Keine naechste Ausgabe"}
    `;
  }

  const toc = document.getElementById("edition-toc");
  if (toc) {
    toc.innerHTML = articles.length
      ? articles
          .map(
            (a) =>
              `<li style="margin-bottom:0.45rem"><a href="artikel.html?id=${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a></li>`
          )
          .join("")
      : "<li>Keine Artikel in dieser Ausgabe.</li>";
  }

  renderPuzzle(editionId);
}

main().catch(console.error);
