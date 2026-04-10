import { ROLES, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getSiteContent, saveSiteContent } from "../core/data-service.js";

function byId(id) {
  return document.getElementById(id);
}

async function main() {
  if (!requireRole([ROLES.EDITOR, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  mountShell();

  const site = getSiteContent();
  byId("editor-notice").value = site.editorNotice || "";
  byId("editor-default-status").value = site.editorDefaultStatus || "draft";

  byId("editor-save").addEventListener("click", () => {
    saveSiteContent({
      ...getSiteContent(),
      editorNotice: byId("editor-notice").value.trim(),
      editorDefaultStatus: byId("editor-default-status").value,
    });
    alert("Editor-Einstellungen gespeichert.");
  });
}

main().catch(console.error);
