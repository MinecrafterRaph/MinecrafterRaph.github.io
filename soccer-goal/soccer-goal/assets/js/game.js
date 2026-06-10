import { mountDiceIn } from "./dice-3d.js";
import { DICE_TYPES, ANGRIFF_DICE } from "./dice-config.js";
import {
  applyMove,
  canShoot,
  isPenalty,
  isMiddleRow,
  moveVector,
  goalKickPosition,
  cornerKickPosition,
  throwInPosition,
  centerSpot,
  formatPos,
  formatTime,
  forwardSign,
  opponent,
} from "./game-rules.js";
import { MultiplayerSession, hasMultiplayerBackend } from "./multiplayer.js";
import {
  getSession,
  getProfile,
  isAliasAvailable,
  signUp,
  signIn,
  signOut,
} from "./auth.js";

const state = {
  ball: { col: 2, row: 5 },
  score: [0, 0],
  attacker: 1,
  half: 1,
  secondsLeft: 7 * 60 + 30,
  timerOn: false,
  lastAttackDice: null,
  mustOrange: true,
  restartFree: false,
  restartType: null,
  selectedDice: "ballkontrolle",
  diceInstances: {},
  phase: "idle",
  pendingEffect: null,
  meisterOwner: 0,
  meisterLabel: "",
  meisterFace: null,
  drawWinner: 0,
  processing: false,
  varEnabled: false,
  wideKick: false,
  defenseFoulStreak: 0,
  timeExpired: false,
  playerNames: ["Spieler 1", "Spieler 2"],
  lastRoll: null,
  localCouch: true,
  pendingShotKeeper: false,
};

const logLines = [];
let mp = null;
let remoteLock = false;
let timerHandle = null;
let currentUser = null;
let currentAlias = null;
let partyAutoStartDone = false;
let randomAutoStartDone = false;

const $ = (id) => document.getElementById(id);

function serializeState() {
  return {
    ball: state.ball,
    score: state.score,
    attacker: state.attacker,
    half: state.half,
    secondsLeft: state.secondsLeft,
    lastAttackDice: state.lastAttackDice,
    mustOrange: state.mustOrange,
    restartFree: state.restartFree,
    restartType: state.restartType,
    selectedDice: state.selectedDice,
    phase: state.phase,
    pendingEffect: state.pendingEffect,
    meisterOwner: state.meisterOwner,
    meisterLabel: state.meisterLabel,
    meisterFace: state.meisterFace,
    drawWinner: state.drawWinner,
    varEnabled: state.varEnabled,
    wideKick: state.wideKick,
    defenseFoulStreak: state.defenseFoulStreak,
    timeExpired: state.timeExpired,
    playerNames: state.playerNames,
    lastRoll: state.lastRoll,
    localCouch: state.localCouch,
    pendingShotKeeper: state.pendingShotKeeper,
  };
}

/** Wer würfelt gerade physisch am Gerät? */
function getActiveRoller() {
  if (["defense", "defense_shot", "keeper"].includes(state.phase)) {
    return opponent(state.attacker);
  }
  return state.attacker;
}

function applyFieldRotation() {
  const board = $("boardTable");
  if (!board) return;
  const flip = state.localCouch && !mp?.active && getActiveRoller() === 1;
  board.classList.toggle("view-flipped", flip);
}

function applySerialized(data) {
  if (!data || typeof data !== "object") return;
  const keys = Object.keys(serializeState());
  keys.forEach((k) => {
    if (data[k] !== undefined) state[k] = data[k];
  });
}

async function syncPush(status = "playing") {
  if (!mp?.active || remoteLock) return;
  await mp.push(serializeState(), logLines.slice(-80), status);
}

function log(msg) {
  logLines.push(msg);
  const p = document.createElement("p");
  p.textContent = msg;
  $("gameLog").appendChild(p);
  $("gameLog").scrollTop = $("gameLog").scrollHeight;
}

function renderLogFromRemote(lines) {
  logLines.length = 0;
  logLines.push(...lines);
  $("gameLog").innerHTML = "";
  lines.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    $("gameLog").appendChild(p);
  });
}

function playerName(p) {
  return state.playerNames[p] || (p === 0 ? "Spieler 1" : "Spieler 2");
}

function guardTurn(actionLabel) {
  if (!mp?.active) return true;
  if (!mp.canAct(state)) {
    log(`Nicht dein Zug (${actionLabel}).`);
    updateUI();
    return false;
  }
  return true;
}

