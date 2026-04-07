import { ROLES, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { loadAllData, getCached, saveArticles, saveAds, getSiteContent, saveSiteContent } from "../core/data-service.js";
import { getAllCommentsFlat, removeComment } from "../core/comments.js";
import { getPendingAds, getPendingContributions } from "../core/pending.js";
import { mountShell } from "../ui/shell.js";

let quill = null;
let editingId = null;
let canPublishDirectly = false;
const DRAFT_BACKUP_KEY = "sz_editor_live_backup";
let hasUnsavedChanges = false;

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = value == null ? "" : String(value);
  return el.innerHTML;
}

function switchPanel(panelId) {
  document.querySelectorAll(".side-nav button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.panel === panelId);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-visible", panel.id === `panel-${panelId}`);
  });
}

function initTabs() {
  byId("editor-nav").addEventListener("click", (event) => {
    const target = event.target.closest("button[data-panel]");
    if (!target) return;
    switchPanel(target.dataset.panel);
  });
}

function articleRows() {
  if (canPublishDirectly) return getCached().articles || [];
  return (getCached().articles || []).filter((a) => a.status !== "published");
}

function fillSelect(selectId, options, valueKey = "id", labelKey = "title") {
  const select = byId(selectId);
  select.innerHTML = options
    .map((opt) => `<option value="${escapeHtml(opt[valueKey])}">${escapeHtml(opt[labelKey])}</option>`)
    .join("");
}

