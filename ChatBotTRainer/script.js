const STORAGE_VERSION = 2;
const workspacesKey = 'chatbot-trainer-workspaces-v2';
const legacyTrainingKey = 'chatbot-trainer-data';
const legacyHistoryKey = 'chatbot-trainer-history';
const legacyGrammarKey = 'chatbot-trainer-grammar';

// DOM
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const trainingForm = document.getElementById('training-form');
const trainInput = document.getElementById('train-input');
const trainAnswer = document.getElementById('train-answer');
const trainingList = document.getElementById('training-list');
const clearDataButton = document.getElementById('clear-data');
const resetHistoryButton = document.getElementById('reset-history');
const openTrainerButton = document.getElementById('open-trainer');
const openChatButton = document.getElementById('open-chat');
const promptButton = document.getElementById('open-prompt');
const loadWordsButton = document.getElementById('load-words');
const fileInput = document.getElementById('file-input');
const grammarList = document.getElementById('grammar-list');
const grammarForm = document.getElementById('grammar-form');
const grammarType = document.getElementById('grammar-type');
const grammarRuleInput = document.getElementById('grammar-rule');
const workspaceTabsEl = document.getElementById('workspace-tabs');
const newWorkspaceButton = document.getElementById('new-workspace');
const chatHelpButton = document.getElementById('chat-help');
const exportChatOnlyButton = document.getElementById('export-chat-only');
const exportAllButton = document.getElementById('export-all');
const exportHistoryButton = document.getElementById('export-history');
const exportTrainingButton = document.getElementById('export-training');
const exportGrammarButton = document.getElementById('export-grammar');
const exportWordsButton = document.getElementById('export-words');
const importAllButton = document.getElementById('import-all');
const importPartialButton = document.getElementById('import-partial');
const importInput = document.getElementById('import-input');
const importDialog = document.getElementById('import-dialog');
const importDialogTitle = document.getElementById('import-dialog-title');
const importDialogText = document.getElementById('import-dialog-text');
const importCancelButton = document.getElementById('import-cancel');
const importConfirmButton = document.getElementById('import-confirm');
const importMergeOption = document.getElementById('import-merge-option');
const contextHint = document.getElementById('context-hint');
const quickCommandsEl = document.getElementById('quick-commands');
const statWorkspaces = document.getElementById('stat-workspaces');
const statTraining = document.getElementById('stat-training');
const statMessages = document.getElementById('stat-messages');

const grammarSimpleForm = document.getElementById('grammar-simple-form');
const grammarAction = document.getElementById('grammar-action');
const grammarCatName = document.getElementById('grammar-cat-name');
const grammarCatWords = document.getElementById('grammar-cat-words');
const grammarTemplateText = document.getElementById('grammar-template-text');
const grammarWrong = document.getElementById('grammar-wrong');
const grammarRight = document.getElementById('grammar-right');
const grammarUploadTxt = document.getElementById('grammar-upload-txt');
const grammarExpertReplace = document.getElementById('grammar-expert-replace');
const grammarFieldsCategory = document.getElementById('grammar-fields-category');
const grammarFieldsTemplate = document.getElementById('grammar-fields-template');
const grammarFieldsCorrection = document.getElementById('grammar-fields-correction');
const toastRoot = document.getElementById('toast-root');
const trainingSearchInput = document.getElementById('training-search');
const synonymsInput = document.getElementById('synonyms-input');
const saveSynonymsButton = document.getElementById('save-synonyms');
const exportChatTxtButton = document.getElementById('export-chat-txt');
const renameWorkspaceButton = document.getElementById('rename-workspace');
const importTrainingJsonButton = document.getElementById('import-training-json');

let workspaces = [];
let trainingFilter = '';
let activeWorkspaceId = null;
let words = [];
let baseGrammarRules = { categories: {}, templates: [], corrections: [] };
let pendingImport = null;

// --- Migration & Workspace ---

const STARTER_TRAINING = [
  { question: 'was ist mathe|erkläre mathe|#mathe', answer: 'Mathe ist Rechnen und Arbeiten mit Zahlen, Formeln und Größen.' },
  { question: 'was ist code|programmieren|#code', answer: 'Code sind Anweisungen für Computer — Programme entstehen daraus.' },
  { question: 'hallo|hi|hey', answer: 'Hallo.' },
];

function createWorkspace(name = 'Bot 1', withStarter = false) {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    history: [],
    training: withStarter ? STARTER_TRAINING.map(e => ({ ...e, id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })) : [],
    customGrammar: [],
    words: [],
    synonyms: {},
    session: {
      lastMatch: null,
      lastUserQuestion: '',
      facts: [],
      vars: {},
      pendingChoices: null,
      recentEntryIds: [],
    },
  };
}

function ensureWorkspaceSession(ws) {
  if (!ws.session) ws.session = {};
  const s = ws.session;
  if (!s.facts) s.facts = [];
  if (!s.vars) s.vars = {};
  if (!s.recentEntryIds) s.recentEntryIds = [];
  if (!('pendingChoices' in s)) s.pendingChoices = null;
  if (!ws.synonyms) ws.synonyms = {};
  return s;
}

function showToast(message, type = 'ok') {
  if (!toastRoot) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function parseSynonymsText(text) {
  const map = {};
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, rest] = trimmed.split('=').map(s => s.trim());
    if (!key || !rest) return;
    map[key.toLowerCase()] = rest.split(/[,;|]/).map(w => w.trim()).filter(Boolean);
  });
  return map;
}

function synonymsToText(synonyms) {
  return Object.entries(synonyms || {})
    .map(([k, list]) => `${k} = ${list.join(', ')}`)
    .join('\n');
}

