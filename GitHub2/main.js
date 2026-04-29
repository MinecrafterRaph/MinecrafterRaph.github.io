import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uqqmdsntllughipbrolq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wn-bahf3NdF-sH6B54W8WA_J8OUoAZp";
const ADMIN_CODE = "13243";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = { user: null, projects: [], activeProject: null, activeView: "chat", adminUnlocked: false, adminTable: "projects", adminRows: [], adminSelectedRow: null, editingAnnouncementId: null };

const authView = document.getElementById("authView");
const chatView = document.getElementById("chatView");
const announcementsView = document.getElementById("announcementsView");
const adminView = document.getElementById("adminView");
const adminTabBtn = document.getElementById("adminTabBtn");
const logoutBtn = document.getElementById("logoutBtn");
const topbarTitle = document.getElementById("topbarTitle");
const topbarSubtitle = document.getElementById("topbarSubtitle");
const projectList = document.getElementById("projectList");
const modal = document.getElementById("modal");
const newProjectBtn = document.getElementById("newProjectBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const joinProjectForm = document.getElementById("joinProjectForm");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");
const nameList = document.getElementById("nameList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messageList = document.getElementById("messageList");
const announcementComposer = document.getElementById("announcementComposer");
const announcementForm = document.getElementById("announcementForm");
const announcementTitle = document.getElementById("announcementTitle");
const announcementBody = document.getElementById("announcementBody");
const announcementList = document.getElementById("announcementList");
const adminCodeForm = document.getElementById("adminCodeForm");
const adminCodeInput = document.getElementById("adminCodeInput");
const adminEmailInput = document.getElementById("adminEmailInput");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminTools = document.getElementById("adminTools");
const adminData = document.getElementById("adminData");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");
const adminTableSelect = document.getElementById("adminTableSelect");
const adminSearchInput = document.getElementById("adminSearchInput");
const newAdminRowBtn = document.getElementById("newAdminRowBtn");
const adminEditorForm = document.getElementById("adminEditorForm");
const adminEditorFields = document.getElementById("adminEditorFields");
const adminEditorTitle = document.getElementById("adminEditorTitle");
const deleteAdminRowBtn = document.getElementById("deleteAdminRowBtn");
const duplicateAdminRowBtn = document.getElementById("duplicateAdminRowBtn");
const exportAdminBtn = document.getElementById("exportAdminBtn");
const makeMeAdminBtn = document.getElementById("makeMeAdminBtn");
const bulkJsonInput = document.getElementById("bulkJsonInput");
const bulkInsertBtn = document.getElementById("bulkInsertBtn");
const deleteConfirmInput = document.getElementById("deleteConfirmInput");

const adminTableConfig = { projects: { key: ["id"], preview: ["name", "code"] }, project_members: { key: ["user_id", "project_id"], preview: ["user_id", "project_id"] }, project_names: { key: ["id"], preview: ["display_name", "device_hash"] }, messages: { key: ["id"], preview: ["body", "user_id"] }, announcements: { key: ["id"], preview: ["title", "project_id"] }, app_admins: { key: ["user_id"], preview: ["user_id"] } };

document.getElementById("chatTabBtn").addEventListener("click", () => setView("chat"));
document.getElementById("announcementsTabBtn").addEventListener("click", () => setView("announcements"));
document.getElementById("adminTabBtn").addEventListener("click", () => setView("admin"));
newProjectBtn.addEventListener("click", () => modal.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
logoutBtn.addEventListener("click", async () => { await supabase.auth.signOut(); location.reload(); });
joinProjectForm.addEventListener("submit", onJoinProject);
nameForm.addEventListener("submit", onNameSubmit);
messageForm.addEventListener("submit", onMessageSubmit);
announcementForm.addEventListener("submit", onAnnouncementSubmit);
adminCodeForm.addEventListener("submit", onAdminUnlock);
refreshAdminBtn.addEventListener("click", loadAdminData);
adminTableSelect.addEventListener("change", async () => { state.adminTable = adminTableSelect.value; await loadAdminData(); });
adminSearchInput.addEventListener("input", renderAdminList);
newAdminRowBtn.addEventListener("click", createAdminDraft);
adminEditorForm.addEventListener("submit", onAdminSave);
deleteAdminRowBtn.addEventListener("click", onAdminDelete);
duplicateAdminRowBtn.addEventListener("click", onAdminDuplicate);
exportAdminBtn.addEventListener("click", onAdminExport);
makeMeAdminBtn.addEventListener("click", onMakeMeAdmin);
bulkInsertBtn.addEventListener("click", onBulkInsert);

boot();

async function boot() {
  if (SUPABASE_URL.startsWith("PASTE_")) {
    renderConfigHint();
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return renderAuth();
  state.user = session.user; await loadProjects(); await renderApp();
}

function renderConfigHint() {
  authView.classList.remove("hidden");
  authView.innerHTML = `
    <div class="card">
      <h3>Supabase konfigurieren</h3>
      <p class="muted">Bitte in <code>main.js</code> SUPABASE_URL und SUPABASE_ANON_KEY eintragen.</p>
    </div>
  `;
}

function renderAuth() {
  authView.classList.remove("hidden");
  chatView.classList.add("hidden"); announcementsView.classList.add("hidden"); adminView.classList.add("hidden"); logoutBtn.classList.add("hidden");

  authView.innerHTML = `
    <div class="card" style="max-width:520px;">
      <h3>Account erstellen / Anmelden</h3>
      <p class="muted">Mit Account bekommst du Zugriff auf freigegebene Projekte.</p>
      <form id="authForm" class="stack-form">
        <input id="authEmail" type="email" required placeholder="E-Mail" />
        <input id="authPassword" type="password" required minlength="6" placeholder="Passwort" />
        <button class="btn" type="submit">Registrieren / Login</button>
      </form>
    </div>
  `;

  document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) {
        alert(signUp.error.message);
        return;
      }
    }
    location.reload();
  });
}