function renderArticlesTable() {
  const tbody = byId("table-editor-articles").querySelector("tbody");
  const q = byId("article-search")?.value?.trim().toLowerCase() || "";
  const status = byId("article-status-filter")?.value || "all";
  const rows = articleRows().filter((a) => {
    const searchOk = !q || a.title.toLowerCase().includes(q);
    const statusOk = status === "all" || a.status === status;
    return searchOk && statusOk;
  });
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (a) => `<tr>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(a.status === "review" ? "Zur Freigabe" : a.status === "published" ? "Veroeffentlicht" : "Entwurf")}</td>
      <td><button class="btn btn--ghost btn--small" data-edit-id="${escapeHtml(a.id)}">Bearbeiten</button></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="3">Noch keine Entwuerfe vorhanden.</td></tr>';
}

function getAuthorIdForEditor() {
  const authors = getCached().authors || [];
  return authors[0]?.id || "a4";
}

function openForm(article = null) {
  editingId = article?.id || null;
  byId("editor-form-wrap").style.display = "block";
  byId("form-article-title").textContent = article ? "Artikel bearbeiten" : "Neuer Artikel";

  byId("art-id").value = article?.id || "";
  byId("art-title").value = article?.title || "";
  byId("art-excerpt").value = article?.excerpt || "";
  byId("art-edition").value = article?.editionId || (getCached().editions?.[0]?.id ?? "");
  byId("art-category").value = article?.categoryId || (getCached().categories?.[0]?.id ?? "");
  quill.root.innerHTML = article?.contentHtml || "<p></p>";
  renderVersionList(article);
  updateEditorStats();
  hasUnsavedChanges = false;
}

function closeForm() {
  byId("editor-form-wrap").style.display = "none";
  editingId = null;
  localStorage.removeItem(DRAFT_BACKUP_KEY);
  byId("version-list").innerHTML = "<li class=\"form-hint\">Keine Versionen vorhanden.</li>";
  hasUnsavedChanges = false;
}

function upsertArticle(status) {
  const title = byId("art-title").value.trim();
  const excerpt = byId("art-excerpt").value.trim();
  const editionId = byId("art-edition").value;
  const categoryId = byId("art-category").value;
  const contentHtml = quill.root.innerHTML;

  const all = [...(getCached().articles || [])];
  const now = new Date().toISOString().slice(0, 10);

  if (editingId) {
    const index = all.findIndex((a) => a.id === editingId);
    if (index >= 0) {
      const previous = all[index];
      const previousVersions = Array.isArray(previous.versions) ? previous.versions : [];
      const snapshot = {
        id: `v-${Date.now()}`,
        savedAt: new Date().toISOString(),
        title: previous.title,
        excerpt: previous.excerpt,
        editionId: previous.editionId,
        categoryId: previous.categoryId,
        contentHtml: previous.contentHtml,
        status: previous.status,
      };
      all[index] = {
        ...previous,
        title,
        excerpt,
        editionId,
        categoryId,
        contentHtml,
        status,
        publishedAt: previous.publishedAt || now,
        versions: [snapshot, ...previousVersions].slice(0, 20),
      };
    }
  } else {
    const id = `art-${Date.now()}`;
    all.unshift({
      id,
      editionId,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      excerpt,
      categoryId,
      authorId: getAuthorIdForEditor(),
      publishedAt: now,
      status,
      featured: false,
      embed: null,
      contentHtml,
      versions: [],
    });
  }

  saveArticles(all);
  renderArticlesTable();
  renderPreview();
  closeForm();
  hasUnsavedChanges = false;
}

function wordCountFromHtmlText(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

function updateEditorStats() {
  const count = wordCountFromHtmlText(quill.getText());
  byId("editor-stats").textContent = `${count} Woerter`;
}

function persistDraftBackup() {
  const backup = {
    title: byId("art-title").value,
    excerpt: byId("art-excerpt").value,
    editionId: byId("art-edition").value,
    categoryId: byId("art-category").value,
    contentHtml: quill.root.innerHTML,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_BACKUP_KEY, JSON.stringify(backup));
  hasUnsavedChanges = true;
}

function restoreDraftBackupIfUseful() {
  if (editingId) return;
  try {
    const raw = localStorage.getItem(DRAFT_BACKUP_KEY);
    if (!raw) return;
    const b = JSON.parse(raw);
    if (!b || !b.title) return;
    byId("editor-form-wrap").style.display = "block";
    byId("form-article-title").textContent = "Neuer Artikel (wiederhergestellt)";
    byId("art-title").value = b.title || "";
    byId("art-excerpt").value = b.excerpt || "";
    if (b.editionId) byId("art-edition").value = b.editionId;
    if (b.categoryId) byId("art-category").value = b.categoryId;
    quill.root.innerHTML = b.contentHtml || "<p></p>";
    updateEditorStats();
    hasUnsavedChanges = true;
  } catch {
    // ignore broken backup data
  }
}

function renderVersionList(article) {
  const list = byId("version-list");
  const versions = Array.isArray(article?.versions) ? article.versions : [];
  list.innerHTML = versions.length
    ? versions
        .map((v) => {
          const date = new Date(v.savedAt || Date.now()).toLocaleString("de-DE");
          return `<li style="display:flex;justify-content:space-between;gap:var(--space-sm);padding:0.45rem 0;border-bottom:1px solid var(--color-border)">
            <span>${escapeHtml(date)} · ${escapeHtml(v.status || "draft")}</span>
            <button type="button" class="btn btn--ghost btn--small" data-restore-version="${escapeHtml(v.id)}">Wiederherstellen</button>
          </li>`;
        })
        .join("")
    : "<li class=\"form-hint\">Keine Versionen vorhanden.</li>";
}

function restoreVersion(versionId) {
  if (!editingId) return;
  const article = (getCached().articles || []).find((a) => a.id === editingId);
  if (!article || !Array.isArray(article.versions)) return;
  const version = article.versions.find((v) => v.id === versionId);
  if (!version) return;
  byId("art-title").value = version.title || "";
  byId("art-excerpt").value = version.excerpt || "";
  byId("art-edition").value = version.editionId || byId("art-edition").value;
  byId("art-category").value = version.categoryId || byId("art-category").value;
  quill.root.innerHTML = version.contentHtml || "<p></p>";
  updateEditorStats();
  persistDraftBackup();
}

async function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function setupEditorImageUpload() {
  const toolbar = quill.getModule("toolbar");
  toolbar.addHandler("image", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const dataUrl = await readImageAsDataUrl(file);
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", dataUrl, "user");
      quill.setSelection(range.index + 1, 0);
    });
  });
}

function renderComments() {
  const tbody = byId("table-comments").querySelector("tbody");
  const comments = getAllCommentsFlat();
  tbody.innerHTML = comments.length
    ? comments
        .map(
          (c) => `<tr>
      <td>${escapeHtml(c.articleId)}</td>
      <td>${escapeHtml(c.authorName)}</td>
      <td>${escapeHtml(c.text)}</td>
      <td><button class="btn btn--ghost btn--small" data-remove-comment="${escapeHtml(c.articleId)}|${escapeHtml(c.id)}">Entfernen</button></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="4">Keine Kommentare vorhanden.</td></tr>';
}

function renderInbox() {
  const ads = getPendingAds();
  const ideas = getPendingContributions();

  byId("inbox-ads").innerHTML = `
    <h3>Anzeigen</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Titel</th><th>Kontakt</th><th>Status</th></tr></thead>
        <tbody>
          ${
            ads.length
              ? ads
                  .map(
                    (a) =>
                      `<tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.contact || "-")}</td><td>${escapeHtml(a.status || "pending")}</td></tr>`
                  )
                  .join("")
              : '<tr><td colspan="3">Keine Anzeigen eingegangen.</td></tr>'
          }
        </tbody>
      </table>
    </div>`;

  byId("inbox-ideas").innerHTML = `
    <h3>Leserbeitraege</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Titel</th><th>Name</th><th>Status</th></tr></thead>
        <tbody>
          ${
            ideas.length
              ? ideas
                  .map(
                    (i) =>
                      `<tr><td>${escapeHtml(i.title)}</td><td>${escapeHtml(i.authorName || "-")}</td><td>${escapeHtml(i.status || "pending")}</td></tr>`
                  )
                  .join("")
              : '<tr><td colspan="3">Keine Leserbeitraege vorhanden.</td></tr>'
          }
        </tbody>
      </table>
    </div>`;
}