function getSynonymsForBot() {
  return getActiveWorkspace()?.synonyms || {};
}

function normalizeTrainingEntry(entry) {
  const normalized = BotBrain.normalizeTrainingEntry(entry);
  if (!normalized.id) {
    normalized.id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return normalized;
}

function migrateLegacyData() {
  try {
    const oldTraining = localStorage.getItem(legacyTrainingKey);
    const oldHistory = localStorage.getItem(legacyHistoryKey);
    const oldGrammar = localStorage.getItem(legacyGrammarKey);
    if (!oldTraining && !oldHistory && !oldGrammar) return null;

    const ws = createWorkspace('Mein Bot');
    ws.training = oldTraining ? JSON.parse(oldTraining) : [];
    ws.history = oldHistory ? JSON.parse(oldHistory) : [];
    ws.customGrammar = oldGrammar ? JSON.parse(oldGrammar) : [];
    return [ws];
  } catch {
    return null;
  }
}

function loadWorkspaces() {
  try {
    const raw = localStorage.getItem(workspacesKey);
    if (raw) {
      const data = JSON.parse(raw);
      workspaces = data.workspaces || [];
      activeWorkspaceId = data.activeWorkspaceId || workspaces[0]?.id;
    }
  } catch {
    workspaces = [];
  }

  if (!workspaces.length) {
    const migrated = migrateLegacyData();
    workspaces = migrated || [createWorkspace('Bot 1', true)];
    activeWorkspaceId = workspaces[0].id;
    saveWorkspaces();
  }

  if (!activeWorkspaceId || !workspaces.find(w => w.id === activeWorkspaceId)) {
    activeWorkspaceId = workspaces[0].id;
  }
  workspaces.forEach(ensureWorkspaceSession);
}

function saveWorkspaces() {
  localStorage.setItem(workspacesKey, JSON.stringify({
    version: STORAGE_VERSION,
    activeWorkspaceId,
    workspaces,
  }));
}

function getActiveWorkspace() {
  return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
}

function setActiveWorkspace(id) {
  activeWorkspaceId = id;
  saveWorkspaces();
  refreshWorkspaceViews();
}

function getHistoryData() { return getActiveWorkspace()?.history || []; }
function getTrainingData() { return getActiveWorkspace()?.training || []; }
function getCustomGrammarLines() { return getActiveWorkspace()?.customGrammar || []; }

function saveHistory() { saveWorkspaces(); }
function saveTrainingData() { saveWorkspaces(); }
function saveCustomGrammarRules() { saveWorkspaces(); rebuildGrammarRules(); }

// --- NLP helpers (unchanged core) ---

function normalize(text) {
  return text.trim().toLowerCase();
}

const STOP_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen',
  'und', 'oder', 'aber', 'doch', 'weil', 'dass', 'wenn', 'als', 'auch', 'noch', 'nur',
  'ist', 'sind', 'war', 'waren', 'bin', 'bist', 'hat', 'haben', 'hatte', 'wird', 'werden',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mir', 'mich', 'dir', 'dich', 'sich',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'mit', 'von', 'zu', 'im', 'in', 'am',
  'an', 'auf', 'für', 'bei', 'nach', 'aus', 'um', 'über', 'unter', 'durch', 'gegen',
  'nicht', 'kein', 'keine', 'ja', 'nein', 'mal', 'schon', 'sehr', 'so', 'wie', 'was',
  'welche', 'welcher', 'welches', 'wo', 'wer', 'wem', 'wen', 'bitte', 'danke', 'hallo',
]);

