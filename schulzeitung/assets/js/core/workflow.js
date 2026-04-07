import { LS_KEYS, readJson, writeJson } from "./storage.js";

export function getWorkflowItems() {
  return readJson(LS_KEYS.WORKFLOW_ITEMS, []);
}

export function saveWorkflowItems(items) {
  writeJson(LS_KEYS.WORKFLOW_ITEMS, items);
}

export function createWorkflowItem(item) {
  const all = getWorkflowItems();
  const next = {
    id: `wf-${Date.now()}`,
    stage: "admin_review",
    status: "submitted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
    ...item,
  };
  all.unshift(next);
  saveWorkflowItems(all);
  return next;
}

export function updateWorkflowItem(id, patch) {
  const all = getWorkflowItems();
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  const prev = all[idx];
  const snapshot = {
    at: new Date().toISOString(),
    stage: prev.stage,
    status: prev.status,
    title: prev.title,
    summary: prev.summary,
    rewrittenText: prev.rewrittenText || "",
    editorHtml: prev.editorHtml || "",
    adminNotes: prev.adminNotes || "",
    editorNotes: prev.editorNotes || "",
    assignedEditorId: prev.assignedEditorId || "",
    assignedDesignerId: prev.assignedDesignerId || "",
  };
  all[idx] = {
    ...prev,
    ...patch,
    versions: [snapshot, ...(prev.versions || [])].slice(0, 30),
    updatedAt: new Date().toISOString(),
  };
  saveWorkflowItems(all);
  return all[idx];
}
