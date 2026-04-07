import { ROLES, requireRole, getSession, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { loadAllData, getCached, saveArticles } from "../core/data-service.js";
import { getWorkflowItems, updateWorkflowItem } from "../core/workflow.js";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function renderItems() {
  const session = getSession();
  const rows = getWorkflowItems().filter((w) => w.stage === "designer" && w.assignedDesignerId === session.id);
  byId("designer-table").querySelector("tbody").innerHTML = rows.length
    ? rows
        .map(
          (w) => `<tr>
      <td>${escapeHtml(w.title)}</td>
      <td>${escapeHtml(w.editorNotes || "-")} (${escapeHtml(w.status)})</td>
      <td><button class="btn btn--primary btn--small" data-import="${escapeHtml(w.id)}">Als Artikel importieren</button></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="3">Keine Designer-Auftraege vorhanden.</td></tr>';
}

function importWorkflowAsArticle(id) {
  const wf = getWorkflowItems().find((w) => w.id === id);
  if (!wf) return;
  const editions = getCached().editions || [];
  const categories = getCached().categories || [];
  const articles = [...(getCached().articles || [])];
  const now = new Date().toISOString().slice(0, 10);

  articles.unshift({
    id: `art-${Date.now()}`,
    editionId: editions[0]?.id || "1",
    title: wf.title || "Neuer Beitrag",
    slug: (wf.title || "neuer-beitrag").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    excerpt: wf.summary || "",
    categoryId: categories[0]?.id || "schulleben",
    authorId: "a4",
    publishedAt: now,
    status: "draft",
    featured: false,
    embed: null,
    contentHtml: wf.editorHtml || `<p>${escapeHtml(wf.rewrittenText || "")}</p>`,
    versions: [],
  });
  saveArticles(articles);
  updateWorkflowItem(id, { stage: "done", status: "imported_draft" });
  renderItems();
}

async function main() {
  if (!requireRole([ROLES.DESIGNER, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  await loadAllData();
  mountShell();
  renderItems();
  byId("designer-table").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-import]");
    if (!btn) return;
    importWorkflowAsArticle(btn.dataset.import);
  });
}

main().catch(console.error);
