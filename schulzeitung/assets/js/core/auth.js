/**
 * Clientseitige Authentifizierung (Demo) – Passwörter nur für Schul-Demos gedacht.
 */
import { LS_KEYS, readJson, writeJson } from "./storage.js";

export const ROLES = {
  READER: "reader",
  EDITOR: "editor",
  REDAKTEUR: "redakteur",
  DESIGNER: "designer",
  VIP: "vip",
  KLASSSPRECHER: "klassensprecher",
  SPONSOR: "sponsor",
  ADMIN: "admin",
};

const ADMIN_USER = {
  id: "u-admin",
  email: "admin@login",
  password: "13243",
  displayName: "Administrator",
  role: ROLES.ADMIN,
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
    [ROLES.REDAKTEUR]: {
      label: "Chef-Redakteur",
      permissions: [PERMISSIONS.COMMENTS_WRITE, PERMISSIONS.WORKFLOW_MANAGE, PERMISSIONS.PUZZLES_MANAGE],
    },
    [ROLES.DESIGNER]: {
      label: "Designer",
      permissions: [],
    },
    [ROLES.VIP]: {
      label: "VIP",
      permissions: [PERMISSIONS.COMMENTS_WRITE],
    },
    [ROLES.KLASSSPRECHER]: {
      label: "Klassensprecher",
      permissions: [PERMISSIONS.COMMENTS_WRITE],
    },
    [ROLES.SPONSOR]: {
      label: "Sponsor",
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
  if (!readJson(LS_KEYS.SEED_DONE, false)) {
    const base = document.documentElement.dataset.base || "";
    const res = await fetch(`${base}data/seed-users.json`.replace(/\/+/g, "/"));
    if (res.ok) {
      const seed = await res.json();
      const existing = getUsers();
      if (existing.length === 0) {
        saveUsers(seed);
      }
      writeJson(LS_KEYS.SEED_DONE, true);
    }
  }

  const before = getUsers();
  const after = enforceAdminUser(before);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    saveUsers(after);
  }
}

function enforceAdminUser(users) {
  const list = Array.isArray(users) ? users.map((u) => ({ ...u })) : [];

  let admin = list.find((u) => u.id === ADMIN_USER.id);
  if (!admin) {
    admin = list.find((u) => String(u.email || "").toLowerCase() === "admin@schule.example");
  }
  if (!admin) {
    admin = list.find((u) => u.role === ROLES.ADMIN);
  }

  if (admin) {
    admin.id = ADMIN_USER.id;
    admin.email = ADMIN_USER.email;
    admin.password = ADMIN_USER.password;
    admin.displayName = ADMIN_USER.displayName;
    admin.role = ADMIN_USER.role;
  } else {
    list.unshift({ ...ADMIN_USER });
  }

  return list.filter((u, idx, arr) => {
    const email = String(u.email || "").toLowerCase();
    if (email === "admin@schule.example") return false;
    if (u.id !== ADMIN_USER.id) return true;
    return arr.findIndex((x) => x.id === ADMIN_USER.id) === idx;
  });
}

export function registerUser({ email, password, displayName }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, message: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }
  if (cleanPassword.length < 8) {
    return { ok: false, message: "Passwort muss mindestens 8 Zeichen lang sein." };
  }
  if (!/[A-Za-z]/.test(cleanPassword) || !/\d/.test(cleanPassword)) {
    return { ok: false, message: "Passwort muss Buchstaben und Zahlen enthalten." };
  }

  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { ok: false, message: "Diese E-Mail ist bereits registriert." };
  }
  const id = "u-" + Math.random().toString(36).slice(2, 10);
  users.push({
    id,
    email: cleanEmail,
    password: cleanPassword,
    displayName: String(displayName || "").trim() || cleanEmail.split("@")[0],
    role: availableRoles().includes(ROLES.READER) ? ROLES.READER : availableRoles()[0] || ROLES.READER,
  });
  saveUsers(users);
  return { ok: true, user: users[users.length - 1] };
}

export function loginWithPassword(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
  );
  if (!user) return { ok: false, message: "E-Mail oder Passwort ungültig." };
  setSession(user);
  return { ok: true, user };
}

export function redirectAfterLogin(role) {
  if (role === ROLES.ADMIN) return "admin.html";
  if (role === ROLES.REDAKTEUR) return "redaktion-admin.html";
  if (role === ROLES.EDITOR) return "manageeditor.html";
  if (role === ROLES.DESIGNER) return "designer.html";
  if (role === ROLES.VIP) return "vip.html";
  if (role === ROLES.KLASSSPRECHER) return "klassensprecher.html";
  if (role === ROLES.SPONSOR) return "sponsor.html";
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
