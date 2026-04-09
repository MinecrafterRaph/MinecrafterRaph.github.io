import { seedUsersIfNeeded, getSession, loginWithPassword } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { addPendingAd, addPendingContribution } from "../core/pending.js";

const CONFIRM_TOKEN_KEY = "sz_freeeditor_confirm_token";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function main() {
  await seedUsersIfNeeded();
  mountShell();
  const authCard = document.getElementById("freeeditor-auth-card");
  const content = document.getElementById("freeeditor-content");
  const authMsg = document.getElementById("auth-msg");
  const loginForm = document.getElementById("freeeditor-login-form");

  function showEditorForLoggedInUser() {
    authCard.style.display = "none";
    content.style.display = "block";
  }

  function showLoginGate() {
    content.style.display = "none";
    authCard.style.display = "block";
  }

  const session = getSession();
  if (!session) {
    showLoginGate();
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      authMsg.innerHTML = "";
      const email = document.getElementById("fe-email").value;
      const password = document.getElementById("fe-password").value;
      const result = loginWithPassword(email, password);
      if (!result.ok) {
        authMsg.innerHTML = `<div class="message message--error">${result.message}</div>`;
        return;
      }
      mountShell();
      showEditorForLoggedInUser();
    });
    return;
  }
  showEditorForLoggedInUser();

  const canvas = document.getElementById("idea-canvas");
  const ctx = canvas.getContext("2d");
  const colorInput = document.getElementById("canva-color");
  const sizeInput = document.getElementById("canva-size");
  const clearBtn = document.getElementById("canva-clear");
  let drawing = false;

  function pointerPos(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  function drawStart(event) {
    drawing = true;
    const { x, y } = pointerPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function drawMove(event) {
    if (!drawing) return;
    const { x, y } = pointerPos(event);
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = Number(sizeInput.value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function drawEnd() {
    drawing = false;
    ctx.closePath();
  }

  ctx.fillStyle = "#fffef9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  canvas.addEventListener("pointerdown", drawStart);
  canvas.addEventListener("pointermove", drawMove);
  canvas.addEventListener("pointerup", drawEnd);
  canvas.addEventListener("pointerleave", drawEnd);
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fffef9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById("form-ad").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("ad-title").value.trim();
    const description = document.getElementById("ad-desc").value.trim();
    const contact = document.getElementById("ad-contact").value.trim();
    const price = document.getElementById("ad-price").value.trim();
    const fileInput = document.getElementById("ad-image");
    let imageDataUrl = null;
    if (fileInput.files && fileInput.files[0]) {
      try {
        imageDataUrl = await readFileAsDataUrl(fileInput.files[0]);
      } catch {
        alert("Bild konnte nicht gelesen werden.");
        return;
      }
    }
    addPendingAd({ title, description, contact, price, imageDataUrl });
    sessionStorage.setItem(CONFIRM_TOKEN_KEY, crypto.randomUUID());
    window.location.href = "freeeditor-bestaetigung.html?typ=anzeige";
  });

  document.getElementById("form-idea").addEventListener("submit", (e) => {
    e.preventDefault();
    const authorName = document.getElementById("idea-name").value.trim();
    const title = document.getElementById("idea-title").value.trim();
    const body = document.getElementById("idea-text").value.trim();
    const subcategory = document.getElementById("idea-subcategory").value;
    const sketchDataUrl = canvas.toDataURL("image/png");
    addPendingContribution({ authorName, title, body, subcategory, sketchDataUrl });
    sessionStorage.setItem(CONFIRM_TOKEN_KEY, crypto.randomUUID());
    window.location.href = "freeeditor-bestaetigung.html?typ=beitrag";
  });
}

main();
