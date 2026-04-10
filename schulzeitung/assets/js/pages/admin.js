import {
  ROLES,
  PERMISSIONS,
  requireRole,
  seedUsersIfNeeded,
  getUsers,
  saveUsers,
  getRoleDefinitions,
  saveRoleDefinitions,
  availableRoles,
} from "../core/auth.js";
import { loadAllData, getCached, saveArticles, saveAds, getSiteContent, saveSiteContent } from "../core/data-service.js";
import { getPendingAds, getPendingContributions, removePendingAd, removePendingContribution } from "../core/pending.js";
import { publishSiteNotice, clearSiteNotice, getSiteNotice } from "../core/notifications.js";
import { getWorkflowItems, createWorkflowItem, updateWorkflowItem } from "../core/workflow.js";
import { getPuzzles, savePuzzles } from "../core/puzzles.js";
import { mountShell } from "../ui/shell.js";

const LOGIN_GUARD_KEY = "sz_login_guard_v1";
const ADMIN_AUDIT_KEY = "sz_admin_audit_v1";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = value == null ? "" : String(value);
  return el.innerHTML;
}

function switchPanel(panelId) {
  document.querySelectorAll("#admin-nav button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.panel === panelId);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-visible", panel.id === `panel-${panelId}`);
  });
}

function readLoginGuard() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_GUARD_KEY)) || { fails: 0, lockUntil: 0 };
  } catch {
    return { fails: 0, lockUntil: 0 };
  }
}

function readAuditLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADMIN_AUDIT_KEY)) || [];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function pushAudit(action, detail = "") {
  const item = {
    at: new Date().toISOString(),
    action,
    detail,
  };
  const next = [item, ...readAuditLog()].slice(0, 60);
  localStorage.setItem(ADMIN_AUDIT_KEY, JSON.stringify(next));
  renderAuditLog();
}

function clearAuditLog() {
  localStorage.removeItem(ADMIN_AUDIT_KEY);
  renderAuditLog();
}

function renderAuditLog() {
  const host = byId("admin-audit-list");
  if (!host) return;
  const rows = readAuditLog();
  host.innerHTML = rows.length
    ? rows
        .map(
          (row) =>
            `<li><strong>${escapeHtml(new Date(row.at).toLocaleString("de-DE"))}</strong> · ${escapeHtml(row.action)} ${row.detail ? `(${escapeHtml(row.detail)})` : ""}</li>`
        )
        .join("")
    : "<li>Noch keine protokollierten Aktionen.</li>";
}

function renderSecurityPanel() {
  const host = byId("security-status");
  if (!host) return;
  const guard = readLoginGuard();
  const now = Date.now();
  const locked = guard.lockUntil && now < guard.lockUntil;
  const remaining = locked ? Math.ceil((guard.lockUntil - now) / 1000) : 0;
  host.innerHTML = `
    <h3 style="margin-top:0">Sicherheitsstatus</h3>
    <ul>
      <li>Fehlversuche im Login-Guard: <strong>${escapeHtml(guard.fails || 0)}</strong></li>
      <li>Globale Login-Sperre aktiv: <strong>${locked ? "Ja" : "Nein"}</strong></li>
      <li>Verbleibende Sperrzeit: <strong>${locked ? `${remaining} Sekunden` : "0 Sekunden"}</strong></li>
    </ul>
    <div style="margin-top:var(--space-md);display:flex;gap:var(--space-sm);flex-wrap:wrap">
      <button class="btn btn--ghost btn--small" id="security-reset-guard" type="button">Login-Guard zurücksetzen</button>
    </div>
  `;
  byId("security-reset-guard")?.addEventListener("click", () => {
    localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify({ fails: 0, lockUntil: 0 }));
    pushAudit("Login-Guard zurückgesetzt");
    renderSecurityPanel();
  });
}

function initTabs() {
  byId("admin-nav").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-panel]");
    if (!btn) return;
    switchPanel(btn.dataset.panel);
  });
}

function renderStats() {
  const articles = getCached().articles || [];
  const users = getUsers();
  const reviewCount = articles.filter((a) => a.status === "review").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;
  const html = [
    ["Nutzer", users.length],
    ["Artikel zur Freigabe", reviewCount],
    ["Entwuerfe", draftCount],
    ["Offene Anzeigen", getPendingAds().length],
    ["Offene Beitraege", getPendingContributions().length],
    ["Workflow offen", getWorkflowItems().filter((w) => w.status !== "done").length],
  ]
    .map(
      ([label, value]) => `<article class="stat-box">
        <div class="stat-box__value">${escapeHtml(value)}</div>
        <div>${escapeHtml(label)}</div>
      </article>`
    )
    .join("");
  byId("admin-stats").innerHTML = html;
}

