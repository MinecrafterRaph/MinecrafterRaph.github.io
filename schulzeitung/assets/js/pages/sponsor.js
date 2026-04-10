import { ROLES, requireRole, seedUsersIfNeeded } from "../core/auth.js";
import { mountShell } from "../ui/shell.js";
import { getSiteContent } from "../core/data-service.js";

async function main() {
  if (!requireRole([ROLES.SPONSOR, ROLES.ADMIN])) return;
  await seedUsersIfNeeded();
  mountShell();
  document.getElementById("sponsor-notice").textContent =
    getSiteContent().sponsorNotice || "Willkommen im Sponsor-Bereich.";
}

main().catch(console.error);