function buildGrid() {
  const grid = $("fieldGrid");
  grid.innerHTML = "";
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("div");
      cell.className = "field-cell";
      cell.dataset.col = c;
      cell.dataset.row = r;
      if (isPenalty(c, r, 0) || isPenalty(c, r, 1)) cell.classList.add("penalty");
      if (r <= 2 || r >= 8) cell.classList.add("shoot-zone");
      grid.appendChild(cell);
    }
  }
  ["shootMarkersLeft", "shootMarkersRight"].forEach((id) => {
    const el = $(id);
    el.innerHTML = "";
    for (let r = 0; r < 11; r++) {
      const mark = document.createElement("span");
      if (r <= 2 || r >= 8) mark.classList.add("marked");
      el.appendChild(mark);
    }
  });
}

function updateBallVisual() {
  const { col, row } = state.ball;
  $("ball").style.left = `${col * 20 + 10}%`;
  $("ball").style.top = `${row * (100 / 11) + 100 / 22}%`;
  $("fieldGrid").querySelectorAll(".field-cell").forEach((cell) => {
    cell.classList.toggle(
      "has-ball",
      Number(cell.dataset.col) === col && Number(cell.dataset.row) === row
    );
  });
  $("ballPos").textContent = `Ball: ${formatPos(col, row)}`;
}

function applyLastRollVisual() {
  if (!state.lastRoll?.dice || !state.diceInstances[state.lastRoll.dice]) return;
  state.diceInstances[state.lastRoll.dice].showFace(state.lastRoll.face);
}

function updateUI() {
  $("scoreP1").textContent = state.score[0];
  $("scoreP2").textContent = state.score[1];
  $("timer").textContent = formatTime(state.secondsLeft);
  $("player1Label").textContent = state.playerNames[0];
  $("player2Label").textContent = state.playerNames[1];

  const atk = playerName(state.attacker);
  const def = playerName(opponent(state.attacker));
  $("roleBadge").textContent = `${atk} · Angreifer | ${def} · Verteidiger`;

  const roller = getActiveRoller();
  const rollerName = playerName(roller);
  const rollerEl = $("rollerTurn");
  const couchPanel = $("localCouchPanel");
  if (couchPanel) couchPanel.hidden = !!mp?.active;

  if (state.localCouch && !mp?.active) {
    rollerEl.hidden = false;
    if (state.phase === "defense" || state.phase === "defense_shot") {
      rollerEl.textContent = `${rollerName} würfelt Verteidigung (E)`;
    } else if (state.phase === "keeper") {
      rollerEl.textContent = `${rollerName} würfelt Torwart (F)`;
    } else if (state.phase === "pick_dir") {
      rollerEl.textContent = `${rollerName} wählt Richtung`;
    } else {
      rollerEl.textContent = `${rollerName} ist am Zug – würfle!`;
    }
  } else {
    rollerEl.hidden = true;
  }
  applyFieldRotation();

  const youEl = $("youVsOpponent");
  if (mp?.active) {
    youEl.textContent = `Du: ${mp.myName()}  vs  ${mp.opponentName()}`;
    $("matchBanner").textContent =
      mp.mode === "random"
        ? `Zufallsmatch · ${mp.myName()} vs ${mp.opponentName()}`
        : `Party ${mp.roomCode} · Host: ${state.playerNames[mp.isHost ? mp.slot : 1 - mp.slot]}`;
  } else if (currentAlias) {
    youEl.textContent = `Lokal · ${currentAlias}`;
  } else {
    youEl.textContent = "";
  }

  $("meisterInfo").textContent = state.meisterOwner !== null
    ? `Meister (${playerName(state.meisterOwner)}): ${state.meisterLabel || "–"}`
    : "";

  const phaseText = {
    idle: state.restartType ? `${state.restartType.toUpperCase()} – ${atk}` : `${atk} ist am Zug`,
    pick_dir: "Richtung wählen",
    defense: `${def} · Verteidigung (E)`,
    keeper: `${def} · Torwart (F)`,
    defense_shot: `${def} · Abfangen`,
    penalty: "Elfmeter!",
  };
  $("gameStatus").textContent = `HZ ${state.half} · ${phaseText[state.phase] || atk}`;

  const myTurn = !mp?.active || mp.canAct(state);
  const shootOk = canShoot(state.ball.col, state.ball.row, state.attacker) && state.phase === "idle";
  $("btnShoot").disabled = !shootOk || state.processing || !myTurn;
  $("btnRoll").disabled = state.processing || state.phase === "pick_dir" || !myTurn;
  $("btnDefend").hidden = state.phase !== "defense" && state.phase !== "defense_shot";
  $("btnKeeper").hidden = state.phase !== "keeper";
  $("dirPick").hidden = state.phase !== "pick_dir";
  $("btnWide").disabled = !state.restartType || state.processing || !myTurn;
  $("btnNewGame").disabled = mp?.active && !mp.isHost;
  $("btnHalf").disabled = mp?.active && !mp.isHost;

  if (mp?.active) {
    $("onlineStatus").textContent = `Online · Raum ${mp.roomCode} · Du: ${mp.myName()}${myTurn ? " · Am Zug" : ""}`;
  }
}

