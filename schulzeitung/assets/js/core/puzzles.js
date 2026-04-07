import { readJson, writeJson } from "./storage.js";

const KEY = "sz_puzzles";

const defaults = {
  "1": {
    title: "Rätsel der Ausgabe",
    intro: "Löse das Wissensrätsel zur März-Ausgabe.",
    questions: [
      { prompt: "Welche AG dokumentiert die Mülltrennung?", answer: "umwelt" },
      { prompt: "Wie heißt der Bereich für Schüler-Kommentare zu Artikeln?", answer: "kommentare" },
      { prompt: "Welche Rubrik enthält persönliche Stellungnahmen?", answer: "meinungen" },
    ],
  },
  "2": {
    title: "Rätsel der Ausgabe",
    intro: "Teste dein Wissen zu Sport, Kultur und Projektwoche.",
    questions: [
      { prompt: "In welcher Halle fand das Turnier statt?", answer: "dreifachhalle" },
      { prompt: "Welche Woche bot Robotik und Theater?", answer: "projektwoche" },
      { prompt: "Welche Seite zeigt Kommentare zentral?", answer: "kommentare" },
    ],
  },
  "3": {
    title: "Rätsel der Ausgabe",
    intro: "Kurzes Redaktionsrätsel zur Januar-Ausgabe.",
    questions: [
      { prompt: "Wie nennt sich der Redaktionsbereich im Menü?", answer: "redaktion" },
      { prompt: "Welche Rolle veröffentlicht Inhalte final?", answer: "admin" },
      { prompt: "Welche Seite zeigt alle Ausgaben?", answer: "start" },
    ],
  },
  "4": {
    title: "Rätsel der Muster-Ausgabe",
    intro: "Workflow-Rätsel: kennst du die neuen Rollen?",
    questions: [
      { prompt: "Welche Rolle gestaltet Inhalte vor dem Import?", answer: "designer" },
      { prompt: "Welche Rolle überarbeitet Einsendungen zuerst?", answer: "admin" },
      { prompt: "Wie heißt die Seite für Redaktions-Workflow?", answer: "workflow-editor" },
    ],
  },
};

export function getPuzzles() {
  return { ...defaults, ...readJson(KEY, {}) };
}

export function savePuzzles(puzzles) {
  writeJson(KEY, puzzles || {});
}