function renderAdsEditorPanel() {
  const ads = getCached().ads || [];
  byId("editor-ads-enabled").checked = !!getSiteContent().adsEnabled;
  const tbody = byId("table-editor-ads").querySelector("tbody");
  tbody.innerHTML = ads.length
    ? ads
        .map(
          (a) => `<tr>
      <td><input data-ead-title="${escapeHtml(a.id)}" value="${escapeHtml(a.title)}" /></td>
      <td><input data-ead-contact="${escapeHtml(a.id)}" value="${escapeHtml(a.contact || "")}" /></td>
      <td>
        <select data-ead-status="${escapeHtml(a.id)}">
          <option value="approved" ${a.status === "approved" ? "selected" : ""}>approved</option>
          <option value="archived" ${a.status === "archived" ? "selected" : ""}>archived</option>
        </select>
      </td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="3">Keine Werbung vorhanden.</td></tr>';
}

function saveAdsFromEditorPanel() {
  const next = [...(getCached().ads || [])].map((a) => ({
    ...a,
    title: byId("table-editor-ads").querySelector(`[data-ead-title="${a.id}"]`)?.value?.trim() || a.title,
    contact: byId("table-editor-ads").querySelector(`[data-ead-contact="${a.id}"]`)?.value?.trim() || a.contact || "",
    status: byId("table-editor-ads").querySelector(`[data-ead-status="${a.id}"]`)?.value || a.status,
  }));
  saveAds(next);
  saveSiteContent({ ...getSiteContent(), adsEnabled: !!byId("editor-ads-enabled").checked });
  renderAdsEditorPanel();
}

function renderPreview() {
  const options = articleRows();
  const select = byId("preview-select");
  select.innerHTML = options.length
    ? options.map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.title)}</option>`).join("")
    : '<option value="">Keine Entwuerfe verfuegbar</option>';

  const selectedId = select.value || options[0]?.id;
  const article = options.find((a) => a.id === selectedId);
  const box = byId("preview-box");
  if (!article) {
    box.innerHTML = "<p>Keine Vorschau verfuegbar.</p>";
    return;
  }
  box.innerHTML = `<h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.excerpt || "")}</p><hr class="ornament-divider" />${
    article.contentHtml || "<p>Kein Inhalt vorhanden.</p>"
  }`;
}

function bindEvents() {
  byId("btn-new-article").addEventListener("click", () => openForm(null));

  byId("table-editor-articles").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-edit-id]");
    if (!btn) return;
    const article = (getCached().articles || []).find((a) => a.id === btn.dataset.editId);
    openForm(article);
  });

  byId("form-article").addEventListener("submit", (event) => {
    event.preventDefault();
    const submitterValue = event.submitter?.value || "draft";
    upsertArticle(submitterValue);
  });

  byId("table-comments").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-remove-comment]");
    if (!btn) return;
    const [articleId, commentId] = btn.dataset.removeComment.split("|");
    removeComment(articleId, commentId);
    renderComments();
  });

  byId("preview-select").addEventListener("change", renderPreview);
  byId("article-search").addEventListener("input", renderArticlesTable);
  byId("article-status-filter").addEventListener("change", renderArticlesTable);
  byId("art-title").addEventListener("input", persistDraftBackup);
  byId("art-excerpt").addEventListener("input", persistDraftBackup);
  byId("art-edition").addEventListener("change", persistDraftBackup);
  byId("art-category").addEventListener("change", persistDraftBackup);
  byId("version-list").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-restore-version]");
    if (!btn) return;
    restoreVersion(btn.dataset.restoreVersion);
  });

  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      const visible = byId("editor-form-wrap").style.display !== "none";
      if (!visible) return;
      event.preventDefault();
      byId("form-article").requestSubmit(byId("btn-save-draft"));
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges) return;
    event.preventDefault();
    event.returnValue = "";
  });
  byId("btn-save-editor-ads").addEventListener("click", saveAdsFromEditorPanel);
}

function initEditor() {
  quill = new window.Quill("#editor", {
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "blockquote", "image"],
        ["clean"],
      ],
    },
  });
  setupEditorImageUpload();
  quill.on("text-change", () => {
    updateEditorStats();
    persistDraftBackup();
  });
}

async function main() {
  const session = requireRole([ROLES.EDITOR, ROLES.ADMIN]);
  if (!session) return;
  canPublishDirectly = session.role === ROLES.ADMIN;
  await seedUsersIfNeeded();
  await loadAllData();
  mountShell();

  initTabs();
  initEditor();
  fillSelect("art-edition", getCached().editions || []);
  fillSelect("art-category", getCached().categories || [], "id", "label");
  byId("btn-save-published").style.display = canPublishDirectly ? "inline-flex" : "none";
  renderArticlesTable();
  renderComments();
  renderAdsEditorPanel();
  renderInbox();
  renderPreview();
  restoreDraftBackupIfUseful();
  bindEvents();
}

main().catch(console.error);
