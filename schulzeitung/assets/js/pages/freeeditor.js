import { seedUsersIfNeeded, getSession, loginWithPassword } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { addPendingAd, addPendingContribution } from "../core/pending.js";

const CONFIRM_TOKEN_KEY = "sz_freeeditor_confirm_token";
const AD_DESIGN_DRAFT_KEY = "sz_ad_designer_draft";

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

  const adDesignedHtml = document.getElementById("ad-designed-html");
  try {
    const draft = JSON.parse(localStorage.getItem(AD_DESIGN_DRAFT_KEY) || "null");
    if (draft && draft.title) {
      document.getElementById("ad-title").value = draft.title || "";
      document.getElementById("ad-desc").value = draft.description || "";
      document.getElementById("ad-contact").value = draft.contact || "";
      document.getElementById("ad-price").value = draft.price || "";
      adDesignedHtml.value = draft.designedHtml || "";
      localStorage.removeItem(AD_DESIGN_DRAFT_KEY);
    }
  } catch {
    // ignore draft parse errors
  }

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
    const designedHtml = adDesignedHtml.value.trim();
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
    addPendingAd({ title, description, contact, price, imageDataUrl, designedHtml });
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

  const ideaGenerateBtn = document.getElementById("idea-generate");
  ideaGenerateBtn?.addEventListener("click", () => {
    const title = document.getElementById("idea-title").value.trim() || "Unser Thema aus dem Schulalltag";
    const sub = document.getElementById("idea-subcategory").value || "reportage";
    const target = Number(document.getElementById("idea-word-target").value || 150);
    const textArea = document.getElementById("idea-text");
    textArea.value = buildReaderTextDraft({ title, subcategory: sub, targetWords: target });
  });
}

function buildReaderTextDraft({ title, subcategory, targetWords }) {
  const opening = {
    reportage: `Schon beim Betreten der Schule merkt man: ${title} ist gerade überall Thema.`,
    interview: `${title} beschäftigt viele in der Schule, deshalb haben wir dazu Stimmen gesammelt.`,
    kommentar: `${title} ist kein Nebenthema, sondern betrifft unseren Alltag direkt.`,
    event: `${title} war einer der Momente, über die danach alle gesprochen haben.`,
    "wissen-kompakt": `${title} klingt zuerst klein, hat aber viele Auswirkungen im Schulalltag.`,
  };
  const blocks = [
    "Im Unterricht, in den Pausen und in den Klassenchats taucht das Thema immer wieder auf.",
    "Viele wünschen sich klare Informationen, damit man nicht nur Gerüchte weitergibt.",
    "Lehrkräfte und Schüler:innen sehen einige Punkte unterschiedlich, sind sich aber bei den wichtigsten Zielen einig.",
    "Entscheidend ist, dass wir offen darüber sprechen und konkrete Vorschläge sammeln.",
    "Mehr Transparenz hilft, damit Entscheidungen besser verstanden und mitgetragen werden.",
    "Wenn man alle Perspektiven zusammenführt, entsteht ein realistisches Bild statt einzelner Eindrücke.",
    "Für die nächsten Wochen wäre hilfreich, wenn Ergebnisse kurz dokumentiert und sichtbar gemacht werden.",
    "So kann jede Klasse nachvollziehen, was bereits passiert ist und was noch fehlt.",
    "Gerade deshalb lohnt sich ein Blick auf kleine Schritte, die sofort umsetzbar sind.",
    "Am Ende geht es nicht nur um ein einzelnes Projekt, sondern um das Miteinander an unserer Schule.",
  ];
  const closing =
    "Unser Fazit: Mit klarer Kommunikation, fairer Beteiligung und einem konkreten Plan kann aus dem Thema ein echter Fortschritt für die ganze Schulgemeinschaft werden.";

  let text = `${opening[subcategory] || opening.reportage}\n\n`;
  let i = 0;
  while (countWords(text) < Math.max(50, targetWords - 25)) {
    text += `${blocks[i % blocks.length]} `;
    i += 1;
  }
  text += `\n\n${closing}`;
  return trimToWords(text, targetWords);
}

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function trimToWords(text, target) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= target) return words.join(" ");
  return `${words.slice(0, target).join(" ")}.`;
}

main();