function renderReviews() {
  const tbody = byId("table-reviews").querySelector("tbody");
  const rows = (getCached().articles || []).filter((a) => a.status === "review");
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (a) => `<tr>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(a.editionId)}</td>
      <td>
        <button class="btn btn--primary btn--small" data-publish="${escapeHtml(a.id)}">Veroeffentlichen</button>
        <button class="btn btn--ghost btn--small" data-to-draft="${escapeHtml(a.id)}">Zu Entwurf</button>
      </td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="3">Keine Artikel zur Freigabe.</td></tr>';
}

function updateArticleStatus(id, status) {
  const all = [...(getCached().articles || [])];
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], status };
  saveArticles(all);
  pushAudit("Artikelstatus geändert", `${id} -> ${status}`);
  renderReviews();
  renderStats();
}

function renderSubmissions() {
  const ads = getPendingAds();
  const ideas = getPendingContributions();
  byId("admin-submissions").innerHTML = `
    <h3>Anzeigen</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Titel</th><th>Kontakt</th><th>Aktionen</th></tr></thead>
        <tbody>
        ${
          ads.length
            ? ads
                .map(
                  (a) => `<tr>
              <td>${escapeHtml(a.title)}</td>
              <td>${escapeHtml(a.contact || "-")}</td>
              <td>
                <button class="btn btn--primary btn--small" data-approve-ad="${escapeHtml(a.id)}">Freigeben</button>
                <button class="btn btn--ghost btn--small" data-workflow-ad="${escapeHtml(a.id)}">In Workflow</button>
                <button class="btn btn--ghost btn--small" data-reject-ad="${escapeHtml(a.id)}">Ablehnen</button>
              </td>
            </tr>`
                )
                .join("")
            : '<tr><td colspan="3">Keine offenen Anzeigen.</td></tr>'
        }
        </tbody>
      </table>
    </div>
    <h3 style="margin-top:var(--space-lg)">Leserbeitraege</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Titel</th><th>Name</th><th>Unterkategorie</th><th>Aktionen</th></tr></thead>
        <tbody>
        ${
          ideas.length
            ? ideas
                .map(
                  (i) => `<tr>
              <td>${escapeHtml(i.title)}</td>
              <td>${escapeHtml(i.authorName || "-")}</td>
              <td>${escapeHtml(i.subcategory || "-")}</td>
              <td>
                <button class="btn btn--primary btn--small" data-workflow-idea="${escapeHtml(i.id)}">In Workflow</button>
                <button class="btn btn--ghost btn--small" data-reject-idea="${escapeHtml(i.id)}">Archivieren</button>
              </td>
            </tr>`
                )
                .join("")
            : '<tr><td colspan="4">Keine offenen Beitraege.</td></tr>'
        }
        </tbody>
      </table>
    </div>`;
}

function renderAdsEditor() {
  const ads = getCached().ads || [];
  byId("ads-enabled").checked = !!getSiteContent().adsEnabled;
  byId("table-ads").querySelector("tbody").innerHTML = ads.length
    ? ads
        .map(
          (a) => `<tr>
      <td><input data-ad-title="${escapeHtml(a.id)}" value="${escapeHtml(a.title)}" /></td>
      <td><input data-ad-contact="${escapeHtml(a.id)}" value="${escapeHtml(a.contact || "")}" /></td>
      <td>
        <select data-ad-status="${escapeHtml(a.id)}">
          <option value="approved" ${a.status === "approved" ? "selected" : ""}>approved</option>
          <option value="archived" ${a.status === "archived" ? "selected" : ""}>archived</option>
        </select>
      </td>
      <td><button class="btn btn--ghost btn--small" data-ad-delete="${escapeHtml(a.id)}">Löschen</button></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="4">Keine Werbung vorhanden.</td></tr>';
}

function saveAdsFromEditor() {
  const rows = [...(getCached().ads || [])].map((a) => ({
    ...a,
    title: byId("table-ads").querySelector(`[data-ad-title="${a.id}"]`)?.value?.trim() || a.title,
    contact: byId("table-ads").querySelector(`[data-ad-contact="${a.id}"]`)?.value?.trim() || a.contact || "",
    status: byId("table-ads").querySelector(`[data-ad-status="${a.id}"]`)?.value || a.status,
  }));
  saveAds(rows);
  const site = getSiteContent();
  saveSiteContent({ ...site, adsEnabled: !!byId("ads-enabled").checked });
  pushAudit("Werbung gespeichert", `Anzahl: ${rows.length}`);
  renderAdsEditor();
}