function selectDiceSlot(type) {
  state.selectedDice = type;
  document.querySelectorAll(".dice-slot").forEach((s) => s.classList.remove("selected"));
  document.querySelector(`[data-dice-type="${type}"]`)?.classList.add("selected");
}

function selectDice(type) {
  if (state.processing || remoteLock) return;
  if (["idle", "penalty"].includes(state.phase) || state.phase === "defense" || state.phase === "keeper") {
    selectDiceSlot(type);
  }
}

function mountAllDice() {
  const onClick = (type) => selectDice(type);
  ANGRIFF_DICE.forEach((key) => {
    state.diceInstances[key] = mountDiceIn($("attackDice"), key, { onClick });
  });
  state.diceInstances.verteidigung = mountDiceIn($("defenseDice"), "verteidigung", { onClick });
  state.diceInstances.meister = mountDiceIn($("meisterDice"), "meister", { onClick });
  ["schuss", "torwart", "elfmeter"].forEach((key) => {
    state.diceInstances[key] = mountDiceIn($("reserveDice"), key, { onClick });
  });
  selectDiceSlot("ballkontrolle");
}

async function rollDice(key) {
  const result = await state.diceInstances[key].roll();
  state.lastRoll = { dice: key, face: result.face };
  return result;
}

function setRestart(type) {
  state.restartType = type;
  state.restartFree = true;
  state.mustOrange = !["anpfiff", "eckstoss", "einwurf", "freistoss"].includes(type);
  if (type === "eckstoss") {
    state.ball = cornerKickPosition(state.attacker, 1);
    log("Eckstoß – Ball an die Ecke.");
    updateBallVisual();
  } else if (type === "einwurf") {
    state.ball = throwInPosition(1);
    log("Einwurf von der Seitenlinie (Mitte).");
    updateBallVisual();
  } else if (type === "freistoss") {
    log("Direkter Freistoß.");
  }
  updateUI();
}

function swapPossession(reason) {
  if (state.timeExpired) {
    log("Zeit abgelaufen – Partie endet mit Ballwechsel.");
    state.timerOn = false;
  }
  state.attacker = opponent(state.attacker);
  state.lastAttackDice = null;
  state.mustOrange = true;
  state.restartFree = false;
  state.restartType = null;
  state.wideKick = false;
  state.defenseFoulStreak = 0;
  selectDiceSlot("ballkontrolle");
  log(`Ballwechsel → ${playerName(state.attacker)}. (${reason})`);
  updateUI();
  applyFieldRotation();
}

function scoreGoal(forPlayer) {
  state.score[forPlayer] += 1;
  log(`⚽ TOR für ${playerName(forPlayer)}!`);
  state.ball = centerSpot();
  state.restartFree = true;
  state.restartType = "anpfiff";
  state.mustOrange = false;
  updateBallVisual();
}

async function transferMeister(fromUser = true) {
  const next = opponent(state.meisterOwner);
  state.meisterOwner = next;
  const roll = await rollDice("meister");
  state.meisterFace = roll.effect.meister;
  state.meisterLabel = roll.label;
  log(
    fromUser
      ? `Meisterwürfel an ${playerName(next)} → neu: ${roll.label}`
      : `Meisterwürfel (${playerName(next)}): ${roll.label}`
  );
  updateUI();
}