async function renderApp() { authView.classList.add("hidden"); logoutBtn.classList.remove("hidden"); adminTabBtn.classList.remove("hidden"); setView("chat"); renderProjectList(); if (state.activeProject) await loadActiveProjectData(); await refreshAdminFlag(); }
function setView(view) { state.activeView = view; chatView.classList.toggle("hidden", view !== "chat"); announcementsView.classList.toggle("hidden", view !== "announcements"); adminView.classList.toggle("hidden", view !== "admin"); [chatView, announcementsView, adminView].forEach((el) => { if (!el.classList.contains("hidden")) { el.style.animation = "none"; void el.offsetHeight; el.style.animation = ""; } }); }

async function loadProjects() {
  const userId = state.user.id;
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id, projects(id, name, code)")
    .eq("user_id", userId);

  if (error) {
    alert(error.message);
    return;
  }

  state.projects = (data || []).map((row) => row.projects).filter(Boolean);
  state.activeProject = state.projects[0] || null;
}

function renderProjectList() {
  projectList.innerHTML = "";
  if (state.projects.length === 0) {
    projectList.innerHTML = `<p class="muted">Noch kein Projekt. Klicke auf "Projekt beitreten".</p>`;
    topbarTitle.textContent = "Kein Projekt ausgewählt";
    topbarSubtitle.textContent = state.user.email;
    return;
  }

  state.projects.forEach((project) => {
    const item = document.createElement("button");
    item.className = `project-item ${state.activeProject?.id === project.id ? "active" : ""}`;
    item.innerHTML = `<strong>${escapeHtml(project.name)}</strong><br><span class="muted">Code: ${escapeHtml(project.code)}</span>`;
    item.addEventListener("click", async () => {
      state.activeProject = project;
      renderProjectList();
      await loadActiveProjectData();
    });
    projectList.appendChild(item);
  });
}

async function onJoinProject(event) {
  event.preventDefault();
  const name = document.getElementById("joinProjectName").value.trim();
  const codeInput = document.getElementById("joinProjectCode").value.trim();
  const code = codeInput || makeCode();

  let project;
  const existing = await supabase.from("projects").select("*").eq("code", code).maybeSingle();
  if (existing.error) {
    alert(existing.error.message);
    return;
  }

  if (existing.data) {
    project = existing.data;
  } else {
    const created = await supabase.from("projects").insert({ name, code, created_by: state.user.id }).select().single();
    if (created.error) {
      alert(created.error.message);
      return;
    }
    project = created.data;
  }

  await supabase
    .from("project_members")
    .upsert({ user_id: state.user.id, project_id: project.id }, { onConflict: "user_id,project_id" });

  modal.classList.add("hidden");
  joinProjectForm.reset();
  await loadProjects();
  renderProjectList();
  await loadActiveProjectData();
}

