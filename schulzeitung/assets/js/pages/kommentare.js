import { seedUsersIfNeeded, getSession, canPermission, PERMISSIONS } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { loadAllData, getCached } from "../core/data-service.js";
import { loadPublicComments, getComments, addComment, subscribeToCommentsRealtime } from "../core/comments.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function params() {
  return new URLSearchParams(window.location.search);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function renderComments(articleId) {
  const list = document.getElementById("comment-list");
  const items = await getComments(articleId);
  list.innerHTML = items.length
    ? items
        .map(
          (c) => `<li class="comment-item">
        <p>${escapeHtml(c.text)}</p>
        <p class="comment-meta">${escapeHtml(c.authorName)} · ${formatDate(c.createdAt)}</p>
      </li>`
        )
        .join("")
    : '<li class="comment-item">Noch keine Kommentare vorhanden.</li>';
}

async function main() {
  await seedUsersIfNeeded();
  await loadAllData();
  await loadPublicComments();
  mountShell();
  const session = getSession();

  const articles = (getCached().articles || []).filter((a) => a.status === "published");
  const select = document.getElementById("comment-article");
  select.innerHTML = articles
    .map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.title)}</option>`)
    .join("");

  const preselect = params().get("id");
  if (preselect && articles.some((a) => a.id === preselect)) {
    select.value = preselect;
  }

  await renderComments(select.value);
  let unsubscribeRealtime = await subscribeToCommentsRealtime(select.value, () => {
    renderComments(select.value);
  });
  select.addEventListener("change", () => renderComments(select.value));
  select.addEventListener("change", async () => {
    unsubscribeRealtime();
    unsubscribeRealtime = await subscribeToCommentsRealtime(select.value, () => {
      renderComments(select.value);
    });
  });

  const form = document.getElementById("comment-form");
  const guestToggle = document.getElementById("comment-guest-mode");
  const guestToggleWrap = document.getElementById("guest-toggle-wrap");
  const nameInput = document.getElementById("c-name");
  const canLoggedInWrite = !!session && canPermission(session, PERMISSIONS.COMMENTS_WRITE);
  const isGuest = () => !session || guestToggle.checked;

  function syncCommentMode() {
    if (session) {
      guestToggleWrap.style.display = "";
      if (!canLoggedInWrite) guestToggle.checked = true;
      if (guestToggle.checked) {
        nameInput.readOnly = false;
        nameInput.value = nameInput.value || "";
      } else {
        nameInput.readOnly = true;
        nameInput.value = session.displayName || "";
      }
    } else {
      guestToggleWrap.style.display = "none";
      nameInput.readOnly = false;
    }
  }
  syncCommentMode();
  guestToggle?.addEventListener("change", syncCommentMode);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isGuest() && !canLoggedInWrite) {
      alert("Deine Rolle darf aktuell keine Kommentare schreiben. Nutze den Gastmodus.");
      return;
    }
    await addComment(select.value, {
      authorName: nameInput.value,
      text: document.getElementById("c-text").value,
    });
    event.target.reset();
    await renderComments(select.value);
  });
}

main().catch(console.error);