function tokenize(text) {
  return normalize(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

function getConversationContext() {
  const recent = getHistoryData().slice(-6);
  const lastExchange = recent[recent.length - 1];
  const topics = [];
  recent.forEach(entry => {
    tokenize(entry.user).forEach(token => { if (!topics.includes(token)) topics.push(token); });
    tokenize(entry.bot).slice(0, 8).forEach(token => { if (!topics.includes(token)) topics.push(token); });
  });
  return {
    recent,
    lastUser: lastExchange?.user || '',
    lastBot: lastExchange?.bot || '',
    topics: topics.slice(-12),
  };
}

// --- Grammar ---

let grammarRules = { categories: {}, templates: [], corrections: [] };

async function loadBaseGrammarFromFile() {
  const fallback = `subject:Ich|Du|Wir
verb:kenne|lerne|weiß|mag|kann
object:Mathe|Grammatik|Code|Sprache|Musik
adjective:gut|einfach|klar|schwer
connector:und|aber
template:{subject} {verb} {object}.
template:Ich finde {object} {adjective}.
correct:ich gehe -> Ich gehe
correct:du ist -> du bist`;

  baseGrammarRules = { categories: {}, templates: [], corrections: [] };
  parseGrammarTextInto(baseGrammarRules, fallback);
  try {
    const response = await fetch('grammar.txt');
    if (response.ok) parseGrammarTextInto(baseGrammarRules, await response.text());
  } catch {
    console.warn('grammar.txt nicht geladen.');
  }
}

function parseGrammarTextInto(target, text) {
  text.split(/\r?\n/).map(line => line.trim()).forEach(line => {
    if (!line || line.startsWith('#')) return;
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    if (!rest) return;

    if (key === 'template') {
      target.templates.push(rest);
      return;
    }
    if (key === 'correct') {
      const parts = rest.split('->').map(part => part.trim());
      if (parts.length === 2) target.corrections.push({ pattern: parts[0], replacement: parts[1] });
      return;
    }
    const values = rest.split('|').map(v => v.trim()).filter(Boolean);
    if (!target.categories[key]) target.categories[key] = [];
    target.categories[key].push(...values);
  });
}

function parseGrammarText(text) {
  parseGrammarTextInto(grammarRules, text);
}

function rebuildGrammarRules() {
  grammarRules = {
    categories: JSON.parse(JSON.stringify(baseGrammarRules.categories)),
    templates: [...baseGrammarRules.templates],
    corrections: [...baseGrammarRules.corrections],
  };
  getCustomGrammarLines().forEach(line => parseGrammarText(line));
}

function addCustomGrammarRule(line, { prepend = true } = {}) {
  const grammar = getCustomGrammarLines();
  if (prepend) grammar.unshift(line);
  else grammar.push(line);
  saveCustomGrammarRules();
  renderGrammarList();
}

function removeCustomGrammarRule(index) {
  getCustomGrammarLines().splice(index, 1);
  saveCustomGrammarRules();
  renderGrammarList();
}

function replaceCategoryRules(categoryName) {
  const prefix = `${categoryName}:`;
  const ws = getActiveWorkspace();
  if (ws) ws.customGrammar = ws.customGrammar.filter(line => !line.startsWith(prefix));
}

function buildCategoryLine(name, wordList) {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_');
  const values = wordList.split(/[,;|]/).map(w => w.trim()).filter(Boolean).join('|');
  return `${cleanName}:${values}`;
}

function getRandomCategoryValue(name) {
  const list = grammarRules.categories[name] || [];
  return list.length ? list[Math.floor(Math.random() * list.length)] : '';
}

function applyGrammarCorrections(text) {
  return grammarRules.corrections.reduce((current, rule) =>
    current.replace(new RegExp(rule.pattern, 'gi'), rule.replacement), text);
}

function generateGrammarSentence() {
  const all = grammarRules.templates;
  const pool = all.filter(t => !/möchte dir|klingt nach|versuche|wenn du willst/i.test(t));
  const list = pool.length ? pool : all;
  const template = list[Math.floor(Math.random() * list.length)] || '{subject} {verb} {object}.';
  let sentence = template.replace(/\{(\w+)\}/g, (_, name) => getRandomCategoryValue(name) || name);
  if (sentence && !/[.!?]$/.test(sentence)) sentence += '.';
  return applyGrammarCorrections(sentence);
}

// --- Bot logic ---

function getRandomWord() {
  const ws = getActiveWorkspace();
  const list = (ws?.words?.length ? ws.words : words);
  if (!list.length) return 'lernen';
  return list[Math.floor(Math.random() * list.length)];
}

async function loadWordList() {
  const fallback = ['lernen', 'rechnen', 'grammatik', 'frage', 'antwort', 'musik', 'zaubern', 'spielen', 'code', 'buch'];
  words = fallback;
  try {
    const response = await fetch('words.txt');
    if (response.ok) {
      const lines = (await response.text()).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length) words = lines;
    }
  } catch { /* fallback */ }
}

function extractQuestionFocus(message) {
  return BotBrain.focus(message);
}

function evaluateGrammar(message) {
  const normalized = normalize(message);
  if (/korrigiere|grammatik|übersetze|schreibe/.test(normalized) && message.length > 20) {
    const corrected = applyGrammarCorrections(message.replace(/^.*korrigiere[:\s]*/i, ''));
    if (corrected !== message) return `Korrekturvorschlag: „${corrected}"`;
  }
  if (/korrigiere|grammatik/.test(normalized) && message.length < 25) {
    return '/korrektur dein satz';
  }
  if (/plural|mehrzahl/.test(normalized)) {
    return 'Hund → Hunde, Buch → Bücher';
  }
  return null;
}


function searchTraining(query) {
  const q = normalize(query);
  if (!q) return [];
  return getTrainingData().filter(entry =>
    getTrainingVariants(entry).some(variant => normalize(variant).includes(q))
      || normalize(entry.answer).includes(q),
  ).slice(0, 8);
}

function updateContextHint() {
  if (!contextHint) return;
  const ctx = getConversationContext();
  const session = ensureWorkspaceSession(getActiveWorkspace());
  const parts = [];
  if (ctx.topics.length) parts.push(`Thema: ${ctx.topics.slice(-2).join(', ')}`);
  if (session.lastMatch) {
    const q = session.lastMatch.question;
    parts.push(`Zuletzt: „${q.length > 30 ? `${q.slice(0, 28)}…` : q}"`);
  }
  if (session.pendingChoices?.length) {
    contextHint.textContent = `Wähle 1–${session.pendingChoices.length}`;
    return;
  }
  contextHint.textContent = parts.length ? parts.join(' · ') : '—';
}

function getHelpText() {
  return `/hilfe — Liste
/train Antwort | /train Frage :: Antwort
/set name Wert — Variable {name} in Antworten
/vars — Variablen anzeigen
/suche Wort | /beispiele | /thema
/merken Text | /fakten
/korrektur Satz | /zufall | /zeit
/del 3 — Training #3 löschen

Fragen: was ist … | #tag | Synonyme im Trainer
Folgen: das, nochmal, warum
Vergleich: ist X gleich Y
Liste: zeige mathe
Mathe: 2+2, 10% von 200, wurzel von 16
Bei Treffern: 1–5 senden`;
}

function handleSlashCommand(message) {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) return null;

  const [cmd, ...restParts] = trimmed.split(/\s+/);
  const rest = restParts.join(' ').trim();
  const cmdLower = cmd.toLowerCase();

  if (cmdLower === '/hilfe' || cmdLower === '/help') return getHelpText();

  if (cmdLower === '/zufall') return getRandomWord();

  if (cmdLower === '/zeit') {
    const now = new Date();
    return `Es ist ${now.toLocaleTimeString('de-DE')} am ${now.toLocaleDateString('de-DE')}.`;
  }

  if (cmdLower === '/thema') {
    const ctx = getConversationContext();
    if (!ctx.topics.length) return 'Kein Thema.';
    return ctx.topics.join(', ');
  }

  if (cmdLower === '/beispiele') {
    const data = getTrainingData();
    if (!data.length) return 'Leer. /train oder Trainer.';
    const list = data.slice(0, 20).map((e, i) => `${i + 1}. ${getTrainingVariants(e)[0]}`).join('\n');
    return data.length > 20 ? `${list}\n+${data.length - 20} weitere` : list;
  }

  if (cmdLower === '/suche') {
    if (!rest) return '/suche mathe';
    const hits = searchTraining(rest);
    if (!hits.length) return `Nichts zu „${rest}".`;
    return hits.map((e, i) => `${i + 1}. ${getTrainingVariants(e)[0]} → ${e.answer.slice(0, 80)}`).join('\n');
  }

  if (cmdLower === '/merken') {
    if (!rest) return '/merken Text';
    ensureWorkspaceSession(getActiveWorkspace()).facts.push(rest);
    saveWorkspaces();
    return rest;
  }

  if (cmdLower === '/fakten') {
    const session = ensureWorkspaceSession(getActiveWorkspace());
    if (!session.facts.length) return 'Keine Fakten.';
    return session.facts.map((f, i) => `${i + 1}. ${f}`).join('\n');
  }

  if (cmdLower === '/korrektur') {
    if (!rest) return '/korrektur satz';
    return applyGrammarCorrections(rest);
  }

  if (cmdLower === '/set') {
    if (!rest) return '/set name Wert';
    const eq = rest.indexOf('=');
    const sp = rest.indexOf(' ');
    let key;
    let val;
    if (eq > 0) {
      key = rest.slice(0, eq).trim();
      val = rest.slice(eq + 1).trim();
    } else if (sp > 0) {
      key = rest.slice(0, sp).trim();
      val = rest.slice(sp + 1).trim();
    } else return '/set name Wert';
    ensureWorkspaceSession(getActiveWorkspace()).vars[key.toLowerCase()] = val;
    saveWorkspaces();
    return `${key} = ${val}`;
  }

  if (cmdLower === '/vars' || cmdLower === '/var') {
    const vars = ensureWorkspaceSession(getActiveWorkspace()).vars;
    const keys = Object.keys(vars);
    if (!keys.length) return 'Keine Variablen. /set name Wert';
    return keys.map(k => `${k} = ${vars[k]}`).join('\n');
  }

  if (cmdLower === '/del' || cmdLower === '/loesch' || cmdLower === '/lösch') {
    const num = parseInt(rest, 10);
    const data = getTrainingData();
    if (!num || num < 1 || num > data.length) return `/del 1–${data.length}`;
    const removed = data.splice(num - 1, 1)[0];
    saveTrainingData();
    renderTrainingList();
    updateStats();
    return `Gelöscht: ${getTrainingVariants(removed)[0]}`;
  }

  if (cmdLower === '/train') {
    const ws = getActiveWorkspace();
    const session = ensureWorkspaceSession(ws);
    if (rest.includes('::')) {
      const [q, a] = rest.split('::').map(s => s.trim());
      if (!q || !a) return 'Format: /train Frage :: Antwort';
      ws.training.unshift(normalizeTrainingEntry({ question: q, answer: a }));
      saveTrainingData();
      renderTrainingList();
      updateStats();
      return `OK: ${q}`;
    }
    if (!rest) return '/train Antwort';
    const question = session.lastUserQuestion || getConversationContext().lastUser;
    if (!question) return 'Erst Frage stellen.';
    ws.training.unshift(normalizeTrainingEntry({ question, answer: rest }));
    saveTrainingData();
    renderTrainingList();
    updateStats();
    return `OK: ${question}`;
  }

  return `Unbekannt: ${cmd}. /hilfe`;
}

