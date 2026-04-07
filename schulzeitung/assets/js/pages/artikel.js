import { loadAllData, getCached, editionById, categoryById, authorById, resolveAssetUrl } from "../core/data-service.js";
import { seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { loadPublicComments } from "../core/comments.js";
import { trackArticleView, trackPageView } from "../core/stats.js";

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

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function main() {
  await seedUsersIfNeeded();
  await loadAllData();
  await loadPublicComments();
  mountShell();

  const id = params().get("id");
  if (!id) {
    document.getElementById("article-title").textContent = "Artikel nicht gefunden";
    return;
  }

  const article = (getCached().articles || []).find((a) => a.id === id);
  if (!article || article.status !== "published") {
    document.getElementById("article-title").textContent = "Artikel nicht gefunden";
    return;
  }

  trackPageView("artikel.html");
  trackArticleView(id);

  const edition = editionById(article.editionId);
  const cat = categoryById(article.categoryId);
  const author = authorById(article.authorId);

  document.title = `${article.title} – Schulzeitung`;
  document.querySelector('meta[name="description"]').setAttribute("content", article.excerpt);

  const crumb = document.getElementById("crumb-edition");
  if (edition) {
    crumb.href = `zeitung${edition.id}.html`;
    crumb.textContent = edition.title;
  }

  document.getElementById("crumb-title").textContent = article.title;
  document.getElementById("article-title").textContent = article.title;
  document.getElementById("article-excerpt").textContent = article.excerpt;
  document.getElementById("article-meta").textContent = cat ? cat.label : "";
  if (cat) {
    document.getElementById("article-meta").style.background = cat.color + "22";
    document.getElementById("article-meta").style.color = cat.color;
  }
  document.getElementById("article-author-line").innerHTML = author
    ? `Von <a href="autor.html?id=${encodeURIComponent(author.id)}">${escapeHtml(author.name)}</a> · ${formatDate(article.publishedAt)}`
    : formatDate(article.publishedAt);

  document.getElementById("article-body").innerHTML = article.contentHtml || "";

  const embedEl = document.getElementById("article-embed");
  if (article.embed && article.embed.url) {
    if (article.embed.type === "video") {
      embedEl.innerHTML = `<iframe title="${escapeHtml(article.embed.title || "Video")}" width="100%" height="315" src="${escapeHtml(article.embed.url)}" allowfullscreen loading="lazy" style="border:0;border-radius:var(--radius-md);max-width:100%"></iframe>`;
    } else if (article.embed.type === "audio") {
      embedEl.innerHTML = `<p><strong>${escapeHtml(article.embed.title || "Audio")}</strong></p><audio controls src="${escapeHtml(article.embed.url)}" style="width:100%"></audio>`;
    }
  } else {
    embedEl.innerHTML = "";
  }

  const url = window.location.href;
  document.getElementById("share-mail").href =
    "mailto:?subject=" + encodeURIComponent(article.title) + "&body=" + encodeURIComponent(url);
  document.getElementById("share-x").href =
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(article.title) + "&url=" + encodeURIComponent(url);

  document.getElementById("copy-link").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link kopiert.");
    } catch {
      prompt("Link kopieren:", url);
    }
  });

  const commentsLink = document.getElementById("comments-link");
  commentsLink.href = `kommentare.html?id=${encodeURIComponent(id)}`;
}

main().catch(console.error);
