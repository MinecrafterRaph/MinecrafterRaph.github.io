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
    addPendingContribution({ authorName, title, body });
    sessionStorage.setItem(CONFIRM_TOKEN_KEY, crypto.randomUUID());
    window.location.href = "freeeditor-bestaetigung.html?typ=beitrag";
  });
}

main();