function removeAd(id) {
  saveAds((getCached().ads || []).filter((a) => a.id !== id));
  pushAudit("Werbung gelöscht", id);
  renderAdsEditor();
}

function renderPuzzleBuilder() {
  const editions = getCached().editions || [];
  const select = byId("pz-edition");
  select.innerHTML = editions.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join("");
  const loadSelected = () => {
    const puzzles = getPuzzles();
    const p = puzzles[select.value] || { title: "", intro: "", questions: [] };
    byId("pz-title").value = p.title || "";
    byId("pz-intro").value = p.intro || "";
    byId("pz-items").value = JSON.stringify(p.questions || [], null, 2);
  };
  select.onchange = loadSelected;
  loadSelected();
}

function savePuzzleFromBuilder() {
  const editionId = byId("pz-edition").value;
  if (!editionId) return;
  let items = [];
  try {
    items = JSON.parse(byId("pz-items").value || "[]");
    if (!Array.isArray(items)) throw new Error("invalid");
  } catch {
    alert("Rätsel-JSON ist ungültig.");
    return;
  }
  const puzzles = getPuzzles();
  puzzles[editionId] = {
    title: byId("pz-title").value.trim() || "Rätsel",
    intro: byId("pz-intro").value.trim(),
    questions: items,
  };
  savePuzzles(puzzles);
  pushAudit("Rätsel gespeichert", editionId);
  alert("Rätsel gespeichert.");
}

function editorUsers() {
  return getUsers().filter((u) => u.role === ROLES.EDITOR);
}

function renderWorkflow() {
  const tbody = byId("table-workflow").querySelector("tbody");
  const rows = getWorkflowItems();
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (w) => `<tr>
      <td>${escapeHtml(w.title)}</td>
      <td>${escapeHtml(w.stage)} · ${escapeHtml(w.status)}</td>
      <td>${escapeHtml(w.assignedEditorId || "-")} / ${escapeHtml(w.assignedDesignerId || "-")}</td>
      <td><button class="btn btn--ghost btn--small" data-open-wf="${escapeHtml(w.id)}">Bearbeiten</button></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="4">Noch keine Workflow-Elemente.</td></tr>';

  const edSelect = byId("wf-editor");
  edSelect.innerHTML = editorUsers()
    .map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.displayName)}</option>`)
    .join("");
}

function openWorkflow(id) {
  const wf = getWorkflowItems().find((x) => x.id === id);
  if (!wf) return;
  byId("wf-id").value = wf.id;
  byId("wf-title").value = wf.title || "";
  byId("wf-summary").value = wf.summary || "";
  byId("wf-rewrite").value = wf.rewrittenText || "";
  byId("wf-notes").value = wf.adminNotes || "";
  if (wf.assignedEditorId) byId("wf-editor").value = wf.assignedEditorId;
}

function createWorkflowFromAd(id) {
  const ad = getPendingAds().find((a) => a.id === id);
  if (!ad) return;
  createWorkflowItem({
    sourceType: "ad",
    sourceId: ad.id,
    title: ad.title,
    summary: ad.description || "",
    rewrittenText: ad.description || "",
    adminNotes: "",
  });
  removePendingAd(id);
  renderSubmissions();
  renderWorkflow();
  renderStats();
}

function createWorkflowFromIdea(id) {
  const idea = getPendingContributions().find((i) => i.id === id);
  if (!idea) return;
  createWorkflowItem({
    sourceType: "contribution",
    sourceId: idea.id,
    title: idea.title,
    summary: `[${idea.subcategory || "beitrag"}] ${idea.body || ""}`,
    rewrittenText: idea.body || "",
    adminNotes: "",
    sketchDataUrl: idea.sketchDataUrl || null,
  });
  removePendingContribution(id);
  renderSubmissions();
  renderWorkflow();
  renderStats();
}

function saveWorkflowFromForm() {
  const id = byId("wf-id").value;
  if (!id) return;
  updateWorkflowItem(id, {
    title: byId("wf-title").value.trim(),
    summary: byId("wf-summary").value.trim(),
    rewrittenText: byId("wf-rewrite").value.trim(),
    adminNotes: byId("wf-notes").value.trim(),
    assignedEditorId: byId("wf-editor").value,
    stage: "editor",
    status: "ready_for_editor",
  });
  pushAudit("Workflow aktualisiert", id);
  renderWorkflow();
  renderStats();
}