function findBestMatch(message, originalMessage = message) {
  const hits = BotBrain.rankTraining(getTrainingData(), message, getSynonymsForBot(), ensureWorkspaceSession(getActiveWorkspace()), 1);
  return hits[0]?.entry || null;
}

function generateBotReply(message) {
  const session = ensureWorkspaceSession(getActiveWorkspace());
  session.lastUserQuestion = message;

  const slashReply = handleSlashCommand(message);
  if (slashReply) return slashReply;

  const n = normalize(message);
  if (/wer bist du|was bist du|was kannst du/.test(n)) {
    return 'Trainierbarer Bot. Antworten aus deinem Training, Mathe, Verlauf. /hilfe';
  }

  if (/wie\s*viel|wieviel/.test(n) && /beispiel|training/.test(n)) {
    return String(getTrainingData().length);
  }
  if (/wie\s*viel|wieviel/.test(n) && /nachricht|verlauf/.test(n)) {
    return String(getHistoryData().length);
  }

  const grammarReply = evaluateGrammar(message);
  if (grammarReply) return grammarReply;

  const context = getConversationContext();
  const reply = BotBrain.generateReply({
    message,
    training: getTrainingData(),
    session,
    context,
    synonyms: getSynonymsForBot(),
    onTrainSuggest: q => {
      trainInput.value = q;
      setTimeout(() => trainAnswer.focus(), 50);
    },
  });

  saveWorkspaces();
  updateContextHint();
  return reply;
}

