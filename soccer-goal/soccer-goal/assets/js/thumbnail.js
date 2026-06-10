const stage = document.getElementById("thumbStage");
const hint = document.getElementById("playHint");
const status = document.getElementById("thumbStatus");

const hints = [
  "▶ Klicken zum Spielen",
  "⚽ Würfle deinen Weg zum Tor!",
  "🎲 8 Holzwürfel – echtes Fußballgefühl",
  "▶ Klicken zum Spielen",
];

let hintIndex = 0;

setInterval(() => {
  hintIndex = (hintIndex + 1) % hints.length;
  hint.textContent = hints[hintIndex];
}, 3200);

function goToGame() {
  status.textContent = "Spiel wird geladen…";
  window.location.href = "./spiel.html";
}

stage.addEventListener("click", goToGame);
stage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    goToGame();
  }
});

stage.addEventListener("mouseenter", () => {
  status.textContent = "Klicke auf das Bild oder drücke Enter.";
});

stage.addEventListener("mouseleave", () => {
  status.textContent = "Bereit.";
});

// Gelegentlicher Konfetti-Impuls
setInterval(() => {
  stage.style.filter = "brightness(1.08)";
  setTimeout(() => {
    stage.style.filter = "";
  }, 180);
}, 5000);