function approveAd(id) {
  const ad = getPendingAds().find((a) => a.id === id);
  if (!ad) return;
  const allAds = [...(getCached().ads || [])];
  allAds.push({
    id: `ad-${Date.now()}`,
    title: ad.title,
    description: ad.description,
    contact: ad.contact,
    price: ad.price || "",
    imageDataUrl: ad.imageDataUrl || null,
    status: "approved",
    createdAt: ad.createdAt || new Date().toISOString(),
  });
  saveAds(allAds);
  removePendingAd(id);
  pushAudit("Anzeige freigegeben", id);
  renderSubmissions();
  renderStats();
}

function renderUsers() {
  const tbody = byId("table-users").querySelector("tbody");
  const users = getUsers();
  const roles = availableRoles();
  tbody.innerHTML = users
    .map(
      (u) => `<tr>
      <td>${escapeHtml(u.displayName)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>
        <select data-role-user="${escapeHtml(u.id)}">
          ${roles
            .map((r) => `<option value="${escapeHtml(r)}" ${u.role === r ? "selected" : ""}>${escapeHtml(r)}</option>`)
            .join("")}
        </select>
      </td>
      <td>
        <button class="btn btn--ghost btn--small" data-delete-user="${escapeHtml(u.id)}">Loeschen</button>
      </td>
    </tr>`
    )
    .join("");
}

