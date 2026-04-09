import { ROLES, requireRole, getSession, seedUsersIfNeeded, getUsers } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getWorkflowItems, updateWorkflowItem } from "../core/workflow.js";

let quill = null;
let pendingPdfDataUrl = null;
let pendingPdfFileName = "";
let removePdfOnSave = false;

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
  pendingPdfDataUrl = item.pdfDataUrl || null;
  pendingPdfFileName = item.pdfFileName || "";
  removePdfOnSave = false;
  renderPdfState();
}

function sendToDesigner() {
  const id = byId("wf-id").value;
  if (!id) return;
  updateWorkflowItem(id, {
    title: byId("wf-title").value.trim(),
    editorHtml: quill.root.innerHTML,
    editorNotes: byId("wf-editor-notes").value.trim(),
    assignedDesignerId: byId("wf-designer").value,
    pdfDataUrl: removePdfOnSave ? null : pendingPdfDataUrl,
    pdfFileName: removePdfOnSave ? "" : pendingPdfFileName,
    stage: "designer",
    status: "ready_for_designer",
  });
  byId("wf-id").value = "";
  byId("wf-title").value = "";
  byId("wf-editor-notes").value = "";
  quill.root.innerHTML = "<p></p>";
  pendingPdfDataUrl = null;
  pendingPdfFileName = "";
  removePdfOnSave = false;
  renderPdfState();
  renderTable();
}

function saveEditorDraft() {
  const id = byId("wf-id").value;
  if (!id) return;
  updateWorkflowItem(id, {
    title: byId("wf-title").value.trim(),
    editorHtml: quill.root.innerHTML,
    editorNotes: byId("wf-editor-notes").value.trim(),
    pdfDataUrl: removePdfOnSave ? null : pendingPdfDataUrl,
    pdfFileName: removePdfOnSave ? "" : pendingPdfFileName,
    status: "editor_draft",
  });
  renderTable();
}

function renderPdfState() {
  const info = byId("wf-pdf-info");
  const open = byId("wf-pdf-open");
  if (!pendingPdfDataUrl || removePdfOnSave) {
    info.textContent = "Kein PDF hinterlegt.";
    open.style.display = "none";
    open.removeAttribute("href");
    return;
  }
  info.textContent = `PDF hinterlegt: ${pendingPdfFileName || "Dokument.pdf"}`;
  open.href = pendingPdfDataUrl;
  open.style.display = "inline-flex";
}

function setupPdfUpload() {
  byId("wf-pdf").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Bitte nur PDF-Dateien hochladen.");
      event.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("PDF ist zu gross. Bitte maximal 3 MB hochladen.");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      pendingPdfDataUrl = dataUrl;
      pendingPdfFileName = file.name || "Zeitung.pdf";
      removePdfOnSave = false;
      renderPdfState();
    } catch {
      alert("PDF konnte nicht gelesen werden.");
    } finally {
      event.target.value = "";
    }
  });
  byId("wf-pdf-remove").addEventListener("click", () => {
    removePdfOnSave = true;
    renderPdfState();
  });
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
  setupPdfUpload();
  renderPdfState();
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