// --- UI Rendering ---

function createMessage(role, text, time) {
  const item = document.createElement('div');
  item.className = `message message--${role}`;
  const label = document.createElement('div');
  label.className = 'message__role';
  label.textContent = role === 'user' ? 'Du' : 'Bot';
  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  bubble.textContent = text;
  item.appendChild(label);
  item.appendChild(bubble);
  if (time) {
    const t = document.createElement('div');
    t.className = 'message__time';
    t.textContent = time;
    item.appendChild(t);
  }
  return item;
}

function formatMsgTime(date = new Date()) {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderHistory() {
  chatWindow.innerHTML = '';
  const history = getHistoryData();
  if (!history.length) {
    chatWindow.appendChild(createMessage('bot', 'Frage stellen oder /hilfe'));
  } else {
    history.forEach(entry => {
      chatWindow.appendChild(createMessage('user', entry.user, entry.time));
      chatWindow.appendChild(createMessage('bot', entry.bot, entry.time));
    });
  }
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderTrainingList() {
  trainingList.innerHTML = '';
  const training = getTrainingData();
  const filter = trainingFilter.toLowerCase();

  const filtered = training.map((entry, index) => ({ entry, index })).filter(({ entry }) => {
    if (!filter) return true;
    const hay = `${entry.question} ${entry.answer} ${(entry.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(filter);
  });

  if (!training.length) {
    const empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = 'Noch keine Beispiele. Formular oben oder Starter mit /hilfe.';
    trainingList.appendChild(empty);
    return;
  }

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = 'Kein Treffer für die Suche.';
    trainingList.appendChild(empty);
    return;
  }

  filtered.forEach(({ entry, index }) => {
    const card = document.createElement('div');
    card.className = 'training-card';
    const tags = (entry.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('');
    const hits = entry.hits ? ` · ${entry.hits}× genutzt` : '';
    card.innerHTML = `
      <p><strong>#${index + 1}</strong> ${tags}</p>
      <p><strong>Frage:</strong> ${escapeHtml(entry.question)}</p>
      <p><strong>Antwort:</strong> ${escapeHtml(entry.answer)}</p>
      <p class="training-card__meta">${getTrainingVariants(entry).length} Formulierung(en)${hits}</p>`;

    const actions = document.createElement('div');
    actions.className = 'training-card__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--ghost btn--small';
    editBtn.textContent = 'Bearbeiten';
    editBtn.addEventListener('click', () => {
      trainInput.value = entry.question;
      trainAnswer.value = entry.answer;
      training.splice(index, 1);
      saveTrainingData();
      renderTrainingList();
      updateStats();
      showSection('trainer-section');
      trainAnswer.focus();
      showToast('Eintrag zum Bearbeiten geladen');
    });

    const dupBtn = document.createElement('button');
    dupBtn.className = 'btn btn--ghost btn--small';
    dupBtn.textContent = 'Duplizieren';
    dupBtn.addEventListener('click', () => {
      training.unshift(normalizeTrainingEntry({ question: entry.question, answer: entry.answer }));
      saveTrainingData();
      renderTrainingList();
      showToast('Duplikat erstellt');
    });

    const remove = document.createElement('button');
    remove.className = 'btn btn--ghost btn--small';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', () => {
      if (!confirm('Eintrag löschen?')) return;
      training.splice(index, 1);
      saveTrainingData();
      renderTrainingList();
      updateStats();
      showToast('Gelöscht');
    });

    actions.appendChild(editBtn);
    actions.appendChild(dupBtn);
    actions.appendChild(remove);
    card.appendChild(actions);
    trainingList.appendChild(card);
  });
}

function renderGrammarList() {
  if (!grammarList) return;
  grammarList.innerHTML = '';
  const grammarLines = getCustomGrammarLines();
  if (!grammarLines.length) {
    const empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = 'Keine eigenen Regeln. Nutze das Formular oben.';
    grammarList.appendChild(empty);
    return;
  }
  grammarLines.forEach((line, index) => {
    const item = document.createElement('div');
    item.className = 'grammar-item';
    const text = document.createElement('div');
    text.className = 'grammar-item__text';
    text.textContent = formatGrammarLineForDisplay(line);
    const remove = document.createElement('button');
    remove.className = 'btn btn--ghost btn--small';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', () => removeCustomGrammarRule(index));
    item.appendChild(text);
    item.appendChild(remove);
    grammarList.appendChild(item);
  });
}

function formatGrammarLineForDisplay(line) {
  if (line.startsWith('correct:')) {
    const rest = line.slice(8);
    const [a, b] = rest.split('->').map(s => s.trim());
    return `Korrektur: „${a}" → „${b}"`;
  }
  if (line.startsWith('template:')) return `Satz: ${line.slice(9)}`;
  const [cat, vals] = line.split(':');
  return `Kategorie „${cat}": ${(vals || '').split('|').join(', ')}`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderWorkspaceTabs() {
  workspaceTabsEl.innerHTML = '';
  workspaces.forEach(ws => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `workspace-tab${ws.id === activeWorkspaceId ? ' is-active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', ws.id === activeWorkspaceId ? 'true' : 'false');

    const label = document.createElement('span');
    label.textContent = ws.name;
    tab.appendChild(label);

    if (workspaces.length > 1) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'workspace-tab__close';
      close.title = 'Bot-Tab schließen';
      close.textContent = '×';
      close.addEventListener('click', e => {
        e.stopPropagation();
        closeWorkspace(ws.id);
      });
      tab.appendChild(close);
    }

    tab.addEventListener('click', () => setActiveWorkspace(ws.id));
    tab.addEventListener('dblclick', e => {
      e.preventDefault();
      const neu = prompt('Bot-Name:', ws.name);
      if (neu?.trim()) {
        ws.name = neu.trim();
        saveWorkspaces();
        renderWorkspaceTabs();
        showToast(`Umbenannt: ${ws.name}`);
      }
    });
    workspaceTabsEl.appendChild(tab);
  });
}

function renameActiveWorkspace() {
  const ws = getActiveWorkspace();
  const neu = prompt('Bot-Name:', ws.name);
  if (!neu?.trim()) return;
  ws.name = neu.trim();
  saveWorkspaces();
  renderWorkspaceTabs();
  showToast(`Umbenannt: ${ws.name}`);
}

function exportChatAsTxt() {
  const ws = getActiveWorkspace();
  const lines = [`Chat: ${ws.name}`, `Export: ${new Date().toLocaleString('de-DE')}`, ''];
  getHistoryData().forEach(e => {
    lines.push(`Du (${e.time || '–'}): ${e.user}`);
    lines.push(`Bot: ${e.bot}`);
    lines.push('');
  });
  downloadFile(`chat-${ws.name}-${dateStamp()}.txt`, lines.join('\n'), 'text/plain');
  showToast('Chat als TXT geladen');
}

function loadSynonymsPanel() {
  if (synonymsInput) synonymsInput.value = synonymsToText(getSynonymsForBot());
}

function closeWorkspace(id) {
  if (workspaces.length <= 1) {
    alert('Mindestens ein Bot-Tab muss bleiben.');
    return;
  }
  if (!confirm('Diesen Bot-Tab wirklich löschen?')) return;
  const idx = workspaces.findIndex(w => w.id === id);
  workspaces.splice(idx, 1);
  if (activeWorkspaceId === id) activeWorkspaceId = workspaces[0].id;
  saveWorkspaces();
  refreshWorkspaceViews();
}

function refreshWorkspaceViews() {
  workspaces.forEach(ensureWorkspaceSession);
  getTrainingData().forEach((e, i) => {
    Object.assign(e, normalizeTrainingEntry(e));
  });
  rebuildGrammarRules();
  renderWorkspaceTabs();
  renderHistory();
  renderTrainingList();
  renderGrammarList();
  loadSynonymsPanel();
  updateStats();
  updateContextHint();
}

function updateStats() {
  const ws = getActiveWorkspace();
  statWorkspaces.textContent = String(workspaces.length);
  statTraining.textContent = String(ws?.training?.length || 0);
  statMessages.textContent = String(ws?.history?.length || 0);
}

function appendHistory(userMessage, botMessage) {
  const w = getActiveWorkspace();
  const time = formatMsgTime();
  w.history.push({ user: userMessage, bot: botMessage, time });
  ensureWorkspaceSession(w).lastUserQuestion = userMessage;
  saveHistory();
  renderHistory();
  updateStats();
  updateContextHint();
}

function showSection(sectionId) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('is-visible'));
  document.getElementById(sectionId)?.classList.add('is-visible');
  document.querySelectorAll('.topnav__link').forEach(link => {
    link.classList.toggle('is-active', link.dataset.section === sectionId);
  });
}

// --- Export / Import ---

function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getExportPayload() {
  return {
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    activeWorkspaceId,
    workspaces,
    globalWords: words,
  };
}

function exportAll() {
  downloadFile(`chatbot-backup-${dateStamp()}.json`, JSON.stringify(getExportPayload(), null, 2));
  showToast('Backup geladen');
}

function exportWorkspacePart(type) {
  const ws = getActiveWorkspace();
  const stamp = dateStamp();
  if (type === 'history') {
    downloadFile(`verlauf-${ws.name}-${stamp}.json`, JSON.stringify({ history: ws.history }, null, 2));
  } else if (type === 'training') {
    downloadFile(`training-${ws.name}-${stamp}.json`, JSON.stringify({ training: ws.training }, null, 2));
  } else if (type === 'grammar') {
    const text = ws.customGrammar.join('\n');
    downloadFile(`grammatik-${ws.name}-${stamp}.txt`, text, 'text/plain');
  } else if (type === 'words') {
    const list = ws.words?.length ? ws.words : words;
    downloadFile(`words-${ws.name}-${stamp}.txt`, list.join('\n'), 'text/plain');
  }
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function parseImportFile(text, filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) {
    try {
      return { kind: 'json', data: JSON.parse(text) };
    } catch {
      return { kind: 'error', message: 'Ungültige JSON-Datei.' };
    }
  }
  if (lower.includes('grammar') || lower.endsWith('.txt')) {
    return { kind: 'grammar-txt', lines: text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')) };
  }
  return { kind: 'words-txt', words: text.split(/\r?\n/).map(l => l.trim()).filter(Boolean) };
}

function openImportDialog(parsed, filename) {
  pendingImport = { parsed, filename };
  const isFullBackup = parsed.kind === 'json' && parsed.data?.workspaces;
  const isPartial = parsed.kind === 'json' && !parsed.data?.workspaces;

  importDialogTitle.textContent = 'Import bestätigen';
  importDialogText.textContent = isFullBackup
    ? `Backup „${filename}" enthält ${parsed.data.workspaces.length} Bot(s). Was soll passieren?`
    : `Datei „${filename}" importieren. Was soll passieren?`;

  importMergeOption.style.display = (isPartial || parsed.kind === 'grammar-txt') ? '' : 'none';
  importDialog.showModal();
}

function getSelectedImportMode() {
  return document.querySelector('input[name="import-mode"]:checked')?.value || 'replace';
}

function applyImport() {
  if (!pendingImport) return;
  const { parsed, filename } = pendingImport;
  const mode = getSelectedImportMode();
  const ws = getActiveWorkspace();

  if (mode === 'replace-backup') exportWorkspacePart('history');

  if (parsed.kind === 'error') {
    showToast(parsed.message, 'err');
    return;
  }

  if (parsed.kind === 'json' && parsed.data?.workspaces) {
    if (mode === 'new-tab') {
      parsed.data.workspaces.forEach(importedWs => {
        workspaces.push({
          ...importedWs,
          id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: `${importedWs.name} (Import)`,
        });
      });
      activeWorkspaceId = workspaces[workspaces.length - 1].id;
    } else if (mode === 'merge') {
      const first = parsed.data.workspaces[0];
      ws.training = [...ws.training, ...(first.training || [])];
      ws.history = [...ws.history, ...(first.history || [])];
      ws.customGrammar = [...ws.customGrammar, ...(first.customGrammar || [])];
    } else {
      workspaces = parsed.data.workspaces;
      activeWorkspaceId = parsed.data.activeWorkspaceId || workspaces[0]?.id;
      if (parsed.data.globalWords?.length) words = parsed.data.globalWords;
    }
    saveWorkspaces();
    refreshWorkspaceViews();
    showToast('Backup importiert');
    return;
  }

  const target = mode === 'new-tab' ? (() => {
    const n = createWorkspace(`${ws.name} (Import)`);
    workspaces.push(n);
    activeWorkspaceId = n.id;
    return n;
  })() : ws;

  if (parsed.kind === 'json') {
    if (parsed.data.history) target.history = mode === 'merge' ? [...target.history, ...parsed.data.history] : parsed.data.history;
    if (parsed.data.training) target.training = mode === 'merge' ? [...target.training, ...parsed.data.training] : parsed.data.training;
    if (parsed.data.customGrammar) {
      target.customGrammar = mode === 'merge'
        ? [...target.customGrammar, ...parsed.data.customGrammar]
        : parsed.data.customGrammar;
    }
    if (parsed.data.words) target.words = parsed.data.words;
  } else if (parsed.kind === 'grammar-txt') {
    if (mode === 'merge') target.customGrammar.push(...parsed.lines);
    else target.customGrammar = parsed.lines;
  } else if (parsed.kind === 'words-txt') {
    target.words = parsed.words;
  }

  saveWorkspaces();
  refreshWorkspaceViews();
  showToast(`Import: ${filename}`);
}

// --- Grammar UI ---

function updateGrammarFieldsVisibility() {
  const action = grammarAction.value;
  grammarFieldsCategory.classList.toggle('is-hidden', !action.includes('category'));
  grammarFieldsTemplate.classList.toggle('is-hidden', action !== 'add-template');
  grammarFieldsCorrection.classList.toggle('is-hidden', action !== 'add-correction');
}

function handleSimpleGrammarSubmit(event) {
  event.preventDefault();
  const action = grammarAction.value;

  if (action === 'add-category' || action === 'replace-category') {
    const name = grammarCatName.value.trim();
    const wordText = grammarCatWords.value.trim();
    if (!name || !wordText) return alert('Bitte Kategorie-Name und Wörter eingeben.');
    if (action === 'replace-category') replaceCategoryRules(name.trim().toLowerCase().replace(/\s+/g, '_'));
    addCustomGrammarRule(buildCategoryLine(name, wordText));
    grammarCatName.value = '';
    grammarCatWords.value = '';
  } else if (action === 'add-template') {
    const tpl = grammarTemplateText.value.trim();
    if (!tpl) return alert('Bitte eine Satz-Vorlage eingeben.');
    addCustomGrammarRule(`template:${tpl}`);
    grammarTemplateText.value = '';
  } else if (action === 'add-correction') {
    const wrong = grammarWrong.value.trim();
    const right = grammarRight.value.trim();
    if (!wrong || !right) return alert('Bitte falsch und richtig eingeben.');
    addCustomGrammarRule(`correct:${wrong} -> ${right}`);
    grammarWrong.value = '';
    grammarRight.value = '';
  }
  grammarSimpleForm.querySelector('button[type="submit"]')?.focus();
}

// --- Init & Events ---

loadWorkspaces();
loadWordList();
loadBaseGrammarFromFile().then(() => {
  rebuildGrammarRules();
  refreshWorkspaceViews();
});

document.querySelectorAll('.topnav__link').forEach(link => {
  link.addEventListener('click', () => showSection(link.dataset.section));
});

document.querySelectorAll('[data-grammar-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-grammar-mode]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const simple = btn.dataset.grammarMode === 'simple';
    document.getElementById('grammar-simple').classList.toggle('is-hidden', !simple);
    document.getElementById('grammar-expert').classList.toggle('is-hidden', simple);
  });
});

grammarAction.addEventListener('change', updateGrammarFieldsVisibility);
grammarSimpleForm.addEventListener('submit', handleSimpleGrammarSubmit);

grammarForm.addEventListener('submit', event => {
  event.preventDefault();
  const type = grammarType.value;
  const ruleText = grammarRuleInput.value.trim();
  if (!ruleText) return;

  let line = ruleText;
  if (type === 'template') line = ruleText.startsWith('template:') ? ruleText : `template:${ruleText}`;
  if (type === 'correct') line = ruleText.startsWith('correct:') ? ruleText : `correct:${ruleText}`;

  if (grammarExpertReplace.checked) {
    const catName = line.split(':')[0]?.trim();
    if (catName && type === 'category') replaceCategoryRules(catName);
  }
  addCustomGrammarRule(line);
  grammarRuleInput.value = '';
});

grammarUploadTxt.addEventListener('click', () => {
  fileInput.accept = '.txt';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    openImportDialog({ kind: 'grammar-txt', lines }, file.name);
    fileInput.value = '';
  };
  fileInput.click();
});

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.value = '';
  chatInput.disabled = true;
  const reply = generateBotReply(message);
  chatInput.disabled = false;
  appendHistory(message, reply);
  chatInput.focus();
});