async function loadActiveProjectData() {
  if (!state.activeProject) return;

  topbarTitle.textContent = state.activeProject.name;
  topbarSubtitle.textContent = `Projektcode: ${state.activeProject.code}`;

  await Promise.all([loadNames(), loadMessages(), loadAnnouncements()]);
}

function currentDeviceHash() {
  const key = "wa_device_hash";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

async function onNameSubmit(event) {
  event.preventDefault();
  if (!state.activeProject) return;

  const deviceHash = currentDeviceHash();
  const name = nameInput.value.trim();
  const payload = {
    project_id: state.activeProject.id,
    user_id: state.user.id,
    display_name: name,
    device_hash: deviceHash,
  };

  const { error } = await supabase.from("project_names").insert(payload);
  if (error) {
    alert("Name konnte nicht eingetragen werden. Wahrscheinlich bereits einmal fuer dieses Geraet.");
    return;
  }
  nameForm.reset();
  await loadNames();
}

async function loadNames() {
  const { data, error } = await supabase
    .from("project_names")
    .select("display_name, created_at")
    .eq("project_id", state.activeProject.id)
    .order("created_at", { ascending: true });
  if (error) {
    alert(error.message);
    return;
  }
  nameList.innerHTML = "";
  for (const row of data || []) {
    const li = document.createElement("li");
    li.className = "chip";
    li.textContent = row.display_name;
    nameList.appendChild(li);
  }
}

async function onMessageSubmit(event) {
  event.preventDefault();
  if (!state.activeProject) return;

  const text = messageInput.value.trim();
  if (!text) return;
  const { error } = await supabase.from("messages").insert({
    project_id: state.activeProject.id,
    user_id: state.user.id,
    body: text,
  });
  if (error) {
    alert(error.message);
    return;
  }
  messageForm.reset();
  await loadMessages();
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("body, created_at, user_id")
    .eq("project_id", state.activeProject.id)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    alert(error.message);
    return;
  }
  messageList.innerHTML = "";
  for (const msg of data || []) {
    const item = document.createElement("div");
    const isOwn = msg.user_id === state.user.id;
    item.className = `message ${isOwn ? "own" : "other"}`;
    const sender = isOwn ? "Du" : shortUser(msg.user_id);
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `
      <div class="message-text">${escapeHtml(msg.body)}</div>
      <div class="message-author">${escapeHtml(sender)} · ${time}</div>
    `;
    messageList.appendChild(item);
  }
  messageList.scrollTop = messageList.scrollHeight;
}

async function onAnnouncementSubmit(event) {
  event.preventDefault();
  if (!state.activeProject) return;
  if (!state.adminUnlocked) return alert("Nur Admins duerfen Ankuendigungen bearbeiten.");
  const payload = { project_id: state.activeProject.id, user_id: state.user.id, title: announcementTitle.value.trim(), body: announcementBody.value.trim() };
  const query = state.editingAnnouncementId ? supabase.from("announcements").update(payload).eq("id", state.editingAnnouncementId) : supabase.from("announcements").insert(payload);
  const { error } = await query;
  if (error) return alert(error.message);
  state.editingAnnouncementId = null; announcementForm.reset(); await loadAnnouncements();
}

async function loadAnnouncements() {
  if (!state.activeProject) return;
  const { data, error } = await supabase.from("announcements")
    .select("*")
    .eq("project_id", state.activeProject.id)
    .order("created_at", { ascending: false });
  if (error) return alert(error.message);
  announcementList.innerHTML = "";
  for (const row of data || []) {
    const card = document.createElement("div");
    card.className = "post";
    card.innerHTML = `<strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.body)}</p><div class="post-meta">${new Date(row.created_at).toLocaleString()}</div>${state.adminUnlocked ? `<div class="post-actions"><button class="btn ghost" data-edit="${row.id}">Bearbeiten</button><button class="btn ghost" data-delete="${row.id}">Loeschen</button></div>` : ""}`;
    card.querySelector("[data-edit]")?.addEventListener("click", () => { state.editingAnnouncementId = row.id; announcementTitle.value = row.title; announcementBody.value = row.body; announcementComposer.classList.remove("hidden"); });
    card.querySelector("[data-delete]")?.addEventListener("click", async () => { await supabase.from("announcements").delete().eq("id", row.id); await loadAnnouncements(); });
    announcementList.appendChild(card);
  }
}

