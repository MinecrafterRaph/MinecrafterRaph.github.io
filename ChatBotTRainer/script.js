const trainingKey = 'chatbot-trainer-data';
const historyKey = 'chatbot-trainer-history';

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
const loadGrammarButton = document.getElementById('load-grammar');
const fileInput = document.getElementById('file-input');
const grammarList = document.getElementById('grammar-list');
const grammarForm = document.getElementById('grammar-form');
const grammarType = document.getElementById('grammar-type');
const grammarRuleInput = document.getElementById('grammar-rule');
const chatPanel = document.getElementById('chat-panel');
const trainerPanel = document.getElementById('trainer-panel');

const grammarStorageKey = 'chatbot-trainer-grammar';
let trainingData = loadTrainingData();
let historyData = loadHistory();
let words = [];
let customGrammarLines = [];
let grammarRules = { categories: {}, templates: [], corrections: [] };

loadWordList();
loadGrammarRules().then(() => {
  renderGrammarList();
});

function loadTrainingData() {
  try {
    const raw = localStorage.getItem(trainingKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrainingData() {
  localStorage.setItem(trainingKey, JSON.stringify(trainingData));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(historyKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(historyKey, JSON.stringify(historyData));
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function getRandomWord() {
  if (!words.length) {
    return 'lernen';
  }
  return words[Math.floor(Math.random() * words.length)];
}

async function loadWordList() {
  const fallback = ['lernen', 'rechnen', 'grammatik', 'frage', 'antwort', 'musik', 'zaubern', 'spielen', 'code', 'buch'];
  words = fallback;

  try {
    const response = await fetch('words.txt');
    if (!response.ok) throw new Error('Keine Datei');
    const text = await response.text();
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length) {
      words = lines;
    }
  } catch (error) {
    console.warn('Words file konnte nicht geladen werden, verwende Fallback-Wörter.');
  }
}

async function loadGrammarRules() {
  const fallback = `# Kategorien und Vorlagen für den Bot
subject:Ich|Du|Er|Sie|Wir|Ihr
verb:kenne|lerne|verstehe|mag|habe|möchte|kann|sage|denke|sehe
object:Mathe|Grammatik|Code|Wörter|Fragen|Antworten|Sprache|Satzbau|Logik|Musik
adjective:gut|einfach|spannend|besser|komplex|interessant|klar
action:helfen|erzählen|lernen|denken|verstehen|schreiben
connector:und|aber|denn|deshalb

template:Ich {verb} {object}.
template:Das ist {adjective} und ich {verb} {object}.
template:Ich {verb} {object} {connector} ich {verb} {object}.
template:Manchmal ist {object} {adjective}.
template:Ich möchte dir bei {object} helfen.

correct:ich gehe -> Ich gehe
correct:du ist -> du bist
correct:haben wir -> haben wir
`;

  grammarRules = { categories: {}, templates: [], corrections: [] };
  parseGrammarText(fallback);

  try {
    const response = await fetch('grammar.txt');
    if (!response.ok) throw new Error('Keine Datei');
    const text = await response.text();
    parseGrammarText(text);
  } catch (error) {
    console.warn('Grammar file konnte nicht geladen werden, verwende interne Grammatikregeln.');
  }

  customGrammarLines = loadCustomGrammarRules();
  customGrammarLines.forEach(parseGrammarText);
}

function parseGrammarText(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim());
  lines.forEach(line => {
    if (!line || line.startsWith('#')) return;
    const [key, rest] = line.split(':');
    if (!rest) return;
    if (key === 'template') {
      grammarRules.templates.push(rest.trim());
      return;
    }
    if (key === 'correct') {
      const parts = rest.split('->').map(part => part.trim());
      if (parts.length === 2) {
        grammarRules.corrections.push({ pattern: parts[0], replacement: parts[1] });
      }
      return;
    }

    const values = rest.split('|').map(v => v.trim()).filter(Boolean);
    if (!grammarRules.categories[key]) {
      grammarRules.categories[key] = [];
    }
    grammarRules.categories[key].push(...values);
  });
}

function loadCustomGrammarRules() {
  try {
    const raw = localStorage.getItem(grammarStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomGrammarRules() {
  localStorage.setItem(grammarStorageKey, JSON.stringify(customGrammarLines));
}

function addCustomGrammarRule(line) {
  customGrammarLines.unshift(line);
  saveCustomGrammarRules();
  parseGrammarText(line);
  renderGrammarList();
}

function removeCustomGrammarRule(index) {
  customGrammarLines.splice(index, 1);
  saveCustomGrammarRules();
  renderGrammarList();
}

function renderGrammarList() {
  if (!grammarList) return;
  grammarList.innerHTML = '';
  if (!customGrammarLines.length) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--muted)';
    empty.textContent = 'Keine eigenen Regeln gespeichert. Füge eine neue Regel hinzu.';
    grammarList.appendChild(empty);
    return;
  }

  customGrammarLines.forEach((line, index) => {
    const item = document.createElement('div');
    item.className = 'grammar-item';

    const text = document.createElement('div');
    text.className = 'grammar-item__text';
    text.textContent = line;

    const remove = document.createElement('button');
    remove.className = 'btn btn--ghost';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', () => {
      removeCustomGrammarRule(index);
    });

    item.appendChild(text);
    item.appendChild(remove);
    grammarList.appendChild(item);
  });
}

function getRandomCategoryValue(name) {
  const list = grammarRules.categories[name] || [];
  if (!list.length) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function applyGrammarCorrections(text) {
  return grammarRules.corrections.reduce((current, rule) => {
    return current.replace(new RegExp(rule.pattern, 'gi'), rule.replacement);
  }, text);
}

function generateGrammarSentence(message) {
  const template = grammarRules.templates[Math.floor(Math.random() * grammarRules.templates.length)] || 'Ich versuche mein Bestes.';
  let sentence = template.replace(/\{(\w+)\}/g, (_, name) => getRandomCategoryValue(name) || name);
  if (sentence && !/[.!?]$/.test(sentence)) {
    sentence += '.';
  }
  if (/\?/i.test(message) || /wie|was|warum|wieso|woher|wohin|welche|wann/i.test(message)) {
    sentence = `Das ist spannend. ${sentence}`;
  }
  sentence = applyGrammarCorrections(sentence);
  return sentence;
}

function evaluateMath(message) {
  const cleaned = message
    .replace(/mal/g, '*')
    .replace(/geteilt durch/g, '/')
    .replace(/durch/g, '/')
    .replace(/plus/g, '+')
    .replace(/minus/g, '-')
    .replace(/,/g, '.');

  const simpleMath = cleaned.match(/[0-9\s\.\+\-\*\/\(\)]+/g);
  if (!simpleMath) return null;

  const candidate = simpleMath.join('');
  if (!/^[0-9\.\+\-\*\/\(\)\s]+$/.test(candidate)) return null;

  try {
    // eslint-disable-next-line no-eval
    const result = eval(candidate);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return `Ergebnis: ${result}`;
    }
  } catch {
    return null;
  }
  return null;
}

function evaluateGrammar(message) {
  const normalized = normalize(message);
  if (normalized.includes('korrigiere') || normalized.includes('grammatik') || normalized.includes('übersetze') || normalized.includes('schreibe')) {
    return 'Ich kann einfache Grammatiktipps geben: Achte auf Großschreibung, Satzzeichen und klare Frageformen.';
  }
  if (normalized.includes('plural') || normalized.includes('mehrzahl')) {
    return 'Oft wird der Plural im Deutschen mit -en, -e oder -er gebildet. Zum Beispiel: der Hund -> die Hunde.';
  }
  return null;
}

function generateBotReply(message) {
  const mathReply = evaluateMath(message);
  if (mathReply) {
    return mathReply;
  }

  const grammarReply = evaluateGrammar(message);
  if (grammarReply) {
    return grammarReply;
  }

  const match = findBestMatch(message);
  if (match) {
    return match.answer;
  }

  const sentence = generateGrammarSentence(message);
  trainInput.value = message;
  setTimeout(() => trainAnswer.focus(), 50);
  return `Ich kenne dazu noch keine perfekte Antwort. Ich sage: "${sentence}". Schreibe bitte die richtige Antwort im Trainer, damit ich besser werde.`;
}

function pickPrompt() {
  const word = getRandomWord();
  chatInput.value = word;
  chatInput.focus();
}

function findBestMatch(message) {
  if (!trainingData.length) return null;

  const normalized = normalize(message);
  let best = null;
  let bestScore = 0;

  trainingData.forEach(entry => {
    const question = normalize(entry.question);
    if (!question) return;

    const exact = normalized === question;
    if (exact) {
      best = entry;
      bestScore = Infinity;
      return;
    }

    const tokens = question.split(/\s+/);
    const matched = tokens.filter(word => normalized.includes(word)).length;
    if (matched > bestScore) {
      bestScore = matched;
      best = entry;
    }
  });

  return bestScore > 0 ? best : null;
}

function createMessage(role, text) {
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
  return item;
}

function renderHistory() {
  chatWindow.innerHTML = '';
  if (!historyData.length) {
    chatWindow.appendChild(createMessage('bot', 'Hallo! Trainiere mich mit Beispielen oder schreibe spontan etwas.')); 
  } else {
    historyData.forEach(entry => {
      chatWindow.appendChild(createMessage('user', entry.user));
      chatWindow.appendChild(createMessage('bot', entry.bot));
    });
  }
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderTrainingList() {
  trainingList.innerHTML = '';
  if (!trainingData.length) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--muted)';
    empty.textContent = 'Noch keine Trainingsbeispiele. Füge oben deine ersten Fragen und Antworten hinzu.';
    trainingList.appendChild(empty);
    return;
  }

  trainingData.forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = 'training-card';

    const question = document.createElement('p');
    question.innerHTML = `<strong>Frage:</strong> ${entry.question}`;
    const answer = document.createElement('p');
    answer.innerHTML = `<strong>Antwort:</strong> ${entry.answer}`;
    const remove = document.createElement('button');
    remove.className = 'btn btn--ghost';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', () => {
      trainingData.splice(index, 1);
      saveTrainingData();
      renderTrainingList();
    });

    card.appendChild(question);
    card.appendChild(answer);
    card.appendChild(remove);
    trainingList.appendChild(card);
  });
}