async function checkVarBeforePenalty() {
  if (!state.varEnabled) return true;
  log("VAR-Prüfung mit orangem Würfel…");
  const { label, effect } = await rollDice("ballkontrolle");
  log(`VAR: ${label}`);
  if (effect.intercept) {
    log("VAR: Kein Elfmeter – Angreifer behält den Ball.");
    return false;
  }
  log("VAR: Elfmeter bestätigt.");
  return true;
}

async function resolvePenalty() {
  const ok = await checkVarBeforePenalty();
  if (!ok) return;
  state.phase = "penalty";
  updateUI();
  log("Elfmeter!");
  const { label, effect } = await rollDice("elfmeter");
  log(`Elfmeter: ${label}`);
  switch (effect.penalty) {
    case "tor": scoreGoal(state.attacker); break;
    case "vorbei":
      state.ball = goalKickPosition(opponent(state.attacker));
      swapPossession("Elfmeter vorbei");
      updateBallVisual();
      break;
    case "pariert": setRestart("eckstoss"); break;
    case "faust": log("Faustabwehr – Angreifer bleibt am Ball."); break;
    default: break;
  }
  state.phase = "idle";
  updateUI();
}

async function resolveDefenseRoll(context) {
  const atkBefore = state.attacker;
  const { label, effect } = await rollDice("verteidigung");
  log(`Verteidigung: ${label}`);

  if (effect.defense === "foul") {
    state.defenseFoulStreak += 1;
    if (state.defenseFoulStreak >= 2) {
      log("Platzverweis! Zweimal Foul mit E.");
      if (state.meisterOwner === opponent(state.attacker)) await transferMeister(false);
      state.defenseFoulStreak = 0;
    }
    log("Foul – Freistoß für den Angreifer.");
    state.pendingShotKeeper = false;
    if (isPenalty(state.ball.col, state.ball.row, state.attacker)) await resolvePenalty();
    else setRestart("freistoss");
    state.phase = "idle";
    updateUI();
    return;
  }

  state.defenseFoulStreak = 0;
  switch (effect.defense) {
    case "klauen":
      log("Ballbesitz erobert!");
      swapPossession("Abgefangen (Klauen)");
      break;
    case "verpassen":
      log("Verfehlt – Angreifer behält den Ball.");
      break;
    case "eigentor":
      if (isPenalty(state.ball.col, state.ball.row, state.attacker)) scoreGoal(state.attacker);
      else log("Kein Eigentor – Ball beim Angreifer.");
      break;
    case "abwehren": {
      const sign = forwardSign(state.attacker);
      const back = applyMove(state.ball.col, state.ball.row, 0, -sign * 3, state.attacker);
      state.ball = { col: back.col, row: back.row };
      updateBallVisual();
      log("Abgewehrt – Ball 3 Felder zurück.");
      break;
    }
    default: break;
  }
  if (context === "shot" && state.pendingShotKeeper && state.attacker === atkBefore) {
    state.pendingShotKeeper = false;
    beginKeeperPhase("Tor? – Torwart (F) würfeln.");
    return;
  }
  state.pendingShotKeeper = false;
  state.phase = "idle";
  updateUI();
}

function beginKeeperPhase(msg) {
  if (msg) log(msg);
  state.phase = "keeper";
  selectDiceSlot("torwart");
  updateUI();
}

async function resolveKeeperRoll() {
  const { label, effect } = await rollDice("torwart");
  log(`Torwart: ${label}`);
  switch (effect.keeper) {
    case "gehalten":
      swapPossession("Gehalten");
      state.ball = goalKickPosition(state.attacker);
      updateBallVisual();
      break;
    case "tor": scoreGoal(state.attacker); break;
    case "faust": log("Faustabwehr – Angreifer bleibt am Ball."); break;
    case "pariert": setRestart("eckstoss"); break;
    default: break;
  }
  state.phase = "idle";
  updateUI();
}

