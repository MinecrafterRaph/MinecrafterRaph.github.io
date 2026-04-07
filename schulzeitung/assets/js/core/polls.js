import { LS_KEYS, readJson, writeJson } from "./storage.js";

const DEFAULT_POLL_ID = "default-school-poll";

export function getPollState(pollId = DEFAULT_POLL_ID) {
  const all = readJson(LS_KEYS.POLLS, {});
  return (
    all[pollId] || {
      question: "Welches Thema soll die nächste Ausgabe schwerpunktmäßig behandeln?",
      options: [
        { id: "o1", label: "Nachhaltigkeit & Umwelt", votes: 0 },
        { id: "o2", label: "Digitales Lernen", votes: 0 },
        { id: "o3", label: "Sport & Vereine", votes: 0 },
        { id: "o4", label: "Kunst & Musik", votes: 0 },
      ],
      voterKeys: [],
    }
  );
}

function savePollState(pollId, state) {
  const all = readJson(LS_KEYS.POLLS, {});
  all[pollId] = state;
  writeJson(LS_KEYS.POLLS, all);
}

export function votePoll(optionId, pollId = DEFAULT_POLL_ID) {
  const state = getPollState(pollId);
  const voterKey =
    localStorage.getItem("sz_poll_voter") || "v-" + Math.random().toString(36).slice(2);
  localStorage.setItem("sz_poll_voter", voterKey);
  if (state.voterKeys.includes(voterKey)) {
    return { ok: false, message: "Du hast bereits abgestimmt." };
  }
  const opt = state.options.find((o) => o.id === optionId);
  if (!opt) return { ok: false, message: "Ungültige Option." };
  opt.votes += 1;
  state.voterKeys.push(voterKey);
  savePollState(pollId, state);
  return { ok: true, state };
}

export function hasVoted(pollId = DEFAULT_POLL_ID) {
  const state = getPollState(pollId);
  const voterKey = localStorage.getItem("sz_poll_voter");
  return voterKey && state.voterKeys.includes(voterKey);
}
