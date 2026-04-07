/**
 * Clientseitige Authentifizierung (Demo) – Passwörter nur für Schul-Demos gedacht.
 */
import { LS_KEYS, readJson, writeJson } from "./storage.js";

export const ROLES = {
  READER: "reader",
  EDITOR: "editor",
  DESIGNER: "designer",
  ADMIN: "admin",
};

const ROLE_DEFS_KEY = "sz_role_definitions";
export const PERMISSIONS = {
  COMMENTS_WRITE: "comments.write",
  ADS_MANAGE: "ads.manage",
  PUZZLES_MANAGE: "puzzles.manage",
  WORKFLOW_MANAGE: "workflow.manage",
  USERS_MANAGE: "users.manage",
};

function defaultRoleDefinitions() {
  return {
    [ROLES.ADMIN]: {
      label: "Administrator",
      permissions: Object.values(PERMISSIONS),
    },
    [ROLES.EDITOR]: {
      label: "Redaktion",
      permissions: [PERMISSIONS.COMMENTS_WRITE, PERMISSIONS.ADS_MANAGE, PERMISSIONS.PUZZLES_MANAGE],
    },
    [ROLES.DESIGNER]: {
      label: "Designer",
      permissions: [],
    },
    [ROLES.READER]: {
      label: "Leser",
      permissions: [PERMISSIONS.COMMENTS_WRITE],
    },
  };
}

export function getRoleDefinitions() {
  const defs = readJson(ROLE_DEFS_KEY, null) || {};
  return { ...defaultRoleDefinitions(), ...defs };
}

export function saveRoleDefinitions(defs) {
  writeJson(ROLE_DEFS_KEY, defs || {});
}

export function availableRoles() {
  return Object.keys(getRoleDefinitions());
}

export function canPermission(session, permission) {
  if (!session) return false;
  const defs = getRoleDefinitions();
  const roleDef = defs[session.role];
  return !!roleDef && Array.isArray(roleDef.permissions) && roleDef.permissions.includes(permission);
}

export function getSession() {
  return readJson(LS_KEYS.SESSION, null);
}

export function setSession(user) {
  if (!user) {
    localStorage.removeItem(LS_KEYS.SESSION);
    return;
  }
  writeJson(LS_KEYS.SESSION, {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  });
}

export function logout() {
  setSession(null);
}

export function getUsers() {
  return readJson(LS_KEYS.USERS, []);
}

export function saveUsers(users) {
  writeJson(LS_KEYS.USERS, users);
}

export async function seedUsersIfNeeded() {
  if (readJson(LS_KEYS.SEED_DONE, false)) return;
  const base = document.documentElement.dataset.base || "";
  const res = await fetch(`${base}data/seed-users.json`.replace(/\/+/g, "/"));
  if (!res.ok) return;
  const seed = await res.json();
  const existing = getUsers();
  if (existing.length === 0) {
    saveUsers(seed);
  }
  writeJson(LS_KEYS.SEED_DONE, true);
}

export function registerUser({ email, password, displayName }) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: "Diese E-Mail ist bereits registriert." };
  }
  const id = "u-" + Math.random().toString(36).slice(2, 10);
  users.push({
    id,
    email: email.trim().toLowerCase(),
    password,
    displayName: displayName.trim() || email.split("@")[0],
    role: availableRoles().includes(ROLES.READER) ? ROLES.READER : availableRoles()[0] || ROLES.READER,
  });
  saveUsers(users);
  return { ok: true, user: users[users.length - 1] };
}

export function loginWithPassword(email, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!user) return { ok: false, message: "E-Mail oder Passwort ungültig." };
  setSession(user);
  return { ok: true, user };
}

export function redirectAfterLogin(role) {
  if (role === ROLES.ADMIN) return "admin.html";
  if (role === ROLES.EDITOR) return "manageeditor.html";
  if (role === ROLES.DESIGNER) return "designer.html";
  return "nutzer.html";
}

export function requireRole(allowedRoles, loginPage = "login.html") {
  const s = getSession();
  if (!s || !allowedRoles.includes(s.role)) {
    window.location.href = loginPage;
    return null;
  }
  return s;
}