async function resolveShot(effect) {
  const inBox = isPenalty(state.ball.col, state.ball.row, state.attacker);
  switch (effect.shot) {
    case "unhaltbar":
      if (state.meisterOwner === opponent(state.attacker) && state.meisterFace === "abwehr") {
        log("Perfekte Abwehr – kein Tor!");
        state.meisterFace = null;
        state.meisterLabel = "";
        await transferMeister(false);
      } else if (state.meisterOwner === opponent(state.attacker) && state.meisterFace === "rueck" && !inBox) {
        log("Meister-Rückeroberung!");
        swapPossession("Unhaltbar abgefangen");
        await transferMeister();
      } else {
        scoreGoal(state.attacker);
      }
      break;
    case "tor?":
      if (inBox) beginKeeperPhase("Tor? im Strafraum – Torwart (F) würfeln.");
      else {
        log("Tor? – Verteidiger darf E würfeln.");
        state.phase = "defense_shot";
        state.pendingShotKeeper = true;
        selectDiceSlot("verteidigung");
        updateUI();
      }
      break;
    case "pfosten":
      log("Pfosten – Verteidiger darf E würfeln.");
      state.phase = "defense_shot";
      state.pendingShotKeeper = false;
      selectDiceSlot("verteidigung");
      updateUI();
      break;
    case "querlatte": beginKeeperPhase("Querlatte – Torwart (F) würfeln."); break;
    case "vorbei":
      state.ball = goalKickPosition(opponent(state.attacker));
      swapPossession("Schuss vorbei");
      updateBallVisual();
      break;
    default: break;
  }
}

async function handleSideOut(result, effect) {
  const { row } = state.ball;
  if (effect?.dir === "diag" && isMiddleRow(row)) {
    state.ball = throwInPosition(result.lateral);
    swapPossession("Einwurf");
    log("Einwurf – Ballbesitz wechselt.");
    updateBallVisual();
    return;
  }
  state.ball = goalKickPosition(opponent(state.attacker));
  swapPossession("Abstoß");
  log("Ball ins Aus – Abstoß.");
  updateBallVisual();
}

async function executeMove(effect, lateral = 0) {
  const vec = moveVector(effect, state.attacker, lateral, state.wideKick);
  if (state.wideKick) {
    log("Weiter Schuss – Schritte verdoppelt!");
    state.wideKick = false;
  }
  const result = applyMove(state.ball.col, state.ball.row, vec.dCol, vec.dRow, state.attacker);
  if (result.event === "side_out") {
    await handleSideOut(result, effect);
    return;
  }
  state.ball = { col: result.col, row: result.row };
  if (result.event === "goal") {
    scoreGoal(state.attacker);
    return;
  }
  updateBallVisual();
}

async function finishAttackAfterMove(effect) {
  if (effect.loseBall) {
    log(`X – Ball ${effect.steps || 1} Feld(er) bewegt, dann Ballverlust!`);
    swapPossession("X");
    return;
  }
  if (effect.intercept) {
    const defender = playerName(opponent(state.attacker));
    log(`? – ${defender} darf Verteidigung (E) würfeln – evtl. Ballbesitz!`);
    state.phase = "defense";
    selectDiceSlot("verteidigung");
    updateUI();
    if (mp?.active && mp.slot === opponent(state.attacker)) {
      log("Du bist Verteidiger – klicke „Würfeln“.");
    }
  }
}

async function handleAttackRoll(effect) {
  if (effect.dir === "diag" || effect.dir === "side") {
    state.pendingEffect = effect;
    state.phase = "pick_dir";
    updateUI();
    return;
  }
  await executeMove(effect);
  await finishAttackAfterMove(effect);
}

async function applyMeister(effect) {
  const def = opponent(state.attacker);
  switch (effect.meister) {
    case "unhaltbar":
      if (state.meisterOwner === def && state.meisterFace === "abwehr") log("Perfekte Abwehr!");
      else scoreGoal(state.attacker);
      break;
    case "abwehr": log("Perfekte Abwehr – aktiv bei unhaltbarem Schuss."); break;
    case "rueck": swapPossession("Meister-Rückeroberung"); break;
    case "weitschuss":
      state.ball = centerSpot();
      updateBallVisual();
      beginKeeperPhase("Weitschuss – Torwart (F) würfeln.");
      break;
    case "torvorlage":
      state.ball.row = state.attacker === 0 ? 2 : 8;
      state.ball.col = 2;
      updateBallVisual();
      log("Torvorlage – Ball schussbereit.");
      break;
    case "foul":
      if (isPenalty(state.ball.col, state.ball.row, def)) await resolvePenalty();
      else setRestart("freistoss");
      break;
    default: break;
  }
  await transferMeister();
}

