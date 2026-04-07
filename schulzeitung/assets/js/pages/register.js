import { seedUsersIfNeeded, registerUser, setSession, getSession } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { createMathCaptcha, verifyCaptcha } from "../core/captcha.js";

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
