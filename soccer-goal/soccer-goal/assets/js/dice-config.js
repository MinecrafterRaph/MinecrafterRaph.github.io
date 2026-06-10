/**
 * Würfel-Konfiguration – Bilder + Spielwerte pro Seite
 */

const ROT_FILES = [
  "Herunterladen.png",
  "Herunterladen (1).png",
  "Herunterladen (2).png",
  "Herunterladen (3).png",
  "Herunterladen (4).png",
  "Herunterladen (5).png",
];

const LILA_FILES = [
  "Herunterladen.png",
  "Herunterladen (1).png",
  "Herunterladen (2).png",
  "Herunterladen (3).png",
  "Herunterladen (4).png",
  "Herunterladen (6).png",
];

const ORANGE_FILES = ["1.svg", "2-diag.svg", "2-seit.svg", "frage.svg", "x.svg", "1-back.svg"];
const SCHUSS_FILES = ["tor.svg", "unhaltbar.svg", "pfosten.svg", "querlatte.svg", "vorbei.svg", "tor2.svg"];
const TORWART_FILES = ["gehalten.svg", "tor.svg", "faust.svg", "pariert.svg", "gehalten2.svg", "tor2.svg"];
const ELFMETER_FILES = ["tor.svg", "vorbei.svg", "pariert.svg", "tor2.svg", "faust.svg", "vorbei2.svg"];
const MEISTER_FILES = ["weitschuss.svg", "torvorlage.svg", "unhaltbar.svg", "abwehr.svg", "rueck.svg", "foul.svg"];

export const DICE_TYPES = {
  ballkontrolle: {
    id: "A",
    label: "Ballkontrolle",
    color: "#e67e22",
    role: "angriff",
    folder: "../Würfel-Orange",
    faceFiles: ORANGE_FILES,
    faces: [
      { label: "1↑", steps: 1, dir: "forward" },
      { label: "2↗", steps: 2, dir: "diag" },
      { label: "2→", steps: 2, dir: "side" },
      { label: "?", steps: 1, dir: "forward", intercept: true },
      { label: "1↑X", steps: 1, dir: "forward", loseBall: true },
      { label: "1↓", steps: 1, dir: "back" },
    ],
  },
  ballabgabe: {
    id: "B",
    label: "Ballabgabe",
    color: "#c0392b",
    role: "angriff",
    folder: "../Würfel-Rot",
    faceFiles: ROT_FILES,
    faces: [
      { label: "1↑", steps: 1, dir: "forward" },
      { label: "3↑", steps: 3, dir: "forward" },
      { label: "2↑", steps: 2, dir: "forward" },
      { label: "?", steps: 1, dir: "forward", intercept: true },
      { label: "3↑X", steps: 3, dir: "forward", loseBall: true },
      { label: "2↓", steps: 2, dir: "back" },
    ],
  },
  pass: {
    id: "C",
    label: "Pass",
    color: "#9b30b8",
    role: "angriff",
    folder: "../Würfel-Lila",
    faceFiles: LILA_FILES,
    faces: [
      { label: "?2", steps: 2, dir: "forward", intercept: true },
      { label: "3↑", steps: 3, dir: "forward" },
      { label: "2↑", steps: 2, dir: "forward" },
      { label: "4↑", steps: 4, dir: "forward" },
      { label: "?", steps: 1, dir: "forward", intercept: true },
      { label: "2↑X", steps: 2, dir: "forward", loseBall: true },
    ],
  },
  schuss: {
    id: "D",
    label: "Schuss",
    color: "#c0392b",
    role: "reserve",
    folder: "../Würfel-Schuss",
    faceFiles: SCHUSS_FILES,
    faces: [
      { label: "Tor?", shot: "tor?" },
      { label: "Unhaltbar", shot: "unhaltbar" },
      { label: "Pfosten", shot: "pfosten" },
      { label: "Querlatte", shot: "querlatte" },
      { label: "Vorbei", shot: "vorbei" },
      { label: "Tor?", shot: "tor?" },
    ],
  },
  verteidigung: {
    id: "E",
    label: "Verteidigung",
    color: "#1a3a6e",
    role: "verteidigung",
    folder: "..",
    spritesheet: "Blaue-Würfelarten.png",
    spritesheetWidth: 34,
    spritesheetHeight: 134,
    spritesheetFaces: 6,
    faces: [
      { label: "Klauen", defense: "klauen", hint: "Ballbesitz" },
      { label: "Verpassen", defense: "verpassen", hint: "Verfehlt" },
      { label: "Eigentor", defense: "eigentor", hint: "Eigentor" },
      { label: "Abwehren", defense: "abwehren", hint: "Abwehren" },
      { label: "Foul", defense: "foul", hint: "Foul" },
      { label: "Klauen", defense: "klauen", hint: "Ballbesitz" },
    ],
  },
  torwart: {
    id: "F",
    label: "Torwart",
    color: "#5dade2",
    role: "reserve",
    folder: "../Würfel-Torwart",
    faceFiles: TORWART_FILES,
    faces: [
      { label: "Gehalten", keeper: "gehalten" },
      { label: "Tor", keeper: "tor" },
      { label: "Faust", keeper: "faust" },
      { label: "Pariert", keeper: "pariert" },
      { label: "Gehalten", keeper: "gehalten" },
      { label: "Tor", keeper: "tor" },
    ],
  },
  elfmeter: {
    id: "G",
    label: "Elfmeter",
    color: "#1a1a1a",
    role: "reserve",
    folder: "../Würfel-Elfmeter",
    faceFiles: ELFMETER_FILES,
    faces: [
      { label: "Tor", penalty: "tor" },
      { label: "Vorbei", penalty: "vorbei" },
      { label: "Pariert", penalty: "pariert" },
      { label: "Tor", penalty: "tor" },
      { label: "Faust", penalty: "faust" },
      { label: "Vorbei", penalty: "vorbei" },
    ],
  },
  meister: {
    id: "H",
    label: "Meisterwürfel",
    color: "#f5f5f5",
    role: "meister",
    folder: "../Würfel-Meister",
    faceFiles: MEISTER_FILES,
    faces: [
      { label: "Weitschuss", meister: "weitschuss" },
      { label: "Torvorlage", meister: "torvorlage" },
      { label: "Unhaltbar", meister: "unhaltbar" },
      { label: "Perfekte Abwehr", meister: "abwehr" },
      { label: "Rückeroberung", meister: "rueck" },
      { label: "Foul", meister: "foul" },
    ],
  },
};

export function faceImageUrl(diceConfig, faceIndex) {
  if (diceConfig.spritesheet) return null;
  const files = diceConfig.faceFiles;
  if (!diceConfig.folder || !files) return null;
  const file = files[faceIndex - 1];
  if (!file) return null;
  return `${diceConfig.folder}/${encodeURIComponent(file)}`;
}

export function getFaceEffect(diceKey, faceIndex) {
  const dice = DICE_TYPES[diceKey];
  return dice?.faces?.[faceIndex - 1] ?? { label: "?" };
}

export const ANGRIFF_DICE = ["ballkontrolle", "ballabgabe", "pass"];