async function rollSelected() {
  if (state.processing || remoteLock) return;

  if (state.phase === "defense" || state.phase === "defense_shot") {
    if (!guardTurn("Verteidigung")) return;
    state.processing = true;
    await resolveDefenseRoll(state.phase === "defense_shot" ? "shot" : "intercept");
    state.processing = false;
    await syncPush();
    updateUI();
    return;
  }

  if (state.phase === "keeper") {
    if (!guardTurn("Torwart")) return;
    state.processing = true;
    await resolveKeeperRoll();
    state.processing = false;
    await syncPush();
    return;
  }

  if (state.phase !== "idle") return;

  const type = state.selectedDice;

  if (ANGRIFF_DICE.includes(type)) {
    if (!guardTurn("Angriff")) return;
    if (state.mustOrange && type !== "ballkontrolle" && !state.restartFree) {
      log("Zuerst Ballkontrolle (orange)!");
      return;
    }
    if (type === "ballkontrolle" && state.lastAttackDice === "ballkontrolle") {
      log("Orange nicht zweimal hintereinander!");
      return;
    }

    state.processing = true;
    const { label, effect } = await rollDice(type);
    log(`${DICE_TYPES[type].label}: ${label}`);
    state.lastAttackDice = type;
    state.restartFree = false;
    state.restartType = null;

    await handleAttackRoll(effect);
    state.processing = false;
    if (!["pick_dir", "defense", "defense_shot", "keeper"].includes(state.phase)) state.phase = "idle";
    await syncPush();
    updateUI();
    return;
  }

  if (type === "meister" && state.meisterOwner === state.attacker) {
    if (!guardTurn("Meisterwürfel")) return;
    state.processing = true;
    log(`Meisterwürfel: ${state.meisterLabel}`);
    await applyMeister({ meister: state.meisterFace, label: state.meisterLabel });
    state.processing = false;
    await syncPush();
    updateUI();
  }
}

async function rollShoot() {
  if (!guardTurn("Schuss")) return;
  if (!canShoot(state.ball.col, state.ball.row, state.attacker)) {
    log("Nicht im Schussbereich!");
    return;
  }
  state.processing = true;
  selectDiceSlot("schuss");
  const { label, effect } = await rollDice("schuss");
  log(`Schuss: ${label}`);
  await resolveShot(effect);
  state.processing = false;
  if (!["defense", "defense_shot", "keeper"].includes(state.phase)) state.phase = "idle";
  await syncPush();
  updateUI();
}

async function pickDirection(lateral) {
  if (!guardTurn("Richtung")) return;
  if (state.phase !== "pick_dir" || !state.pendingEffect) return;
  state.processing = true;
  const effect = state.pendingEffect;
  state.pendingEffect = null;
  state.phase = "idle";
  await executeMove(effect, lateral);
  await finishAttackAfterMove(effect);
  state.processing = false;
  await syncPush();
  updateUI();
}

function toggleWideKick() {
  if (!guardTurn("Weiter Schuss")) return;
  if (!state.restartType) return;
  state.wideKick = !state.wideKick;
  log(state.wideKick ? "Weiter Schuss (x2) angesagt." : "Weiter Schuss abgesagt.");
  syncPush();
  updateUI();
}

function startTimer() {
  if (state.timerOn) return;
  state.timerOn = true;
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(async () => {
    if (!state.timerOn || state.secondsLeft <= 0) return;
    if (mp?.active && !mp.isHost) return;
    state.secondsLeft -= 1;
    $("timer").textContent = formatTime(state.secondsLeft);
    if (state.secondsLeft <= 0) {
      state.timeExpired = true;
      log("Zeit ab – Spiel bis zum nächsten Ballwechsel.");
    }
    if (state.secondsLeft % 3 === 0) await syncPush();
  }, 1000);
}

