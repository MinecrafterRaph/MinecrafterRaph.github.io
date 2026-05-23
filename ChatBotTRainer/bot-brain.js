/**
 * Chatbot-Kern — Matching, Kontext, Variablen, ohne Floskeln.
 */
const BotBrain = (() => {
  const STOP = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen',
    'und', 'oder', 'aber', 'weil', 'dass', 'wenn', 'auch', 'noch', 'nur', 'schon', 'sehr',
    'ist', 'sind', 'war', 'bin', 'bist', 'hat', 'haben', 'wird', 'werden',
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mir', 'mich', 'dir', 'dich',
    'mit', 'von', 'zu', 'im', 'in', 'am', 'an', 'auf', 'für', 'bei', 'nach', 'aus', 'um', 'über',
    'nicht', 'kein', 'keine', 'ja', 'nein', 'mal', 'so', 'wie', 'was', 'welche', 'wo', 'wer',
    'bitte', 'hallo', 'können', 'kann', 'muss', 'soll', 'gibt', 'hier', 'dort', 'schon',
  ]);

  const PREFIXES = [
    /^was ist\s+(ein[e]?\s+)?/i, /^was sind\s+/i, /^was bedeutet\s+/i, /^was heißt\s+/i,
    /^wer ist\s+/i, /^wie funktioniert\s+/i, /^wie geht\s+/i,
    /^erkläre?\s+(mir\s+)?/i, /^erklär\s+(mir\s+)?/i,
    /^sag mir\s+/i, /^kannst du\s+/i, /^weißt du\s+(über\s+)?/i,
    /^definiere?\s+/i, /^beschreibe?\s+/i, /^tell me\s+/i,
    /^gib mir\s+/i, /^zeig mir\s+/i,
  ];

  const BASE_SYNONYMS = {
    mathe: ['mathematik', 'rechnen', 'zahl', 'zahlen', 'rechnung', 'arithmetik'],
    deutsch: ['grammatik', 'sprache', 'schreiben', 'lesen', 'diktat'],
    englisch: ['english', 'vokabeln', 'vocabulary'],
    code: ['programmieren', 'programmierung', 'informatik', 'python', 'javascript', 'html'],
    musik: ['noten', 'instrument', 'lied', 'melodie'],
    tier: ['tiere', 'hund', 'katze', 'haustier'],
    wissenschaft: ['physik', 'chemie', 'biologie', 'natur'],
  };

  const UNKNOWN = [
    'Keine Antwort. /train Antwort',
    'Nicht im Training. Trainer-Tab oder /train.',
    'Unbekannt. Mit /train Antwort beibringen.',
  ];

  function norm(t) {
    return t.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }

  function stem(w) {
    if (w.length < 4) return w;
    let s = w;
    const endings = ['ieren', 'ierung', 'ungen', 'ung', 'heit', 'keit', 'lich', 'isch', 'eren', 'ere', 'en', 'er', 'em', 'es', 'e', 'n', 's'];
    for (const end of endings) {
      if (s.length > end.length + 2 && s.endsWith(end)) {
        s = s.slice(0, -end.length);
        break;
      }
    }
    return s.length >= 2 ? s : w;
  }

  function mergeSynonymMaps(custom = {}) {
    const merged = { ...BASE_SYNONYMS };
    Object.entries(custom).forEach(([key, list]) => {
      const k = norm(key);
      merged[k] = [...new Set([...(merged[k] || []), ...list.map(norm)])];
    });
    return merged;
  }

  function expandSynonyms(tokens, synonymMap) {
    const out = new Set(tokens);
    tokens.forEach(t => {
      Object.entries(synonymMap).forEach(([key, list]) => {
        if (t === key || list.includes(t)) {
          out.add(key);
          list.forEach(s => out.add(s));
        }
      });
    });
    return [...out];
  }

  function tokenize(text, synonymMap = BASE_SYNONYMS) {
    const raw = norm(text).replace(/[^\p{L}\p{N}\s#]/gu, ' ').split(/\s+/)
      .filter(w => w.length > 1 && !STOP.has(w) && !w.startsWith('#'));
    return expandSynonyms(raw.map(stem), synonymMap);
  }

  function extractTags(text) {
    return (text.match(/#(\p{L}+)/gu) || []).map(t => t.slice(1).toLowerCase());
  }

  function stripTags(text) {
    return text.replace(/#\p{L}+/gu, '').replace(/\s+/g, ' ').trim();
  }

  function focus(message) {
    let f = stripTags(message.trim());
    PREFIXES.forEach(p => { f = f.replace(p, ''); });
    return f.replace(/[?.!]+$/, '').trim();
  }

  function variants(entry) {
    return (entry.question || '').split(/[|;/]/).map(q => stripTags(q.trim())).filter(Boolean);
  }

  function applyVars(text, session) {
    if (!text || !session?.vars) return text;
    let out = text;
    Object.entries(session.vars).forEach(([key, val]) => {
      out = out.replace(new RegExp(`\\{${key}\\}`, 'gi'), val);
    });
    return out;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return m[b.length][a.length];
  }

  function fuzzy(a, b) {
    if (a === b) return true;
    if (a.length < 4 || b.length < 4) return false;
    return levenshtein(a, b) / Math.max(a.length, b.length) <= 0.22;
  }

  function jaccard(a, b) {
    if (!a.length || !b.length) return 0;
    const A = new Set(a);
    const B = new Set(b);
    let inter = 0;
    A.forEach(x => { if (B.has(x)) inter++; });
    return inter / new Set([...A, ...B]).size;
  }

  function phraseScore(msgNorm, variantNorm) {
    if (!msgNorm || !variantNorm) return 0;
    if (msgNorm === variantNorm) return 1;
    const a = msgNorm.split(' ').filter(Boolean);
    const b = variantNorm.split(' ').filter(Boolean);
    if (a.length >= 2 && b.length >= 2) {
      const sub = b.join(' ');
      if (msgNorm.includes(sub) || sub.includes(msgNorm)) {
        const ratio = Math.min(sub.length, msgNorm.length) / Math.max(sub.length, msgNorm.length);
        return 0.88 + ratio * 0.11;
      }
    }
    if (msgNorm.includes(variantNorm) || variantNorm.includes(msgNorm)) {
      const ratio = Math.min(variantNorm.length, msgNorm.length) / Math.max(variantNorm.length, msgNorm.length);
      return 0.82 + ratio * 0.16;
    }
    return 0;
  }

  function tokenOverlap(qTok, mTok) {
    let hit = 0;
    qTok.forEach(q => {
      if (mTok.some(m => q === m || fuzzy(q, m))) hit++;
    });
    return qTok.length ? hit / qTok.length : 0;
  }

  function scoreVariant(variant, msgTokens, msgNorm, focusNorm, focusTok) {
    const vNorm = norm(variant);
    const vTok = tokenize(variant);
    const phrase = Math.max(phraseScore(msgNorm, vNorm), phraseScore(focusNorm, vNorm));
    if (phrase >= 0.99) return 1;
    const jac = Math.max(jaccard(vTok, msgTokens), jaccard(vTok, focusTok));
    const overlap = Math.max(tokenOverlap(vTok, msgTokens), tokenOverlap(vTok, focusTok));
    return Math.min(1, phrase * 0.48 + jac * 0.27 + overlap * 0.38);
  }

  function scoreEntry(entry, message, synonymMap, session) {
    const msgNorm = norm(message);
    const focusText = focus(message);
    const focusNorm = norm(focusText);
    const msgTokens = tokenize(message, synonymMap);
    const focusTok = tokenize(focusText || message, synonymMap);
    const msgTags = extractTags(message);

    let best = 0;
    variants(entry).forEach(v => {
      const s = scoreVariant(v, msgTokens, msgNorm, focusNorm, focusTok);
      if (s > best) best = s;
    });

    if (msgTags.length && entry.tags?.length) {
      const tagHit = msgTags.some(t => entry.tags.includes(t));
      if (tagHit) best = Math.min(1, best + 0.15);
    }

    const ansTok = tokenize(entry.answer || '', synonymMap);
    best = Math.min(1, best + tokenOverlap(ansTok, msgTokens) * 0.1);

    if (session?.recentEntryIds?.includes(entry.id)) {
      best = Math.min(1, best + 0.06);
    }

    return best;
  }

  function ensureEntryIds(training) {
    training.forEach((e, i) => {
      if (!e.id) e.id = `tr-${i}-${norm((e.question || '').slice(0, 12)).replace(/\s/g, '-')}`;
    });
  }

  function rankTraining(training, message, synonymMap, session, limit = 5) {
    if (!training.length) return [];
    ensureEntryIds(training);
    const msgTok = tokenize(message, synonymMap);
    const min = msgTok.length <= 1 ? 0.56 : msgTok.length === 2 ? 0.46 : 0.36;
    return training
      .map(entry => ({ entry, score: scoreEntry(entry, message, synonymMap, session) }))
      .filter(x => x.score >= min)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function pickUnknown() {
    return UNKNOWN[Math.floor(Math.random() * UNKNOWN.length)];
  }

  function isFollowUp(msg) {
    return /\b(das|dies|dazu|darüber|damit|davon|es|nochmal|noch mal|wiederhol|genauer|ausführlicher|warum|wieso|weshalb|und was|auch|ebenso|gleich)\b/i.test(msg)
      || /^(warum|wieso|weshalb|wie meinst|was meinst|nochmal)/i.test(msg.trim());
  }

  function expandMsg(message, ctx) {
    const n = norm(message);
    if (/^(nochmal|noch mal|wiederhol)/.test(n) && ctx.lastBot) {
      return { text: ctx.lastBot, kind: 'repeat' };
    }
    if (/was (hast du|sagtest du|war das|meintest du)/.test(n) && ctx.lastBot) {
      return { text: ctx.lastBot, kind: 'recall' };
    }
    if (isFollowUp(message) && (ctx.lastUser || ctx.topics.length)) {
      const extra = [...tokenize(ctx.lastUser), ...ctx.topics.map(t => stem(norm(t)))];
      const merged = [...new Set([...tokenize(message), ...extra])];
      return { text: merged.join(' '), kind: 'followup' };
    }
    return { text: message, kind: 'normal' };
  }

  function handleNumberPick(message, session) {
    const t = message.trim();
    if (!session.pendingChoices?.length) return null;
    const num = parseInt(t, 10);
    if (num >= 1 && num <= session.pendingChoices.length) {
      const chosen = session.pendingChoices[num - 1];
      session.pendingChoices = null;
      trackHit(session, chosen.entry);
      return applyVars(chosen.entry.answer, session);
    }
    if (!/^\d+$/.test(t)) session.pendingChoices = null;
    return null;
  }

  function trackHit(session, entry) {
    session.lastMatch = entry;
    if (!session.recentEntryIds) session.recentEntryIds = [];
    session.recentEntryIds = [entry.id, ...session.recentEntryIds.filter(id => id !== entry.id)].slice(0, 8);
    if (entry.hits !== undefined) entry.hits = (entry.hits || 0) + 1;
  }

  function buildClarify(matches, session) {
    session.pendingChoices = matches.slice(0, 5).map(m => ({
      entry: m.entry,
      label: variants(m.entry)[0],
      score: Math.round(m.score * 100),
    }));
    const lines = session.pendingChoices.map((c, i) => `${i + 1}. ${c.label} (${c.score}%)`).join('\n');
    return `Treffer — Nummer senden:\n${lines}`;
  }

  function handleWhy(message, session, training, synonymMap) {
    if (!/^(warum|wieso|weshalb)\b/i.test(norm(message))) return null;
    if (!session.lastMatch) return null;
    const topicTok = tokenize(session.lastMatch.question, synonymMap);
    const whyEntry = training.find(e =>
      variants(e).some(v => /warum|wieso|weshalb/i.test(v))
      && variants(e).some(v => tokenize(v, synonymMap).some(t => topicTok.includes(t))),
    );
    if (whyEntry) return applyVars(whyEntry.answer, session);
    return applyVars(session.lastMatch.answer, session);
  }

  function handleCompare(message, training, synonymMap, session) {
    const m = message.match(/(?:ist|sind)\s+(.+?)\s+(?:gleich|das gleiche wie|wie)\s+(.+?)\??$/i)
      || message.match(/unterschied zwischen\s+(.+?)\s+und\s+(.+?)\??$/i);
    if (!m) return null;
    const a = focus(m[1]);
    const b = focus(m[2]);
    const matchA = rankTraining(training, a, synonymMap, session, 1)[0];
    const matchB = rankTraining(training, b, synonymMap, session, 1)[0];
    if (matchA && matchB) {
      if (matchA.entry.id === matchB.entry.id) return 'Ja, gleiche Antwort im Training.';
      return `A: ${applyVars(matchA.entry.answer, session)}\nB: ${applyVars(matchB.entry.answer, session)}`;
    }
    return null;
  }

  function handleListAll(message, training, synonymMap) {
    const n = norm(message);
    if (!/^(zeige|liste|was weißt du über|alles zu)\s+/i.test(n)) return null;
    const topic = focus(message.replace(/^(zeige|liste|was weißt du über|alles zu)\s+/i, ''));
    if (!topic) return null;
    const hits = rankTraining(training, topic, synonymMap, {}, 10);
    if (!hits.length) return null;
    return hits.map((h, i) => `${i + 1}. ${variants(h.entry)[0]}`).join('\n');
  }

  function composeMatch(top, matches, session, expandedKind) {
    trackHit(session, top.entry);
    session.pendingChoices = null;
    const answer = applyVars(top.entry.answer, session);

    if (matches.length > 1 && top.score < 0.8) {
      return `${answer}\n\n${buildClarify(matches, session)}`;
    }
    return answer;
  }

  function smallTalk(msg) {
    const n = norm(msg);
    if (/^(danke|thx|thanks)\b/.test(n)) return 'Bitte.';
    if (/^(tschüss|bye|ciao)\b/.test(n)) return 'Tschüss.';
    if (/wie geht/.test(n)) return 'Gut. Was brauchst du?';
    if (/^(cool|ok|okay|super)\b/.test(n)) return 'Ok.';
    if (/^(hallo|hi|hey|moin|servus)\b/.test(n)) return 'Hallo.';
    return null;
  }

  function yesNo(msg, session) {
    const n = norm(msg);
    if (!/^(ja|nein|jap|nö|yes|no)$/.test(n) || !session.lastMatch) return null;
    if (/^ja|yes|jap/.test(n)) return applyVars(session.lastMatch.answer, session);
    return `Nicht „${variants(session.lastMatch)[0]}". Genauer fragen oder /train.`;
  }

  function evalMath(msg) {
    const pct = msg.match(/(\d+(?:[.,]\d+)?)\s*%\s*von\s*(\d+(?:[.,]\d+)?)/i);
    if (pct) {
      const a = Number(pct[1].replace(',', '.'));
      const b = Number(pct[2].replace(',', '.'));
      if (Number.isFinite(a) && Number.isFinite(b)) return String((a / 100) * b);
    }
    const sqrt = msg.match(/(?:quadrat)?wurzel\s+von\s+(\d+(?:[.,]\d+)?)/i);
    if (sqrt) {
      const n = Number(sqrt[1].replace(',', '.'));
      if (Number.isFinite(n) && n >= 0) return String(Math.sqrt(n));
    }
    let ex = msg.replace(/(\d+)\s*hoch\s*(\d+)/gi, '($1**$2)').replace(/mal/gi, '*')
      .replace(/geteilt durch/gi, '/').replace(/durch/gi, '/')
      .replace(/plus/gi, '+').replace(/minus/gi, '-').replace(/,/g, '.');
    if (!/\d/.test(ex)) return null;
    const c = ex.match(/[0-9.\+\-\*\/\(\)\s]+/g)?.join('');
    if (!c || !/^[0-9.\+\-\*\/\(\)\s]+$/.test(c) || !/[+\-*/()]/.test(c)) return null;
    try {
      // eslint-disable-next-line no-eval
      const r = eval(c);
      if (typeof r === 'number' && Number.isFinite(r)) {
        return Number.isInteger(r) ? String(r) : String(Math.round(r * 1000) / 1000);
      }
    } catch { /* */ }
    return null;
  }

  function matchFacts(msg, facts) {
    const tok = tokenize(msg);
    if (!tok.length || !facts.length) return null;
    for (let i = facts.length - 1; i >= 0; i--) {
      const f = facts[i];
      const ft = tokenize(f);
      if (ft.filter(t => tok.includes(t)).length >= 2) return f;
      if (tok.some(t => norm(f).includes(t) && t.length > 3)) return f;
    }
    return null;
  }

  function normalizeTrainingEntry(entry) {
    const tags = extractTags(entry.question || '');
    return {
      ...entry,
      tags: [...new Set([...(entry.tags || []), ...tags])],
    };
  }

  function generateReply(input) {
    const {
      message,
      training: rawTraining,
      session,
      context,
      synonyms = {},
      onTrainSuggest,
    } = input;

    const training = rawTraining.map(normalizeTrainingEntry);
    const synonymMap = mergeSynonymMaps(synonyms);
    const trimmed = message.trim();
    if (!trimmed) return '';

    const picked = handleNumberPick(trimmed, session);
    if (picked) return picked;

    const st = smallTalk(trimmed);
    if (st) return st;

    const yn = yesNo(trimmed, session);
    if (yn) return yn;

    const expanded = expandMsg(trimmed, context);
    if (expanded.kind === 'repeat' || expanded.kind === 'recall') {
      return expanded.text;
    }

    const listAll = handleListAll(trimmed, training, synonymMap);
    if (listAll) return listAll;

    const compare = handleCompare(trimmed, training, synonymMap, session);
    if (compare) return compare;

    const why = handleWhy(trimmed, session, training, synonymMap);
    if (why) return why;

    const math = evalMath(trimmed);
    if (math !== null) return math;

    const fact = matchFacts(trimmed, session.facts || []);
    if (fact && /wer|heißt|weißt|erinner|merk|name/.test(norm(trimmed))) return fact;

    const queries = [...new Set([expanded.text, focus(trimmed), stripTags(trimmed)].filter(Boolean))];
    let matches = [];
    for (const q of queries) {
      matches = rankTraining(training, q, synonymMap, session, 5);
      if (matches.length) break;
    }

    if (matches.length) {
      return composeMatch(matches[0], matches, session, expanded.kind);
    }

    if (expanded.kind === 'followup' && session.lastMatch) {
      return applyVars(session.lastMatch.answer, session);
    }

    if (onTrainSuggest) onTrainSuggest(focus(trimmed) || trimmed);
    return pickUnknown();
  }

  return {
    norm,
    tokenize,
    focus,
    variants,
    rankTraining,
    scoreEntry,
    generateReply,
    isFollowUp,
    pickUnknown,
    applyVars,
    extractTags,
    normalizeTrainingEntry,
    mergeSynonymMaps,
  };
})();
