const CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CAPTCHA_LENGTH = 7;
const CAPTCHA_TTL_MS = 1000 * 90;
const CAPTCHA_MIN_SOLVE_MS = 900;
const CAPTCHA_MAX_ATTEMPTS = 4;

function randomCode() {
  let code = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i += 1) {
    code += CAPTCHA_ALPHABET[Math.floor(Math.random() * CAPTCHA_ALPHABET.length)];
  }
  return code;
}

function drawCaptchaToCanvas(canvas, code) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#fffdf6");
  bg.addColorStop(1, "#efe3c8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 24; i += 1) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(120, 95, 42, ${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  for (let i = 0; i < 80; i += 1) {
    ctx.fillStyle = `rgba(25, 20, 14, ${0.08 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "700 34px Georgia, serif";
  ctx.textBaseline = "middle";
  const step = w / (code.length + 1);
  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];
    const x = step * (i + 1);
    const y = h / 2 + (Math.random() * 8 - 4);
    const rot = (Math.random() * 0.6 - 0.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = i % 2 === 0 ? "#3f2e0f" : "#704f18";
    ctx.fillText(char, -10, 0);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(109, 83, 35, 0.35)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, h * (0.25 + Math.random() * 0.2));
  ctx.bezierCurveTo(w * 0.3, h * 0.9, w * 0.7, h * 0.05, w, h * (0.75 + Math.random() * 0.15));
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

export function createVisualCaptcha(hostEl) {
  const code = randomCode();
  const now = Date.now();
  const challenge = {
    answer: code,
    createdAt: now,
    expiresAt: now + CAPTCHA_TTL_MS,
    minSolveAt: now + CAPTCHA_MIN_SOLVE_MS,
    attempts: 0,
    maxAttempts: CAPTCHA_MAX_ATTEMPTS,
  };

  if (hostEl) {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 80;
    canvas.style.borderRadius = "8px";
    canvas.style.border = "1px solid rgba(166, 124, 27, 0.35)";
    canvas.style.display = "block";
    drawCaptchaToCanvas(canvas, code);
    hostEl.innerHTML = "";
    hostEl.appendChild(canvas);
  }

  return challenge;
}

export function verifyCaptcha(inputValue, challenge) {
  if (!challenge || typeof challenge !== "object") {
    return { ok: false, reason: "invalid-challenge" };
  }
  const now = Date.now();
  if (now > challenge.expiresAt) {
    return { ok: false, reason: "expired" };
  }
  if (now < challenge.minSolveAt) {
    return { ok: false, reason: "too-fast" };
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    return { ok: false, reason: "attempt-limit" };
  }
  challenge.attempts += 1;
  const input = String(inputValue || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "");
  const expected = String(challenge.answer || "").toUpperCase();
  if (input === expected) return { ok: true, reason: "ok" };
  return { ok: false, reason: "mismatch" };
}