promptButton.addEventListener('click', () => {
  chatInput.value = getRandomWord();
  chatInput.focus();
});

chatHelpButton.addEventListener('click', () => {
  appendHistory('/hilfe', getHelpText());
});

trainingForm.addEventListener('submit', event => {
  event.preventDefault();
  const question = trainInput.value.trim();
  const answer = trainAnswer.value.trim();
  if (!question || !answer) return;
  getActiveWorkspace().training.unshift(normalizeTrainingEntry({ question, answer }));
  saveTrainingData();
  renderTrainingList();
  updateStats();
  trainInput.value = '';
  trainAnswer.value = '';
  chatInput.focus();
  showToast('Beispiel gespeichert');
});

if (trainingSearchInput) {
  trainingSearchInput.addEventListener('input', () => {
    trainingFilter = trainingSearchInput.value;
    renderTrainingList();
  });
}

if (saveSynonymsButton) {
  saveSynonymsButton.addEventListener('click', () => {
    getActiveWorkspace().synonyms = parseSynonymsText(synonymsInput?.value || '');
    saveWorkspaces();
    showToast('Synonyme gespeichert');
  });
}

if (exportChatTxtButton) exportChatTxtButton.addEventListener('click', exportChatAsTxt);
if (renameWorkspaceButton) renameWorkspaceButton.addEventListener('click', renameActiveWorkspace);