function renderRoleManager() {
  const defs = getRoleDefinitions();
  const perms = Object.values(PERMISSIONS);
  byId("roles-permissions").innerHTML = Object.keys(defs)
    .map(
      (roleId) => `<section class="card" style="margin-bottom: var(--space-md)">
      <h3>${escapeHtml(roleId)}</h3>
      ${perms
        .map((p) => {
          const checked = defs[roleId]?.permissions?.includes(p) ? "checked" : "";
          return `<label style="display:block;margin-bottom:0.35rem"><input type="checkbox" data-role-perm="${escapeHtml(
            roleId
          )}|${escapeHtml(p)}" ${checked} /> ${escapeHtml(p)}</label>`;
        })
        .join("")}
    </section>`
    )
    .join("");
}

function addRole() {
  const raw = byId("new-role-id").value.trim().toLowerCase();
  if (!raw) return;
  if (!/^[a-z0-9_-]{3,32}$/.test(raw)) {
    alert("Rollen-ID ist ungueltig (3-32 Zeichen, a-z, 0-9, _ oder -).");
    return;
  }
  const defs = getRoleDefinitions();
  if (defs[raw]) {
    alert("Diese Rolle existiert bereits.");
    return;
  }
  defs[raw] = { label: raw, permissions: [] };
  saveRoleDefinitions(defs);
  byId("new-role-id").value = "";
  renderRoleManager();
  renderUsers();
}

function toggleRolePermission(roleId, permission, enabled) {
  const defs = getRoleDefinitions();
  const role = defs[roleId];
  if (!role) return;
  const set = new Set(role.permissions || []);
  if (enabled) set.add(permission);
  else set.delete(permission);
  defs[roleId] = { ...role, permissions: [...set] };
  saveRoleDefinitions(defs);
}

function updateRole(id, role) {
  const changed = getUsers().find((u) => u.id === id);
  const fromRole = changed?.role || "-";
  const users = getUsers();
  const next = users.map((u) => (u.id === id ? { ...u, role } : u));
  saveUsers(next);
  pushAudit("Rolle geändert", `${id}: ${fromRole} -> ${role}`);
  renderUsers();
}

function deleteUser(id) {
  const users = getUsers();
  const admins = users.filter((u) => u.role === ROLES.ADMIN);
  const target = users.find((u) => u.id === id);
  if (target?.role === ROLES.ADMIN && admins.length <= 1) {
    alert("Der letzte Admin kann nicht geloescht werden.");
    return;
  }
  if (!confirm("Nutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
  saveUsers(users.filter((u) => u.id !== id));
  pushAudit("Nutzer gelöscht", id);
  renderUsers();
  renderStats();
}

function initSiteNoticeForm() {
  const current = getSiteNotice();
  byId("site-notice-message").value = current?.message || "";
  byId("site-theme").value = getSiteContent().theme || "classic";
}

function initWebsiteSettingsForm() {
  const site = getSiteContent();
  byId("site-hero-eyebrow").value = site.heroEyebrow || "";
  byId("site-hero-title").value = site.heroTitle || "";
  byId("site-hero-subtitle").value = site.heroSubtitle || "";
  byId("site-about-html").value = site.aboutHtml || "";
  byId("site-contact-email").value = site.contactEmail || "";
  byId("site-contact-phone").value = site.contactPhone || "";
  byId("site-contact-room").value = site.contactRoom || "";
  byId("site-highlights-count").value = String(site.highlightsCount || 4);
  byId("site-photo-band-enabled").checked = site.photoBandEnabled !== false;
  byId("site-redakteur-notice").value = site.redakteurNotice || "";
  byId("site-editor-notice").value = site.editorNotice || "";
  byId("site-vip-notice").value = site.vipNotice || "";
  byId("site-sponsor-notice").value = site.sponsorNotice || "";
}

function saveWebsiteSettings() {
  const prev = getSiteContent();
  const next = {
    ...prev,
    heroEyebrow: byId("site-hero-eyebrow").value.trim() || prev.heroEyebrow,
    heroTitle: byId("site-hero-title").value.trim() || prev.heroTitle,
    heroSubtitle: byId("site-hero-subtitle").value.trim() || prev.heroSubtitle,
    aboutHtml: byId("site-about-html").value.trim() || prev.aboutHtml,
    contactEmail: byId("site-contact-email").value.trim() || prev.contactEmail,
    contactPhone: byId("site-contact-phone").value.trim() || prev.contactPhone,
    contactRoom: byId("site-contact-room").value.trim() || prev.contactRoom,
    highlightsCount: Math.max(1, Math.min(8, Number(byId("site-highlights-count").value || 4))),
    photoBandEnabled: !!byId("site-photo-band-enabled").checked,
    redakteurNotice: byId("site-redakteur-notice").value.trim() || prev.redakteurNotice,
    editorNotice: byId("site-editor-notice").value.trim() || prev.editorNotice,
    vipNotice: byId("site-vip-notice").value.trim() || prev.vipNotice,
    sponsorNotice: byId("site-sponsor-notice").value.trim() || prev.sponsorNotice,
  };
  saveSiteContent(next);
  pushAudit("Website-Einstellungen gespeichert");
  alert("Website-Einstellungen gespeichert.");
}

function resetWebsiteSettingsToDefault() {
  const prev = getSiteContent();
  const reset = {
    ...prev,
    heroEyebrow: "Schulzeitung",
    heroTitle: "Stimmen aus dem Schulleben",
    heroSubtitle:
      "Reportagen, Meinungen und Hintergruende aus Unterricht, Projekten, Kultur und Sport - von Schuelerinnen und Schuelern fuer die ganze Schulgemeinschaft.",
    aboutHtml:
      "<p>Unsere Schulzeitung erscheint mehrmals im Jahr und begleitet das Schulleben mit klaren, sorgfaeltig recherchierten Beitraegen.</p><p>Wir berichten ueber Unterricht, Projekte, Sport, Kultur und Themen, die die Schulgemeinschaft bewegen. Mitmachen ist ausdruecklich erwuenscht.</p>",
    contactEmail: "zeitung@schule.example",
    contactPhone: "+49 123 456789",
    contactRoom: "Raum 2.14, Mittwoch 7. Stunde",
    highlightsCount: 4,
    photoBandEnabled: true,
    redakteurNotice: "Hier steuerst du Themenplanung, Leitlinien und redaktionelle Prioritäten.",
    editorNotice: "Hier steuerst du Abgabe-Regeln und Arbeitsmodus für Editoren.",
    vipNotice: "Willkommen im VIP-Bereich. Hier erscheinen exklusive Inhalte und Vorabinfos.",
    sponsorNotice: "Willkommen im Sponsor-Bereich. Hier stehen Sponsoring-Infos und Kontaktpunkte.",
  };
  saveSiteContent(reset);
  pushAudit("Website-Einstellungen auf Standard zurückgesetzt");
  initWebsiteSettingsForm();
  alert("Standardwerte wurden wiederhergestellt.");
}

function bindEvents() {
  byId("table-reviews").addEventListener("click", (event) => {
    const publish = event.target.closest("[data-publish]");
    if (publish) {
      updateArticleStatus(publish.dataset.publish, "published");
      return;
    }
    const toDraft = event.target.closest("[data-to-draft]");
    if (toDraft) updateArticleStatus(toDraft.dataset.toDraft, "draft");
  });

  byId("admin-submissions").addEventListener("click", (event) => {
    const approveAdBtn = event.target.closest("[data-approve-ad]");
    if (approveAdBtn) {
      approveAd(approveAdBtn.dataset.approveAd);
      return;
    }
    const workflowAdBtn = event.target.closest("[data-workflow-ad]");
    if (workflowAdBtn) {
      createWorkflowFromAd(workflowAdBtn.dataset.workflowAd);
      return;
    }
    const workflowIdeaBtn = event.target.closest("[data-workflow-idea]");
    if (workflowIdeaBtn) {
      createWorkflowFromIdea(workflowIdeaBtn.dataset.workflowIdea);
      return;
    }
    const rejectAdBtn = event.target.closest("[data-reject-ad]");
    if (rejectAdBtn) {
      removePendingAd(rejectAdBtn.dataset.rejectAd);
      pushAudit("Anzeige abgelehnt", rejectAdBtn.dataset.rejectAd);
      renderSubmissions();
      renderStats();
      return;
    }
    const rejectIdeaBtn = event.target.closest("[data-reject-idea]");
    if (rejectIdeaBtn) {
      removePendingContribution(rejectIdeaBtn.dataset.rejectIdea);
      pushAudit("Beitrag archiviert", rejectIdeaBtn.dataset.rejectIdea);
      renderSubmissions();
      renderStats();
    }
  });

  byId("table-workflow").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-open-wf]");
    if (!btn) return;
    openWorkflow(btn.dataset.openWf);
  });

  byId("wf-save").addEventListener("click", saveWorkflowFromForm);
  byId("ads-save").addEventListener("click", saveAdsFromEditor);
  byId("table-ads").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-ad-delete]");
    if (!btn) return;
    removeAd(btn.dataset.adDelete);
  });
  byId("pz-save").addEventListener("click", savePuzzleFromBuilder);

  byId("table-users").addEventListener("change", (event) => {
    const select = event.target.closest("select[data-role-user]");
    if (!select) return;
    updateRole(select.dataset.roleUser, select.value);
  });
  byId("btn-add-role").addEventListener("click", addRole);
  byId("roles-permissions").addEventListener("change", (event) => {
    const input = event.target.closest("[data-role-perm]");
    if (!input) return;
    const [roleId, permission] = input.dataset.rolePerm.split("|");
    toggleRolePermission(roleId, permission, input.checked);
  });

  byId("table-users").addEventListener("click", (event) => {
    const delBtn = event.target.closest("[data-delete-user]");
    if (!delBtn) return;
    deleteUser(delBtn.dataset.deleteUser);
  });

  byId("site-notice-send").addEventListener("click", () => {
    const message = byId("site-notice-message").value.trim();
    if (!message) {
      alert("Bitte zuerst eine Nachricht eingeben.");
      return;
    }
    publishSiteNotice(message);
    pushAudit("Site-Notice gesendet");
    alert("Benachrichtigung wurde gesendet.");
  });
  byId("site-notice-clear").addEventListener("click", () => {
    clearSiteNotice();
    byId("site-notice-message").value = "";
    pushAudit("Site-Notice entfernt");
    alert("Benachrichtigung entfernt.");
  });
  byId("site-theme-save").addEventListener("click", () => {
    const theme = byId("site-theme").value || "classic";
    saveSiteContent({ ...getSiteContent(), theme });
    document.documentElement.dataset.theme = theme;
    pushAudit("Theme geändert", theme);
    alert("Theme gespeichert.");
  });
  byId("site-settings-save").addEventListener("click", saveWebsiteSettings);
  byId("site-settings-reset").addEventListener("click", resetWebsiteSettingsToDefault);
  byId("admin-refresh-all").addEventListener("click", () => {
    renderStats();
    renderSubmissions();
    renderReviews();
    renderWorkflow();
    renderUsers();
    renderSecurityPanel();
    pushAudit("Admin-Ansicht aktualisiert");
  });
  byId("admin-audit-clear").addEventListener("click", clearAuditLog);
}

async function main() {
  if (!requireRole([ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  await loadAllData();
  mountShell();
  initTabs();
  renderStats();
  renderReviews();
  renderSubmissions();
  renderAdsEditor();
  renderPuzzleBuilder();
  renderWorkflow();
  renderRoleManager();
  renderUsers();
  renderSecurityPanel();
  renderAuditLog();
  initSiteNoticeForm();
  initWebsiteSettingsForm();
  bindEvents();
}

main().catch(console.error);