async function newGame() {
  if (mp?.active && !mp.isHost) {
    log("Nur der Host startet die Partie.");
    return;
  }

  state.score = [0, 0];
  state.attacker = 1;
  state.half = 1;
  state.secondsLeft = 7 * 60 + 30;
  state.timeExpired = false;
  state.lastAttackDice = null;
  state.mustOrange = true;
  state.restartFree = true;
  state.restartType = "anpfiff";
  state.phase = "idle";
  state.meisterOwner = state.drawWinner;
  state.wideKick = false;
  state.defenseFoulStreak = 0;
  state.pendingShotKeeper = false;
  state.ball = centerSpot();
  state.processing = false;
  state.varEnabled = $("varToggle").checked;
  state.localCouch = $("localCouch").checked && !mp?.active;
  if (mp?.active) state.playerNames = [...mp.playerNames];
  else if (currentAlias) state.playerNames = [currentAlias, "Spieler 2"];
  else if (state.localCouch) {
    state.playerNames = [
      $("localName1").value.trim() || "Spieler 1",
      $("localName2").value.trim() || "Spieler 2",
    ];
  }

  logLines.length = 0;
  $("gameLog").innerHTML = "";
  log("Auslosung: Spieler 1 erhält Meisterwürfel. Spieler 2 beginnt.");
  log(state.varEnabled ? "VAR aktiv." : "Ohne VAR.");
  if (mp?.active) {
    log(`${state.playerNames[0]} vs ${state.playerNames[1]}`);
  } else if (currentAlias) {
    log(`Lokal als ${currentAlias}`);
  }

  const meisterRoll = await rollDice("meister");
  state.meisterFace = meisterRoll.effect.meister;
  state.meisterLabel = meisterRoll.label;
  log(`Meisterwürfel offen: ${meisterRoll.label}`);

  selectDiceSlot("ballkontrolle");
  updateBallVisual();
  updateUI();
  startTimer();
  await syncPush("playing");
}

async function toggleHalf() {
  if (mp?.active && !mp.isHost) {
    log("Nur der Host wechselt die Halbzeit.");
    return;
  }
  if (state.half === 1) {
    state.half = 2;
    state.secondsLeft = 7 * 60 + 30;
    state.timeExpired = false;
    state.attacker = state.drawWinner;
    state.mustOrange = true;
    state.restartFree = true;
    log(`2. Halbzeit – ${playerName(state.drawWinner)} beginnt.`);
  } else {
    state.timerOn = false;
    log(`Spielende: ${state.score[0]} : ${state.score[1]}`);
    await syncPush("finished");
  }
  await syncPush();
  updateUI();
}

async function tryAutoStart(row) {
  if (!mp?.active) return;
  if (row.mode === "party" && mp.isHost && row.status === "ready" && row.player2_id && !partyAutoStartDone) {
    partyAutoStartDone = true;
    log(`Gegner ${row.player2_name} ist da – Partie startet!`);
    await newGame();
    return;
  }
  if (row.mode === "random" && row.status === "ready" && mp.isHost && !randomAutoStartDone) {
    randomAutoStartDone = true;
    log(`Zufallsmatch gegen ${mp.opponentName()} – Anpfiff!`);
    await newGame();
  }
}

function onRemoteRoomUpdate(row) {
  remoteLock = true;
  try {
    if (row.player1_name || row.player2_name) {
      state.playerNames = [row.player1_name || "?", row.player2_name || "?"];
      if (mp) mp.playerNames = state.playerNames;
    }
    if (Array.isArray(row.log_lines) && row.log_lines.length) {
      renderLogFromRemote(row.log_lines);
    }
    if (row.game_state && Object.keys(row.game_state).length) {
      applySerialized(row.game_state);
      applyLastRollVisual();
      updateBallVisual();
    }
    updateUI();
  } finally {
    remoteLock = false;
  }
  tryAutoStart(row);
  if (row._autoStart) tryAutoStart(row);
}

function setAuthUI(loggedIn, alias = "") {
  $("authLoggedOut").hidden = loggedIn;
  $("authLoggedIn").hidden = !loggedIn;
  $("onlinePanel").hidden = !loggedIn;
  if (loggedIn) {
    $("authAliasDisplay").textContent = alias;
    $("authStatus").textContent = `Online als ${alias}`;
  }
}

async function refreshAuth() {
  if (!hasMultiplayerBackend()) {
    $("authStatus").textContent = "Supabase fehlt in assets/js/config/backend.js";
    return;
  }
  const session = await getSession();
  if (!session) {
    currentUser = null;
    currentAlias = null;
    setAuthUI(false);
    return;
  }
  const profile = await getProfile();
  currentUser = session.user;
  currentAlias = profile?.alias || session.user.email;
  setAuthUI(true, currentAlias);
  if (!mp) {
    mp = new MultiplayerSession(onRemoteRoomUpdate);
    await mp.init(currentUser.id);
  }
}