async function onAdminUnlock(event) {
  event.preventDefault();
  if (adminCodeInput.value !== ADMIN_CODE) return alert("Falscher Admin-Code");
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value;
  const login = await supabase.auth.signInWithPassword({ email, password });
  if (login.error) return alert(login.error.message);
  state.user = login.data.user;
  const ok = await refreshAdminFlag();
  if (!ok) return alert("Kein Admin-Zugriff fuer diesen Account.");
  adminTools.classList.remove("hidden");
  announcementComposer.classList.remove("hidden");
  await loadProjects();
  renderProjectList();
  await loadAdminData();
}
async function refreshAdminFlag() { const { data } = await supabase.from("app_admins").select("user_id").eq("user_id", state.user.id).maybeSingle(); state.adminUnlocked = Boolean(data); if (state.adminUnlocked) announcementComposer.classList.remove("hidden"); return state.adminUnlocked; }

async function loadAdminData() {
  if (!state.adminUnlocked) return;
  const selectedTable = state.adminTable;
  const tableQuery = supabase.from(selectedTable).select("*").limit(200);
  const hasCreatedAtSort = selectedTable !== "project_members" && selectedTable !== "app_admins";
  if (hasCreatedAtSort) tableQuery.order("created_at", { ascending: false });
  const { data, error } = await tableQuery;
  if (error) {
    alert(error.message);
    return;
  }

  state.adminRows = data || [];
  state.adminSelectedRow = null;
  renderAdminList();
  createAdminDraft();
}

function renderAdminList() {
  adminData.innerHTML = "";
  const term = adminSearchInput.value.trim().toLowerCase();
  const rows = term
    ? state.adminRows.filter((r) => JSON.stringify(r).toLowerCase().includes(term))
    : state.adminRows;
  const selectedTable = state.adminTable;
  const previewFields = adminTableConfig[selectedTable]?.preview || [];
  if (rows.length === 0) {
    adminData.innerHTML = `<div class="post muted">Keine Daten in dieser Tabelle.</div>`;
    return;
  }

  rows.forEach((row, index) => {
    const rowEl = document.createElement("button");
    rowEl.className = `post admin-row ${state.adminSelectedRow === row ? "active" : ""}`;
    const previewText = previewFields
      .map((field) => `${field}: ${String(row[field] ?? "-").slice(0, 70)}`)
      .join(" | ");
    rowEl.innerHTML = `
      <span>${escapeHtml(previewText || JSON.stringify(row).slice(0, 80))}</span>
      <span class="pill">#${index + 1}</span>
    `;
    rowEl.addEventListener("click", () => {
      state.adminSelectedRow = row;
      renderAdminList();
      renderAdminEditor(row, false, index);
    });
    adminData.appendChild(rowEl);
  });
}

function createAdminDraft() {
  state.adminSelectedRow = null;
  deleteConfirmInput.value = "";
  renderAdminList();
  const draft = inferEmptyRowForTable(state.adminTable);
  renderAdminEditor(draft, true, -1);
}

function inferEmptyRowForTable(table) {
  const row = {};
  if (state.adminRows[0]) {
    for (const key of Object.keys(state.adminRows[0])) {
      row[key] = "";
    }
  } else {
    if (table === "projects") row.name = "";
    if (table === "projects") row.code = "";
    if (table === "projects") row.created_by = state.user.id;
    if (table === "project_members") {
      row.user_id = "";
      row.project_id = "";
    }
    if (table === "project_names") {
      row.project_id = "";
      row.user_id = "";
      row.display_name = "";
      row.device_hash = "";
    }
    if (table === "messages") {
      row.project_id = "";
      row.user_id = "";
      row.body = "";
    }
    if (table === "announcements") {
      row.project_id = "";
      row.user_id = "";
      row.title = "";
      row.body = "";
    }
    if (table === "app_admins") {
      row.user_id = "";
    }
  }
  return row;
}

function renderAdminEditor(row, isNew, originalIndex) {
  adminEditorTitle.textContent = isNew ? `Neuer Datensatz (${state.adminTable})` : `Datensatz bearbeiten (${state.adminTable})`;
  adminEditorForm.dataset.mode = isNew ? "create" : "update";
  adminEditorForm.dataset.index = String(originalIndex);
  adminEditorFields.innerHTML = "";
  const keys = Object.keys(row);
  if (keys.length === 0) {
    adminEditorFields.innerHTML = `<p class="muted">Keine Felder gefunden.</p>`;
    return;
  }

  for (const key of keys) {
    const wrapper = document.createElement("div");
    wrapper.className = "admin-field";
    const value = row[key];
    wrapper.innerHTML = `
      <label>${escapeHtml(key)}</label>
      ${String(value ?? "").length > 100 || key === "body" ? `<textarea data-key="${escapeHtml(key)}">${escapeHtml(value ?? "")}</textarea>` : `<input data-key="${escapeHtml(key)}" value="${escapeHtml(value ?? "")}" />`}
    `;
    adminEditorFields.appendChild(wrapper);
  }
}