if (importTrainingJsonButton) {
  importTrainingJsonButton.addEventListener('click', () => {
    importInput.accept = '.json';
    importInput.onchange = async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const list = data.training || data;
        if (!Array.isArray(list)) throw new Error('Kein Training-Array');
        const ws = getActiveWorkspace();
        list.forEach(item => ws.training.push(normalizeTrainingEntry(item)));
        saveTrainingData();
        renderTrainingList();
        updateStats();
        showToast(`${list.length} Beispiele importiert`);
      } catch {
        showToast('Ungültige Training-JSON', 'err');
      }
      importInput.value = '';
    };
    importInput.click();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && importDialog.open) importDialog.close();
  if (e.ctrlKey && e.key === 'Enter' && document.activeElement === chatInput) {
    chatForm.requestSubmit();
  }
});

clearDataButton.addEventListener('click', () => {
  if (!confirm('Training dieses Bots wirklich leeren?')) return;
  getActiveWorkspace().training = [];
  saveTrainingData();
  renderTrainingList();
  updateStats();
});

resetHistoryButton.addEventListener('click', () => {
  if (!confirm('Chatverlauf dieses Bots wirklich leeren?')) return;
  getActiveWorkspace().history = [];
  saveHistory();
  renderHistory();
  updateStats();
});

