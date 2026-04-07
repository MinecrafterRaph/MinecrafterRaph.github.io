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

  const articles = (getCached().articles || [])
    .filter((a) => a.editionId === editionId && a.status === "published")
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const track = document.getElementById("slider-track");
  track.innerHTML = articles
    .map((a) => {
      const cat = categoryById(a.categoryId);
      const url = window.location.origin + window.location.pathname.replace(/[^/]+$/, `artikel.html?id=${encodeURIComponent(a.id)}`);
      return `
      <div class="issue-slide">
        <span class="badge" style="background:${cat?.color}22;color:${cat?.color}">${escapeHtml(cat?.label || "")}</span>
        <h3 style="margin-top:0.75rem">${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.excerpt)}</p>
        <p style="font-size:0.9rem;color:var(--color-ink-muted)">${formatDate(a.publishedAt)}</p>
        <p style="margin-top:var(--space-md)">
          <a class="btn btn--primary" href="artikel.html?id=${encodeURIComponent(a.id)}">Vollständig lesen</a>
        </p>
        <div class="share-row" style="margin-top:var(--space-lg)">
          <span>Teilen:</span>
          <a class="btn btn--ghost btn--small" href="mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(url)}">E-Mail</a>
          <a class="btn btn--ghost btn--small" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(url)}" rel="noopener">X</a>
        </div>
      </div>`;
    })
    .join("");

  let index = 0;
  const total = articles.length;
  function updateSlider() {
    if (total === 0) return;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  document.getElementById("slider-prev").addEventListener("click", () => {
    index = (index - 1 + total) % total;
    updateSlider();
  });
  document.getElementById("slider-next").addEventListener("click", () => {
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
