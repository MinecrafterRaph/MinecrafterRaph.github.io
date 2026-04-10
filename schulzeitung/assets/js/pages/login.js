import { seedUsersIfNeeded, loginWithPassword, redirectAfterLogin, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { createVisualCaptcha, verifyCaptcha } from "../core/captcha.js";

const LOGIN_GUARD_KEY = "sz_login_guard_v1";
const GLOBAL_LOCK_MS = 1000 * 60 * 3;
const MAX_FAILED_ATTEMPTS = 5;

function nowMs() {
  return Date.now();
}

function readGuard() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_GUARD_KEY)) || { fails: 0, lockUntil: 0 };
  } catch (error) {
    return { fails: 0, lockUntil: 0 };
  }
}

function writeGuard(state) {
  localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(state));
}

function resetGuard() {
  writeGuard({ fails: 0, lockUntil: 0 });
}

function registerFailedAttempt() {
  const state = readGuard();
  const fails = Number(state.fails || 0) + 1;
  const lockUntil = fails >= MAX_FAILED_ATTEMPTS ? nowMs() + GLOBAL_LOCK_MS : 0;
  writeGuard({ fails, lockUntil });
  return { fails, lockUntil };
}

async function main() {
  await seedUsersIfNeeded();
  mountShell();
  if (getSession()) {
    window.location.href = "index.html";
    return;
  }

  const form = document.getElementById("form-login");
  const msg = document.getElementById("msg");
  const captchaTask = document.getElementById("captcha-task");
  const captchaRefresh = document.getElementById("captcha-refresh");
  const captchaAnswer = document.getElementById("captcha-answer");
  let captcha = createVisualCaptcha(captchaTask);
  captchaRefresh.addEventListener("click", () => {
    captcha = createVisualCaptcha(captchaTask);
    captchaAnswer.value = "";
    captchaAnswer.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.innerHTML = "";
    const guardBefore = readGuard();
    if (guardBefore.lockUntil && nowMs() < guardBefore.lockUntil) {
      const waitSeconds = Math.ceil((guardBefore.lockUntil - nowMs()) / 1000);
      msg.innerHTML = `<div class="message message--error">Zu viele Fehlversuche. Bitte ${waitSeconds} Sekunden warten.</div>`;
      return;
    }

    const check = verifyCaptcha(captchaAnswer.value, captcha);
    if (!check.ok) {
      const text =
        check.reason === "expired"
          ? "Captcha abgelaufen. Bitte neu laden."
          : check.reason === "too-fast"
            ? "Bitte kurz warten und das Captcha erneut eingeben."
          : check.reason === "attempt-limit"
            ? "Zu viele Fehlversuche. Neues Captcha laden."
            : "Die Captcha-Eingabe ist nicht korrekt.";
      msg.innerHTML = `<div class="message message--error">${text}</div>`;
      captcha = createVisualCaptcha(captchaTask);
      captchaAnswer.value = "";
      return;
    }
    const email = String(document.getElementById("email").value || "").trim();
    const password = String(document.getElementById("password").value || "");
    const result = loginWithPassword(email, password);
    if (!result.ok) {
      const failed = registerFailedAttempt();
      const locked = failed.lockUntil && nowMs() < failed.lockUntil;
      const lockHint = locked
        ? ` Konto gesperrt für ${Math.ceil((failed.lockUntil - nowMs()) / 1000)} Sekunden.`
        : "";
      msg.innerHTML = `<div class="message message--error">${result.message}</div>`;
      if (lockHint) {
        msg.innerHTML += `<div class="message message--error" style="margin-top: var(--space-sm)">${lockHint}</div>`;
      }
      captcha = createVisualCaptcha(captchaTask);
      captchaAnswer.value = "";
      return;
    }
    resetGuard();
    window.location.href = redirectAfterLogin(result.user.role);
  });
}

main();
