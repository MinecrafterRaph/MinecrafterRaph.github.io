/** Spielfeld- und Regel-Logik für Soccer Goal */

export const COLS = 5;
export const ROWS = 11;
export const MIDDLE_ROW = 5;

const PENALTY_TOP = new Set(["0-3", "0-4", "1-3", "1-4", "2-3", "2-4"]);
const PENALTY_BOTTOM = new Set(["8-3", "8-4", "9-3", "9-4", "10-3", "10-4"]);

export function cellKey(col, row) {
  return `${row}-${col}`;
}

export function forwardSign(attacker) {
  return attacker === 0 ? -1 : 1;
}

export function opponent(player) {
  return player === 0 ? 1 : 0;
}

export function isPenalty(col, row, attacker) {
  const key = cellKey(col, row);
  return attacker === 0 ? PENALTY_TOP.has(key) : PENALTY_BOTTOM.has(key);
}

export function isShootZone(row, attacker) {
  return attacker === 0 ? row <= 2 : row >= 8;
}

export function isLongShotZone(col, row, attacker) {
  if (isPenalty(col, row, attacker)) return false;
  if (attacker === 0) return row === 2 || row === 3;
  return row === 8 || row === 7;
}

export function canShoot(col, row, attacker) {
  return isPenalty(col, row, attacker) || isLongShotZone(col, row, attacker);
}

export function isMiddleRow(row) {
  return row === MIDDLE_ROW;
}

export function moveVector(effect, attacker, lateralPick = 0, wide = false) {
  const sign = forwardSign(attacker);
  let steps = effect.steps ?? 1;
  if (wide) steps *= 2;

  switch (effect.dir) {
    case "back":
      return { dCol: 0, dRow: -sign * steps };
    case "diag":
      return { dCol: lateralPick >= 0 ? steps : -steps, dRow: sign * steps };
    case "side":
      return { dCol: lateralPick >= 0 ? steps : -steps, dRow: 0 };
    case "forward":
    default:
      return { dCol: 0, dRow: sign * steps };
  }
}

export function applyMove(col, row, dCol, dRow, attacker) {
  const nc = col + dCol;
  const nr = row + dRow;

  if (nc < 0 || nc >= COLS) {
    return { col, row, event: "side_out", lateral: nc < 0 ? -1 : 1 };
  }

  if (nr < 0) {
    return attacker === 0
      ? { col: nc, row: 0, event: "goal" }
      : { col, row, event: "none" };
  }

  if (nr >= ROWS) {
    return attacker === 1
      ? { col: nc, row: ROWS - 1, event: "goal" }
      : { col, row, event: "none" };
  }

  return { col: nc, row: nr, event: "none" };
}

export function goalKickPosition(defender) {
  return { col: 2, row: defender === 0 ? 2 : 8 };
}

export function abschlagPosition(defender, col = 1) {
  return { col, row: defender === 0 ? 2 : 8 };
}

export function cornerKickPosition(attacker, lateral = 1) {
  const row = attacker === 0 ? 0 : ROWS - 1;
  const col = lateral >= 0 ? COLS - 1 : 0;
  return { col, row };
}

export function throwInPosition(lateral) {
  return { col: lateral < 0 ? 0 : COLS - 1, row: MIDDLE_ROW };
}

export function centerSpot() {
  return { col: 2, row: MIDDLE_ROW };
}

export function formatPos(col, row) {
  return `Zeile ${row + 1}, Spalte ${col + 1}`;
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
