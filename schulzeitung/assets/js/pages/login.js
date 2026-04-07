import { seedUsersIfNeeded, loginWithPassword, redirectAfterLogin, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { createMathCaptcha, verifyCaptcha } from "../core/captcha.js";

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
  let captcha = createMathCaptcha();
  captchaTask.textContent = captcha.prompt;
  captchaRefresh.addEventListener("click", () => {
    captcha = createMathCaptcha();
    captchaTask.textContent = captcha.prompt;
    captchaAnswer.value = "";
    captchaAnswer.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.innerHTML = "";
    if (!verifyCaptcha(captchaAnswer.value, captcha.answer)) {
      msg.innerHTML = `<div class="message message--error">Die Sicherheitsabfrage ist nicht korrekt.</div>`;
      captcha = createMathCaptcha();
      captchaTask.textContent = captcha.prompt;
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
