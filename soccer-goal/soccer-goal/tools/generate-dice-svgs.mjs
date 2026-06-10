import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function arrowSvg(bg, content, sub = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${bg}"/>
  <polygon points="100,28 148,108 124,108 124,168 76,168 76,108 52,108" fill="#fff"/>
  <text x="100" y="118" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="42" font-weight="900" fill="${bg}">${content}</text>
  ${sub}
</svg>`;
}

function labelSvg(bg, fg, text, small = false) {
  const fs = small ? 22 : 28;
  const lines = text.split("\n");
  const tspans = lines.map((l, i) => `<tspan x="100" dy="${i === 0 ? 0 : fs}">${l}</tspan>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${bg}"/>
  <text x="100" y="${lines.length > 1 ? 78 : 112}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" fill="${fg}">${tspans}</text>
</svg>`;
}

function meisterSvg(bg, fg, text) {
  return labelSvg(bg, fg, text, text.length > 12);
}

const sets = {
  "Würfel-Orange": {
    color: "#e67e22",
    files: ["1.svg", "2-diag.svg", "2-seit.svg", "frage.svg", "x.svg", "1-back.svg"],
    maker: (i, f) => {
      if (f === "frage.svg") return arrowSvg("#e67e22", "?");
      if (f === "x.svg") return arrowSvg("#e67e22", "X");
      if (f === "2-diag.svg") return arrowSvg("#e67e22", "2");
      if (f === "2-seit.svg") return labelSvg("#e67e22", "#fff", "2 →");
      if (f === "1-back.svg") return labelSvg("#e67e22", "#fff", "1 ↓");
      return arrowSvg("#e67e22", "1");
    },
  },
  "Würfel-Schuss": {
    color: "#c0392b",
    files: ["tor.svg", "unhaltbar.svg", "pfosten.svg", "querlatte.svg", "vorbei.svg", "tor2.svg"],
    maker: (_, f) => {
      const map = {
        "tor.svg": "TOR?",
        "tor2.svg": "TOR?",
        "unhaltbar.svg": "UNHALTBAR",
        "pfosten.svg": "PFOSTEN",
        "querlatte.svg": "QUERLATTE",
        "vorbei.svg": "VORBEI",
      };
      return labelSvg("#c0392b", "#fff", map[f], true);
    },
  },
  "Würfel-Torwart": {
    color: "#5dade2",
    files: ["gehalten.svg", "tor.svg", "faust.svg", "pariert.svg", "gehalten2.svg", "tor2.svg"],
    maker: (_, f) => {
      const map = {
        "gehalten.svg": "GEHALTEN",
        "gehalten2.svg": "GEHALTEN",
        "tor.svg": "TOR",
        "tor2.svg": "TOR",
        "faust.svg": "FAUST",
        "pariert.svg": "PARIERT",
      };
      return labelSvg("#5dade2", "#0a2a4a", map[f], true);
    },
  },
  "Würfel-Elfmeter": {
    color: "#1a1a1a",
    files: ["tor.svg", "vorbei.svg", "pariert.svg", "tor2.svg", "faust.svg", "vorbei2.svg"],
    maker: (_, f) => {
      const map = {
        "tor.svg": "TOR",
        "tor2.svg": "TOR",
        "vorbei.svg": "VORBEI",
        "vorbei2.svg": "VORBEI",
        "pariert.svg": "PARIERT",
        "faust.svg": "FAUST",
      };
      return labelSvg("#1a1a1a", "#fff", map[f]);
    },
  },
  "Würfel-Meister": {
    color: "#f0f0f0",
    files: ["weitschuss.svg", "torvorlage.svg", "unhaltbar.svg", "abwehr.svg", "rueck.svg", "foul.svg"],
    maker: (_, f) => {
      const red = ["weitschuss", "torvorlage", "unhaltbar"].includes(f.replace(".svg", ""));
      const blue = ["abwehr", "rueck"].includes(f.replace(".svg", ""));
      const bg = red ? "#c0392b" : blue ? "#1a3a6e" : "#888";
      const fg = "#fff";
      const map = {
        "weitschuss.svg": "WEIT\nSCHUSS",
        "torvorlage.svg": "TOR\nVORLAGE",
        "unhaltbar.svg": "UNHALT\nBAR",
        "abwehr.svg": "PERFEKTE\nABWEHR",
        "rueck.svg": "RÜCK\nEROBERUNG",
        "foul.svg": "FOUL",
      };
      return meisterSvg(bg, fg, map[f]);
    },
  },
};

for (const [folder, cfg] of Object.entries(sets)) {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  cfg.files.forEach((file, i) => {
    writeFileSync(join(dir, file), cfg.maker(i, file));
  });
  console.log(`Created ${cfg.files.length} faces in ${folder}`);
}
