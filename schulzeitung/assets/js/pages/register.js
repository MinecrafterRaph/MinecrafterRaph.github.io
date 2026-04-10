import { seedUsersIfNeeded, registerUser, setSession, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { createVisualCaptcha, verifyCaptcha } from "../core/captcha.js";

async function main() {
  await seedUsersIfNeeded();
  mountShell();
  if (getSession()) {
    window.location.href = "nutzer.html";
    return;
  }

  const form = document.getElementById("form-reg");
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
    const displayName = document.getElementById("displayName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const result = registerUser({ email, password, displayName });
    if (!result.ok) {
      msg.innerHTML = `<div class="message message--error">${result.message}</div>`;
      return;
    }
    setSession(result.user);
    msg.innerHTML = `<div class="message message--success">Willkommen! Weiterleitung …</div>`;
    setTimeout(() => {
      window.location.href = "nutzer.html";
    }, 600);
  });
}

main();
