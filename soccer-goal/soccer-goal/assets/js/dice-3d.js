import { DICE_TYPES, faceImageUrl, getFaceEffect } from "./dice-config.js";

const FACE_CLASSES = ["front", "back", "right", "left", "top", "bottom"];

const ROTATIONS = [
  { x: 0, y: 0 },
  { x: 0, y: 180 },
  { x: 0, y: -90 },
  { x: 0, y: 90 },
  { x: -90, y: 0 },
  { x: 90, y: 0 },
];

function applyFaceTexture(face, config, faceIndex) {
  const effect = config.faces[faceIndex - 1];

  if (config.spritesheet) {
    const total = config.spritesheetFaces ?? 6;
    const sliceH = config.spritesheetHeight / total;
    const url = `${config.folder}/${encodeURIComponent(config.spritesheet)}`;
    face.style.backgroundImage = `url("${url}")`;
    face.style.backgroundSize = `${config.spritesheetWidth}px ${config.spritesheetHeight}px`;
    face.style.backgroundPosition = `0 ${-(faceIndex - 1) * sliceH}px`;
    face.classList.remove("face-wood");
    return;
  }

  const url = faceImageUrl(config, faceIndex);
  if (url) {
    const img = new Image();
    img.onload = () => {
      face.style.backgroundImage = `url("${url}")`;
      face.classList.remove("face-wood");
    };
    img.onerror = () => applyWoodFallback(face, effect, config.color);
    img.src = url;
  } else {
    applyWoodFallback(face, effect, config.color);
  }
}

export function createDice3D(typeKey, options = {}) {
  const config = DICE_TYPES[typeKey];
  if (!config) return null;

  const wrap = document.createElement("div");
  wrap.className = "dice-3d";
  if (config.folder || config.spritesheet) wrap.classList.add("dice-3d--textured");
  wrap.dataset.diceType = typeKey;

  const cube = document.createElement("div");
  cube.className = "cube";

  FACE_CLASSES.forEach((cls, i) => {
    const face = document.createElement("div");
    face.className = `face face-${cls}`;
    applyFaceTexture(face, config, i + 1);
    cube.appendChild(face);
  });

  wrap.appendChild(cube);

  let currentFace = options.initialFace ?? 1;

  function showFace(n) {
    currentFace = ((n - 1) % 6 + 6) % 6 + 1;
    const rot = ROTATIONS[currentFace - 1];
    cube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  }

  function roll() {
    return new Promise((resolve) => {
      const result = Math.floor(Math.random() * 6) + 1;
      wrap.classList.add("rolling");

      const spins = 3 + Math.floor(Math.random() * 3);
      const startX = Math.random() * 360;
      const startY = Math.random() * 360;

      cube.style.transform = `rotateX(${startX + spins * 360}deg) rotateY(${startY + spins * 360}deg)`;

      setTimeout(() => {
        wrap.classList.remove("rolling");
        showFace(result);
        const effect = getFaceEffect(typeKey, result);
        resolve({ face: result, label: effect.label, effect });
      }, 900);
    });
  }

  showFace(currentFace);

  wrap.addEventListener("click", (e) => {
    e.stopPropagation();
    if (options.onClick) options.onClick(typeKey, wrap);
  });

  return { element: wrap, roll, showFace, getFace: () => currentFace, config };
}

function applyWoodFallback(face, effect, color) {
  face.classList.add("face-wood");
  face.textContent = effect?.label || "?";
  face.style.backgroundColor = color;
}

export function mountDiceIn(container, typeKey, options = {}) {
  const slot = document.createElement("div");
  slot.className = "dice-slot";
  slot.dataset.diceType = typeKey;

  const config = DICE_TYPES[typeKey];
  if (config.role === "reserve") slot.classList.add("reserve");
  if (config.role === "verteidigung") slot.classList.add("defense");

  const dice = createDice3D(typeKey, {
    ...options,
    onClick: (type) => {
      container.closest(".board-table")?.querySelectorAll(".dice-slot").forEach((s) => {
        s.classList.remove("selected");
      });
      slot.classList.add("selected");
      if (options.onClick) options.onClick(type, dice);
    },
  });

  const label = document.createElement("span");
  label.className = "dice-label";
  label.textContent = `${config.id} · ${config.label}`;

  slot.appendChild(dice.element);
  slot.appendChild(label);
  container.appendChild(slot);

  return dice;
}