newWorkspaceButton.addEventListener('click', () => {
  const name = prompt('Name für den neuen Bot:', `Bot ${workspaces.length + 1}`);
  if (!name?.trim()) return;
  const ws = createWorkspace(name.trim(), false);
  workspaces.push(ws);
  activeWorkspaceId = ws.id;
  saveWorkspaces();
  refreshWorkspaceViews();
});

openTrainerButton.addEventListener('click', () => showSection('trainer-section'));
openChatButton.addEventListener('click', () => showSection('chat-section'));

exportAllButton.addEventListener('click', exportAll);
exportHistoryButton.addEventListener('click', () => exportWorkspacePart('history'));
exportTrainingButton.addEventListener('click', () => exportWorkspacePart('training'));
exportGrammarButton.addEventListener('click', () => exportWorkspacePart('grammar'));
exportWordsButton.addEventListener('click', () => exportWorkspacePart('words'));
exportChatOnlyButton.addEventListener('click', () => exportWorkspacePart('history'));

function triggerImport(acceptAll) {
  importInput.accept = acceptAll ? '.json,.txt' : '.json,.txt';
  importInput.onchange = async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseImportFile(text, file.name);
    if (parsed.kind === 'error') alert(parsed.message);
    else openImportDialog(parsed, file.name);
    importInput.value = '';
  };
  importInput.click();
}

importAllButton.addEventListener('click', () => triggerImport(true));
importPartialButton.addEventListener('click', () => triggerImport(true));
importCancelButton.addEventListener('click', () => { pendingImport = null; importDialog.close(); });
importConfirmButton.addEventListener('click', e => {
  e.preventDefault();
  applyImport();
  pendingImport = null;
  importDialog.close();
});

loadWordsButton.addEventListener('click', () => {
  fileInput.accept = '.txt';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length) {
      getActiveWorkspace().words = lines;
      saveWorkspaces();
      showToast('Wörterliste gespeichert');
    }
    fileInput.value = '';
  };
  fileInput.click();
});

if (quickCommandsEl) {
  quickCommandsEl.addEventListener('click', event => {
    const btn = event.target.closest('.quick-cmd');
    if (!btn) return;
    const cmd = btn.dataset.cmd || '';
    if (cmd === '/suche ') {
      chatInput.value = '/suche ';
      chatInput.focus();
      return;
    }
    chatInput.value = cmd;
    chatForm.requestSubmit();
  });
}

updateGrammarFieldsVisibility();