async function initAuthAndOnline() {
  $("btnCheckAlias").addEventListener("click", async () => {
    try {
      const result = await isAliasAvailable($("authAlias").value);
      $("authStatus").textContent = result.ok ? "Alias ist frei!" : result.reason;
    } catch (e) {
      $("authStatus").textContent = e.message;
    }
  });

  $("btnRegister").addEventListener("click", async () => {
    try {
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value;
      const alias = $("authAlias").value.trim();
      if (!email || !password || !alias) throw new Error("E-Mail, Passwort und Alias ausfüllen.");
      await signUp(email, password, alias);
      $("authStatus").textContent = "Account erstellt – du bist angemeldet.";
      await refreshAuth();
    } catch (e) {
      $("authStatus").textContent = e.message;
    }
  });

  $("btnLogin").addEventListener("click", async () => {
    try {
      await signIn($("authEmail").value.trim(), $("authPassword").value);
      $("authStatus").textContent = "Angemeldet.";
      await refreshAuth();
    } catch (e) {
      $("authStatus").textContent = e.message;
    }
  });

  $("btnLogout").addEventListener("click", async () => {
    if (mp) await mp.leave();
    mp = null;
    partyAutoStartDone = false;
    randomAutoStartDone = false;
    await signOut();
    await refreshAuth();
    $("onlineStatus").textContent = "Abgemeldet.";
  });

  $("btnCreateParty").addEventListener("click", async () => {
    try {
      if (!currentAlias) throw new Error("Bitte zuerst anmelden.");
      partyAutoStartDone = false;
      const code = await mp.createParty(currentAlias);
      $("partyCode").value = code;
      state.playerNames[0] = currentAlias;
      $("onlineStatus").textContent = `Party ${code} – Code an Freund senden!`;
      log(`Party ${code} erstellt. Warte auf Gegner…`);
      await syncPush("waiting");
      updateUI();
    } catch (e) {
      $("onlineStatus").textContent = e.message;
    }
  });

  $("btnJoinParty").addEventListener("click", async () => {
    try {
      if (!currentAlias) throw new Error("Bitte zuerst anmelden.");
      const code = $("partyCode").value.trim().toUpperCase();
      const row = await mp.joinParty(code, currentAlias);
      state.playerNames = [row.player1_name, row.player2_name];
      $("onlineStatus").textContent = `Party ${code} beigetreten.`;
      log(`Du bist ${currentAlias} – Partie startet gleich…`);
      updateUI();
    } catch (e) {
      $("onlineStatus").textContent = e.message;
    }
  });

  $("btnFindRandom").addEventListener("click", async () => {
    try {
      if (!currentAlias) throw new Error("Bitte zuerst anmelden.");
      randomAutoStartDone = false;
      $("onlineStatus").textContent = "Suche zufälligen Gegner…";
      const result = await mp.findRandomMatch(currentAlias);
      if (result.status === "waiting") {
        $("onlineStatus").textContent = "Warte auf Gegner in der Warteschlange…";
        log("In Warteschlange – suche zufälligen Gegner…");
      } else {
        state.playerNames = [...mp.playerNames];
        $("onlineStatus").textContent = `Gegner gefunden: ${mp.opponentName()}`;
        if (mp.isHost) await tryAutoStart({ ...result.room, status: "ready", mode: "random" });
      }
      updateUI();
    } catch (e) {
      $("onlineStatus").textContent = e.message;
    }
  });

  await refreshAuth();
}

$("localCouch").addEventListener("change", () => {
  state.localCouch = $("localCouch").checked && !mp?.active;
  updateUI();
});
$("localName1").addEventListener("change", () => {
  if (!mp?.active) state.playerNames[0] = $("localName1").value.trim() || "Spieler 1";
  updateUI();
});
$("localName2").addEventListener("change", () => {
  if (!mp?.active) state.playerNames[1] = $("localName2").value.trim() || "Spieler 2";
  updateUI();
});

buildGrid();
updateBallVisual();
mountAllDice();
state.localCouch = $("localCouch").checked;
updateUI();
initAuthAndOnline();

$("btnRoll").addEventListener("click", rollSelected);
$("btnShoot").addEventListener("click", rollShoot);
$("btnNewGame").addEventListener("click", newGame);
$("btnHalf").addEventListener("click", toggleHalf);
$("btnDefend").addEventListener("click", rollSelected);
$("btnKeeper").addEventListener("click", rollSelected);
$("btnDirLeft").addEventListener("click", () => pickDirection(-1));
$("btnDirRight").addEventListener("click", () => pickDirection(1));
$("btnWide").addEventListener("click", toggleWideKick);
