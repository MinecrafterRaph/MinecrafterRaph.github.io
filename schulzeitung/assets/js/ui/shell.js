/**
 * Gemeinsame Kopf- und Fußzeile; aktualisiert Navigation je nach Login.
 */
import { getSession, logout } from "../core/auth.js";
import { getPendingAds, getPendingContributions } from "../core/pending.js";
import { getWorkflowItems } from "../core/workflow.js";
import { getSiteNotice, onNoticeSignal } from "../core/notifications.js";
import { getSiteContent } from "../core/data-service.js";

let umlautObserverStarted = false;

const navLinks = [
  { href: "index.html", label: "Start" },
  { href: "index.html#ausgaben", label: "Ausgaben" },
  { href: "zeitung4.html", label: "Muster-Zeitung" },
  { href: "freeeditor.html", label: "Mitmachen" },
];

function currentPage() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path;
}

export function mountShell() {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  if (!headerMount || !footerMount) return;

  const session = getSession();
  const siteContent = getSiteContent();
  document.documentElement.dataset.theme = siteContent.theme || "classic";
  const page = currentPage();

  const extraNav = [];
  if (session) {
    const workflow = getWorkflowItems();
    const adminBadge =
      getPendingAds().length +
      getPendingContributions().length +
      workflow.filter((w) => w.stage === "admin_review").length;
    const editorBadge = workflow.filter((w) => w.stage === "editor" && w.assignedEditorId === session.id).length;
    const designerBadge = workflow.filter((w) => w.stage === "designer" && w.assignedDesignerId === session.id).length;

    if (session.role === "admin") {
      extraNav.push({ href: "admin.html", label: adminBadge > 0 ? `Admin (${adminBadge})` : "Admin" });
    }
    if (session.role === "redakteur") {
      extraNav.push({ href: "redaktion-admin.html", label: "Redakteur-Admin" });
    }
    if (session.role === "editor") {
      extraNav.push({ href: "manageeditor.html", label: "Redaktion" });
      extraNav.push({ href: "editor-admin.html", label: "Editor-Admin" });
      extraNav.push({ href: "workflow-editor.html", label: editorBadge > 0 ? `Workflow (${editorBadge})` : "Workflow" });
    }
    if (session.role === "designer") {
      extraNav.push({ href: "designer.html", label: designerBadge > 0 ? `Designer (${designerBadge})` : "Designer" });
    }
    if (session.role === "reader")
      extraNav.push({ href: "nutzer.html", label: "Meine Seite" });
    if (session.role === "vip")
      extraNav.push({ href: "vip.html", label: "VIP-Bereich" });
    if (session.role === "klassensprecher")
      extraNav.push({ href: "klassensprecher.html", label: "Klassensprecher" });
    if (session.role === "sponsor")
      extraNav.push({ href: "sponsor.html", label: "Sponsor-Bereich" });
  }

  const allLinks = [...navLinks, ...extraNav];

  headerMount.innerHTML = `
    <div class="site-header__inner">
      <a class="site-logo" href="index.html">Schulzeitung</a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="primary-nav">Menü</button>
      <nav class="site-nav" id="primary-nav" aria-label="Hauptnavigation">
        ${allLinks
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.href === page ? "is-active" : ""}">${l.label}</a>`
          )
          .join("")}
        <div class="site-nav__actions">
          ${
            session
              ? `<span style="color:var(--color-ink-muted);font-size:0.9rem">${escapeHtml(session.displayName)}</span>
                 <button type="button" class="btn btn--ghost btn--small" id="btn-logout">Abmelden</button>`
              : `<a class="btn btn--ghost btn--small" href="login.html">Anmelden</a>
                 <a class="btn btn--primary btn--small" href="registrieren.html">Registrieren</a>`
          }
        </div>
      </nav>
    </div>
  `;

  footerMount.innerHTML = `
    <div class="site-footer__inner">
      <div>
        <strong>Schulzeitung</strong>
        <p style="margin-top:0.5rem;font-size:0.9rem">Unabhängig, schülerisch, neugierig.</p>
      </div>
      <div>
        <strong>Kontakt Redaktion</strong>
        <p style="margin-top:0.5rem;font-size:0.9rem"><a href="mailto:zeitung@schule.example">zeitung@schule.example</a></p>
      </div>
      <div>
        <strong>Links</strong>
        <p style="margin-top:0.5rem;font-size:0.9rem">
          <a href="index.html#kontakt">Kontaktbereich</a> ·
          <a href="freeeditor.html">Mitmachen</a>
        </p>
      </div>
    </div>
    <p class="site-footer__copy">© ${new Date().getFullYear()} Schulzeitung · Statische Demo für GitHub Pages</p>
  `;

  const toggle = headerMount.querySelector(".nav-toggle");
  const nav = headerMount.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    logout();
    window.location.href = "index.html";
  });

  startGermanUmlautAutoFix();
  mountSiteNotice();
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function mountSiteNotice() {
  let host = document.getElementById("site-notice-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "site-notice-host";
    host.className = "site-notice-host";
    document.body.appendChild(host);
  }

  function render(notice) {
    if (!notice?.message) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = `
      <aside class="site-notice-card" role="status" aria-live="polite">
        <strong>Info der Redaktion</strong>
        <p>${escapeHtml(notice.message)}</p>
      </aside>
    `;
  }

  render(getSiteNotice());
  onNoticeSignal(render);
}

function applyGermanUmlautFix(root) {
  if (!root) return;

  const replacements = [
    [/\bSchuelerinnen\b/g, "Schülerinnen"],
    [/\bschuelerinnen\b/g, "schülerinnen"],
    [/\bSchuelerzeitung\b/g, "Schülerzeitung"],
    [/\bSchuelern\b/g, "Schülern"],
    [/\bschuelern\b/g, "schülern"],
    [/\bSchueler\b/g, "Schüler"],
    [/\bschueler\b/g, "schüler"],
    [/\bVeroeffentlichung\b/g, "Veröffentlichung"],
    [/\bveroeffentlichung\b/g, "veröffentlichung"],
    [/\bVeroeffentlicht\b/g, "Veröffentlicht"],
    [/\bveroeffentlicht\b/g, "veröffentlicht"],
    [/\bVeroeffentlichen\b/g, "Veröffentlichen"],
    [/\bveroeffentlichen\b/g, "veröffentlichen"],
    [/\bUeber\b/g, "Über"],
    [/\bueber\b/g, "über"],
    [/\bFuer\b/g, "Für"],
    [/\bfuer\b/g, "für"],
    [/\bMoeglich\b/g, "Möglich"],
    [/\bmoeglich\b/g, "möglich"],
    [/\bWaehlen\b/g, "Wählen"],
    [/\bwaehlen\b/g, "wählen"],
    [/\bZurueck\b/g, "Zurück"],
    [/\bzurueck\b/g, "zurück"],
    [/\bNaechste\b/g, "Nächste"],
    [/\bnaechste\b/g, "nächste"],
    [/\bBeitraege\b/g, "Beiträge"],
    [/\bbeitraege\b/g, "beiträge"],
    [/\bLoeschen\b/g, "Löschen"],
    [/\bloeschen\b/g, "löschen"],
    [/\bUngueltig\b/g, "Ungültig"],
    [/\bungueltig\b/g, "ungültig"],
    [/\bGueltig\b/g, "Gültig"],
    [/\bgueltig\b/g, "gültig"],
    [/\bRaeum\b/g, "Räum"],
    [/\braeum\b/g, "räum"],
  ];

  const shouldSkip = (el) => {
    if (!el) return true;
    const tag = el.tagName;
    return tag === "SCRIPT" || tag === "STYLE" || tag === "CODE" || tag === "PRE";
  };

  const fixNode = (textNode) => {
    if (!textNode?.nodeValue || shouldSkip(textNode.parentElement)) return;
    let next = textNode.nodeValue;
    replacements.forEach(([pattern, value]) => {
      next = next.replace(pattern, value);
    });
    if (next !== textNode.nodeValue) textNode.nodeValue = next;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) fixNode(walker.currentNode);
}

function startGermanUmlautAutoFix() {
  applyGermanUmlautFix(document.body);
  if (umlautObserverStarted) return;
  umlautObserverStarted = true;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") {
        applyGermanUmlautFix(mutation.target.parentElement || document.body);
        return;
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          applyGermanUmlautFix(node.parentElement || document.body);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyGermanUmlautFix(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}