async function onAdminDuplicate() {
  if (!state.adminSelectedRow) return alert("Bitte zuerst eine Zeile auswaehlen.");
  const table = state.adminTable;
  const payload = { ...state.adminSelectedRow };
  delete payload.id;
  delete payload.created_at;
  const keyFields = adminTableConfig[table]?.key || [];
  for (const key of keyFields) {
    if (key !== "user_id") delete payload[key];
  }
  const { error } = await supabase.from(table).insert(payload);
  if (error) return alert(error.message);
  await loadAdminData();
}

function onAdminExport() {
  const table = state.adminTable;
  const blob = new Blob([JSON.stringify(state.adminRows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${table}-export.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function onMakeMeAdmin() {
  const { error } = await supabase.from("app_admins").upsert({ user_id: state.user.id }, { onConflict: "user_id" });
  if (error) return alert(error.message);
  await refreshAdminFlag();
  await loadAdminData();
  alert("Du bist jetzt als App-Admin eingetragen.");
}

async function onBulkInsert() {
  if (!state.adminUnlocked) return;
  const raw = bulkJsonInput.value.trim();
  if (!raw) return alert("Bitte JSON einfuegen.");
  let rows;
  try {
    rows = JSON.parse(raw);
  } catch {
    return alert("Ungueltiges JSON.");
  }
  if (!Array.isArray(rows) || rows.length === 0) return alert("Bitte ein JSON-Array mit Datensaetzen angeben.");
  if (rows.length > 50) return alert("Maximal 50 Datensaetze pro Bulk Insert.");
  const cleaned = rows.map((r) => {
    const copy = { ...r };
    delete copy.id;
    delete copy.created_at;
    return copy;
  });
  const { error } = await supabase.from(state.adminTable).insert(cleaned);
  if (error) return alert(error.message);
  bulkJsonInput.value = "";
  await loadAdminData();
}

async function onAdminSave(event) {
  event.preventDefault();
  if (!state.adminUnlocked) return;
  const table = state.adminTable;
  const payload = readAdminPayloadFromForm();
  const mode = adminEditorForm.dataset.mode || "create";
  const keyFields = adminTableConfig[table]?.key || ["id"];
  const originalRow = state.adminSelectedRow;

  if (mode === "update" && originalRow) {
    let query = supabase.from(table).update(payload);
    for (const key of keyFields) {
      query = query.eq(key, originalRow[key]);
    }
    const { error } = await query;
    if (error) {
      alert(error.message);
      return;
    }
  } else {
    const cleanPayload = { ...payload };
    delete cleanPayload.id;
    delete cleanPayload.created_at;
    const { error } = await supabase.from(table).insert(cleanPayload);
    if (error) {
      alert(error.message);
      return;
    }
  }
  await loadAdminData();
}

async function onAdminDelete() {
  if (!state.adminUnlocked) return;
  if (!state.adminSelectedRow) {
    alert("Bitte zuerst einen Datensatz auswaehlen.");
    return;
  }
  if (deleteConfirmInput.value.trim() !== "DELETE") return alert('Bitte erst "DELETE" in das Feld eingeben.');

  const table = state.adminTable;
  const keyFields = adminTableConfig[table]?.key || ["id"];
  const row = state.adminSelectedRow;
  let query = supabase.from(table).delete();
  for (const key of keyFields) {
    query = query.eq(key, row[key]);
  }
  const { error } = await query;
  if (error) {
    alert(error.message);
    return;
  }
  await loadAdminData();
}

function readAdminPayloadFromForm() {
  const payload = {};
  const inputs = adminEditorFields.querySelectorAll("input[data-key], textarea[data-key]");
  inputs.forEach((input) => {
    const key = input.dataset.key;
    let value = input.value;
    if (value === "") value = null;
    payload[key] = value;
  });
  return payload;
}

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function shortUser(userId) {
  if (!userId) return "User";
  return `User ${String(userId).slice(0, 4)}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
