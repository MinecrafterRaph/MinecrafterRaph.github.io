import { ROLES, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getSiteContent, saveSiteContent } from "../core/data-service.js";

function byId(id) {
  return document.getElementById(id);
}

async function main() {
  if (!requireRole([ROLES.REDAKTEUR, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  mountShell();

  const site = getSiteContent();
  byId("redakteur-notice").value = site.redakteurNotice || "";
  byId("redakteur-focus").value = site.redakteurFocus || "";

  byId("redakteur-save").addEventListener("click", () => {
    saveSiteContent({
      ...getSiteContent(),
      redakteurNotice: byId("redakteur-notice").value.trim(),
      redakteurFocus: byId("redakteur-focus").value.trim(),
    });
    alert("Redakteur-Einstellungen gespeichert.");
  });
}

main().catch(console.error);