function appendHistory(userMessage, botMessage) {
  historyData.push({ user: userMessage, bot: botMessage });
  saveHistory();
  renderHistory();
}

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = '';
  const botReply = generateBotReply(message);
  appendHistory(message, botReply);
});

promptButton.addEventListener('click', () => {
  pickPrompt();
});

loadWordsButton.addEventListener('click', () => {
  fileInput.accept = '.txt';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length) {
      words = lines;
      alert('words.txt geladen.');
    }
    fileInput.value = '';
  };
  fileInput.click();
});

loadGrammarButton.addEventListener('click', () => {
  fileInput.accept = '.txt';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    grammarRules = { categories: {}, templates: [], corrections: [] };
    parseGrammarText(text);
    customGrammarLines = loadCustomGrammarRules();
    customGrammarLines.forEach(parseGrammarText);
    renderGrammarList();
    alert('grammar.txt geladen.');
    fileInput.value = '';
  };
  fileInput.click();
});

grammarForm.addEventListener('submit', event => {
  event.preventDefault();
  const type = grammarType.value;
  const ruleText = grammarRuleInput.value.trim();
  if (!ruleText) return;

  const line = `${type}:${ruleText}`;
  addCustomGrammarRule(line);
  grammarRuleInput.value = '';
  grammarRuleInput.focus();
});

trainingForm.addEventListener('submit', event => {
  event.preventDefault();
  const question = trainInput.value.trim();
  const answer = trainAnswer.value.trim();
  if (!question || !answer) return;

  trainingData.unshift({ question, answer });
  saveTrainingData();
  renderTrainingList();
  trainInput.value = '';
  trainAnswer.value = '';
  chatInput.focus();
});

clearDataButton.addEventListener('click', () => {
  if (!confirm('Alle Trainingsdaten wirklich löschen?')) return;
  trainingData = [];
  saveTrainingData();
  renderTrainingList();
});

resetHistoryButton.addEventListener('click', () => {
  if (!confirm('Chatverlauf wirklich zurücksetzen?')) return;
  historyData = [];
  saveHistory();
  renderHistory();
});

openTrainerButton.addEventListener('click', () => {
  trainerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

openChatButton.addEventListener('click', () => {
  chatPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

renderHistory();
renderTrainingList();
