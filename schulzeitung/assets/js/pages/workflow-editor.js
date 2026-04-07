import { ROLES, requireRole, getSession, seedUsersIfNeeded, getUsers } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getWorkflowItems, updateWorkflowItem } from "../core/workflow.js";

let quill = null;

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function designers() {
  return getUsers().filter((u) => u.role === ROLES.DESIGNER);
}

function renderTable() {
  const s = getSession();
  const rows = getWorkflowItems().filter((w) => w.stage === "editor" && w.assignedEditorId === s.id);
  byId("wf-table-editor").querySelector("tbody").innerHTML = rows.length
    ? rows
        .map(
          (w) => `<tr><td>${escapeHtml(w.title)}</td><td>${escapeHtml(w.status)}</td><td><button class="btn btn--ghost btn--small" data-open="${escapeHtml(w.id)}">Bearbeiten</button></td></tr>`
        )
        .join("")
    : '<tr><td colspan="3">Keine Auftraege zugewiesen.</td></tr>';
}

function fillDesignerSelect() {
  byId("wf-designer").innerHTML = designers()
    .map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.displayName)}</option>`)
    .join("");
}

function openItem(id) {
  const item = getWorkflowItems().find((w) => w.id === id);
  if (!item) return;
  byId("wf-id").value = item.id;
  byId("wf-title").value = item.title || "";
  byId("wf-editor-notes").value = item.editorNotes || "";
  if (item.assignedDesignerId) byId("wf-designer").value = item.assignedDesignerId;
  quill.root.innerHTML = item.editorHtml || item.rewrittenText || "<p></p>";
}

function sendToDesigner() {
  const id = byId("wf-id").value;
  if (!id) return;
  updateWorkflowItem(id, {
    title: byId("wf-title").value.trim(),
    editorHtml: quill.root.innerHTML,
    editorNotes: byId("wf-editor-notes").value.trim(),
    assignedDesignerId: byId("wf-designer").value,
    stage: "designer",
    status: "ready_for_designer",
  });
  byId("wf-id").value = "";
  byId("wf-title").value = "";
  byId("wf-editor-notes").value = "";
  quill.root.innerHTML = "<p></p>";
  renderTable();
}

function saveEditorDraft() {
  const id = byId("wf-id").value;
  if (!id) return;
  updateWorkflowItem(id, {
    title: byId("wf-title").value.trim(),
    editorHtml: quill.root.innerHTML,
    editorNotes: byId("wf-editor-notes").value.trim(),
    status: "editor_draft",
  });
  renderTable();
}

async function main() {
  if (!requireRole([ROLES.EDITOR, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  mountShell();

  quill = new window.Quill("#wf-editor-box", {
    theme: "snow",
    modules: { toolbar: [[{ header: [2, 3, false] }], ["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], ["link", "clean"]] },
  });
  fillDesignerSelect();
  renderTable();

  byId("wf-table-editor").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-open]");
    if (!btn) return;
    openItem(btn.dataset.open);
  });
  byId("wf-send-designer").addEventListener("click", sendToDesigner);
  byId("wf-save-draft").addEventListener("click", saveEditorDraft);
}

main().catch(console.error);
