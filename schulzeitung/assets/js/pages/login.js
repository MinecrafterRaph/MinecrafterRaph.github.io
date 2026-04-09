import { seedUsersIfNeeded, loginWithPassword, redirectAfterLogin, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { createVisualCaptcha, verifyCaptcha } from "../core/captcha.js";

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
    const check = verifyCaptcha(captchaAnswer.value, captcha);
    if (!check.ok) {
      const text =
        check.reason === "expired"
          ? "Captcha abgelaufen. Bitte neu laden."
          : check.reason === "attempt-limit"
            ? "Zu viele Fehlversuche. Neues Captcha laden."
            : "Die Captcha-Eingabe ist nicht korrekt.";
      msg.innerHTML = `<div class="message message--error">${text}</div>`;
      captcha = createVisualCaptcha(captchaTask);
      captchaAnswer.value = "";
      return;
    }
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const result = loginWithPassword(email, password);
    if (!result.ok) {
      msg.innerHTML = `<div class="message message--error">${result.message}</div>`;
      return;
    }
    window.location.href = redirectAfterLogin(result.user.role);
  });
}

main();
