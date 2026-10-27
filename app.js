'use strict';

/* ============================================================
   Konstanten
   ============================================================ */
const APP_VERSION = 55;                    // gleich wie CACHE in sw.js und ?v= in index.html halten
const STORE_KEY = 'rk-data-v1';
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const LEARN_STEPS = [1 * MIN, 10 * MIN];   // Lernschritte für neue Karten
const RELEARN_STEP = 10 * MIN;             // nach "Nochmal" bei einer Wiederholungskarte
const STRESS = /́/g;                  // Betonungszeichen (für Vorlesen/Suche entfernen)

const KNOWN_LANGS = {
  ru: { name: 'Russisch', tts: 'ru-RU' },
  de: { name: 'Deutsch', tts: 'de-DE' },
  en: { name: 'Englisch', tts: 'en-US' },
  uk: { name: 'Ukrainisch', tts: 'uk-UA' },
  fr: { name: 'Französisch', tts: 'fr-FR' },
  es: { name: 'Spanisch', tts: 'es-ES' },
  it: { name: 'Italienisch', tts: 'it-IT' },
  pl: { name: 'Polnisch', tts: 'pl-PL' },
  tr: { name: 'Türkisch', tts: 'tr-TR' },
};

// Kartentypen: jeder Typ hat eigene Zusatzfelder, die auf der Rückseite erscheinen.
const CARD_TYPES = {
  word: { name: 'Vokabel', extras: [] },
  noun: {
    name: 'Substantiv',
    extras: [
      { key: 'gender', label: 'Geschlecht', options: { m: 'maskulin', f: 'feminin', n: 'neutrum' } },
      { key: 'plural', label: 'Plural' },
      { key: 'genitive', label: 'Genitiv Sg.' },
    ],
  },
  verb: {
    name: 'Verb',
    extras: [
      { key: 'aspect', label: 'Aspekt', options: { ipf: 'unvollendet', pf: 'vollendet' } },
      { key: 'pair', label: 'Aspektpartner' },
      { key: 'conj', label: 'Konjugation (я / ты / они)' },
    ],
  },
  adj: { name: 'Adjektiv', extras: [{ key: 'forms', label: 'Formen (m / f / n / Pl.)' }] },
  phrase: { name: 'Satz / Redewendung', extras: [] },
  // Aspektpaar auf einer Karte. Die russische Seite wird als Block dargestellt (verbPairHtml),
  // die Zusatzfelder erscheinen daher nicht zusätzlich in der Extras-Liste.
  verbpair: {
    name: 'Verbpaar',
    ownLayout: true,
    extras: [
      { key: 'ipf', label: 'Unvollendet – Infinitiv' },
      { key: 'ipf_pron', label: 'Unvollendet – Aussprache' },
      { key: 'ipf_1', label: 'Unvollendet – я' },
      { key: 'ipf_1_pron', label: 'Unvollendet – я Aussprache' },
      { key: 'ipf_2', label: 'Unvollendet – ты' },
      { key: 'ipf_2_pron', label: 'Unvollendet – ты Aussprache' },
      { key: 'pf', label: 'Vollendet – Infinitiv' },
      { key: 'pf_pron', label: 'Vollendet – Aussprache' },
      { key: 'pf_1', label: 'Vollendet – я' },
      { key: 'pf_1_pron', label: 'Vollendet – я Aussprache' },
      { key: 'pf_2', label: 'Vollendet – ты' },
      { key: 'pf_2_pron', label: 'Vollendet – ты Aussprache' },
      { key: 'example_pron', label: 'Beispielsatz – Aussprache (leer = automatisch)' },
      { key: 'example_cases', label: 'Beispielsatz – Fälle' },
      { key: 'ipf_imp', label: 'Unvollendet – Imperativ (leer = automatisch, — = nicht üblich)' },
      { key: 'pf_imp', label: 'Vollendet – Imperativ (leer = automatisch, — = nicht üblich)' },
      { key: 'example_de', label: 'Beispielsatz – Deutsch' },
      { key: 'example_en', label: 'Beispielsatz – Englisch' },
      { key: 'example_es', label: 'Beispielsatz – Spanisch' },
      { key: 'es_verb', label: 'Spanisch – Verb für Konjugation' },
      { key: 'es_pres', label: 'Spanisch – Presente (yo, tú, él, nosotros, ellos; mit Komma)' },
      { key: 'es_past', label: 'Spanisch – Pretérito (mit Komma)' },
      { key: 'es2_verb', label: 'Spanisch – 2. Verb (optional)' },
      { key: 'es2_pres', label: 'Spanisch – 2. Verb Presente' },
      { key: 'es2_past', label: 'Spanisch – 2. Verb Pretérito' },
      { key: 'note_es', label: 'Notiz zum spanischen Wort (Spanisch-Modus)' },
    ],
  },
  // Adjektiv: Formen berechnet aus der männlichen Grundform (adjHtml / adjDecl)
  adjfull: {
    name: 'Adjektiv',
    ownLayout: true,
    extras: [
      { key: 'short', label: 'Kurzform (m, f, n, Pl.)' },
      { key: 'comp', label: 'Komparativ' },
      { key: 'comp_irr', label: 'Komparativ unregelmäßig (1 = ja)' },
      { key: 'anto', label: 'Gegenteil' },
      { key: 'adv', label: 'Adverb' },
      { key: 'adv_de', label: 'Adverb – Deutsch' },
      { key: 'adv_ex', label: 'Adverb – Beispielsatz' },
      { key: 'adv_ex_de', label: 'Adverb – Beispielsatz Deutsch' },
      { key: 'hint', label: 'Hinweis' },
      { key: 'example_cases', label: 'Beispielsatz – Fälle' },
      { key: 'example_de', label: 'Beispielsatz – Deutsch' },
      { key: 'example_en', label: 'Beispielsatz – Englisch' },
      { key: 'example_es', label: 'Beispielsatz – Spanisch' },
    ],
  },
  // Adverb mit Art (Zeit, Ort …) und Beispielsatz (advHtml)
  advfull: {
    name: 'Adverb',
    ownLayout: true,
    extras: [
      { key: 'cat', label: 'Art (Zeit, Ort, Richtung, Art und Weise, Menge, Frage, Meinung, Zustand)' },
      { key: 'hint', label: 'Hinweis' },
      { key: 'example_de', label: 'Beispielsatz – Deutsch' },
      { key: 'example_en', label: 'Beispielsatz – Englisch' },
      { key: 'example_es', label: 'Beispielsatz – Spanisch' },
    ],
  },
  // Präposition mit Fall und Beispielsatz (prepHtml); zwei Fälle = zwei Karten
  prepfull: {
    name: 'Präposition',
    ownLayout: true,
    extras: [
      { key: 'case', label: 'Fall (Genitiv, Dativ, Akkusativ, Instrumental, Präpositiv)' },
      { key: 'hint', label: 'Hinweis' },
      { key: 'example_cases', label: 'Beispielsatz – Fälle' },
      { key: 'example_de', label: 'Beispielsatz – Deutsch' },
      { key: 'example_en', label: 'Beispielsatz – Englisch' },
      { key: 'example_es', label: 'Beispielsatz – Spanisch' },
    ],
  },
  // Nomen mit Geschlecht, Grundformen und vollständiger Deklination (nounHtml / declensionHtml)
  nounfull: {
    name: 'Nomen',
    ownLayout: true,
    extras: [
      { key: 'gender', label: 'Geschlecht (m, f, n oder pl = nur Plural)' },
      { key: 'anim', label: 'Belebt (1 = Mensch/Tier)' },
      { key: 'indecl', label: 'Unveränderlich (1 = ja)' },
      { key: 'sg', label: 'Singular: Nom|Gen|Dat|Akk|Ins|Präp' },
      { key: 'pl', label: 'Plural: Nom|Gen|Dat|Akk|Ins|Präp' },
      { key: 'hint', label: 'Hinweis (Geschlechtsfalle, Besonderheit)' },
      { key: 'example_cases', label: 'Beispielsatz – Fälle' },
      { key: 'example_de', label: 'Beispielsatz – Deutsch' },
      { key: 'example_en', label: 'Beispielsatz – Englisch' },
      { key: 'example_es', label: 'Beispielsatz – Spanisch' },
    ],
  },
};
// Spanisch wie in der Dominikanischen Republik: ustedes statt vosotros, Futur mit "ir a + Infinitiv"
const ES_PERSONS = ['yo', 'tú', 'él/ella/ud.', 'nosotros', 'ellos/uds.'];
const ES_IR = ['voy', 'vas', 'va', 'vamos', 'van'];
const COMMON_EXTRAS = [
  { key: 'example', label: 'Beispielsatz (RU)' },
  { key: 'example_tr', label: 'Beispiel – Übersetzung' },
  { key: 'note', label: 'Notiz' },
];
const RESERVED_KEYS = new Set(['id', 'type', 'tags', 'deck']);

/* ============================================================
   Datenhaltung
   ============================================================ */
function defaultDb() {
  return {
    v: 1,
    languages: [
      { code: 'ru', name: 'Russisch', tts: 'ru-RU', active: true },
      { code: 'de', name: 'Deutsch', tts: 'de-DE', active: true },
    ],
    settings: { newPerDay: 20, qLang: 'ru' },   // qLang: Sprache der Vorderseite oder 'mix'
    decks: {},      // id -> { id, name, active }
    cards: {},      // id -> { id, deck, type, f: {ru, de, ...}, x: {...}, created }
    progress: {},   // "cardId|qLang" -> { due, ivl, ease, reps, lapses, step }
    daily: { date: '', newSeen: 0 },
  };
}

// Die Karten (groß, ändern sich selten) liegen unter einem eigenen Schlüssel. So muss nach jeder Bewertung
// nur der kleine Teil mit Lernfortschritt und Einstellungen geschrieben werden.
const CARDS_KEY = STORE_KEY + '-cards';
let cardsDirty = false;   // Karten seit dem letzten Speichern geändert?
let cardsRev = 0;         // zählt Kartenänderungen (für Zwischenspeicher wie deckCards)
// Nach jeder Änderung an db.cards oder db.decks aufrufen
function markCards() { cardsDirty = true; cardsRev++; }

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = Object.assign(defaultDb(), JSON.parse(raw));
      const rawCards = localStorage.getItem(CARDS_KEY);
      if (rawCards) data.cards = JSON.parse(rawCards);
      else if (Object.keys(data.cards).length) cardsDirty = true;   // altes Format: Karten beim nächsten Speichern umziehen
      return data;
    }
  } catch (e) { console.error(e); }
  return defaultDb();
}

let db = load();
migrateDirections();

// Früher gab es eine Richtung pro Sprache (de → ru, en → ru …). Jetzt sind alle Übersetzungen eine Seite ('tr').
function migrateDirections() {
  if (!['ru', 'tr', 'mix'].includes(db.settings.qLang)) db.settings.qLang = 'tr';
  let changed = false;
  for (const key of Object.keys(db.progress)) {
    const [id, q] = key.split('|');
    if (q === 'ru' || q === 'tr' || q.startsWith('es-')) continue;   // es-…: Fortschritt im Spanisch-Modus
    const target = id + '|tr';
    if (!db.progress[target] || (db.progress[key].reps || 0) > (db.progress[target].reps || 0)) db.progress[target] = db.progress[key];
    delete db.progress[key];
    changed = true;
  }
  if (changed) save();
}

function save() {
  try {
    // Karten zuerst: Steht der kleine Teil schon im neuen Format, müssen die Karten unter CARDS_KEY liegen
    if (cardsDirty) { localStorage.setItem(CARDS_KEY, JSON.stringify(db.cards)); cardsDirty = false; }
    const { cards, ...rest } = db;
    localStorage.setItem(STORE_KEY, JSON.stringify(rest));
  } catch (e) { toast('Speichern fehlgeschlagen: ' + e.message); }
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
// Neue Karten heute – je Lernsprache getrennt (newSeen = Russisch, newSeenEs = Spanisch)
function newSeenToday() {
  if (db.daily.date !== today()) db.daily = { date: today(), newSeen: 0, newSeenEs: 0 };
  return learnLang() === 'es' ? (db.daily.newSeenEs || 0) : db.daily.newSeen;
}
function countNewSeen() {
  newSeenToday();
  if (learnLang() === 'es') db.daily.newSeenEs = (db.daily.newSeenEs || 0) + 1; else db.daily.newSeen++;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const activeLangs = () => db.languages.filter(l => l.active);
const langByCode = code => db.languages.find(l => l.code === code);
const langName = code => (langByCode(code) || KNOWN_LANGS[code] || { name: code }).name;

/* ============================================================
   Hilfsfunktionen
   ============================================================ */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function fmtInterval(ms) {
  if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + ' Min';
  if (ms < DAY) return Math.round(ms / (60 * MIN)) + ' Std';
  const d = ms / DAY;
  if (d < 30) return Math.round(d) + ' T';
  if (d < 365) return (d / 30).toFixed(1).replace('.0', '') + ' Mon';
  return (d / 365).toFixed(1).replace('.0', '') + ' J';
}

// Vorlesen nur auf Russisch. Die Stimmenliste lädt der Browser asynchron nach.
let voices = [];
function loadVoices() { voices = 'speechSynthesis' in window ? speechSynthesis.getVoices() : []; }

// Beste russische Stimme: natürliche/Online-/Google-Stimmen klingen deutlich besser als lokale
function russianVoice() {
  if (!voices.length) loadVoices();
  const ru = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('ru'));
  return ru.find(v => /natural|online|google/i.test(v.name)) || ru[0] || null;
}

// Spanische Stimme: lateinamerikanisch (Dom. Rep., USA, Mexiko …) vor Spanien, natürliche Stimmen zuerst
function spanishVoice() {
  if (!voices.length) loadVoices();
  const es = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('es'));
  const rank = v => {
    const l = v.lang.replace('_', '-').toLowerCase();
    return (/natural|online|google/i.test(v.name) ? 0 : 10) + (l === 'es-do' ? 0 : l === 'es-us' ? 1 : l === 'es-mx' ? 2 : l === 'es-es' ? 4 : 3);
  };
  return es.sort((a, b) => rank(a) - rank(b))[0] || null;
}

// lang: 'ru' (Standard) oder 'es' – steht an den 🔊-Knöpfen als data-lang
function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  const voice = lang === 'es' ? spanishVoice() : russianVoice();
  // Ohne passende Stimme würde der Browser die Standardstimme (meist Englisch) nehmen – dann lieber gar nicht
  if (!voice) { toast(`Keine ${lang === 'es' ? 'spanische' : 'russische'} Stimme gefunden – Hinweis unter Einstellungen → Vorlesen`); return; }
  const u = new SpeechSynthesisUtterance(text.replace(STRESS, ''));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ============================================================
   Aussprache: deutsche Umschrift aus betontem Russisch ableiten
   Betonte Silbe mit Akzent, unbetontes о → a, unbetontes е/я → i,
   Auslautverhärtung und Stimmangleichung, ' = weich.
   ============================================================ */
const RU_VOWEL_CHARS = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
const RU_UNSTRESSED = new Set(['не', 'ни', 'на', 'в', 'во', 'с', 'со', 'к', 'ко', 'по', 'за', 'из', 'от', 'до', 'у', 'о', 'об', 'и', 'а', 'но', 'же', 'ли', 'бы', 'при', 'без', 'под', 'над', 'про']);
const RU_SPECIAL = {
  'что': 'schto', 'чтобы': 'schtóby', 'сегодня': 'ssiwódnja', 'конечно': 'kanéschna', 'скучно': 'skúschna',
  'здравствуйте': 'sdrástwujtje', 'здравствуй': 'sdrástwuj', 'пожалуйста': 'pashálsta', 'солнце': 'sónze', 'сейчас': 'ssitschás',
};
const RU_OGO_EXCEPT = new Set(['много', 'немного', 'строго', 'дорого', 'недорого', 'убого']);
const RU_DEVOICE = { б: 'п', в: 'ф', г: 'к', д: 'т', ж: 'ш', з: 'с' };
const RU_VOICE = { п: 'б', ф: 'в', к: 'г', т: 'д', ш: 'ж', с: 'з' };
const RU_CONS = { б: 'b', в: 'w', г: 'g', д: 'd', ж: 'sh', з: 's', к: 'k', л: 'l', м: 'm', н: 'n', п: 'p', р: 'r', т: 't', ф: 'f', х: 'ch', ц: 'z', ч: 'tsch', ш: 'sch', щ: 'schtsch', й: 'j' };
const DE_ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý' };

function ruWordPron(word) {
  const plain = word.replace(STRESS, '').toLowerCase();
  if (RU_SPECIAL[plain]) return RU_SPECIAL[plain];
  const isV = c => !!c && RU_VOWEL_CHARS.includes(c);
  // Betonte Vokale als Großbuchstaben markieren
  let w = word.toLowerCase().replace(/([аеиоуыэюя])́/g, (_, v) => v.toUpperCase()).replace(/ё/g, 'Ё');
  const vowels = [...w].filter(isV).length;
  if (!/[АЕЁИОУЫЭЮЯ]/.test(w) && vowels === 1 && !RU_UNSTRESSED.has(plain)) w = w.replace(/[аеиоуыэюя]/, v => v.toUpperCase());
  const unknown = vowels > 1 && !/[АЕЁИОУЫЭЮЯ]/.test(w);   // Betonung unbekannt: nicht reduzieren
  // Buchstabengruppen, die anders gesprochen werden
  if (/[оеОЕ]г[оО]$/.test(w) && !RU_OGO_EXCEPT.has(plain)) w = w.slice(0, -2) + 'в' + w.slice(-1);
  w = w.replace(/ться$|тся$/, 'ца').replace(/стн/g, 'сн').replace(/стл/g, 'сл').replace(/здн/g, 'зн').replace(/вств/g, 'ств')
    .replace(/лнц/g, 'нц').replace(/рдц/g, 'рц').replace(/[сзж]ч/g, 'щ').replace(/[сз]ж/g, 'жж').replace(/г([кч])/g, 'х$1');
  const a = [...w];
  // Auslautverhärtung und Stimmangleichung (von hinten nach vorne)
  for (let i = a.length - 1; i >= 0; i--) {
    let j = i + 1;
    while (a[j] === 'ь' || a[j] === 'ъ') j++;
    const next = a[j];
    if (RU_DEVOICE[a[i]] && (next === undefined || RU_VOICE[next] || 'хцчщ'.includes(next))) a[i] = RU_DEVOICE[a[i]];
    else if (RU_VOICE[a[i]] && next && RU_DEVOICE[next] && next !== 'в') a[i] = RU_VOICE[a[i]];
  }
  const isCons = c => !!c && !isV(c) && c !== 'ь' && c !== 'ъ' && /[а-яё]/.test(c);
  let out = '';
  for (let i = 0; i < a.length; i++) {
    const c = a[i], lc = c.toLowerCase(), prev = a[i - 1], next = a[i + 1];
    const stressed = c !== lc;
    if (isV(c)) {
      const afterCons = isCons(prev);
      const hard = afterCons && 'жшц'.includes(prev), chsch = afterCons && 'чщ'.includes(prev);
      const full = stressed || unknown, last = i === a.length - 1;
      let v;
      switch (lc) {
        case 'а': v = !full && chsch && !last ? 'i' : 'a'; break;
        case 'о': v = full ? 'o' : 'a'; break;
        case 'у': v = 'u'; break;
        case 'ы': v = 'y'; break;
        case 'э': v = 'e'; break;
        case 'и': v = hard ? 'y' : 'i'; break;
        case 'е': v = afterCons ? (full || (hard && last) ? 'e' : hard ? 'y' : 'i') : (full ? 'je' : 'ji'); break;
        case 'ё': v = hard || chsch ? 'o' : 'jo'; break;
        case 'ю': v = chsch ? 'u' : 'ju'; break;
        case 'я': v = full || last ? 'ja' : afterCons ? 'i' : 'ji'; break;
      }
      out += stressed && vowels > 1 ? v.replace(/[aeiouy]/, m => DE_ACCENT[m]) : v;
    } else if (lc === 'ь') {
      if (!isV(next) && !'жшчщ'.includes(prev)) out += "'";
    } else if (lc === 'ъ') {
      // stumm, der folgende Vokal wird mit j gesprochen
    } else if (lc === 'с') {
      out += isV(next) && (!prev || isV(prev)) ? 'ss' : 's';
    } else {
      out += RU_CONS[lc] || c;
    }
  }
  return out.replace(/tschsch/g, 'tsch');   // лу́чший: ч vor ш klingt wie ein Laut
}

function ruPron(text) {
  if (!text || !/[а-яё]/i.test(text)) return '';   // z. B. „—“ bei fehlender Form
  const parts = text.split(/([а-яёА-ЯЁ́]+)/);
  return parts.map((t, i) => {
    if (i % 2 === 0) return t;
    let p = ruWordPron(t);
    // Die Präposition в richtet sich nach dem folgenden Wort
    if (p === 'f' || p === 'w') p = /^[пфктшсхцчщ]/i.test(parts[i + 2] || '') ? 'f' : 'w';
    return p;
  }).join('');
}

/* ============================================================
   Imperativ (ты-Form) aus Infinitiv, я- und ты-Form ableiten.
   Regeln: Präsensstamm + -й (nach Vokal), -и́ (я-Form endbetont), -и (zwei Konsonanten, вы́-),
   sonst -ь. Ausnahmen stehen in decks-src/imperativ.tsv und kommen als ipf_imp / pf_imp in die Karte.
   ============================================================ */
function ruImperative(inf, ya, ty) {
  if (!inf || !ya || !ty || /—/.test(ya + ty)) return '';
  const vowels = s => (s.replace(STRESS, '').match(/[аеёиоуыэюя]/g) || []).length;
  const cut = s => s.replace(/(ся|сь)$/, '');
  const reflexive = /(ся|сь)$/.test(inf);
  const i = cut(inf), y = cut(ya), t = cut(ty);
  const plainI = i.replace(STRESS, ''), plainY = y.replace(STRESS, ''), plainT = t.replace(STRESS, '');
  let imp;
  if (/авать$/.test(plainI) && /аю$/.test(plainY)) {
    imp = i.replace(/ть$/, 'й');                                  // дава́ть → дава́й
  } else if (/дам$/.test(plainY)) {
    imp = i.replace(/ть$/, 'й');                                  // отда́ть → отда́й
  } else if (/ь[её]шь$/.test(plainT) && /ить$/.test(plainI)) {
    const base = i.replace(/и́?ть$/, '');                    // пить → пей, разби́ть → разбе́й
    imp = /́/.test(base) ? base + 'ей' : base + 'е́й';
  } else {
    const lastVowel = y.search(/[аеёиоуыэюя](?=[^аеёиоуыэюя]*$)/);
    const endStressed = vowels(y) === 1 || y[lastVowel + 1] === '́' || y[lastVowel] === 'ё';
    // Bei к/г-Stämmen kommt der Stamm aus der я-Form: помогу́ → помоги́, бегу́ → беги́
    const stem = /[гк]у$/.test(plainY) ? y.replace(/у́?$/, '') : t.replace(/[еёи]́?шь$/, '');
    const plainStem = stem.replace(STRESS, '');
    if (/[аеёиоуыэюя]$/.test(plainStem)) imp = stem + 'й';         // де́лаю → де́лай
    else if (endStressed) imp = plainStem + 'и́';                   // пишу́ → пиши́
    else if (/^вы́/.test(i) || /[бвгджзйклмнпрстфхцчшщ]{2}$/.test(plainStem)) imp = stem + 'и';   // вы́учи, кри́кни
    else imp = stem + 'ь';                                         // ста́ну → стань
  }
  if (vowels(imp) === 1) imp = imp.replace(STRESS, '');           // einsilbig: kein Akzent
  else if (!/[́ё]/.test(imp)) imp = imp.replace(/([аеиоуыэюя])([^аеиоуыэюя]*)$/, '$1́$2');   // посто́й, осну́й
  if (reflexive) imp += /[и́]$/.test(imp) ? 'сь' : 'ся';
  // Mit -ся wird eine einsilbige Form zweisilbig: Betonung auf den Stammvokal (бой → бо́йся)
  if (vowels(imp) > 1 && !/[́ё]/.test(imp)) imp = imp.replace(/[аеиоуыэюя]/, v => v + '́');
  return imp;
}

// Höfliche / Plural-Form: де́лай → де́лайте, сади́сь → сади́тесь
function ruImperativePlural(imp) {
  const pl = /(сь|ся)$/.test(imp) ? imp.slice(0, -2) + 'тесь' : imp + 'те';
  // Aus einsilbigen Formen wird eine zweisilbige: Betonung auf den Stammvokal (дай → да́йте, жди → жди́те)
  return /[́ё]/.test(pl) ? pl : pl.replace(/[аеиоуыэюя]/, v => v + '́');
}

/* ============================================================
   Spanische Konjugation (Dominikanische Republik):
   Presente, Pretérito, Futur mit "ir a + Infinitiv", ustedes statt vosotros.
   Ein Stammwechsel kann mit ":ie", ":ue", ":i", ":ie-i", ":ue-u", ":acc" oder ":dat" erzwungen werden.
   ============================================================ */
const ES_IRREG = {
  ser: ['soy, eres, es, somos, son', 'fui, fuiste, fue, fuimos, fueron'],
  estar: ['estoy, estás, está, estamos, están', 'estuve, estuviste, estuvo, estuvimos, estuvieron'],
  ir: ['voy, vas, va, vamos, van', 'fui, fuiste, fue, fuimos, fueron'],
  dar: ['doy, das, da, damos, dan', 'di, diste, dio, dimos, dieron'],
  ver: ['veo, ves, ve, vemos, ven', 'vi, viste, vio, vimos, vieron'],
  haber: ['he, has, ha, hemos, han', 'hube, hubiste, hubo, hubimos, hubieron'],
  saber: ['sé, sabes, sabe, sabemos, saben', 'supe, supiste, supo, supimos, supieron'],
  caber: ['quepo, cabes, cabe, cabemos, caben', 'cupe, cupiste, cupo, cupimos, cupieron'],
  poder: ['puedo, puedes, puede, podemos, pueden', 'pude, pudiste, pudo, pudimos, pudieron'],
  querer: ['quiero, quieres, quiere, queremos, quieren', 'quise, quisiste, quiso, quisimos, quisieron'],
  andar: ['ando, andas, anda, andamos, andan', 'anduve, anduviste, anduvo, anduvimos, anduvieron'],
  jugar: ['juego, juegas, juega, jugamos, juegan', 'jugué, jugaste, jugó, jugamos, jugaron'],
  oler: ['huelo, hueles, huele, olemos, huelen', 'olí, oliste, olió, olimos, olieron'],
  oír: ['oigo, oyes, oye, oímos, oyen', 'oí, oíste, oyó, oímos, oyeron'],
  caer: ['caigo, caes, cae, caemos, caen', 'caí, caíste, cayó, caímos, cayeron'],
  salir: ['salgo, sales, sale, salimos, salen', 'salí, saliste, salió, salimos, salieron'],
  valer: ['valgo, vales, vale, valemos, valen', 'valí, valiste, valió, valimos, valieron'],
  // Diese gelten auch mit Vorsilbe (obtener, proponer, convenir, traducir, conseguir …)
  tener: ['tengo, tienes, tiene, tenemos, tienen', 'tuve, tuviste, tuvo, tuvimos, tuvieron'],
  poner: ['pongo, pones, pone, ponemos, ponen', 'puse, pusiste, puso, pusimos, pusieron'],
  venir: ['vengo, vienes, viene, venimos, vienen', 'vine, viniste, vino, vinimos, vinieron'],
  hacer: ['hago, haces, hace, hacemos, hacen', 'hice, hiciste, hizo, hicimos, hicieron'],
  decir: ['digo, dices, dice, decimos, dicen', 'dije, dijiste, dijo, dijimos, dijeron'],
  traer: ['traigo, traes, trae, traemos, traen', 'traje, trajiste, trajo, trajimos, trajeron'],
  ducir: ['duzco, duces, duce, ducimos, ducen', 'duje, dujiste, dujo, dujimos, dujeron'],
  seguir: ['sigo, sigues, sigue, seguimos, siguen', 'seguí, seguiste, siguió, seguimos, siguieron'],
  reír: ['río, ríes, ríe, reímos, ríen', 'reí, reíste, rio, reímos, rieron'],
};
const ES_PREFIXABLE = ['salir', 'tener', 'poner', 'venir', 'hacer', 'decir', 'traer', 'ducir', 'seguir', 'reír'];
const ES_STEM = {};
const esClass = (cls, list) => list.split(' ').forEach(v => { ES_STEM[v] = cls; });
esClass('ie', 'adquirir sembrar pensar empezar comenzar cerrar despertar sentar entender perder recomendar negar nevar calentar confesar defender encender atender extender tender regar temblar gobernar apretar atravesar acertar manifestar merendar fregar tropezar');
esClass('ie-i', 'sentir preferir mentir convertir divertir sugerir advertir herir referir consentir invertir requerir hervir');
esClass('ue', 'soler esforzar desenvolver volver devolver resolver envolver mover llover doler morder contar encontrar recordar costar mostrar demostrar probar aprobar comprobar sonar soñar volar acostar almorzar colgar rogar forzar soltar acordar renovar rodar apostar promover remover conmover torcer');
esClass('ue-u', 'dormir morir');
esClass('i', 'derretir pedir repetir servir vestir medir competir despedir impedir elegir corregir gemir rendir');
esClass('acc', 'criar prohibir reunir enviar confiar enfriar guiar variar ampliar continuar actuar graduar situar evaluar desconfiar resfriar');
const ES_DAT = new Set(['gustar', 'encantar', 'importar', 'interesar']);
const ES_REFL = ['me', 'te', 'se', 'nos', 'se'];
const ES_DATIVE = ['me', 'te', 'le', 'nos', 'les'];

// Letztes Vorkommen eines Musters im Stamm ersetzen (Stammwechsel betrifft die letzte Stammsilbe)
function replaceLast(s, re, to) {
  const m = [...s.matchAll(re)].pop();
  return m ? s.slice(0, m.index) + (typeof to === 'function' ? to(m[0]) : to) + s.slice(m.index + m[0].length) : s;
}

function esRegular(inf, cls) {
  const end = inf.slice(-2).replace('í', 'i'), stem = inf.slice(0, -2);
  const PRES = { ar: ['o', 'as', 'a', 'amos', 'an'], er: ['o', 'es', 'e', 'emos', 'en'], ir: ['o', 'es', 'e', 'imos', 'en'] };
  const PAST = { ar: ['é', 'aste', 'ó', 'amos', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'ieron'], ir: ['í', 'iste', 'ió', 'imos', 'ieron'] };
  if (!PRES[end]) return null;
  const [presCh, pretCh] = (cls || '').split('-');
  let presStem = stem;
  if (presCh === 'ie') presStem = replaceLast(stem, /e/g, 'ie');
  if (presCh === 'ue') presStem = replaceLast(stem, /o/g, 'ue');
  if (presCh === 'i') presStem = replaceLast(stem, /e/g, 'i');
  if (cls === 'acc') presStem = replaceLast(stem, /[iu]/g, m => (m === 'i' ? 'í' : 'ú'));
  let pres = PRES[end].map((e, i) => (i === 3 ? stem : presStem) + e);
  const uir = end === 'ir' && /[^g]u$/.test(stem);   // construir → construyo
  if (uir) pres = pres.map((f, i) => (i === 3 ? f : stem + 'y' + PRES.ir[i]));
  // Rechtschreibung in der yo-Form
  if (/g(er|ir)$/.test(inf)) pres[0] = pres[0].replace(/go$/, 'jo');
  else if (/guir$/.test(inf)) pres[0] = pres[0].replace(/guo$/, 'go');
  else if (/[aeiouáéó]c(er|ir)$/.test(inf)) pres[0] = pres[0].replace(/co$/, 'zco');
  else if (/c(er|ir)$/.test(inf)) pres[0] = pres[0].replace(/co$/, 'zo');

  let past = PAST[end].map(e => stem + e);
  const pretChange = cls === 'i' ? 'i' : pretCh;
  if (pretChange === 'i') [2, 4].forEach(i => { past[i] = replaceLast(stem, /e/g, 'i') + PAST[end][i]; });
  if (pretChange === 'u') [2, 4].forEach(i => { past[i] = replaceLast(stem, /o/g, 'u') + PAST[end][i]; });
  if (end === 'ar') {
    if (stem.endsWith('c')) past[0] = stem.slice(0, -1) + 'qué';
    else if (stem.endsWith('g')) past[0] = stem + 'ué';
    else if (stem.endsWith('z')) past[0] = stem.slice(0, -1) + 'cé';
  } else if (uir) {
    past = [stem + 'í', stem + 'iste', stem + 'yó', stem + 'imos', stem + 'yeron'];
  } else if (/[aeo]$/.test(stem)) {
    past = [stem + 'í', stem + 'íste', stem + 'yó', stem + 'ímos', stem + 'yeron'];   // leer → leyó
  }
  // Einsilbige Formen ohne Akzent (RAE 2010): crie, crio, guio, hui
  if (/^(cri|gui|fi|li|pi)ar$/.test(inf)) { past[0] = past[0].replace('é', 'e'); past[2] = past[2].replace('ó', 'o'); }
  if (inf === 'huir') past[0] = 'hui';
  return [pres, past];
}

// Erklärung, warum ein spanisches Verb so konjugiert wird (für die ⓘ-Box unter der Tabelle)
const ES_ENDINGS = {
  ar: ['-o, -as, -a, -amos, -an', '-é, -aste, -ó, -amos, -aron'],
  er: ['-o, -es, -e, -emos, -en', '-í, -iste, -ió, -imos, -ieron'],
  ir: ['-o, -es, -e, -imos, -en', '-í, -iste, -ió, -imos, -ieron'],
};
const ES_IRREG_NOTE = {
  ser: 'ser ist ganz unregelmäßig. Pretérito: dieselben Formen wie ir (fui, fuiste …) – der Zusammenhang zeigt die Bedeutung.',
  ir: 'ir ist ganz unregelmäßig (voy, vas …). Pretérito: dieselben Formen wie ser (fui, fuiste …).',
  estar: 'estar: yo-Form estoy, Betonung auf der Endung (estás, está). Pretérito mit Stamm estuv- ohne Akzent.',
  dar: 'dar: yo-Form doy. Pretérito mit Endungen wie bei -er/-ir: di, diste, dio.',
  ver: 'ver: yo-Form veo. Pretérito ohne Akzent: vi, vio.',
  haber: 'haber ist Hilfsverb (he, has, ha …). hay = es gibt.',
};
const ES_STEM_NOTE = {
  ie: 'Stammwechsel e → ie in allen betonten Formen (yo, tú, él, ellos), nicht bei nosotros.',
  ue: 'Stammwechsel o → ue in allen betonten Formen (yo, tú, él, ellos), nicht bei nosotros.',
  i: 'Stammwechsel e → i im Presente (außer nosotros) und im Pretérito bei él und ellos.',
  'ie-i': 'Stammwechsel e → ie im Presente (außer nosotros); im Pretérito bei él und ellos e → i.',
  'ue-u': 'Stammwechsel o → ue im Presente (außer nosotros); im Pretérito bei él und ellos o → u.',
  acc: 'i bzw. u bekommt im Presente einen Akzent (außer nosotros): envío, continúas.',
};
function esExplain(raw) {
  const [spec, forced] = raw.trim().split(':');
  const words = spec.trim().split(/\s+/);
  let inf = words[0];
  const refl = /(ar|er|ir|ír)se$/.test(inf);
  if (refl) inf = inf.slice(0, -2);
  const end = inf.slice(-2).replace('í', 'i');
  const lines = [];
  const key = ES_IRREG[inf] ? inf : ES_PREFIXABLE.find(k => inf.endsWith(k) && inf.length > k.length);
  const cls = forced || ES_STEM[inf] || '';
  if (ES_IRREG_NOTE[inf]) lines.push(ES_IRREG_NOTE[inf]);
  else if (key) {
    const pre = inf.slice(0, inf.length - key.length);
    const yo = pre + ES_IRREG[key][0].split(', ')[0], pret = pre + ES_IRREG[key][1].split(', ')[0];
    lines.push(`<b>Unregelmäßig</b>${key !== inf ? ` (wie <b>${key}</b>, mit Vorsilbe ${inf.slice(0, inf.length - key.length)}-)` : ''}: yo-Form <b>${yo}</b>.`);
    if (key === 'seguir') lines.push('Stammwechsel e → i wie bei pedir, dazu gu → g in der yo-Form; Pretérito: siguió, siguieron.');
    else if (key === 'ducir') lines.push('Alle Verben auf -ducir: yo-Form -duzco, Pretérito mit -duj- (traduje, produjo).');
    else if (/go$/.test(yo)) lines.push('Typisch: In der yo-Form kommt ein -g- dazu (tengo, pongo, salgo, hago, digo …).');
    if (!/[éí]$/.test(pret) && key !== 'ducir') lines.push(`Pretérito mit eigenem Stamm und ohne Akzent: ${pret} (wie tuve, puse, hice, dije).`);
  } else if (ES_ENDINGS[end]) {
    lines.push(`<b>Verb auf -${end}</b>: Stamm ${inf.slice(0, -2)}- + regelmäßige Endungen.`);
    lines.push(`Presente: ${ES_ENDINGS[end][0]} · Pretérito: ${ES_ENDINGS[end][1]}`);
    if (cls && cls !== 'dat' && ES_STEM_NOTE[cls]) lines.push(ES_STEM_NOTE[cls]);
    if (/g(er|ir)$/.test(inf)) lines.push('yo-Form: g → j vor o (escojo), damit der Laut gleich bleibt.');
    else if (/guir$/.test(inf)) lines.push('yo-Form: gu → g vor o (sigo).');
    else if (/[aeiouáéó]c(er|ir)$/.test(inf)) lines.push('yo-Form: Vokal + -cer/-cir → -zco (conozco, parezco).');
    else if (/c(er|ir)$/.test(inf)) lines.push('yo-Form: Konsonant + -cer → -zo (venzo).');
    if (end === 'ar' && /c$/.test(inf.slice(0, -2))) lines.push('Pretérito yo: c → qu vor é (busqué), damit es wie k klingt.');
    if (end === 'ar' && /g$/.test(inf.slice(0, -2))) lines.push('Pretérito yo: g → gu vor é (llegué), damit es wie g klingt.');
    if (end === 'ar' && /z$/.test(inf.slice(0, -2))) lines.push('Pretérito yo: z → c vor é (empecé).');
    if (end === 'ir' && /[^g]u$/.test(inf.slice(0, -2))) lines.push('Verben auf -uir schieben ein y ein: construyo, construyó.');
    if (end !== 'ar' && /[aeo]$/.test(inf.slice(0, -2))) lines.push('Stamm endet auf Vokal: im Pretérito y statt i (leyó, leyeron).');
  }
  if (cls === 'dat' || ES_DAT.has(inf)) lines.push('<b>Wie gustar:</b> Das Verb richtet sich nach der Sache (gusta / gustan); die Person steht davor: me, te, le, nos, les.');
  else if (refl) lines.push('<b>Reflexiv</b> (-se): Pronomen vor dem Verb: me, te, se, nos, se (me levanto).');
  const futEx = cls === 'dat' || ES_DAT.has(inf) ? 'me va a ' + inf : refl ? 'voy a ' + inf + 'me' : 'voy a ' + inf;
  lines.push('Futuro wie in der DR: <b>ir a</b> + Infinitiv (' + futEx + ').');
  return lines.map(l => `<div>${l}</div>`).join('');
}

// "sentarse", "tener que", "darse cuenta", "pensar:ie" → { label, pres[5], past[5], fut[5] }
function esConjugate(raw) {
  const [spec, forced] = raw.trim().split(':');
  const words = spec.trim().split(/\s+/);
  let inf = words[0];
  const rest = words.slice(1).join(' ');
  const refl = /(ar|er|ir|ír)se$/.test(inf);
  if (refl) inf = inf.slice(0, -2);
  const cls = forced || ES_STEM[inf] || '';
  const key = ES_IRREG[inf] ? inf : ES_PREFIXABLE.find(k => inf.endsWith(k) && inf.length > k.length);
  let forms;
  if (key) {
    const pre = inf.slice(0, inf.length - key.length);
    forms = ES_IRREG[key].map(s => s.split(', ').map(f => pre + (pre && f === 'rio' ? 'rió' : f)));
  } else {
    forms = esRegular(inf, cls === 'dat' ? ES_STEM[inf] : cls);
  }
  if (!forms) return null;
  const [pres, past] = forms;
  const tail = f => (rest ? `${f} ${rest}` : f);
  if (cls === 'dat' || (ES_DAT.has(inf) && !refl)) {
    return {
      label: spec,
      pres: ES_DATIVE.map(p => tail(`${p} ${pres[2]}`)),
      past: ES_DATIVE.map(p => tail(`${p} ${past[2]}`)),
      fut: ES_DATIVE.map(p => tail(`${p} va a ${inf}`)),
    };
  }
  const pro = i => (refl ? ES_REFL[i] + ' ' : '');
  // "estar parado" → nosotros estamos parados
  const plural = ['estar', 'quedar', 'ser'].includes(inf) && /^[a-zñáéíóú]+[oa]$/.test(rest);
  const tailAt = (f, i) => (rest ? `${f} ${plural && i >= 3 ? rest + 's' : rest}` : f);
  return {
    label: spec,
    pres: pres.map((f, i) => tailAt(pro(i) + f, i)),
    past: past.map((f, i) => tailAt(pro(i) + f, i)),
    fut: ES_IR.map((ir, i) => tailAt(`${ir} a ${inf}${refl ? ES_REFL[i] : ''}`, i)),
  };
}

/* ============================================================
   Weitere spanische Zeitformen (Dropdown „Alle Zeitformen“ und Konjugationstraining):
   Imperfecto, Pretérito perfecto, Futuro simple, Condicional, Subjuntivo presente,
   Gerundio, Participio, Imperativo
   ============================================================ */
const ES_FUT_STEM = { tener: 'tendr', poner: 'pondr', venir: 'vendr', salir: 'saldr', valer: 'valdr', poder: 'podr', saber: 'sabr', caber: 'cabr', haber: 'habr', querer: 'querr', hacer: 'har', decir: 'dir' };
const ES_PART = { abrir: 'abierto', cubrir: 'cubierto', decir: 'dicho', escribir: 'escrito', hacer: 'hecho', morir: 'muerto', poner: 'puesto', romper: 'roto', ver: 'visto', prever: 'previsto', volver: 'vuelto', freír: 'frito', imprimir: 'impreso', satisfacer: 'satisfecho' };
const ES_PART_SUFFIX = ['scribir', 'cubrir', 'poner', 'hacer', 'volver', 'solver', 'decir', 'abrir'];   // gilt auch mit Vorsilbe
const ES_PART_SUFFIX_FORM = { scribir: 'scrito', cubrir: 'cubierto', poner: 'puesto', hacer: 'hecho', volver: 'vuelto', solver: 'suelto', decir: 'dicho', abrir: 'abierto' };
const ES_IMPF_IRREG = { ser: 'era, eras, era, éramos, eran', ir: 'iba, ibas, iba, íbamos, iban', ver: 'veía, veías, veía, veíamos, veían' };
const ES_SUBJ_IRREG = { ser: 'sea, seas, sea, seamos, sean', ir: 'vaya, vayas, vaya, vayamos, vayan', estar: 'esté, estés, esté, estemos, estén', dar: 'dé, des, dé, demos, den', saber: 'sepa, sepas, sepa, sepamos, sepan', haber: 'haya, hayas, haya, hayamos, hayan', reír: 'ría, rías, ría, riamos, rían' };
const ES_IMP_TU = { decir: 'di', hacer: 'haz', ir: 've', poner: 'pon', salir: 'sal', ser: 'sé', tener: 'ten', venir: 'ven' };
const ES_HABER = ['he', 'has', 'ha', 'hemos', 'han'];

// Position des betonten Vokals (Akzent oder Regel: Vokal/-n/-s → vorletzte Silbe, sonst letzte)
function esStressPos(w) {
  const acc = w.search(/[áéíóú]/i);
  if (acc >= 0) return acc;
  const nuc = esNuclei(w);
  if (!nuc.length) return -1;
  const n = /[aeiouns]$/i.test(w) ? (nuc[nuc.length - 2] || nuc[nuc.length - 1]) : nuc[nuc.length - 1];
  const g = w.slice(n.start, n.end);
  return n.start + (/[aeo]/i.test(g) ? g.search(/[aeo]/i) : g.length - 1);   // im Diphthong der starke Vokal
}

// Pronomen anhängen (Imperativ): levanta + te → levántate; einsilbig ohne Akzent: ponte, dime
function esAttach(base, clitic) {
  if (esNuclei(base).length < 2) return base.replace(/[áéíóú]/, v => ES_DEACCENT[v]) + clitic;   // dé + se → dese
  if (/[áéíóú]/.test(base) || esNuclei(base).length < 2) return base + clitic;
  const p = esStressPos(base);
  return base.slice(0, p) + (ES_ACCENT[base[p]] || base[p]) + base.slice(p + 1) + clitic;
}

function esParticiple(inf, end, stem) {
  if (ES_PART[inf]) return ES_PART[inf];
  const k = ES_PART_SUFFIX.find(s => inf.endsWith(s) && inf.length > s.length);
  if (k) return inf.slice(0, inf.length - k.length) + ES_PART_SUFFIX_FORM[k];
  if (end === 'ar') return stem + 'ado';
  return stem + (/[aeo]$/.test(stem) ? 'ído' : 'ido');   // leído, caído, oído
}

function esFutStem(inf) {
  if (ES_FUT_STEM[inf]) return ES_FUT_STEM[inf];
  const k = ES_PREFIXABLE.find(s => ES_FUT_STEM[s] && inf.endsWith(s) && inf.length > s.length);
  if (k) return inf.slice(0, inf.length - k.length) + ES_FUT_STEM[k];
  return inf.replace(/ír$/, 'ir');   // oír → oiré
}

// "pensar", "levantarse", "tener que", "gustar" → { imperf, perf, futs, cond, subj, ger, part, imp: [tú, no tú, usted, ustedes] }
function esMoreTenses(raw) {
  const [spec, forced] = raw.trim().split(':');
  const words = spec.trim().split(/\s+/);
  let inf = words[0];
  const rest = words.slice(1).join(' ');
  const refl = /(ar|er|ir|ír)se$/.test(inf);
  if (refl) inf = inf.slice(0, -2);
  const end = inf.slice(-2).replace('í', 'i'), stem = inf.slice(0, -2);
  if (!['ar', 'er', 'ir'].includes(end)) return null;
  const cls = forced || ES_STEM[inf] || '';
  const key = ES_IRREG[inf] ? inf : ES_PREFIXABLE.find(k => inf.endsWith(k) && inf.length > k.length);
  const pre = key ? inf.slice(0, inf.length - key.length) : '';
  const base = esConjugate(inf + (forced ? ':' + forced : ''));
  if (!base) return null;
  const pres = base.pres;
  const split = s => s.split(', ');
  const imperf = ES_IMPF_IRREG[inf] ? split(ES_IMPF_IRREG[inf])
    : (end === 'ar' ? ['aba', 'abas', 'aba', 'ábamos', 'aban'] : ['ía', 'ías', 'ía', 'íamos', 'ían']).map(e => stem + e);
  const fs = esFutStem(inf);
  const futs = ['é', 'ás', 'á', 'emos', 'án'].map(e => fs + e);
  const cond = ['ía', 'ías', 'ía', 'íamos', 'ían'].map(e => fs + e);
  const part = esParticiple(inf, end, stem);
  const perf = ES_HABER.map(h => `${h} ${part}`);
  // Subjuntivo: Stamm der yo-Form (tengo → teng-a); nur Stammwechsel-Verben bilden nosotros vom Infinitiv
  let subj;
  if (ES_SUBJ_IRREG[inf]) subj = split(ES_SUBJ_IRREG[inf]);
  else if (key && ES_SUBJ_IRREG[key]) subj = split(ES_SUBJ_IRREG[key]).map(f => pre + f);
  else {
    const E = end === 'ar' ? ['e', 'es', 'e', 'emos', 'en'] : ['a', 'as', 'a', 'amos', 'an'];
    const dat0 = cls === 'dat' || (ES_DAT.has(inf) && !refl);
    const yoStem = dat0 ? stem : pres[0].replace(/^(me|te|se|nos) /, '').replace(/o$/, '');
    const changeOnly = ['ie', 'ue', 'i', 'ie-i', 'ue-u', 'acc'].includes(cls) || ['jugar', 'poder', 'querer', 'oler'].includes(inf);
    let nosStem = changeOnly ? stem : yoStem;
    if (end === 'ir' && (cls === 'ie-i' || cls === 'i')) nosStem = replaceLast(stem, /e/g, 'i');
    if (end === 'ir' && cls === 'ue-u') nosStem = replaceLast(stem, /o/g, 'u');
    const fix = s => (end === 'ar' ? s.replace(/c$/, 'qu').replace(/g$/, 'gu').replace(/z$/, 'c') : s);
    subj = E.map((e, i) => fix(i === 3 ? nosStem : yoStem) + e);
  }
  // Gerundio
  let ger;
  if (inf === 'ir') ger = 'yendo';
  else if (inf === 'poder') ger = 'pudiendo';
  else if (key === 'reír') ger = pre + 'riendo';
  else if (end === 'ar') ger = stem + 'ando';
  else {
    let s = stem;
    if (end === 'ir' && (cls === 'ie-i' || cls === 'i' || ['decir', 'venir', 'seguir'].includes(key))) s = replaceLast(stem, /e/g, 'i');
    if (end === 'ir' && cls === 'ue-u') s = replaceLast(stem, /o/g, 'u');
    ger = s + (/[aeou]$/.test(s) && !/[gq]u$/.test(s) ? 'yendo' : 'iendo');   // leyendo, oyendo, construyendo
  }
  // Imperativo: tú = él-Form (außer di, haz, ve, pon, sal, sé, ten, ven), sonst Subjuntivo
  const presPlain = esConjugate(inf + (forced ? ':' + forced : '')).pres.map(f => f.replace(/^(me|te|se|nos) /, ''));
  let tu = ES_IMP_TU[inf] || presPlain[2];
  if (!ES_IMP_TU[inf] && key && pre && ES_IMP_TU[key]) tu = pre + ES_IMP_TU[key].replace(/([aeo])n$/, (m, v) => ES_ACCENT[v] + 'n');   // obtén, propón
  const tail = f => (rest ? `${f} ${rest}` : f);
  const dat = cls === 'dat' || (ES_DAT.has(inf) && !refl);
  if (dat) {
    // gustar & Co.: die Person steht davor, das Verb in der 3. Person
    const d = forms => ES_DATIVE.map(p => tail(`${p} ${forms[2]}`));
    return { imperf: d(imperf), perf: d(perf), futs: d(futs), cond: d(cond), subj: d(subj), ger: tail(ger), part, imp: null, dat: true };
  }
  const pro = i => (refl ? ES_REFL[i] + ' ' : '');
  const conj = forms => forms.map((f, i) => tail(pro(i) + f));
  const noImp = inf === 'haber' || /^que( |$)/.test(rest);
  const imp = noImp ? null : refl
    ? [esAttach(tu, 'te'), `no te ${subj[1]}`, esAttach(subj[2], 'se'), esAttach(subj[4], 'se')]
    : [tu, `no ${subj[1]}`, subj[2], subj[4]];
  return {
    imperf: conj(imperf), perf: conj(perf), futs: conj(futs), cond: conj(cond), subj: conj(subj),
    ger: tail(refl ? `${esAttach(ger, 'se')}` : ger), part, imp: imp && imp.map(tail), refl,
  };
}

const ES_TENSE_INFO = {
  imperf: '<b>Imperfecto</b> – Vergangenheit für „früher immer“, Gewohnheiten, Beschreibungen und Hintergrund: De niño jugaba pelota. Endungen -aba (bei -ar) bzw. -ía (bei -er/-ir). Nur ser, ir und ver sind unregelmäßig.',
  perf: '<b>Pretérito perfecto</b> – haber + Partizip: he comido = ich habe gegessen. In Spanien häufig für „heute“, in der Dominikanischen Republik sagt man meist das <b>Pretérito</b> (comí) – das steht oben in der Haupttabelle in der Spalte „Pretérito“.',
  futs: '<b>Futuro simple</b> – Infinitiv + -é, -ás, -á, -emos, -án: hablaré. Im Alltag nimmt man meist ir a + Infinitiv. Oft auch für Vermutungen: Serán las tres = Es wird wohl drei sein.',
  cond: '<b>Condicional</b> – „würde“: hablaría = ich würde sprechen. Gleicher Stamm wie das Futuro, Endungen wie das Imperfecto von -er (-ía). Höflich: ¿Podría ayudarme?',
  subj: '<b>Subjuntivo presente</b> – Möglichkeitsform nach Wunsch, Gefühl, Zweifel, Aufforderung: Quiero que vengas. Espero que estés bien. Bildung: yo-Form ohne -o + „falscher“ Vokal (-ar → -e, -er/-ir → -a): tengo → tenga.',
  ger: '<b>Gerundio</b> – „gerade dabei“ mit estar: Estoy comiendo = Ich esse gerade. -ar → -ando, -er/-ir → -iendo (nach Vokal -yendo: leyendo).',
  part: '<b>Participio</b> – mit haber für das Perfekt (he hablado) und als Adjektiv (la puerta está cerrada). -ar → -ado, -er/-ir → -ido. Unregelmäßig: hecho, dicho, visto, puesto, escrito, abierto, vuelto, muerto, roto.',
  imp: '<b>Imperativo</b> – Befehl, Bitte. tú: wie die él-Form (habla, come) – außer di, haz, ve, pon, sal, sé, ten, ven. usted/ustedes und alle verneinten Formen: Subjuntivo (hable, no hables). Pronomen werden angehängt: ¡Dime! ¡Levántate!',
};

function esMoreHtml(v) {
  const t = esMoreTenses(v);
  if (!t) return '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = s => `<button class="say" data-lang="es" data-say="${esc(s)}">🔊</button>`;
  const TCLS = { imperf: 't-past', perf: 't-past', futs: 't-fut' };
  const block = (k, title, forms) => `
    <tr class="vf-h"><th colspan="2" class="${TCLS[k] || ''}">${title}${info}</th></tr><tr class="vp-rule"><td colspan="2">${ES_TENSE_INFO[k]}</td></tr>
    ${forms.map((f, i) => `<tr><td>${ES_PERSONS[i]}</td><td>${esc(f)}</td></tr>`).join('')}`;
  const IMP = ['tú', 'tú (verneint)', 'usted', 'ustedes'];
  return `<details class="vf-all es-more"><summary>Alle Zeitformen anzeigen</summary><table class="vf-table">
    <tr><td colspan="2" class="vf-note">Presente, Pretérito und Futuro mit ir a stehen in der Tabelle oben.</td></tr>
    ${block('imperf', 'Imperfecto', t.imperf)}
    ${block('perf', 'Pretérito perfecto', t.perf)}
    ${block('futs', 'Futuro simple', t.futs)}
    ${block('cond', 'Condicional', t.cond)}
    ${block('subj', 'Subjuntivo presente', t.subj)}
    <tr class="vf-h"><th colspan="2">Gerundio und Participio${info}</th></tr><tr class="vp-rule"><td colspan="2">${ES_TENSE_INFO.ger}<br>${ES_TENSE_INFO.part}</td></tr>
    <tr><td>Gerundio</td><td>${esc(t.ger)} ${say(t.ger)}</td></tr>
    <tr><td>Participio</td><td>${esc(t.part)}</td></tr>
    ${t.imp ? `<tr class="vf-h"><th colspan="2">Imperativo${info}</th></tr><tr class="vp-rule"><td colspan="2">${ES_TENSE_INFO.imp}</td></tr>
    ${t.imp.map((f, i) => `<tr><td>${IMP[i]}</td><td>${esc(f)} ${say(f)}</td></tr>`).join('')}` : ''}
  </table></details>`;
}

/* ============================================================
   Wiederholungsalgorithmus (vereinfachtes SM-2 wie in Anki)
   grade: 1 = Nochmal, 2 = Schwer, 3 = Gut, 4 = Leicht
   ============================================================ */
function newProgress() {
  return { due: 0, ivl: 0, ease: 2.5, reps: 0, lapses: 0, step: 0 };
}

function schedule(p, grade, now = Date.now()) {
  p = { ...p };
  p.reps++;
  if (p.step >= 0) {
    // Lern-/Neulernphase
    if (grade === 1) {
      p.step = 0;
      p.due = now + LEARN_STEPS[0];
    } else if (grade === 2) {
      p.due = now + Math.round(LEARN_STEPS[p.step] * 1.5);
    } else if (grade === 3) {
      p.step++;
      if (p.step >= LEARN_STEPS.length) {
        p.step = -1;
        p.ivl = Math.max(1, p.ivl || 1);
        p.due = now + p.ivl * DAY;
      } else {
        p.due = now + LEARN_STEPS[p.step];
      }
    } else {
      p.step = -1;
      p.ivl = Math.max(4, p.ivl * 1.5 || 4);
      p.due = now + p.ivl * DAY;
    }
  } else {
    // Wiederholungsphase
    if (grade === 1) {
      p.lapses++;
      p.ease = Math.max(1.3, p.ease - 0.2);
      p.ivl = Math.max(1, p.ivl * 0.5);
      p.step = LEARN_STEPS.length - 1;   // ein Neulernschritt
      p.due = now + RELEARN_STEP;
    } else {
      if (grade === 2) { p.ivl = p.ivl * 1.2; p.ease = Math.max(1.3, p.ease - 0.15); }
      if (grade === 3) { p.ivl = p.ivl * p.ease; }
      if (grade === 4) { p.ivl = p.ivl * p.ease * 1.3; p.ease += 0.15; }
      p.ivl = Math.max(1, Math.round(p.ivl));
      p.due = now + p.ivl * DAY;
    }
  }
  return p;
}

/* ============================================================
   Abfragerichtungen und Warteschlange
   ============================================================ */
// Eine Karte hat zwei feste Seiten: die Lernsprache und die Übersetzungen (alle anderen aktiven Sprachen).
// Abfragerichtung: 'ru' = Lernsprache zuerst, 'tr' = Übersetzungen zuerst, 'mix' = beides.
// (Der Wert heißt aus historischen Gründen 'ru', auch wenn Spanisch die Lernsprache ist.)
const RU = 'ru';

// Lernsprache: Russisch oder Spanisch. Dieselben Karten, beim Spanischlernen ist Spanisch die Vorderseite
// und Russisch steht bei den Übersetzungen. Der Lernfortschritt wird je Lernsprache getrennt gespeichert.
const LEARN_LANGS = {
  ru: { name: 'Russisch', flag: '🇷🇺', title: 'Карточки' },
  es: { name: 'Spanisch', flag: '🇩🇴', title: 'Tarjetas' },
};
const learnLang = () => (db.settings.learn === 'es' ? 'es' : 'ru');
const trLangs = () => activeLangs().filter(l => l.code !== learnLang());
// Schlüssel im Lernfortschritt: Russisch wie bisher „id|ru“, Spanisch „id|es-ru“ / „id|es-tr“
const progKey = (id, q) => (learnLang() === 'es' ? `${id}|es-${q}` : `${id}|${q}`);

function questionLangs() {
  const q = db.settings.qLang;
  return q === 'mix' ? [RU, 'tr'] : [q === 'tr' ? 'tr' : RU];
}

// Abfragbar, wenn es die Lernsprache und mindestens eine aktive Übersetzung gibt.
// Spanisch: Mehrere russische Wörter haben oft dieselbe Übersetzung (z. B. Aspektpaare) – nur die erste Karte zählt.
function canAsk(card) {
  const L = learnLang();
  return !!card.f[L] && trLangs().some(l => card.f[l.code]) && (L === 'ru' || !esDuplicate(card));
}

const esKey = c => (c.f.es || '').toLowerCase().trim();
let esFirst = null, esFirstRev = -1;
function esDuplicate(card) {
  if (esFirstRev !== cardsRev) {
    esFirst = new Map();
    for (const c of allCardsSorted()) if (esKey(c) && !esFirst.has(esKey(c))) esFirst.set(esKey(c), c.id);
    esFirstRev = cardsRev;
  }
  return esFirst.get(esKey(card)) !== card.id;
}

// Zwischenspeicher: alle Karten nach Alter sortiert und je Deck gruppiert (neu berechnet nach markCards)
let cardIndex = null, cardIndexRev = -1;
function buildCardIndex() {
  if (cardIndexRev === cardsRev) return cardIndex;
  const all = Object.values(db.cards).sort((a, b) => a.created - b.created);
  const byDeck = new Map();
  for (const c of all) { if (!byDeck.has(c.deck)) byDeck.set(c.deck, []); byDeck.get(c.deck).push(c); }
  cardIndex = { all, byDeck };
  cardIndexRev = cardsRev;
  return cardIndex;
}
const allCardsSorted = () => buildCardIndex().all;

function deckCards(deckIds) {
  const { all, byDeck } = buildCardIndex();
  // Virtuelle Spanisch-Decks (es-verben-01 …) bestehen aus Karten verschiedener echter Decks
  if (deckIds.some(id => id.startsWith('es-'))) {
    const vd = esVirtualDecks().byId;
    return deckIds.flatMap(id => (vd[id] ? vd[id].ids.map(cid => db.cards[cid]).filter(Boolean) : byDeck.get(id) || []));
  }
  if (deckIds.length === 1) return (byDeck.get(deckIds[0]) || []).slice();
  const set = new Set(deckIds);
  return all.filter(c => set.has(c.deck));
}
// Karten, die in der aktuellen Lernsprache abgefragt werden (für Anzeige und Schreibmodus)
const learnCards = deckIds => deckCards(deckIds).filter(c => canAsk(c));

function deckStats(deckIds) {
  const now = Date.now();
  let fresh = 0, learn = 0, due = 0;
  for (const c of deckCards(deckIds)) {
    for (const q of questionLangs()) {
      if (!canAsk(c, q)) continue;
      const p = db.progress[progKey(c.id, q)];
      if (!p) fresh++;
      else if (p.due <= now + 20 * MIN) (p.step >= 0 ? learn++ : due++);
    }
  }
  return { fresh, learn, due };
}

function buildQueue(deckIds) {
  const now = Date.now();
  const langs = questionLangs();
  const dueItems = [], freshItems = [];
  for (const c of deckCards(deckIds)) {
    for (const q of langs) {
      if (!canAsk(c, q)) continue;
      const key = progKey(c.id, q);
      const p = db.progress[key];
      if (!p) freshItems.push({ id: c.id, q, key, isNew: true });
      else if (p.due <= now + 20 * MIN) dueItems.push({ id: c.id, q, key, isNew: false, due: p.due });
    }
  }
  dueItems.sort((a, b) => a.due - b.due);
  // Im Mischmodus nicht beide Richtungen derselben Karte direkt nacheinander zeigen
  if (langs.length > 1) freshItems.sort((a, b) => langs.indexOf(a.q) - langs.indexOf(b.q));
  const limit = Math.max(0, db.settings.newPerDay - newSeenToday());
  const queue = dueItems.concat(freshItems.slice(0, limit));
  // Neue Karten zwischen die fälligen mischen
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  // Lernkarten (kurze Intervalle) zuerst
  queue.sort((a, b) => (db.progress[a.key]?.step >= 0 ? 0 : 1) - (db.progress[b.key]?.step >= 0 ? 0 : 1));
  return queue;
}

/* ============================================================
   Navigation
   ============================================================ */
let tab = 'learn';
let backHandler = null;

function setHeader(title, onBack) {
  $('#title').textContent = title;
  backHandler = onBack || null;
  $('#back').hidden = !onBack;
  $('#header-extra').innerHTML = '';   // Zusatzinfos (z. B. beim Lernen) setzt die jeweilige Ansicht neu
}

function go(newTab) {
  tab = newTab;
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.body.classList.remove('studying');   // untere Leiste wieder zeigen
  quiz = null;
  drill = null;
  stopStudyKeys();
  if (tab === 'learn') renderLearn();
  if (tab === 'cards') renderCards();
  if (tab === 'rules') renderRules();
  if (tab === 'settings') renderSettings();
  $('#view').scrollTop = 0;
}

/* ============================================================
   Ansicht: Regeln (Inhalte aus rules.js)
   ============================================================ */
// Regeln der aktuellen Lernsprache (Russisch: rules.js, Spanisch: rules-es.js)
const ruleList = () => (learnLang() === 'es' ? RULES_ES : RULES);

function renderRules() {
  setHeader(learnLang() === 'es' ? 'Reglas' : 'Regeln');
  $('#view').innerHTML = `
    <div class="panel">
      ${ruleList().map(r => `
        <div class="row clickable" data-rule="${r.id}">
          <span class="rule-icon">${r.icon}</span>
          <div class="grow"><b>${esc(r.title)}</b><div class="sub">${esc(r.teaser)}</div></div>
          <span class="chev">›</span>
        </div>`).join('')}
    </div>`;
  $$('[data-rule]').forEach(r => r.onclick = () => renderRule(r.dataset.rule));
}

function renderRule(id) {
  const rule = ruleList().find(r => r.id === id);
  if (!rule) return renderRules();
  setHeader(rule.title, () => go('rules'));
  $('#view').innerHTML = `<article class="rule">${rule.html}</article>`;
  // Aussprache der Beispielwörter berechnen und 🔊 aktivieren
  $$('[data-pr]', $('#view')).forEach(el => { const p = ruPron(el.dataset.pr); el.textContent = p ? `[${p}]` : ''; });
  $$('.say', $('#view')).forEach(b => b.onclick = () => speak(b.dataset.say, b.dataset.lang));
  $('#view').scrollTop = 0;
}

/* ============================================================
   Ansicht: Lernen (Deckübersicht)
   ============================================================ */
const DIRECTIONS = ['ru', 'tr', 'mix'];
function dirText(q) {
  const tr = trLangs().map(l => l.code.toUpperCase()).join('/') || '?';
  const L = learnLang().toUpperCase();
  return q === 'mix' ? 'Gemischt' : q === 'tr' ? `${tr} → ${L}` : `${L} → ${tr}`;
}
function dirLabel() { return dirText(db.settings.qLang); }

function dirChips() {
  const opts = DIRECTIONS.map(v => ({ v, t: dirText(v) }));
  return `<div class="chips">${opts.map(o =>
    `<button class="chip ${db.settings.qLang === o.v ? 'active' : ''}" data-dir="${o.v}">${esc(o.t)}</button>`).join('')}</div>`;
}

// Deck-Auswahl in der Übersicht: alle oder nur eine Wortart
const DECK_KINDS = [
  { v: 'all', t: 'Alle', test: () => true },
  { v: 'verben', t: 'Verben', test: id => id.startsWith('verben-') },
  { v: 'nomen', t: 'Nomen', test: id => id.startsWith('nomen-') },
  { v: 'adjektive', t: 'Adjektive', test: id => id.startsWith('adjektive-') },
  { v: 'adverbien', t: 'Adverbien', test: id => id.startsWith('adverbien-') },
  { v: 'praepositionen', t: 'Präpositionen', test: id => id.startsWith('praepositionen-') || id.startsWith('preposiciones-') },
];
// Spanisch-Modus: Decks werden aus allen Karten neu gebildet – je Wortart, sortiert nach spanischer Häufigkeit (es_freq)
const ES_DECK_KINDS = [
  { v: 'all', t: 'Alle', test: () => true },
  { v: 'verben', t: 'Verben', name: 'Verbos', test: id => id.startsWith('es-verben-'), card: c => c.type === 'verbpair' },
  { v: 'nomen', t: 'Nomen', name: 'Sustantivos', test: id => id.startsWith('es-nomen-'), card: c => c.type === 'nounfull' },
  { v: 'adjektive', t: 'Adjektive', name: 'Adjetivos', test: id => id.startsWith('es-adjektive-'), card: c => c.type === 'adjfull' },
  { v: 'adverbien', t: 'Adverbien', name: 'Adverbios', test: id => id.startsWith('es-adverbien-'), card: c => c.type === 'advfull' },
  { v: 'praepositionen', t: 'Präpositionen', name: 'Preposiciones', test: id => id.startsWith('es-praepositionen-'), card: c => c.type === 'prepfull' },
  { v: 'grundwoerter', t: 'Grundwörter', name: 'Palabras básicas', test: id => id.startsWith('es-grundwoerter-'), card: c => c.type === 'word' },
  { v: 'alltag', t: 'Alltag (DR)', name: 'Alltag (DR)', test: id => id.startsWith('es-alltag-'), alltag: true },
];
const deckKinds = () => (learnLang() === 'es' ? ES_DECK_KINDS : DECK_KINDS);
function kindChips() {
  const cur = db.settings.deckKind || 'all';
  return `<div class="chips kind-chips">${deckKinds().map(k =>
    `<button class="chip ${cur === k.v ? 'active' : ''}" data-kind="${k.v}">${k.t}</button>`).join('')}</div>`;
}

// Bibliotheksdecks, deren Karten im Spanisch-Modus vorkommen (russische Präpositionen und das alte Startdeck nicht)
const esRelevantDeck = id => !id.startsWith('praepositionen-') && !id.startsWith('grundwortschatz-');

// Virtuelle Spanisch-Decks (je 50 Karten), zwischengespeichert bis sich Karten ändern
let esVd = null, esVdRev = -1;
function esVirtualDecks() {
  if (esVdRev === cardsRev && esVd) return esVd;
  const cards = allCardsSorted().filter(c => c.f.es && esRelevantDeck(c.deck) && !esDuplicate(c));
  const byId = {}, list = [];
  for (const k of ES_DECK_KINDS.slice(1)) {
    let kc = cards.filter(c => (k.alltag ? c.deck.startsWith('alltag-') : !c.deck.startsWith('alltag-') && k.card(c)));
    if (!k.alltag) kc = kc.map((c, i) => ({ c, i, f: +c.x.es_freq || 0 })).sort((a, b) => b.f - a.f || a.i - b.i).map(o => o.c);
    const n = Math.ceil(kc.length / 50);
    for (let g = 0; g < n; g++) {
      const num = String(g + 1).padStart(2, '0');
      const d = { id: `es-${k.v}-${num}`, name: n > 1 ? `${k.name} ${num}` : k.name, ids: kc.slice(g * 50, g * 50 + 50).map(c => c.id) };
      byId[d.id] = d;
      list.push(d);
    }
  }
  esVd = { byId, list };
  esVdRev = cardsRev;
  return esVd;
}
const deckName = id => (id.startsWith('es-') ? esVirtualDecks().byId[id]?.name : db.decks[id]?.name) || id;

// Umschalter der Lernsprache (oben in der Übersicht)
function learnChips() {
  return `<div class="chips learn-chips">${Object.entries(LEARN_LANGS).map(([code, l]) =>
    `<button class="chip ${learnLang() === code ? 'active' : ''}" data-learn="${code}">${l.flag} ${l.name}</button>`).join('')}</div>`;
}
function setLearnLang(code) {
  db.settings.learn = code;
  ensureLanguage(code);
  save();
}

// Decks nur für eine Lernsprache: russische Präpositionen (Fälle) bzw. spanische Präpositionen und spanische Zusatzdecks
function deckFitsLearn(id) {
  if (id.startsWith('praepositionen-')) return learnLang() === 'ru';
  if (id.startsWith('preposiciones-') || id.startsWith('espanol-') || id.startsWith('alltag-')) return learnLang() === 'es';
  return true;
}

function renderLearn() {
  const es = learnLang() === 'es';
  setHeader(LEARN_LANGS[learnLang()].title);
  const kinds = deckKinds();
  const kind = kinds.find(k => k.v === (db.settings.deckKind || 'all')) || kinds[0];
  const allDecks = es ? esVirtualDecks().list : Object.values(db.decks).filter(d => deckFitsLearn(d.id));
  const decks = allDecks.filter(d => kind.test(d.id));
  const allTitle = kind.v === 'all' ? 'Alle Decks' : 'Alle ' + kind.t;
  const view = $('#view');
  if (!Object.keys(db.decks).length) {
    view.innerHTML = `
      <div class="empty">
        <div style="font-size:48px">${LEARN_LANGS[learnLang()].flag}</div>
        <p>Noch keine Karten vorhanden.</p>
        <button class="btn" id="go-lib">Startdeck aus der Bibliothek laden</button><br>
        <button class="btn secondary" id="go-new">Eigene Karte anlegen</button>
      </div>`;
    $('#go-lib').onclick = () => { go('settings'); setTimeout(() => $('#library')?.scrollIntoView(), 50); };
    $('#go-new').onclick = () => editCard(null);
    return;
  }
  const allIds = decks.map(d => d.id);
  const isVerbDeck = id => /^(es-)?verben-/.test(id);
  const statRow = (s) => `<div class="counts"><span class="c-new">${Math.min(s.fresh, Math.max(0, db.settings.newPerDay - newSeenToday()))}</span><span class="c-learn">${s.learn}</span><span class="c-due">${s.due}</span></div>`;
  const drillBtn = id => `<button class="quiz-btn" data-drill="${esc(id)}" aria-label="Konjugation üben">🔁</button>`;
  // Spanisch: Zusatzdecks (Grundwörter, Alltag …) noch nicht geladen?
  const esMissing = es && !Object.keys(db.decks).some(id => id.startsWith('espanol-'));
  view.innerHTML = `
    <div class="section">
      <h2>Ich lerne</h2>
      ${learnChips()}
    </div>
    <div class="section">
      <h2>Abfragerichtung</h2>
      ${dirChips()}
    </div>
    <div class="section">
      <h2>Decks</h2>
      ${kindChips()}
      ${esMissing ? `<div class="panel"><div class="row"><div class="grow">Spanische Zusatzdecks (Grundwörter, Alltag in der DR …)<div class="sub">noch nicht geladen</div></div><button class="btn small" id="load-es">Laden</button></div></div>` : ''}
      <div class="panel">
        ${decks.length > 1 ? `
          <div class="row clickable" data-study="*">
            <div class="grow"><b>${allTitle}</b></div>${statRow(deckStats(allIds))}
            ${kind.v === 'verben' ? drillBtn('*') : ''}
            <button class="quiz-btn" data-quiz="*" aria-label="Schreiben üben">✍️</button>
          </div>` : ''}
        ${!decks.length ? `<div class="row"><div class="grow sub">Noch keine ${kind.t} geladen</div>${kind.v !== 'all' ? `<button class="btn small" id="load-kind">Laden</button>` : ''}</div>` : ''}
        ${decks.map(d => { const lc = learnCards([d.id]); return { d, n: lc.length, s: lc.filter(c => quizMastered()[c.id]).length }; }).map(({ d, n, s }) => `
          <div class="row clickable" data-study="${esc(d.id)}">
            <div class="grow ellipsis">${esc(d.name)}<div class="sub">${n} ${n === 1 ? "Karte" : "Karten"}${s ? ` · ✍️ ${s} sitzen` : ''}</div></div>
            ${statRow(deckStats([d.id]))}
            ${isVerbDeck(d.id) ? drillBtn(d.id) : ''}
            <button class="quiz-btn" data-quiz="${esc(d.id)}" aria-label="Schreiben üben">✍️</button>
          </div>`).join('')}
      </div>
    </div>
    <p class="sub" style="color:var(--muted);font-size:13px">
      <span class="c-new">Blau</span> = neu (heute noch), <span class="c-learn">Rot</span> = in Lernphase, <span class="c-due">Grün</span> = fällig<br>
      ✍️ = Schreiben üben: immer 5 Wörter, bis jedes ${QUIZ_STREAK}× hintereinander richtig war, dann die nächsten 5 (mit Wiederholungen)<br>
      🔁 = Konjugation üben (bei Verben): Verbform eintippen${es ? '<br>Im Spanisch-Modus sind die Decks nach spanischer Häufigkeit sortiert.' : ''}
    </p>`;
  $$('[data-quiz]', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const id = b.dataset.quiz;
    startQuiz(id === '*' ? allIds : [id], '✍️ ' + (id === '*' ? allTitle : deckName(id)));
  });
  $$('[data-drill]', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const id = b.dataset.drill;
    startDrill(id === '*' ? allIds : [id], '🔁 ' + (id === '*' ? allTitle : deckName(id)));
  });
  $$('[data-dir]', view).forEach(b => b.onclick = () => { db.settings.qLang = b.dataset.dir; save(); renderLearn(); });
  $$('[data-kind]', view).forEach(b => b.onclick = () => { db.settings.deckKind = b.dataset.kind; save(); renderLearn(); });
  $$('[data-learn]', view).forEach(b => b.onclick = () => { setLearnLang(b.dataset.learn); renderLearn(); });
  // Noch nichts von dieser Art geladen: alle passenden Decks aus der Bibliothek holen
  const loadFrom = async (btn, filter, msg) => {
    btn.disabled = true;
    try {
      const list = await (await fetch('decks/index.json', { cache: 'no-cache' })).json();
      for (const entry of list.filter(filter)) await importLibraryDeck(entry);
      toast(msg);
    } catch (err) { toast('Laden nicht möglich (offline?)'); }
    renderLearn();
  };
  const loadBtn = $('#load-kind');
  if (loadBtn) loadBtn.onclick = () => (es
    ? loadFrom(loadBtn, d => esRelevantDeck(d.id) && !db.decks[d.id], 'Spanische Decks geladen')
    : loadFrom(loadBtn, d => kind.test(d.id) && deckFitsLearn(d.id), kind.t + ' geladen'));
  const loadEs = $('#load-es');
  if (loadEs) loadEs.onclick = () => loadFrom(loadEs, d => esRelevantDeck(d.id) && !db.decks[d.id], 'Spanische Decks geladen');
  $$('[data-study]', view).forEach(r => r.onclick = () => {
    const id = r.dataset.study;
    startStudy(id === '*' ? allIds : [id], id === '*' ? allTitle : deckName(id));
  });
}

/* ============================================================
   Ansicht: Abfrage
   ============================================================ */
let study = null;

function startStudy(deckIds, title) {
  study = { deckIds, title, queue: buildQueue(deckIds), current: null, flipped: false, done: 0 };
  document.body.classList.add('studying');   // beim Lernen keine untere Leiste – mehr Platz für die Karte
  setHeader(title, () => { study = null; go('learn'); });
  startStudyKeys();
  nextCard();
}

function nextCard() {
  study.current = study.queue.shift() || null;
  study.flipped = false;
  study.seenBack = false;
  renderStudy();
}

// Kurzerklärungen der Fälle (erscheinen hinter ⓘ bei „Fälle:“, nur für die Fälle im Satz)
const CASE_INFO = {
  Nominativ: 'Wer? Was? – Subjekt des Satzes, Grundform aus dem Wörterbuch.',
  Genitiv: 'Wessen? Wovon? – Besitz (дом отца́), nach Mengen und Zahlen (мно́го, два, пять), nach Verneinung (нет вре́мени) und nach у, без, до, из, от, по́сле, для, с (= von … weg).',
  Dativ: 'Wem? – Empfänger (дать кому́), Gefühle und Alter (мне хо́лодно, мне нра́вится), nach к (zu jemandem) und по (entlang, per).',
  Akkusativ: 'Wen? Was? – direktes Objekt; Richtung „wohin?“ nach в / на; Zeitangaben (в пя́тницу, всю ночь); nach за, че́рез. Belebte männliche Wörter sehen aus wie der Genitiv (ви́жу бра́та).',
  Instrumental: 'Womit? Mit wem? Als was? – Werkzeug (писа́ть ру́чкой), с = zusammen mit, nach стать / быть / рабо́тать (als …), занима́ться, интересова́ться; Ort nach за, под, над, пе́ред, ме́жду.',
  'Präpositiv': 'Wo? Worüber? – steht nur mit Präposition: в / на (wo?), о / об (über etwas sprechen, denken).',
};
// Bewegungsverb mit Vorsilbe: Vorsilbe + Grundverb erklären, Beispiele mit genau diesem Verb (unvollendet und vollendet)
const MOTION_ROOTS = [
  [/ходить$/, '-ходи́ть / -йти́', 'gehen (zu Fuß)'],
  [/езжать$/, '-езжа́ть / -е́хать', 'fahren'],
  [/водить$/, '-води́ть / -вести́', 'führen (jemanden zu Fuß)'],
  [/носить$/, '-носи́ть / -нести́', 'tragen'],
  [/возить$/, '-вози́ть / -везти́', 'bringen (mit Fahrzeug)'],
  [/летать$/, '-лета́ть / -лете́ть', 'fliegen'],
  [/бегать$/, '-бега́ть / -бежа́ть', 'laufen, rennen'],
];
function motionPrefixHtml(x) {
  const root = MOTION_ROOTS.find(([re]) => re.test((x.ipf || '').replace(STRESS, '')));
  const say = t => `<button class="say" data-say="${esc(t)}">🔊</button>`;
  const ex = (ru, de, label) => ru ? `<div class="nn-ex"><i>${label}:</i> ${esc(ru)} ${say(ru)}<div class="pron nn-ex-pron">[${esc(ruPron(ru))}]</div>${de ? `<details class="nn-ex-de"><summary>Übersetzung anzeigen</summary>${esc(de)}</details>` : ''}</div>` : '';
  return `<div class="motion-prefix"><b>${esc(x.motion_prefix)}</b> = ${esc(x.motion_meaning || '')}${root ? ` &nbsp;+&nbsp; <b>${root[1]}</b> = ${root[2]}` : ''}</div>
    <div>Also: <b>${esc(x.ipf)}</b> / <b>${esc(x.pf || '')}</b> = ${esc(x.motion_meaning || '')}${root ? ` (${root[2]})` : ''}</div>
    ${ex(x.motion_ex_ipf, x.motion_ex_ipf_de, 'unvollendet (wiederholt, gerade dabei)')}
    ${ex(x.motion_ex_pf, x.motion_ex_pf_de, 'vollendet (einmal, mit Ergebnis)')}
    <hr class="motion-sep">`;
}
// Erklärung der Verben der Bewegung (hinter ⓘ bei Bewegungsverben)
const MOTION_INFO = `
  <div>Bewegungsverben gibt es paarweise, <b>beide unvollendet</b>:</div>
  <div>• <b>Eine Richtung</b>, gerade unterwegs (идти́, е́хать): Я иду́ домо́й. – Ich bin auf dem Weg nach Hause.</div>
  <div>• <b>Mehrere Richtungen</b>, hin und zurück, regelmäßig oder allgemein (ходи́ть, е́здить): Я хожу́ в шко́лу. – Ich gehe (regelmäßig) zur Schule. Вчера́ я ходи́л в кино́. – Ich war gestern im Kino (hin und zurück).</div>
  <div>• <b>по-</b> + Richtungsverb = vollendet, „losgehen, losfahren“: пойти́, пое́хать.</div>
  <div>• <b>Andere Vorsilben</b> (при-, у-, вы-, в-, пере-, до- …) machen daraus normale Aspektpaare: приходи́ть / прийти́ = ankommen, уходи́ть / уйти́ = weggehen.</div>
  <div>• Zu Fuß: идти́ / ходи́ть · mit Fahrzeug: е́хать / е́здить · tragen: нести́ / носи́ть, mit Fahrzeug bringen: везти́ / вози́ть · führen: вести́ / води́ть.</div>`;

function caseInfoHtml(cases) {
  const found = Object.keys(CASE_INFO).filter(name => cases.includes(name));
  return found.map(name => `<div><b>${name}:</b> ${esc(CASE_INFO[name])}</div>`).join('');
}

/* ============================================================
   Konjugation für Verben, deren Infinitiv sie nicht verrät (-ти, -чь, -сть, -зть).
   Alle sechs Formen werden aus я- und ты-Form abgeleitet (inkl. Betonungs- und Stammwechsel).
   ============================================================ */
const CONJ_HIDDEN = /(ти|тись|чь|чься|сть|сться|зть)$/;
const CONJ_IRREGULAR = {
  'есть': ['ем', 'ешь', 'ест', 'еди́м', 'еди́те', 'едя́т'],
  'съесть': ['съем', 'съешь', 'съест', 'съеди́м', 'съеди́те', 'съедя́т'],
  'надоесть': ['надое́м', 'надое́шь', 'надое́ст', 'надоеди́м', 'надоеди́те', 'надоедя́т'],
};
const CONJ_INFO = `
  <div>Bei Infinitiven auf <b>-ти, -чь, -сть, -зть</b> sieht man nicht, wie das Verb konjugiert wird.</div>
  <div>Sie gehören zur <b>1. Konjugation (е-Konjugation)</b>: -у/-ю, -ешь/-ёшь, -ет, -ем, -ете, -ут/-ют. Ist die Endung betont, steht ё: идёшь, идёт.</div>
  <div>Den <b>Stamm</b> nimmt man aus der я-Form: идти́ → иду́ → ид-, класть → кладу́ → клад-.</div>
  <div>Bei <b>-чь</b> wechselt der Stamm: г/к in der я- und они-Form, ж/ч in den anderen (могу́ – мо́жешь – мо́гут).</div>
  <div>Bei vollendeten Verben sind diese Formen <b>Zukunft</b>.</div>`;

function ruVowelCount(s) { return (s.replace(STRESS, '').match(/[аеёиоуыэюя]/g) || []).length; }

// Betonung auf den n-ten Vokal (0-basiert) setzen
function stressVowel(stem, n) {
  let i = -1;
  return stem.replace(STRESS, '').replace(/[аеиоуыэюя]/g, v => (++i === n ? v + '́' : v));
}

// [я, ты, он, мы, вы, они] aus я- und ты-Form der 1. Konjugation
function ruPresentForms(ya, ty) {
  const refl = /(сь|ся)$/.test(ya);
  const cut = s => s.replace(/(сь|ся)$/, '');
  const y = cut(ya), t = cut(ty);
  const m = t.match(/^(.*?)([её])(́?)шь$/);
  if (!m || !/[ую]́?$/.test(y)) return null;
  const tStem = m[1];
  const endStressedTy = m[2] === 'ё' || m[3] === '́';
  const yStem = y.replace(/[ую]́?$/, '');
  const u = /ю́?$/.test(y) ? 'ю' : 'у';
  const endStressedYa = /[ую]́$/.test(y) || ruVowelCount(y) === 1;
  const plainT = tStem.replace(STRESS, '');
  const mid = endStressedTy
    ? [plainT + 'ёт', plainT + 'ём', plainT + 'ёте']
    : [tStem + 'ет', tStem + 'ем', tStem + 'ете'];
  let they;
  if (endStressedYa && endStressedTy) they = yStem.replace(STRESS, '') + u + '́т';
  else if (endStressedYa) {
    // Betonung springt wie in der ты-Form auf den Stamm: могу́ – мо́жешь – мо́гут
    const pos = tStem.indexOf('́');
    they = pos < 0 ? yStem + u + 'т' : stressVowel(yStem, ruVowelCount(tStem.slice(0, pos)) - 1) + u + 'т';
  } else they = yStem + u + 'т';
  const fix = s => (ruVowelCount(s) === 1 ? s.replace(STRESS, '') : s);
  const forms = [y, t, ...mid, fix(they)];
  return refl ? forms.map((f, i) => (i < 2 ? [ya, ty][i] : f + (/[аеёиоуыэюя]$/.test(f) ? 'сь' : 'ся'))) : forms;
}

// 2. Konjugation (и-Konjugation): говорю́, говори́шь → говори́т, говори́м, говори́те, говоря́т
function ruPresentForms2(ya, ty) {
  const refl = /(сь|ся)$/.test(ya);
  const cut = s => s.replace(/(сь|ся)$/, '');
  const y = cut(ya), t = cut(ty);
  const m = t.match(/^(.*?)и(́?)шь$/);
  if (!m) return null;
  const tStem = m[1], plainT = tStem.replace(STRESS, '');
  const endStressed = !!m[2] || ruVowelCount(t) === 1;      // спишь: einsilbig, Endung betont
  const theyEnd = /[жшчщ]$/.test(plainT) ? 'ат' : 'ят';
  const fix = s => (ruVowelCount(s) === 1 ? s.replace(STRESS, '') : s);
  const forms = endStressed
    ? [y, t, plainT + 'и́т', plainT + 'и́м', plainT + 'и́те', plainT + theyEnd[0] + '́' + theyEnd[1]].map(fix)
    : [y, t, tStem + 'ит', tStem + 'им', tStem + 'ите', tStem + theyEnd];
  return refl ? forms.map((f, i) => (i < 2 ? [ya, ty][i] : f + (/[аеёиоуыэюя]$/.test(f) ? 'сь' : 'ся'))) : forms;
}

// Alle sechs Präsens- bzw. Futurformen (я, ты, он, мы, вы, они) oder null
function ruAllPresent(inf, ya, ty) {
  if (!inf || !ya || !ty || ya === '—' || ty === '—') return null;
  const plain = inf.replace(STRESS, '');
  if (CONJ_IRREGULAR[plain]) return CONJ_IRREGULAR[plain];
  const prefix = (word, end) => word.slice(0, word.length - end.length);
  const withPrefix = (p, forms) => (/́/.test(p) ? forms.map(f => p + f.replace(STRESS, '')) : forms.map(f => p + f))
    .map(f => (ruVowelCount(f) === 1 ? f.replace(STRESS, '') : f));
  let m;
  if ((m = ya.match(/^(.*)да́?м$/)) && /дать$/.test(plain)) return withPrefix(m[1], ['да́м', 'да́шь', 'да́ст', 'дади́м', 'дади́те', 'даду́т']);
  if ((m = ya.match(/^(.*)бегу́$/))) return withPrefix(m[1], ['бегу́', 'бежи́шь', 'бежи́т', 'бежи́м', 'бежи́те', 'бегу́т']);
  if ((m = ya.match(/^(.*)хочу́$/))) return withPrefix(m[1], ['хочу́', 'хо́чешь', 'хо́чет', 'хоти́м', 'хоти́те', 'хотя́т']);
  const forms = /и́?шь(ся)?$/.test(ty) ? ruPresentForms2(ya, ty) : ruPresentForms(ya, ty);
  // сни́тся, бью́тся: durch -ся zweisilbig gewordene Formen bekommen den Akzent auf den Stamm
  return forms && forms.map(f => (ruVowelCount(f) > 1 && !/[́ё]/.test(f) ? f.replace(/[аеиоуыэюя]/, v => v + "́") : f));
}

// Vergangenheit (m, f, n, Pl.): regelmäßig Stamm + л, -ла, -ло, -ли; Ausnahmen in RU_PAST_IRREG
const RU_PAST_IRREG = Object.fromEntries(`
быть:был,была́,бы́ло,бы́ли|жить:жил,жила́,жи́ло,жи́ли|пить:пил,пила́,пи́ло,пи́ли|дать:дал,дала́,да́ло,да́ли|брать:брал,брала́,бра́ло,бра́ли
браться:бра́лся,брала́сь,бра́лось,бра́лись|взять:взял,взяла́,взя́ло,взя́ли|взяться:взя́лся,взяла́сь,взяло́сь,взяли́сь|ждать:ждал,ждала́,жда́ло,жда́ли
спать:спал,спала́,спа́ло,спа́ли|звать:звал,звала́,зва́ло,зва́ли|лить:лил,лила́,ли́ло,ли́ли|рвать:рвал,рвала́,рва́ло,рва́ли|врать:врал,врала́,вра́ло,вра́ли
гнать:гнал,гнала́,гна́ло,гна́ли|плыть:плыл,плыла́,плы́ло,плы́ли|воспринять:воспри́нял,восприняла́,воспри́няло,воспри́няли
добраться:добра́лся,добрала́сь,добрало́сь,добрали́сь|догнать:догна́л,догнала́,догна́ло,догна́ли|дождаться:дожда́лся,дождала́сь,дождало́сь,дождали́сь
забрать:забра́л,забрала́,забра́ло,забра́ли|задать:за́дал,задала́,за́дало,за́дали|занять:за́нял,заняла́,за́няло,за́няли|заняться:заня́лся,заняла́сь,заняло́сь,заняли́сь
избрать:избра́л,избрала́,избра́ло,избра́ли|издать:изда́л,издала́,изда́ло,изда́ли|набрать:набра́л,набрала́,набра́ло,набра́ли|назвать:назва́л,назвала́,назва́ло,назва́ли
налить:на́лил,налила́,на́лило,на́лили|нанять:на́нял,наняла́,на́няло,на́няли|начать:на́чал,начала́,на́чало,на́чали|начаться:начался́,начала́сь,начало́сь,начали́сь
обнять:о́бнял,обняла́,о́бняло,о́бняли|отдать:о́тдал,отдала́,о́тдало,о́тдали|отобрать:отобра́л,отобрала́,отобра́ло,отобра́ли|отозваться:отозва́лся,отозвала́сь,отозвало́сь,отозвали́сь
оторвать:оторва́л,оторвала́,оторва́ло,оторва́ли|передать:пе́редал,передала́,пе́редало,пе́редали|пережить:пережи́л,пережила́,пережи́ло,пережи́ли|погнать:погна́л,погнала́,погна́ло,погна́ли
подать:по́дал,подала́,по́дало,по́дали|поднять:по́днял,подняла́,по́дняло,по́дняли|подняться:подня́лся,подняла́сь,подняло́сь,подняли́сь|подобрать:подобра́л,подобрала́,подобра́ло,подобра́ли
подождать:подожда́л,подождала́,подожда́ло,подожда́ли|позвать:позва́л,позвала́,позва́ло,позва́ли|полить:по́лил,полила́,по́лило,по́лили|понять:по́нял,поняла́,по́няло,по́няли
поплыть:поплы́л,поплыла́,поплы́ло,поплы́ли|порвать:порва́л,порвала́,порва́ло,порва́ли|поспать:поспа́л,поспала́,поспа́ло,поспа́ли|прервать:прерва́л,прервала́,прерва́ло,прерва́ли
прибыть:при́был,прибыла́,при́было,при́были|придать:при́дал,придала́,при́дало,при́дали|призвать:призва́л,призвала́,призва́ло,призва́ли|принять:при́нял,приняла́,при́няло,при́няли
приняться:приня́лся,приняла́сь,приняло́сь,приняли́сь|продать:про́дал,продала́,про́дало,про́дали|прожить:про́жил,прожила́,про́жило,про́жили|пролить:про́лил,пролила́,про́лило,про́лили
раздать:разда́л,раздала́,разда́ло,разда́ли|разобрать:разобра́л,разобрала́,разобра́ло,разобра́ли|разобраться:разобра́лся,разобрала́сь,разобрало́сь,разобрали́сь
сдать:сдал,сдала́,сда́ло,сда́ли|снять:снял,сняла́,сня́ло,сня́ли|собрать:собра́л,собрала́,собра́ло,собра́ли|собраться:собра́лся,собрала́сь,собрало́сь,собрали́сь
соврать:совра́л,соврала́,совра́ло,совра́ли|создать:со́здал,создала́,со́здало,со́здали|убрать:убра́л,убрала́,убра́ло,убра́ли|удаться:уда́лся,удала́сь,удало́сь,удали́сь
раздаться:разда́лся,раздала́сь,раздало́сь,раздали́сь|ошибиться:оши́бся,оши́блась,оши́блось,оши́блись
идти:шёл,шла,шло,шли|пойти:пошёл,пошла́,пошло́,пошли́|прийти:пришёл,пришла́,пришло́,пришли́|прийтись:пришёлся,пришла́сь,пришло́сь,пришли́сь|выйти:вы́шел,вы́шла,вы́шло,вы́шли
уйти:ушёл,ушла́,ушло́,ушли́|войти:вошёл,вошла́,вошло́,вошли́|найти:нашёл,нашла́,нашло́,нашли́|найтись:нашёлся,нашла́сь,нашло́сь,нашли́сь|пройти:прошёл,прошла́,прошло́,прошли́
зайти:зашёл,зашла́,зашло́,зашли́|подойти:подошёл,подошла́,подошло́,подошли́|отойти:отошёл,отошла́,отошло́,отошли́|перейти:перешёл,перешла́,перешло́,перешли́|дойти:дошёл,дошла́,дошло́,дошли́
сойти:сошёл,сошла́,сошло́,сошли́|обойти:обошёл,обошла́,обошло́,обошли́|обойтись:обошёлся,обошла́сь,обошло́сь,обошли́сь|разойтись:разошёлся,разошла́сь,разошло́сь,разошли́сь|произойти:произошёл,произошла́,произошло́,произошли́
нести:нёс,несла́,несло́,несли́|принести:принёс,принесла́,принесло́,принесли́|внести:внёс,внесла́,внесло́,внесли́|вынести:вы́нес,вы́несла,вы́несло,вы́несли|отнести:отнёс,отнесла́,отнесло́,отнесли́
отнестись:отнёсся,отнесла́сь,отнесло́сь,отнесли́сь|перенести:перенёс,перенесла́,перенесло́,перенесли́|нанести:нанёс,нанесла́,нанесло́,нанесли́|унести:унёс,унесла́,унесло́,унесли́|понести:понёс,понесла́,понесло́,понесли́
произнести:произнёс,произнесла́,произнесло́,произнесли́|вести:вёл,вела́,вело́,вели́|ввести:ввёл,ввела́,ввело́,ввели́|вывести:вы́вел,вы́вела,вы́вело,вы́вели|довести:довёл,довела́,довело́,довели́
завести:завёл,завела́,завело́,завели́|отвести:отвёл,отвела́,отвело́,отвели́|перевести:перевёл,перевела́,перевело́,перевели́|повести:повёл,повела́,повело́,повели́|подвести:подвёл,подвела́,подвело́,подвели́
привести:привёл,привела́,привело́,привели́|провести:провёл,провела́,провело́,провели́|произвести:произвёл,произвела́,произвело́,произвели́|развести:развёл,развела́,развело́,развели́|развестись:развёлся,развела́сь,развело́сь,развели́сь
свести:свёл,свела́,свело́,свели́|везти:вёз,везла́,везло́,везли́|отвезти:отвёз,отвезла́,отвезло́,отвезли́|повезти:повёз,повезла́,повезло́,повезли́|привезти:привёз,привезла́,привезло́,привезли́
брести:брёл,брела́,брело́,брели́|побрести:побрёл,побрела́,побрело́,побрели́|ползти:полз,ползла́,ползло́,ползли́|поползти:попо́лз,поползла́,поползло́,поползли́|лезть:лез,ле́зла,ле́зло,ле́зли|полезть:поле́з,поле́зла,поле́зло,поле́зли
расти:рос,росла́,росло́,росли́|вырасти:вы́рос,вы́росла,вы́росло,вы́росли|возрасти:возро́с,возросла́,возросло́,возросли́|спасти:спас,спасла́,спасло́,спасли́|потрясти:потря́с,потрясла́,потрясло́,потрясли́
цвести:цвёл,цвела́,цвело́,цвели́|расцвести:расцвёл,расцвела́,расцвело́,расцвели́|изобрести:изобрёл,изобрела́,изобрело́,изобрели́|приобрести:приобрёл,приобрела́,приобрело́,приобрели́
учесть:учёл,учла́,учло́,учли́|предпочесть:предпочёл,предпочла́,предпочло́,предпочли́|мочь:мог,могла́,могло́,могли́|смочь:смог,смогла́,смогло́,смогли́|помочь:помо́г,помогла́,помогло́,помогли́
лечь:лёг,легла́,легло́,легли́|течь:тёк,текла́,текло́,текли́|достичь:дости́г,дости́гла,дости́гло,дости́гли|привлечь:привлёк,привлекла́,привлекло́,привлекли́|отвлечь:отвлёк,отвлекла́,отвлекло́,отвлекли́
увлечься:увлёкся,увлекла́сь,увлекло́сь,увлекли́сь|зажечь:зажёг,зажгла́,зажгло́,зажгли́|есть:ел,е́ла,е́ло,е́ли|съесть:съел,съе́ла,съе́ло,съе́ли|надоесть:надое́л,надое́ла,надое́ло,надое́ли
сесть:сел,се́ла,се́ло,се́ли|присесть:присе́л,присе́ла,присе́ло,присе́ли|класть:клал,кла́ла,кла́ло,кла́ли|красть:крал,кра́ла,кра́ло,кра́ли|украсть:укра́л,укра́ла,укра́ло,укра́ли
упасть:упа́л,упа́ла,упа́ло,упа́ли|попасть:попа́л,попа́ла,попа́ло,попа́ли|пропасть:пропа́л,пропа́ла,пропа́ло,пропа́ли|напасть:напа́л,напа́ла,напа́ло,напа́ли|совпасть:совпа́л,совпа́ла,совпа́ло,совпа́ли
выпасть:вы́пал,вы́пала,вы́пало,вы́пали|умереть:у́мер,умерла́,у́мерло,у́мерли|замереть:за́мер,замерла́,за́мерло,за́мерли|запереть:за́пер,заперла́,за́перло,за́перли|вытереть:вы́тер,вы́терла,вы́терло,вы́терли
опереться:опёрся,оперла́сь,оперло́сь,оперли́сь|исчезнуть:исче́з,исче́зла,исче́зло,исче́зли|возникнуть:возни́к,возни́кла,возни́кло,возни́кли|привыкнуть:привы́к,привы́кла,привы́кло,привы́кли
погибнуть:поги́б,поги́бла,поги́бло,поги́бли|мёрзнуть:мёрз,мёрзла,мёрзло,мёрзли|замёрзнуть:замёрз,замёрзла,замёрзло,замёрзли|пахнуть:пах,па́хла,па́хло,па́хли`
  .trim().split(/[|\n]/).map(s => s.split(':')).map(([k, v]) => [k.trim(), v.split(',')]));

function ruPastForms(inf) {
  if (!inf) return null;
  const plain = inf.replace(STRESS, '').replace(/ё/g, 'е');
  if (RU_PAST_IRREG[plain] || RU_PAST_IRREG[inf.replace(STRESS, '')]) return RU_PAST_IRREG[plain] || RU_PAST_IRREG[inf.replace(STRESS, '')];
  const refl = /(ся|сь)$/.test(inf);
  const base = inf.replace(/(ся|сь)$/, '');
  if (!/ть$/.test(base)) return null;                           // -ти, -чь, -сть ohne Eintrag: lieber nichts zeigen
  const stem = base.slice(0, -2);
  const stressed = s => (ruVowelCount(s) > 1 && !/[́ё]/.test(s) ? s.replace(/[аеиоуыэюя]/, v => v + '́') : s);
  const forms = ['л', 'ла', 'ло', 'ли'].map(e => stressed(stem + e));
  return refl ? forms.map((f, i) => f + (i === 0 ? 'ся' : 'сь')) : forms;
}

// Welche Konjugation? 1. (е-Konjugation), 2. (и-Konjugation) oder unregelmäßig
function ruConjType(inf, ya, ty) {
  const plain = (inf || '').replace(STRESS, '');
  if (CONJ_IRREGULAR[plain] || /дать$/.test(plain) && /да́?м$/.test(ya)) return 'unregelmäßig';
  if (/бегу́$|хочу́$/.test(ya)) return 'gemischt (1. und 2. Konjugation)';
  if (/и́?шь(ся)?$/.test(ty)) return '2. Konjugation (и: -ишь, -ит, -им, -ите, -ат/-ят)';
  return '1. Konjugation (е: -ешь, -ет, -ем, -ете, -ут/-ют)';
}

// Ausklappbare Tabelle mit allen Formen eines Aspekts (Präsens/Futur, Vergangenheit, Imperativ)
function allFormsHtml(x, p, imp) {
  const pres = ruAllPresent(x[p], x[p + '_1'], x[p + '_2']);
  const past = ruPastForms(x[p]);
  if (!pres && !past) return '';
  const say = list => `<button class="say" data-say="${esc(list.filter(Boolean).join(', '))}">🔊</button>`;
  const PERS = ['я', 'ты', 'он/она́', 'мы', 'вы', 'они́'];
  const isByt = x[p].replace(STRESS, '') === 'быть';            // бу́ду, бу́дешь … sind Zukunft
  const tense = p === 'pf' || isByt ? 'Zukunft' : 'Gegenwart';
  const rows = [];
  if (pres) rows.push(`<tr><td colspan="2" class="vf-conj">${esc(ruConjType(x[p], x[p + '_1'], x[p + '_2']))}</td></tr>`);
  if (pres) rows.push(`<tr><th colspan="2" class="${tense === 'Zukunft' ? 't-fut' : ''}">${tense} ${say(pres)}</th></tr>` + PERS.map((pr, i) => `<tr><td>${pr}</td><td>${esc(pres[i])}</td></tr>`).join(''));
  if (p === 'ipf' && pres && !isByt) rows.push(`<tr><td colspan="2" class="vf-note"><span class="t-fut">Zukunft:</span> бу́ду / бу́дешь … + ${esc(x[p])}</td></tr>`);
  if (past) rows.push(`<tr><th colspan="2" class="t-past">Vergangenheit ${say(past)}</th></tr>` + ['он', 'она́', 'оно́', 'они́'].map((pr, i) => `<tr><td>${pr}</td><td>${esc(past[i])}</td></tr>`).join(''));
  if (imp && imp !== '—') rows.push(`<tr><th colspan="2">Imperativ</th></tr><tr><td>ты</td><td>${esc(imp)}!</td></tr><tr><td>вы</td><td>${esc(ruImperativePlural(imp))}!</td></tr>`);
  return `<details class="vf-all"><summary>Alle Formen anzeigen</summary><table class="vf-table">${rows.join('')}</table></details>`;
}

function conjugationHtml(card) {
  const x = card.x;
  if (card.type !== 'verbpair') return '';
  const items = [];
  for (const p of ['ipf', 'pf']) {
    if (!x[p] || (p === 'pf' && x.pf === x.ipf)) continue;
    const plain = x[p].replace(STRESS, '');
    if (!CONJ_HIDDEN.test(plain)) continue;
    const irregular = CONJ_IRREGULAR[plain];
    const forms = irregular || ruPresentForms(x[p + '_1'] || '', x[p + '_2'] || '');
    if (!forms) continue;
    const kind = irregular ? 'unregelmäßig' : '1. Konjugation (е-Konjugation)';
    const tense = p === 'pf' ? 'Zukunft' : 'Gegenwart';
    const rows = ['я', 'ты', 'он/она́', 'мы', 'вы', 'они́'].map((pr, i) => `<span><i>${pr}</i> ${esc(forms[i])}</span>`).join('');
    items.push(`<div class="conj-ru-item"><b>${esc(x[p])}</b> – ${kind} · <span class="${p === 'pf' ? 't-fut' : ''}">${tense}</span><div class="conj-ru-forms">${rows}</div></div>`);
  }
  if (!items.length) return '';
  return `<div class="conj-ru">
    <div class="conj-ru-head">Konjugation <small>(am Infinitiv nicht erkennbar)</small> <button class="info" aria-label="Erklärung anzeigen">ⓘ</button></div>
    <div class="vp-rule">${CONJ_INFO}</div>
    ${items.join('')}
  </div>`;
}

/* ============================================================
   Nomen: Geschlecht (Farbe), Grundformen, Beispielsatz und Deklinationstabelle.
   Die Formen stehen in x.sg / x.pl als „Nom|Gen|Dat|Akk|Ins|Präp“.
   ============================================================ */
const NOUN_GENDER = {
  m: { label: '♂ männlich', cls: 'm' },
  f: { label: '♀ weiblich', cls: 'f' },
  n: { label: '⚲ sächlich', cls: 'n' },
  pl: { label: 'nur Plural', cls: 'pl' },
};
const NOUN_CASES = [
  ['Nom.', 'wer? was?'], ['Gen.', 'wessen? von wem?'], ['Dat.', 'wem?'],
  ['Akk.', 'wen? was?'], ['Ins.', 'mit wem? womit?'], ['Präp.', 'über wen? wo?'],
];
const ANIM_INFO = 'Belebt = Menschen und Tiere. Dann sieht der Akkusativ aus wie der Genitiv – bei männlichen Wörtern im Singular und bei allen Wörtern im Plural: Я ви́жу бра́та. Я ви́жу друзе́й. (Aber unbelebt: Я ви́жу стол.)';
const nounForms = s => (s || '').split('|').map(f => f.trim());

/* Alle 12 Formen eines Nomens: entweder vollständig aus x.sg / x.pl („Nom|Gen|Dat|Akk|Ins|Präp“)
   oder berechnet aus Nom. Sg. + x.gen (Gen. Sg.) + x.npl / x.gpl / x.dpl (Nom./Gen./Dat. Pl.).
   Einzelne Ausnahmen: x.dat, x.akk, x.ins, x.prp (Singular), x.ipl (Ins. Pl.). */
function nounDecl(x, nom) {
  if (x.indecl) return { sg: Array(6).fill(nom), pl: [] };
  let sg = x.sg ? nounForms(x.sg) : null, pl = x.pl ? nounForms(x.pl) : null;
  if (!sg && x.gender !== 'pl' && x.gen) sg = nounSingular(x, nom);
  if (!pl && x.npl && x.gpl && x.dpl) {
    // дням → дня́ми: aus einer einsilbigen Form wird eine zweisilbige, Betonung auf den Stamm
    const stressStem = w => /[́ё]/.test(w) || (w.match(/[аеиоуыэюя]/g) || []).length < 2 ? w : w.replace(/[аеиоуыэюя]/, v => v + '́');
    pl = [x.npl, x.gpl, x.dpl, x.anim ? x.gpl : x.npl, x.ipl || stressStem(x.dpl.replace(/м$/, 'ми')), x.dpl.replace(/м$/, 'х')];
  }
  return { sg: sg || [], pl: pl || [] };
}

// Endung anhängen; bei Endbetonung bekommt der erste Vokal der Endung den Akzent, einsilbige Wörter keinen
function nounEnd(stem, ending, stressed) {
  const e = stressed && !/ё/.test(ending) ? ending.replace(/[аеиоуыэюя]/, v => v + '́') : ending;
  const w = stem + e;
  return (w.replace(STRESS, '').match(/[аеёиоуыэюя]/g) || []).length <= 1 ? w.replace(STRESS, '') : w;
}

function nounSingular(x, nom) {
  const m = x.gen.match(/^(.*?)([аяыи])(́?)$/);
  if (!m) return null;
  const [, stem, gEnd, acc] = m;
  const plainNom = nom.replace(STRESS, '');
  const endStressed = !!acc || !/[́ё]/.test(stem);           // дня, стола́, руки́ → Endung betont
  const E = ending => nounEnd(stem, ending, endStressed);
  const sib = /[жшчщц]$/.test(stem);
  let dat, akk, ins, prep;
  if (/мя$/.test(plainNom)) {                                  // вре́мя – вре́мени – вре́менем
    dat = prep = x.gen; akk = nom; ins = E('ем');
  } else if (/[ая]$/.test(plainNom)) {                         // кни́га, неде́ля, исто́рия, па́па
    const soft = /я$/.test(plainNom);
    dat = prep = E(/ия$/.test(plainNom) ? 'и' : 'е');
    akk = E(soft ? 'ю' : 'у');
    ins = soft ? E(endStressed ? 'ёй' : 'ей') : sib && !endStressed ? E('ей') : E('ой');
  } else if (x.gender === 'f') {                               // ночь – но́чи – но́чью
    dat = prep = x.gen; akk = nom;
    ins = (/[́ё]/.test(nom) ? nom : nom.replace(/[аеиоуыэюя]/, v => v + '́')) + 'ю';
  } else {                                                     // стол, слу́чай, гость, сло́во, мо́ре, зда́ние
    const soft = gEnd === 'я';
    dat = E(soft ? 'ю' : 'у');
    ins = soft ? E(endStressed ? 'ём' : 'ем') : sib && !endStressed ? E('ем') : E('ом');
    prep = E(/и[йе]$/.test(plainNom) ? 'и' : 'е');
    akk = x.gender === 'm' && x.anim ? x.gen : nom;
  }
  return [nom, x.gen, x.dat || dat, x.akk || akk, x.ins || ins, x.prp || prep];
}

// Typische Verbindung je Fall, wenn es keine eigenen Beispielsätze gibt (immer grammatisch passend)
const NOUN_FRAMES = [
  [f => `Э́то ${f}.`, 'Э́то = Das ist …'],
  [f => `без ${f}`, 'без + Genitiv = ohne'],
  [f => `${/^(вс|вт|мн|дн|сн|льд|рт)/.test(f) ? 'ко' : 'к'} ${f}`, 'к + Dativ = zu'],
  [f => `про ${f}`, 'про + Akkusativ = über'],
  [f => `${/^([сзшжщ][бвгджзклмнпрстфхцчшщ]|мн|вс|вт|льд)/.test(f) ? 'со' : 'с'} ${f}`, 'с + Instrumental = mit'],
  [f => `${/^[аоуэи]/.test(f.replace(STRESS, '')) ? 'об' : 'о'} ${f}`, 'о + Präpositiv = über'],
];
const nounFrames = forms => forms.length ? NOUN_FRAMES.map(([ru, de], i) => forms[i] ? { ru: ru(forms[i]), de } : null) : [];

// Deklinationsmuster aus Geschlecht und Endung
function nounPattern(x, word) {
  const w = (word || '').replace(STRESS, '');
  if (x.indecl) return 'unveränderlich – alle Fälle gleich';
  if (x.gender === 'pl') return 'nur Plural';
  if (/мя$/.test(w)) return 'sächlich auf -мя (Sonderform wie и́мя)';
  if (/[ая]$/.test(w)) return x.gender === 'm' ? 'auf -а/-я, aber männlich (Endungen wie кни́га)' : 'weiblich auf -а/-я (wie кни́га)';
  if (x.gender === 'f') return 'weiblich auf -ь (wie ночь)';
  if (x.gender === 'n') return 'sächlich auf -о/-е (wie сло́во)';
  return 'männlich auf Konsonant/-й/-ь (wie стол)';
}

function nounHtml(card) {
  const x = card.x, word = card.f.ru || '';
  const g = NOUN_GENDER[x.gender] || NOUN_GENDER.m;
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-say="${esc(t)}">🔊</button>` : '';
  const pron = t => { const p = ruPron(t); return p ? ` <span class="pron">[${esc(p)}]</span>` : ''; };
  const { sg, pl } = nounDecl(x, word);
  const key = [];
  if (x.indecl) key.push('<span>unveränderlich</span>');
  else {
    if (x.gender !== 'pl' && sg[1]) key.push(`<span><i>Gen. Sg.</i> ${esc(sg[1])}</span>`);
    if (x.gender !== 'pl' && pl[0]) key.push(`<span><i>Pl.</i> ${esc(pl[0])}</span>`);
    if (x.gender === 'pl' && pl[1]) key.push(`<span><i>Gen.</i> ${esc(pl[1])}</span>`);
    if (x.loc) key.push(`<span><i>Ort</i> ${esc(x.loc)}</span>`);
  }
  const exPron = x.example_pron || ruPron(x.example);
  return `<div class="nn nn-${g.cls}">
    <div class="nn-tags"><span class="nn-g">${g.label}</span>${x.anim ? `<span class="nn-anim">👤 belebt${info}</span><div class="vp-rule">${ANIM_INFO}</div>` : ''}</div>
    <div class="nn-word">${esc(word)}${pron(word)} ${say(word)}</div>
    ${key.length ? `<div class="nn-key">${key.join('')}</div>` : ''}
    ${declensionHtml(card)}
    ${x.hint ? `<div class="nn-hint">⚠️ Achtung${info}</div><div class="vp-rule">${esc(x.hint)}</div>` : ''}
    ${x.example ? `<div class="vp-ex">${esc(x.example)} ${say(x.example)}${exPron ? `<div class="pron">[${esc(exPron)}]</div>` : ''}${x.example_cases ? `<div class="vp-case"><b>Fälle:</b> ${esc(x.example_cases)}${info}</div><div class="vp-rule vp-case-info">${caseInfoHtml(x.example_cases)}</div>` : ''}</div>` : ''}
  </div>`;
}

// Beispielsätze je Fall: x.ex_sg / x.ex_pl = „Satz = Übersetzung || …“ (6 Einträge, Reihenfolge wie NOUN_CASES)
const nounExamples = s => (s || '').split('||').map(e => { const [ru, de] = e.split(' = ').map(t => (t || '').trim()); return { ru, de }; });

// Satz mit fett markierter Form (Groß-/Kleinschreibung am Satzanfang egal)
function markForm(sentence, form) {
  const html = esc(sentence);
  if (!form) return html;
  const re = new RegExp(`(^|[^а-яё́])(${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^а-яё́]|$)`, 'i');
  return html.replace(re, '$1<b>$2</b>');
}

// Alle 12 Formen, hinter ⓘ eingeklappt; jede Zeile hat ein eigenes ⓘ mit Beispielsätzen
function declensionHtml(card) {
  if (card.type !== 'nounfull') return '';
  if (card.x.indecl) return `<div class="conj-ru nn-decl"><div class="conj-ru-head">Deklination <small>unveränderlich – in allen Fällen ${esc(card.f.ru)}</small></div></div>`;
  const x = card.x;
  const { sg, pl } = nounDecl(x, card.f.ru);
  const exSg = x.ex_sg ? nounExamples(x.ex_sg) : nounFrames(sg), exPl = x.ex_pl ? nounExamples(x.ex_pl) : nounFrames(pl);
  const say = forms => forms.filter(Boolean).length ? `<button class="say" data-say="${esc(forms.filter(Boolean).join(', '))}">🔊</button>` : '';
  const cols = [sg.filter(Boolean).length && 'Singular', pl.filter(Boolean).length && 'Plural'].filter(Boolean);
  const exLine = (ex, form, label) => ex && ex.ru ? `<div class="nn-ex"><i>${label}</i> ${markForm(ex.ru, form)} ${say([ex.ru])}<div class="pron nn-ex-pron">[${esc(ruPron(ex.ru))}]</div>${ex.de ? `<details class="nn-ex-de"><summary>Übersetzung anzeigen</summary>${esc(ex.de)}</details>` : ''}</div>` : '';
  const rows = NOUN_CASES.map(([c, q], i) => {
    const exs = (cols.includes('Singular') ? exLine(exSg[i], sg[i], cols.length > 1 ? 'Sg.' : '') : '') + (cols.includes('Plural') ? exLine(exPl[i], pl[i], cols.length > 1 ? 'Pl.' : '') : '');
    return `<tr><th>${c}${exs ? ' <button class="info" aria-label="Beispiel anzeigen">ⓘ</button>' : ''}<small>${q}</small></th>${cols.includes('Singular') ? `<td>${esc(sg[i] || '')}</td>` : ''}${cols.includes('Plural') ? `<td>${esc(pl[i] || '')}</td>` : ''}</tr>`
      + (exs ? `<tr class="vp-rule nn-ex-row"><td colspan="${cols.length + 1}">${exs}</td></tr>` : '');
  }).join('');
  return `<div class="conj-ru nn-decl">
    <div class="conj-ru-head">Deklination <small>${esc(nounPattern(x, card.f.ru))}</small> <button class="info" aria-label="Tabelle anzeigen">ⓘ</button></div>
    <div class="vp-rule">
      <table class="nn-table"><thead><tr><th></th>${cols.includes('Singular') ? `<th>Singular ${say(sg)}</th>` : ''}${cols.includes('Plural') ? `<th>Plural ${say(pl)}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table>
    </div>
  </div>`;
}

/* ============================================================
   Adjektive: alle 24 Formen werden aus der männlichen Grundform berechnet.
   Typen: hart (но́вый), betonte Endung (большо́й), weich auf -ний (си́ний),
   Rechtschreibregeln nach г/к/х (ы → и) und ж/ш/ч/щ (ы → и, unbetontes о → е).
   ============================================================ */
const ADJ_ROWS = [['Nom.', 'wer? was?'], ['Gen.', 'wessen?'], ['Dat.', 'wem?'], ['Akk.', 'wen? was?'], ['Ins.', 'mit wem?'], ['Präp.', 'über wen?']];

function adjType(m) {
  const p = m.replace(STRESS, '');
  if (/ой$/.test(p)) return 'end';                           // -ой ist immer betont (злой, большо́й)
  if (/ний$/.test(p)) return 'soft';
  return 'hard';
}

function adjDecl(m) {
  const type = adjType(m);
  const stem = m.replace(/(о́й|ой|ый|ий)$/, '');
  const plain = stem.replace(STRESS, '');
  const velar = /[гкх]$/.test(plain), sib = /[жшчщ]$/.test(plain);
  const E = ending => {
    let e = ending;
    if (type === 'soft') e = e.replace(/^ы/, 'и').replace(/^о/, 'е').replace(/^а/, 'я').replace(/^у/, 'ю').replace(/^ая/, 'яя');
    else {
      if (velar || sib) e = e.replace(/^ы/, 'и');
      if (sib && type !== 'end') e = e.replace(/^о/, 'е');
    }
    if (type === 'soft') e = e.replace(/^яя$/, 'яя').replace(/^ую$/, 'юю');
    if (type === 'end') e = e.replace(/[аеиоуыэюя]/, v => v + '́');
    const w = stem + e;
    return (w.replace(STRESS, '').match(/[аеёиоуыэюя]/g) || []).length <= 1 ? w.replace(STRESS, '') : w;   // злым: einsilbig, kein Akzent
  };
  const f = {
    m: [type === 'end' ? m : E('ый'), E('ого'), E('ому'), null, E('ым'), E('ом')],
    n: [E('ое'), E('ого'), E('ому'), E('ое'), E('ым'), E('ом')],
    f: [E('ая'), E('ой'), E('ой'), E('ую'), E('ой'), E('ой')],
    pl: [E('ые'), E('ых'), E('ым'), null, E('ыми'), E('ых')],
  };
  if (type === 'soft') { f.f[0] = stem + 'яя'; f.f[3] = stem + 'юю'; }
  f.m[3] = `${f.m[0]} / ${f.m[1]}`;
  f.pl[3] = `${f.pl[0]} / ${f.pl[1]}`;
  return f;
}

function adjPattern(m) {
  const type = adjType(m), plain = m.replace(STRESS, '');
  if (type === 'soft') return 'weich (wie си́ний)';
  const extra = /[гкх](ий|о́?й)$/.test(plain) ? ', nach г/к/х: и statt ы' : /[жшчщ](ий|о́?й)$/.test(plain) ? ', nach ж/ш/ч/щ: и statt ы' + (type === 'end' ? '' : ', е statt о') : '';
  return (type === 'end' ? 'betonte Endung (wie большо́й)' : 'hart (wie но́вый)') + extra;
}

function adjHtml(card) {
  const x = card.x, word = card.f.ru || '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-say="${esc(t)}">🔊</button>` : '';
  const pron = t => { const p = ruPron(t); return p ? ` <span class="pron">[${esc(p)}]</span>` : ''; };
  const d = adjDecl(word);
  const four = [['m', d.m[0]], ['n', d.n[0]], ['f', d.f[0]], ['pl', d.pl[0]]];
  const exPron = x.example_pron || ruPron(x.example);
  const row = (label, val, extra = '') => val ? `<div class="aj-row"><i>${label}</i> ${esc(val)} ${say(val.replace(/[,/]/g, ' '))}${extra}</div>` : '';
  return `<div class="nn aj">
    <div class="nn-tags"><span class="nn-g aj-tag">Adjektiv</span></div>
    <div class="nn-word">${esc(word)}${pron(word)} ${say(word)}</div>
    <div class="aj-four">${four.map(([g, w]) => `<span class="aj-${g}">${esc(w)}</span>`).join('')} ${say(four.map(a => a[1]).join(', '))}</div>
    ${adjDeclHtml(card)}
    ${row('Kurzform', x.short, `${info}</div><div class="vp-rule">Die Kurzform steht nach dem Subjekt als Aussage: Дом нов = Das Haus ist neu. Formen: männlich, weiblich, sächlich, Plural.`)}
    ${row('Komparativ', x.comp, (x.comp_irr ? ' <span class="aj-irr">unregelmäßig</span>' : '') + `${info}</div><div class="vp-rule">${compInfoHtml(x.comp, d)}`)}
    ${row('Gegenteil', x.anto)}
    ${x.adv ? `<div class="aj-row"><i>Adverb</i> ${esc(x.adv)} ${say(x.adv)}${info}</div><div class="vp-rule">${advInfoHtml(card)}</div>` : ''}
    ${x.hint ? `<div class="nn-hint">⚠️ Achtung${info}</div><div class="vp-rule">${esc(x.hint)}</div>` : ''}
    ${x.example ? `<div class="vp-ex">${esc(x.example)} ${say(x.example)}${exPron ? `<div class="pron">[${esc(exPron)}]</div>` : ''}${x.example_cases ? `<div class="vp-case"><b>Fälle:</b> ${esc(x.example_cases)}${info}</div><div class="vp-rule vp-case-info">${caseInfoHtml(x.example_cases)}</div>` : ''}</div>` : ''}
  </div>`;
}

// Erklärung zum Adverb des Adjektivs (ⓘ): Bildung, Beispielsatz, Übersetzung zum Aufklappen
function advInfoHtml(card) {
  const x = card.x, adj = esc(card.f.ru), adv = esc(x.adv);
  const plain = x.adv.replace(STRESS, '');
  const say = t => `<button class="say" data-say="${esc(t)}">🔊</button>`;
  const rule = /^по-.*ски$/.test(plain) ? `Adjektive auf <b>-ский</b> bilden das Adverb mit <b>по- … -ски</b>: ${adj} → ${adv}. So sagt man, in welcher Sprache oder auf wessen Art.`
    : /^по-/.test(plain) ? `Hier bildet man das Adverb mit <b>по-</b> + Dativ-Endung <b>-ому / -ему</b>: ${adj} → ${adv} (= auf … Art).`
    : /ски$/.test(plain) ? `Adjektive auf <b>-ский / -ческий</b> bilden das Adverb auf <b>-ски</b>: ${adj} → ${adv}.`
    : /е$/.test(plain) ? `Weiche Adjektive (auf <b>-ний</b>, <b>-щий</b>) bilden das Adverb auf <b>-е</b>: ${adj} → ${adv}.`
    : `Endung weg, <b>-о</b> dran: ${adj} → ${adv}. Achtung: Die Betonung kann wandern.`;
  return `<div>${rule}</div>
    <div>Das Adverb sagt, <b>wie</b> etwas passiert, und ändert sich <b>nie</b> (kein Geschlecht, kein Fall). Oft steht es auch allein als Aussage: Мне хо́лодно = Mir ist kalt.</div>
    ${x.adv_ex ? `<div class="nn-ex">${esc(x.adv_ex)} ${say(x.adv_ex)}<div class="pron nn-ex-pron">[${esc(ruPron(x.adv_ex))}]</div></div>` : ''}
    <details class="nn-ex-de"><summary>Übersetzung anzeigen</summary>${adv} = ${esc(x.adv_de || '')}${x.adv_ex_de ? `<br>${esc(x.adv_ex_de)}` : ''}</details>`;
}

// Adverb-Karte: Art (Zeit, Ort …), Wort mit Aussprache, Hinweis und Beispielsatz
function advHtml(card) {
  const x = card.x, word = card.f.ru || '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-say="${esc(t)}">🔊</button>` : '';
  const pron = t => { const p = ruPron(t); return p ? ` <span class="pron">[${esc(p)}]</span>` : ''; };
  const exPron = x.example_pron || ruPron(x.example);
  return `<div class="nn aj av">
    <div class="nn-tags"><span class="nn-g av-tag">Adverb</span>${x.cat ? `<span class="av-cat">${esc(x.cat)}</span>` : ''}</div>
    <div class="nn-word">${esc(word)}${pron(word)} ${say(word)}</div>
    <div class="nn-hint">ℹ️ ${esc(x.cat || 'Adverb')}${info}</div><div class="vp-rule">${advCatInfo(x.cat)}</div>
    ${x.hint ? `<div class="nn-hint">💡 Tipp${info}</div><div class="vp-rule">${esc(x.hint)}</div>` : ''}
    ${ADV_COMPARE[word.replace(STRESS, '')] ? `<div class="nn-hint">🤔 ${ADV_COMPARE[word.replace(STRESS, '')].title}${info}</div><div class="vp-rule">${ADV_COMPARE[word.replace(STRESS, '')].html()}</div>` : ''}
    ${x.example ? `<div class="vp-ex">${esc(x.example)} ${say(x.example)}${exPron ? `<div class="pron">[${esc(exPron)}]</div>` : ''}</div>` : ''}
  </div>`;
}

// Präpositions-Karte: Fall (farbig, Endungen hinter ⓘ), Wort mit Aussprache, Hinweis, Beispiel mit Fällen
const PREP_ENDINGS = {
  Genitiv: 'Endungen: männl./sächl. -а / -я, weibl. -ы / -и; Plural -ов / -ей / ohne Endung. Pronomen: меня́, тебя́, его́, её, нас, вас, их.',
  Dativ: 'Endungen: männl./sächl. -у / -ю, weibl. -е (auf -ь: -и); Plural -ам / -ям. Pronomen: мне, тебе́, ему́, ей, нам, вам, им.',
  Akkusativ: 'Endungen: weibl. -у / -ю; männl. und sächl. unbelebt wie Nominativ, männl. belebt wie Genitiv. Pronomen: меня́, тебя́, его́, её, нас, вас, их.',
  Instrumental: 'Endungen: männl./sächl. -ом / -ем, weibl. -ой / -ей (auf -ь: -ью); Plural -ами / -ями. Pronomen: мной, тобо́й, им, ей, на́ми, ва́ми, и́ми.',
  'Präpositiv': 'Endungen: meist -е; auf -ия, -ие und weibl. -ь: -и; Plural -ах / -ях. Pronomen: мне, тебе́, нём, ней, нас, вас, них.',
};
function prepHtml(card) {
  const x = card.x, word = card.f.ru || '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-say="${esc(t)}">🔊</button>` : '';
  const pron = t => { const p = ruPron(t); return p ? ` <span class="pron">[${esc(p)}]</span>` : ''; };
  const exPron = x.example_pron || ruPron(x.example);
  const caseCls = { Genitiv: 'gen', Dativ: 'dat', Akkusativ: 'akk', Instrumental: 'ins', 'Präpositiv': 'prp' }[x.case] || '';
  return `<div class="nn aj pp">
    <div class="nn-tags"><span class="nn-g pp-tag">Präposition</span></div>
    <div class="nn-word">${esc(word)}${pron(word)} ${say(word.split(' / ')[0])}</div>
    ${x.case ? `<div><span class="pp-case pp-${caseCls}">+ ${esc(x.case)}</span>${info}</div><div class="vp-rule">${caseInfoHtml(x.case)}<div>${esc(PREP_ENDINGS[x.case] || '')}</div></div>` : ''}
    ${x.hint ? `<div class="nn-hint">💡 Tipp${info}</div><div class="vp-rule">${esc(x.hint)}</div>` : ''}
    ${x.example ? `<div class="vp-ex">${esc(x.example)} ${say(x.example)}${exPron ? `<div class="pron">[${esc(exPron)}]</div>` : ''}${x.example_cases ? `<div class="vp-case"><b>Fälle:</b> ${esc(x.example_cases)}${info}</div><div class="vp-rule vp-case-info">${caseInfoHtml(x.example_cases)}</div>` : ''}</div>` : ''}
  </div>`;
}

// Leicht verwechselbare Adverbien: Erklärung hinter ⓘ auf beiden Karten
const SEICHAS_TEPER = {
  title: 'сейча́с oder тепе́рь?',
  html: () => `<div>Beide heißen „jetzt“, aber:</div>
    <div><b>сейча́с</b> = jetzt, in diesem Moment. Neutral, es geht nur um den Zeitpunkt. Auch „gleich“ (sofort): Я сейча́с приду́ = Ich komme gleich.</div>
    <div class="nn-ex">Что ты сейча́с де́лаешь? <button class="say" data-say="Что ты сейча́с де́лаешь?">🔊</button><div class="pron nn-ex-pron">[${esc(ruPron('Что ты сейча́с де́лаешь?'))}]</div><details class="nn-ex-de"><summary>Übersetzung anzeigen</summary>Was machst du gerade?</details></div>
    <div><b>тепе́рь</b> = jetzt, nun – <b>im Gegensatz zu früher</b>. Die Situation hat sich geändert. Oft mit а: früher …, а тепе́рь …</div>
    <div class="nn-ex">Ра́ньше я кури́л, а тепе́рь не курю́. <button class="say" data-say="Ра́ньше я кури́л, а тепе́рь не курю́.">🔊</button><div class="pron nn-ex-pron">[${esc(ruPron('Ра́ньше я кури́л, а тепе́рь не курю́.'))}]</div><details class="nn-ex-de"><summary>Übersetzung anzeigen</summary>Früher habe ich geraucht, jetzt rauche ich nicht mehr.</details></div>
    <div><b>Test:</b> Passt „nun“ oder „inzwischen“ (früher war es anders)? → тепе́рь. Geht es nur um den Moment („gerade“, „gleich“)? → сейча́с.</div>`,
};
const ADV_COMPARE = { 'сейчас': SEICHAS_TEPER, 'теперь': SEICHAS_TEPER };

function advCatInfo(cat) {
  const t = {
    'Zeit': 'Zeit-Adverbien beantworten <b>когда́?</b> (wann?) oder <b>как ча́сто?</b> (wie oft?).',
    'Ort': 'Orts-Adverbien beantworten <b>где?</b> (wo?). Für die Richtung gibt es eigene Wörter: где? здесь / там – куда́? сюда́ / туда́.',
    'Richtung': 'Richtungs-Adverbien beantworten <b>куда́?</b> (wohin?) oder <b>отку́да?</b> (woher?). Sie stehen bei Bewegungsverben: Я иду́ домо́й.',
    'Art und Weise': 'Diese Adverbien beantworten <b>как?</b> (wie? auf welche Art?).',
    'Menge': 'Mengen-Adverbien beantworten <b>ско́лько?</b> (wie viel?) oder sagen, wie stark etwas ist. Nach мно́го, ма́ло, ско́лько, сто́лько steht der Genitiv.',
    'Frage': 'Fragewörter stehen am Satzanfang. Die Wortstellung bleibt wie im Aussagesatz, nur die Stimme geht hoch.',
    'Meinung': 'Diese Wörter kommentieren den ganzen Satz (natürlich, wahrscheinlich …). Sie stehen oft mit Komma am Satzanfang.',
    'Zustand': 'Zustandswörter stehen ohne Subjekt. Die Person steht im <b>Dativ</b>: мне на́до, тебе́ мо́жно, ему́ пора́. Vergangenheit mit бы́ло: мне бы́ло ну́жно.',
  }[cat] || '';
  return `${t}${t ? '<br>' : ''}Adverbien haben keine Endungen: kein Geschlecht, kein Plural, kein Fall.`;
}

// Erklärung zum Komparativ (ⓘ) mit den Formen des jeweiligen Adjektivs
function compInfoHtml(comp, d) {
  const c = esc(comp);
  return `<div><b>Komparativ</b> (schöner, größer): Die Form bleibt <b>immer gleich</b> – egal ob männlich, weiblich oder Plural:</div>
    <div>Он ${c}. · Она́ ${c}. · Они́ ${c}.</div>
    <div>Vergleich mit <b>чем</b> (als) oder mit dem Genitiv: … ${c}, чем я · … ${c} меня́</div>
    <div><b>Superlativ</b> (der schönste): <b>са́мый</b> + Adjektiv. Beide passen sich an das Nomen an:</div>
    <div><span class="aj-m">са́мый ${esc(d.m[0])}</span> · <span class="aj-f">са́мая ${esc(d.f[0])}</span> · <span class="aj-n">са́мое ${esc(d.n[0])}</span> · <span class="aj-pl">са́мые ${esc(d.pl[0])}</span></div>
    <div>Auch die Grundform richtet sich immer nach dem Nomen: Im Wörterbuch steht die männliche Form, im Satz nimmt man die passende (weiblich bei einem weiblichen Nomen usw.).</div>`;
}

// Zwei Tabellen mit je 6 Fällen (männlich + sächlich, weiblich + Plural), damit es aufs Handy passt; hinter ⓘ
function adjDeclHtml(card) {
  const d = adjDecl(card.f.ru);
  // Akkusativ männlich / Plural: beide Formen mit Hinweis belebt / unbelebt
  const cell = (g, i) => {
    const [inanim, anim] = d[g][i].split(' / ');
    return anim ? `${esc(inanim)} <small class="aj-anim">unbelebt</small><br>${esc(anim)} <small class="aj-anim">belebt</small>` : esc(inanim);
  };
  // Je Fall zwei Zeilen: männlich | weiblich, darunter Plural | sächlich
  const LABEL = { m: 'männl.', f: 'weibl.', pl: 'Plural', n: 'sächl.' };
  const td = (g, i) => `<td class="aj-${g}"><small class="aj-g">${LABEL[g]}</small>${cell(g, i)}</td>`;
  const rows = ADJ_ROWS.map(([c, q], i) => `
    <tr class="aj-top"><th rowspan="2">${c}<small>${q}</small></th>${td('m', i)}${td('f', i)}</tr>
    <tr class="aj-bottom">${td('pl', i)}${td('n', i)}</tr>`).join('');
  return `<div class="conj-ru nn-decl">
    <div class="conj-ru-head">Deklination <small>${esc(adjPattern(card.f.ru))}</small> <button class="info" aria-label="Tabelle anzeigen">ⓘ</button></div>
    <div class="vp-rule">
      <table class="nn-table aj-table"><tbody>${rows}</tbody></table>
      <p class="aj-note">Akkusativ männlich und Plural: unbelebt (Dinge) wie Nominativ – я ви́жу но́вый дом; belebt (Menschen, Tiere) wie Genitiv – я ви́жу но́вого дру́га.</p>
    </div>
  </div>`;
}

// Russische Seite eines Verbpaars: beide Aspekte mit я/ты-Formen, Aussprache und Beispielsatz
function verbPairHtml(card) {
  const x = card.x;
  // Aussprache: von Hand eingetragen oder automatisch aus der Betonung abgeleitet
  const pron = k => {
    const p = x[k + '_pron'] || ruPron(x[k]);
    return p ? ` <span class="pron">[${esc(p)}]</span>` : '';
  };
  const say = t => t ? `<button class="say" data-say="${esc(t)}">🔊</button>` : '';
  // Merkregel zum Aspekt direkt unter der Überschrift
  const RULE = {
    ipf: 'Vorgang, Dauer, Wiederholung · Gegenwart, Vergangenheit, Zukunft (бу́ду + Infinitiv)',
    pf: 'einmalig, abgeschlossen, mit Ergebnis · nur Vergangenheit und Zukunft (я/ты-Formen = Zukunft)',
  };
  // Imperativ: von Hand eingetragen (auch „—“ = nicht üblich) oder nach Regel abgeleitet
  const IMP_RULE = {
    ipf: 'Imperativ unvollendet: allgemeine oder wiederholte Aufforderung, Einladung (Сади́тесь!) · Verbot mit не (Не кури́!)',
    pf: 'Imperativ vollendet: einmalige, konkrete Bitte mit Ergebnis (Закро́й дверь!) · mit не nur als Warnung (Не упади́!)',
  };
  const impOf = p => x[p + '_imp'] !== undefined ? x[p + '_imp'] : ruImperative(x[p], x[p + '_1'], x[p + '_2']);
  // Text zum Vorlesen: „дава́й! дава́йте!“ (leer, wenn es keinen Imperativ gibt)
  const impSpeech = p => { const imp = impOf(p); return imp && imp !== '—' ? `${imp}! ${ruImperativePlural(imp)}!` : ''; };
  const impRow = p => {
    const imp = impOf(p);
    if (!imp) return '';
    if (imp === '—') return `<div class="vp-imp"><i>Imp.</i> <span class="pron">nicht üblich</span></div>`;
    // Beispielsatz zum Imperativ steht in der ⓘ-Box über der Regel
    const ex = x[p + '_imp_ex'];
    const exHtml = ex ? `<div class="vp-impex">${esc(ex)} ${say(ex)}${pron2(ex)}${x[p + '_imp_ex_de'] ? `<div class="vp-impex-de">${esc(x[p + '_imp_ex_de'])}</div>` : ''}</div>` : '';
    return `<div class="vp-imp"><i>Imp.</i> ${esc(imp)}! / ${esc(ruImperativePlural(imp))}!${pron2(imp)} ${say(impSpeech(p))}${info}</div>
      <div class="vp-rule">${exHtml}${IMP_RULE[p]}</div>`;
  };
  const pron2 = text => { const p = ruPron(text); return p ? ` <span class="pron">[${esc(p)}]</span>` : ''; };
  // ⓘ blendet die Erklärung darunter (nächstes Element .vp-rule) ein und aus
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const block = (p, label, hint, rule = RULE[p]) => x[p] ? `
    <div class="vp-block ${p}">
      <div class="vp-asp">${label}${hint ? ` <small>${hint}</small>` : ''}${rule ? info : ''}</div>
      ${rule ? `<div class="vp-rule">${rule}</div>` : ''}
      <div class="vp-inf">${esc(x[p])}${pron(p)} ${say([x[p], x[p + '_1'], x[p + '_2']].filter(f => f && f !== '—').join(', ') + (impSpeech(p) ? '. ' + impSpeech(p) : ''))}</div>
      <div class="vp-forms">
        ${x[p + '_1'] ? `<div><i>я</i> ${esc(x[p + '_1'])}${pron(p + '_1')}</div>` : ''}
        ${x[p + '_2'] ? `<div><i>ты</i> ${esc(x[p + '_2'])}${pron(p + '_2')}</div>` : ''}
      </div>
      ${impRow(p)}
      ${allFormsHtml(x, p, impOf(p))}
    </div>` : '';
  const exPron = x.example_pron || ruPron(x.example);
  const biaspectual = x.pf && x.pf === x.ipf;
  // Verben der Bewegung: Kennzeichnung mit Gegenstück und ausklappbarer Erklärung
  const MOTION_LABEL = {
    uni: '🚶 Bewegungsverb · eine Richtung',
    multi: '🔁 Bewegungsverb · mehrere Richtungen / regelmäßig',
    prefix: '🚶 Bewegungsverb mit Vorsilbe · normales Aspektpaar',
  };
  const motion = MOTION_LABEL[x.motion] ? `
    <div class="vp-motion">${MOTION_LABEL[x.motion]}${x.motion_pair ? ` · Gegenstück: <b>${esc(x.motion_pair)}</b>` : ''}${info}</div>
    <div class="vp-rule">${x.motion_prefix ? motionPrefixHtml(x) : ''}${MOTION_INFO}</div>` : '';
  // Rektion: welche Präposition und welchen Fall das Verb verlangt; ⓘ erklärt die genannten Fälle
  const gov = x.government ? `
    <div class="vp-gov"><b>verlangt:</b> ${esc(x.government)}${info}</div>
    <div class="vp-rule vp-case-info">${caseInfoHtml(x.government) || 'Hier wird kein Fall verlangt.'}</div>` : '';
  return `<div class="vp">
    ${motion}
    ${biaspectual
      ? block('ipf', 'unvollendet + vollendet', 'gleiche Form für beide Aspekte', 'Bedeutung ergibt sich aus dem Zusammenhang')
      : block('ipf', 'unvollendet', x.pf ? '' : 'ohne vollendeten Partner') + block('pf', 'vollendet', x.ipf ? '' : 'ohne unvollendeten Partner')}
    ${gov}
    ${x.example ? `<div class="vp-ex">${esc(x.example)} ${say(x.example)}${exPron ? `<div class="pron">[${esc(exPron)}]</div>` : ''}${x.example_cases ? `<div class="vp-case"><b>Fälle:</b> ${esc(x.example_cases)}${info}</div><div class="vp-rule vp-case-info">${caseInfoHtml(x.example_cases)}</div>` : ''}</div>` : ''}
  </div>`;
}

// Erstes Verb der spanischen Übersetzung, z. B. "coger, tomar" → "coger"
function esMainVerb(text) {
  return (text || '').split(/[,;]/)[0].replace(/\(.*?\)/g, '').trim();
}

function esConjHtml(card) {
  const x = card.x;
  const verbs = [x.es_verb || esMainVerb(card.f.es), x.es2_verb].filter(Boolean);
  const split = s => s.split(',').map(f => f.trim());
  const tables = verbs.map((v, n) => {
    const c = esConjugate(v);
    if (!c) return '';
    const p = n === 0 ? 'es' : 'es2';
    // Von Hand eingetragene Formen haben Vorrang
    const pres = x[p + '_pres'] ? split(x[p + '_pres']) : c.pres;
    const past = x[p + '_past'] ? split(x[p + '_past']) : c.past;
    return `<table class="conj">
      <caption>${esc(c.label)}</caption>
      <thead><tr><th></th><th>Presente</th><th class="t-past">Pretérito</th><th class="t-fut">Futuro</th></tr></thead>
      <tbody>${ES_PERSONS.map((pr, i) => `
        <tr><th>${pr}</th><td>${esc(pres[i] || '')}</td><td>${esc(past[i] || '')}</td><td>${esc(c.fut[i])}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="es-why">Warum so? <button class="info" aria-label="Regeln anzeigen">ⓘ</button></div>
    <div class="vp-rule es-rule">${esExplain(v)}</div>
    ${esMoreHtml(v)}`;
  }).filter(Boolean);
  return tables.length ? `<div class="conj-wrap">${tables.join('')}</div>` : '';
}

// Interne Felder, die nicht als Zusatzinfo erscheinen (Spanisch-Modus, Rangfolge)
const INTERNAL_X = new Set(['es_freq', 'es_mente', 'es_verb', 'hint_es', 'note_es', 'adv_es']);

function extrasHtml(card) {
  const type = CARD_TYPES[card.type] || CARD_TYPES.word;
  if (type.ownLayout) {
    // Nur eine evtl. Notiz zeigen, alles andere steckt im Verbblock. Beim Spanischlernen die Notiz zum spanischen Wort.
    const note = learnLang() === 'es' ? card.x.note_es : card.x.note;
    return note ? `<div class="extras"><div><b>Notiz</b>${esc(note)}</div></div>` : '';
  }
  const defs = type.extras.concat(COMMON_EXTRAS);
  const known = new Set(defs.map(d => d.key));
  const items = defs.filter(d => card.x[d.key]).map(d => {
    const val = d.options ? (d.options[card.x[d.key]] || card.x[d.key]) : card.x[d.key];
    const sayBtn = d.key === 'example' ? ` <button class="say" data-say="${esc(card.x[d.key])}" data-lang="ru">🔊</button>` : '';
    return `<div><b>${esc(d.label)}</b>${esc(val)}${sayBtn}</div>`;
  });
  // Unbekannte Zusatzfelder aus Importen trotzdem anzeigen
  for (const [k, v] of Object.entries(card.x)) {
    if (!known.has(k) && !k.startsWith('example_') && !INTERNAL_X.has(k) && v) items.push(`<div><b>${esc(k)}</b>${esc(v)}</div>`);
  }
  return items.length ? `<div class="extras">${items.join('')}</div>` : '';
}

// Seite „Russisch“ einer Karte: Verbblock, Nomen, Adjektiv bzw. das russische Wort
function cardRuSide(card) {
  const sayRu = text => `<button class="say" data-say="${esc(text)}">🔊</button>`;
  return `<div class="lang-tag">${esc(langName(RU))}</div>` + (card.type === 'verbpair'
    ? verbPairHtml(card)
    : card.type === 'adjfull' ? adjHtml(card)
    : card.type === 'advfull' ? advHtml(card)
    : card.type === 'prepfull' ? prepHtml(card)
    : card.type === 'nounfull' ? nounHtml(card)
    : `<div class="q-word">${esc(card.f[RU])}</div>${sayRu(card.f[RU])}`);
}

// Seite „Übersetzungen“: alle anderen aktiven Sprachen mit Beispiel-Übersetzung (und spanischer Tabelle)
function cardTrSide(card) {
  const sayRu = t => `<button class="say" data-say="${esc(t)}">🔊</button>`;
  // Beim Spanischlernen steht Russisch ganz unten
  const langs = trLangs().filter(l => card.f[l.code]).sort((a, b) => (a.code === RU) - (b.code === RU));
  return langs.map(l => l.code === RU ? `
    <div class="answer">
      <div class="lang-tag">${esc(l.name)}</div>
      <div class="a-word">${esc(card.f.ru)} ${sayRu(card.f.ru)}</div>
      ${card.x.example ? `<div class="a-ex">${esc(card.x.example)} ${sayRu(card.x.example)}</div>` : ''}
    </div>` : `
    <div class="answer">
      <div class="lang-tag">${esc(l.name)}</div>
      <div class="a-word">${esc(card.f[l.code])}</div>
      ${card.x['example_' + l.code] ? `<div class="a-ex">${esc(card.x['example_' + l.code])}</div>` : ''}
      ${card.type === 'verbpair' && l.code === 'es' ? esConjHtml(card) : ''}
    </div>`).join('');
}

// Vorderseite in der Lernsprache
const cardLearnSide = card => (learnLang() === 'es' ? cardEsSide(card) : cardRuSide(card));

/* ============================================================
   Spanisch als Lernsprache: Wort mit Artikel/Plural, Adjektivformen, Konjugation, Beispielsatz
   ============================================================ */
// Weibliche Nomen mit betontem a-/ha- am Anfang haben im Singular „el“: el agua, aber las aguas
const ES_EL_FEM = new Set(['agua', 'alma', 'arma', 'área', 'aula', 'ave', 'hambre', 'hacha', 'águila', 'hada', 'ancla', 'asma', 'haba', 'alba', 'ala', 'arca', 'arpa', 'aya']);
// Nomen, die man (fast) nur im Singular benutzt
const ES_NO_PLURAL = new Set(['dinero', 'gente', 'sangre', 'hambre', 'sed', 'salud', 'leche', 'arroz', 'azúcar', 'música', 'calor', 'frío', 'tráfico', 'oro', 'petróleo']);
const ES_DEACCENT = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
const ES_ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

// Silbenkerne: Vokalgruppen, zwei starke Vokale (a, e, o) nebeneinander sind zwei Silben
function esNuclei(w) {
  const res = [];
  const re = /[aeiouáéíóúü]+/gi;
  let m;
  while ((m = re.exec(w))) {
    let start = m.index;
    const g = m[0];
    for (let i = 1; i <= g.length; i++) {
      if (i === g.length || (/[aeoáéó]/i.test(g[i - 1]) && /[aeoáéó]/i.test(g[i])) || /[íú]/i.test(g[i]) || /[íú]/i.test(g[i - 1])) {
        res.push({ start, end: m.index + i });
        start = m.index + i;
      }
    }
  }
  return res;
}

// Plural eines spanischen Wortes (Nomen oder Adjektiv)
function esPluralWord(w) {
  if (/[aeiouáéó]$/i.test(w) || /[íú]$/i.test(w)) return w + 's';
  if (/z$/i.test(w)) return w.slice(0, -1) + 'ces';
  const nuc = esNuclei(w);
  if (/[sx]$/i.test(w) && nuc.length > 1 && !/[áéíóú]/i.test(w)) return w;   // el lunes → los lunes
  let base = w;
  // Betonte Endsilbe verliert den Akzent: canción → canciones, inglés → ingleses (aber país → países)
  base = base.replace(/([áéó])([ns])$/i, (m, v, c) => ES_DEACCENT[v] + c)
    .replace(/([^aeiou])([íú])([ns])$/i, (m, p, v, c) => p + ES_DEACCENT[v] + c);
  // Unbetonte Endung -en/-on: Akzent kommt dazu, weil die Betonung bleibt: examen → exámenes, joven → jóvenes
  if (/n$/i.test(w) && !/[áéíóú]/i.test(w) && nuc.length >= 2) {
    const n = nuc[nuc.length - 2];
    const g = w.slice(n.start, n.end);
    const i = /[aeo]/i.test(g) ? g.search(/[aeo]/i) : g.length - 1;
    base = w.slice(0, n.start + i) + ES_ACCENT[w[n.start + i]] + w.slice(n.start + i + 1);
  }
  return base + 'es';
}
// Nur das erste Wort bekommt den Plural: el fin de semana → los fines de semana
const esPluralPhrase = s => { const [first, ...rest] = s.split(' '); return [esPluralWord(first), ...rest].join(' '); };

function esNounParts(es) {
  return es.split(/[;,]/).map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(el|la|los|las)\s+([^(]+?)\s*(\(.*\))?$/i);   // Klammerzusatz gehört nicht zum Plural
    if (!m) return { text: s };
    const art = m[1].toLowerCase(), noun = m[2];
    if (art === 'los' || art === 'las') return { text: s, g: 'pl', plOnly: true };
    const fem = art === 'la' || ES_EL_FEM.has(noun.split(' ')[0]);
    if (ES_NO_PLURAL.has(noun)) return { text: s, g: fem ? 'f' : 'm' };
    return { text: s, g: fem ? 'f' : 'm', pl: `${fem ? 'las' : 'los'} ${esPluralPhrase(noun)}` };
  });
}

// Adjektiv: „oscuro, oscura“ = männlich, weiblich; sonst ist die zweite Angabe ein Synonym
function esAdjForms(es) {
  const parts = es.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const m = parts[0] || '';
  if (!m || / /.test(m)) return null;
  const plainM = m.replace(/[áéíóú](?=[^aeiouáéíóú]*$)/i, v => ES_DEACCENT[v]);
  const isFem = f => f && (f === m.replace(/o$/, 'a') || f === plainM + 'a');
  const f = isFem(parts[1]) ? parts[1] : /o$/.test(m) ? m.slice(0, -1) + 'a' : m;
  return { m, f, mpl: esPluralWord(m), fpl: f === m ? esPluralWord(m) : f + 's' };
}

const ES_NOUN_INFO = `<div><b>Artikel:</b> el (männlich), la (weiblich); Plural los, las. Unbestimmt: un, una, unos, unas.</div>
  <div>Meist männlich: -o, -or, -aje, -ma (el problema, el tema). Meist weiblich: -a, -ción, -sión, -dad, -tad, -tud. Ausnahmen: el día, el mapa, la mano, la foto, la moto, la radio.</div>
  <div>Weibliche Wörter mit betontem a- am Anfang nehmen im Singular <b>el</b>: el agua fría, aber las aguas.</div>
  <div><b>Plural:</b> nach Vokal <b>-s</b> (casa → casas), nach Konsonant <b>-es</b> (ciudad → ciudades), -z → <b>-ces</b> (vez → veces). Unbetontes -s bleibt (el lunes → los lunes). Der Akzent kann wegfallen oder dazukommen: canción → canciones, examen → exámenes.</div>`;
const ES_ADJ_INFO = `<div>Adjektive passen sich in <b>Geschlecht und Zahl</b> an das Nomen an und stehen meist <b>dahinter</b>: la casa blanca, los coches nuevos.</div>
  <div>Auf -o: vier Formen (-o, -a, -os, -as). Auf -e oder Konsonant: nur Singular/Plural (verde → verdes, fácil → fáciles). Herkunft auf Konsonant hat eine weibliche Form: español → española.</div>
  <div><b>Vergleich:</b> más … que (mehr … als), menos … que, tan … como (so … wie). Superlativ: el/la más … Unregelmäßig: bueno → mejor, malo → peor, grande → mayor, pequeño → menor. Sehr: -ísimo (rapidísimo).</div>`;

// Betonte Silbe unterstreichen (Lesehilfe, kein Akzent!) – nur bei Wörtern mit mehr als einer Silbe
function esStressHtml(text) {
  return text.split(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/).map((t, i) => {
    if (i % 2 === 0 || esNuclei(t).length < 2) return esc(t);
    const p = esStressPos(t);
    return p < 0 ? esc(t) : esc(t.slice(0, p)) + `<u class="es-st">${esc(t[p])}</u>` + esc(t.slice(p + 1));
  }).join('');
}
const ES_STRESS_INFO = `<div>Der <b>unterstrichene Vokal</b> zeigt, welche Silbe betont wird. Das ist nur eine <b>Lesehilfe</b> der App – dort steht <b>kein Akzent</b>. Einen Akzent (á, é, í, ó, ú) schreibt man nur, wenn er auch im Wort zu sehen ist.</div>
  <div><b>Regel:</b> Endet ein Wort auf Vokal, -n oder -s, ist die vorletzte Silbe betont (c<u>a</u>sa, h<u>a</u>blan). Sonst die letzte (habl<u>a</u>r, ciud<u>a</u>d). Wörter, die davon abweichen, bekommen einen Akzent: café, árbol, teléfono.</div>`;

// Adverb auf -mente: weibliche Form + -mente (rápida → rápidamente). Nur bei Adjektiven, die auch im Russischen ein Adverb haben.
const ES_ADV_IRREG = { bueno: 'bien', malo: 'mal' };
function esAdverb(card, a) {
  if (card.x.adv_es) return card.x.adv_es;
  if (!a || (!card.x.adv && !card.x.es_mente)) return '';
  return ES_ADV_IRREG[a.m] || a.f + 'mente';
}
function esAdvInfo(a, adv) {
  const irr = ES_ADV_IRREG[a.m];
  return (irr ? `<div><b>${a.m} → ${adv}</b> ist unregelmäßig: Lo hiciste ${adv} = Du hast es ${adv === 'bien' ? 'gut' : 'schlecht'} gemacht.</div>` : `<div>Adverb = <b>weibliche Form + -mente</b>: ${esc(a.f)} → ${esc(adv)}. Ein Akzent bleibt (rápida → rápidamente, fácil → fácilmente).</div>`)
    + `<div>Das Adverb sagt, <b>wie</b> etwas passiert, und ändert sich nie. Bei zwei Adverben bekommt nur das letzte -mente: clara y rápidamente.</div>
    <div>Im Alltag (auch in der DR) nimmt man oft einfach das Adjektiv: Habla rápido. Maneja lento.</div>`;
}

function cardEsSide(card) {
  const x = card.x, es = card.f.es || '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-lang="es" data-say="${esc(t)}">🔊</button>` : '';
  const KIND = { verbpair: ['Verbo', 'es-v'], nounfull: ['Sustantivo', 'es-n'], adjfull: ['Adjetivo', 'es-a'], advfull: ['Adverbio', 'es-d'], prepfull: ['Preposición', 'es-p'], phrase: ['Expresión', 'es-w'] }[card.type] || ['Palabra', 'es-w'];
  let word = esStressHtml(es), body = '';
  if (card.type === 'nounfull') {
    const parts = esNounParts(es);
    word = parts.map(p => `<span class="${p.g ? 'es-g-' + p.g : ''}">${esStressHtml(p.text)}</span>`).join(', ');
    const rows = parts.filter(p => p.pl || p.plOnly);
    if (rows.length) body = `<div class="es-forms">${rows.map(p => p.plOnly
      ? `<div><i>nur Plural</i> <span class="es-g-pl">${esc(p.text)}</span></div>`
      : `<div><i>Plural</i> <span class="es-g-pl">${esc(p.pl)}</span> ${say(p.pl)}</div>`).join('')}
      <div class="nn-hint">Artikel und Plural${info}</div><div class="vp-rule">${ES_NOUN_INFO}</div></div>`;
  } else if (card.type === 'adjfull') {
    const a = esAdjForms(es);
    if (a) body = `<table class="es-adj"><tr><th></th><th>männl.</th><th>weibl.</th></tr>
      <tr><th>Sing.</th><td class="es-g-m">${esc(a.m)}</td><td class="es-g-f">${esc(a.f)}</td></tr>
      <tr><th>Plural</th><td class="es-g-m">${esc(a.mpl)}</td><td class="es-g-f">${esc(a.fpl)}</td></tr></table>
      <div class="nn-hint">Anpassung und Vergleich${info}</div><div class="vp-rule">${ES_ADJ_INFO}</div>`;
    const adv = esAdverb(card, a);
    if (adv) body += `<div class="es-forms"><div><i>Adverb</i> <b>${esc(adv)}</b> ${say(adv)}${info}</div><div class="vp-rule">${esAdvInfo(a, adv)}</div></div>`;
  } else if (card.type === 'verbpair') {
    body = esConjHtml(card);
  }
  const mainSay = es.split(/[;,]/)[0].replace(/\(.*?\)/g, '').trim();
  return `<div class="lang-tag">${esc(langName('es'))}</div>
    <div class="nn es-card">
      <div class="nn-tags"><span class="nn-g ${KIND[1]}">${KIND[0]}</span></div>
      <div class="nn-word">${word} ${say(mainSay)}</div>
      <div class="es-stress-hint">unterstrichen = betonte Silbe${info}</div><div class="vp-rule">${ES_STRESS_INFO}</div>
      ${body}
      ${x.hint_es ? `<div class="nn-hint">💡 Tipp${info}</div><div class="vp-rule">${esc(x.hint_es)}</div>` : ''}
      ${x.example_es ? `<div class="vp-ex">${esc(x.example_es)} ${say(x.example_es)}</div>` : ''}
    </div>`;
}

function renderStudy() {
  const view = $('#view');
  const cur = study.current;
  if (!cur) {
    $('#header-extra').innerHTML = '';
    stopStudyKeys();
    const s = deckStats(study.deckIds);
    view.innerHTML = `
      <div class="done">
        <div class="big">🎉</div>
        <h2>Geschafft!</h2>
        <p>${study.done} Karten in dieser Runde gelernt.${s.fresh && newSeenToday() >= db.settings.newPerDay ? '<br>Das Tageslimit für neue Karten ist erreicht.' : ''}</p>
        <button class="btn" id="fin">Zur Übersicht</button>
      </div>`;
    $('#fin').onclick = () => { study = null; go('learn'); };
    return;
  }
  const card = db.cards[cur.id];
  if (!card) { nextCard(); return; }
  const p = db.progress[cur.key] || newProgress();
  const typeName = learnLang() === 'es' && card.type === 'verbpair' ? 'Verb' : (CARD_TYPES[card.type] || CARD_TYPES.word).name;
  const remaining = study.queue.length + 1;
  const prev = g => fmtInterval(schedule(p, g).due - Date.now());
  const isVp = card.type === 'verbpair';
  const isNoun = card.type === 'nounfull' || card.type === 'adjfull' || card.type === 'advfull' || card.type === 'prepfull';
  const ruSide = () => cardLearnSide(card);
  const trSide = () => cardTrSide(card);
  const ruFirst = cur.q !== 'tr';

  view.innerHTML = `
    <div class="study">
      <div class="card3d ${study.flipped ? 'flipped' : ''} ${isVp || isNoun ? 'tall' : ''}" id="card">
        <div class="card-inner">
          <div class="face front">
            <span class="badge type">${esc(typeName)}${cur.isNew ? ' · neu' : ''}</span>
            ${ruFirst ? ruSide() : trSide()}
            <div class="hint">Tippen zum Umdrehen</div>
          </div>
          <div class="face back">
            <span class="badge type">${esc(typeName)}</span>
            ${ruFirst ? trSide() : ruSide()}
            ${conjugationHtml(card)}
            ${extrasHtml(card)}
          </div>
        </div>
      </div>
      ${study.seenBack ? `
        <div class="grades">
          <button class="g1" data-grade="1">Nochmal<small>${prev(1)}</small></button>
          <button class="g2" data-grade="2">Schwer<small>${prev(2)}</small></button>
          <button class="g3" data-grade="3">Gut<small>${prev(3)}</small></button>
          <button class="g4" data-grade="4">Leicht<small>${prev(4)}</small></button>
        </div>` : `<button class="btn block" id="flip">Antwort zeigen</button>`}
      <div class="btn-row" style="justify-content:center">
        <button class="btn secondary small" id="edit-cur">✏️ Bearbeiten</button>
      </div>
    </div>`;

  $('#card').onclick = (e) => { if (!e.target.closest('.say, .info, details')) flip(); };
  $('#flip')?.addEventListener('click', flip);
  $$('[data-grade]', view).forEach(b => b.onclick = () => grade(+b.dataset.grade));
  $$('.say', view).forEach(b => b.onclick = (e) => { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); });
  $$('.info', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    // In Tabellen gehört die Erklärung zur nächsten Zeile
    const rule = (b.closest('tr') || b.parentElement).nextElementSibling;
    if (rule && rule.classList.contains('vp-rule')) b.classList.toggle('open', rule.classList.toggle('open'));
  });
  // „übrig“ und Abfragerichtung stehen im blauen Kopfbereich
  $('#header-extra').innerHTML = `
    <span class="hbadge" title="noch übrig">${remaining}</span>
    <button class="hdir" id="swap" title="Richtung wechseln">${esc(dirLabel())} ⇄</button>`;
  $('#swap').onclick = swapDirection;
  $('#edit-cur').onclick = () => editCard(card.id, () => {
    setHeader(study.title, () => { study = null; go('learn'); });
    startStudyKeys();
    renderStudy();
  });
}

function flip() {
  study.flipped = !study.flipped;
  const firstTime = !study.seenBack;
  study.seenBack = true;
  if (firstTime) {
    renderStudy();
    // Animation sichtbar machen: erst ohne, dann mit "flipped" rendern
    const c = $('#card');
    c.classList.remove('flipped');
    requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('flipped')));
  } else {
    $('#card').classList.toggle('flipped', study.flipped);
  }
}

function grade(g) {
  const cur = study.current;
  if (!cur || !study.seenBack) return;
  const before = db.progress[cur.key];
  if (!before) countNewSeen();
  const p = schedule(before || newProgress(), g);
  db.progress[cur.key] = p;
  save();
  study.done++;
  // Karten mit kurzem Intervall kommen in dieser Runde wieder
  if (p.due - Date.now() < 20 * MIN) {
    const item = { ...cur, isNew: false };
    const pos = g === 1 ? Math.min(3, study.queue.length) : study.queue.length;
    study.queue.splice(pos, 0, item);
  }
  nextCard();
}

function swapDirection() {
  const i = DIRECTIONS.indexOf(db.settings.qLang);
  db.settings.qLang = DIRECTIONS[(i + 1) % DIRECTIONS.length];
  save();
  study.queue = buildQueue(study.deckIds);
  toast('Richtung: ' + dirLabel());
  nextCard();
}

function studyKeys(e) {
  if (!study || tab !== 'learn' || e.target.matches('input, textarea, select')) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  if (['1', '2', '3', '4'].includes(e.key)) grade(+e.key);
}
function startStudyKeys() { document.addEventListener('keydown', studyKeys); }
function stopStudyKeys() { document.removeEventListener('keydown', studyKeys); document.removeEventListener('keydown', quizKeys); document.removeEventListener('keydown', drillKeys); }

/* ============================================================
   Schreibmodus: 20 zufällige Wörter aus den gewählten Decks, Bedeutung eintippen.
   Richtung wie in der Übersicht gewählt (RU → DE, DE → RU oder gemischt).
   Falsche Wörter kommen nach ein paar anderen Karten noch einmal, bis alle richtig sind.
   ============================================================ */
// Karte im Ergebnis (Schreib- und Konjugationsmodus): vorne die Lernsprache, Antippen zeigt die Übersetzung
function flipCardHtml(card) {
  return `<div class="card3d tall result-card" id="result-card">
    <div class="card-inner">
      <div class="face front">${cardLearnSide(card)}<div class="hint">Tippen zum Umdrehen – Übersetzung</div></div>
      <div class="face back">${cardTrSide(card)}${conjugationHtml(card)}${extrasHtml(card)}<div class="hint">Tippen zum Zurückdrehen</div></div>
    </div>
  </div>`;
}
function wireFlipCard(view) {
  const c = $('#result-card', view);
  if (c) c.onclick = e => { if (!e.target.closest('.say, .info, details')) c.classList.toggle('flipped'); };
}

/* Schreibmodus in 5er-Gruppen: Die ersten 5 noch nicht sicheren Wörter des Blocks rotieren, bis jedes
   QUIZ_STREAK-mal hintereinander richtig war („sitzt“). Dann kommen die nächsten 5, dazwischen immer wieder
   Wiederholungen der schon sicheren Wörter. Was sitzt, wird je Lernsprache gespeichert (db.quizMastery). */
let quiz = null;
const QUIZ_SIZE = 20;          // Konjugationstraining: Aufgaben pro Runde
const QUIZ_GAP = 3;            // Konjugationstraining: falsche Aufgabe kommt nach so vielen anderen wieder
const QUIZ_BATCH = 5;          // so viele neue Wörter gleichzeitig
const QUIZ_STREAK = 3;         // so oft hintereinander richtig = sitzt
const QUIZ_REVIEW = 0.3;       // Anteil Wiederholungen schon sicherer Wörter

const quizMastered = () => {
  const all = db.quizMastery || (db.quizMastery = {});
  return all[learnLang()] || (all[learnLang()] = {});
};

function startQuiz(deckIds, title) {
  const pool = learnCards(deckIds).filter(c => c.f.de).map(c => c.id);
  if (!pool.length) { toast('Keine Karten in diesem Deck'); return; }
  quiz = { title, deckIds, pool, active: [], streak: {}, last: null, cur: null, answer: null, answered: 0, right: 0, newlyMastered: 0 };
  fillQuizBatch();
  document.body.classList.add('studying');
  setHeader(title, () => { quiz = null; go('learn'); });
  stopStudyKeys();
  document.addEventListener('keydown', quizKeys);
  nextQuiz();
}

// Die nächsten noch nicht sicheren Wörter (in Block-Reihenfolge, also nach Häufigkeit) in die aktive Gruppe holen
function fillQuizBatch() {
  const m = quizMastered();
  for (const id of quiz.pool) {
    if (quiz.active.length >= QUIZ_BATCH) break;
    if (!m[id] && !quiz.active.includes(id)) { quiz.active.push(id); quiz.streak[id] = quiz.streak[id] || 0; }
  }
}

function nextQuiz() {
  const m = quizMastered();
  const dir = () => (db.settings.qLang === 'mix' ? (Math.random() < 0.5 ? 'ru' : 'tr') : db.settings.qLang);
  const reviewable = quiz.pool.filter(id => m[id] && id !== quiz.last);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  let id = null, review = false;
  if (!quiz.active.length) id = null;   // alle Wörter des Blocks sitzen → fertig
  else if (reviewable.length && Math.random() < QUIZ_REVIEW) { id = pick(reviewable); review = true; }
  else if (quiz.active.length) {
    // Wörter mit wenigen richtigen Antworten öfter, aber nie zweimal direkt hintereinander (außer es ist nur eins übrig)
    const cands = quiz.active.filter(x => x !== quiz.last);
    const list = cands.length ? cands : quiz.active;
    const min = Math.min(...list.map(x => quiz.streak[x] || 0));
    id = pick(list.filter(x => (quiz.streak[x] || 0) <= min + 1));
  }
  quiz.cur = id ? { id, q: dir(), review } : null;
  quiz.answer = null;
  renderQuiz();
}

// Vergleichsform: klein, ohne Betonung, ohne Artikel und Klammerzusätze
function quizNorm(s) {
  return (s || '').toLowerCase().replace(STRESS, '').replace(/ё/g, 'е').replace(/\(.*?\)/g, ' ')
    .replace(/(^|\s)(der|die|das|den|dem|ein|eine|einen|sich|etw\.?|etwas|jmdn\.?|jmdm\.?)(?=\s|$)/g, ' ')
    .replace(/(^|\s)(el|la|los|las|un|una|unos|unas)(?=\s|$)/g, ' ')    // spanische Artikel
    .replace(/[áéíóú]/g, v => ES_DEACCENT[v])                        // spanische Akzente zählen nicht
    .replace(/[.,!?;:"„“«»¿¡]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Alle akzeptierten Antworten einer Karte
function quizVariants(card, askRu) {
  if (askRu) return (card.f.de || '').split(/[,;/]/).map(quizNorm).filter(Boolean);
  if (learnLang() === 'es') return [...new Set((card.f.es || '').split(/[,;/]/).map(quizNorm).filter(Boolean))];
  const list = [card.f[RU]].concat(card.f[RU].split('/'), card.x.ipf || [], card.x.pf || []);
  return [...new Set(list.map(quizNorm).filter(Boolean))];
}

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

function quizCheck(text) {
  const cur = quiz.cur, card = db.cards[cur.id];
  const askRu = cur.q === 'ru';
  const a = quizNorm(text);
  let ok = false, typo = false;
  for (const v of quizVariants(card, askRu)) {
    if (!a) break;
    if (v === a) { ok = true; typo = false; break; }
    const allowed = v.length >= 9 ? 2 : v.length >= 5 ? 1 : 0;
    if (levenshtein(a, v) <= allowed) { ok = true; typo = true; }
  }
  quiz.answer = { text, ok, typo, expected: askRu ? card.f.de : card.f[learnLang()], before: { streak: quiz.streak[cur.id] || 0, active: [...quiz.active], mastered: !!quizMastered()[cur.id] } };
  quizApply(ok);
  renderQuiz();
}

// Ergebnis verbuchen: richtig → Serie +1 (sitzt ab QUIZ_STREAK), falsch → Serie 0; vergessene Wiederholung kommt zurück in die Gruppe
function quizApply(ok) {
  const id = quiz.cur.id, m = quizMastered();
  quiz.answered++;
  quiz.last = id;
  if (ok) quiz.right++;
  if (quiz.cur.review) {
    if (!ok) { delete m[id]; quiz.active.push(id); quiz.streak[id] = 0; quiz.answer.lost = true; }
  } else if (ok) {
    quiz.streak[id] = (quiz.streak[id] || 0) + 1;
    if (quiz.streak[id] >= QUIZ_STREAK) {
      m[id] = 1;
      quiz.active = quiz.active.filter(x => x !== id);
      quiz.newlyMastered++;
      quiz.answer.mastered = true;
      if (!quiz.active.length) { fillQuizBatch(); quiz.answer.nextBatch = quiz.active.length > 0; }
    }
  } else quiz.streak[id] = 0;
  save();
}

// „Ich lag doch richtig“: Stand von vor der Antwort wiederherstellen und als richtig werten
function quizOverride() {
  const b = quiz.answer.before, id = quiz.cur.id, m = quizMastered();
  quiz.streak[id] = b.streak;
  quiz.active = b.active;
  if (b.mastered) m[id] = 1; else delete m[id];
  quiz.answered--;
  Object.assign(quiz.answer, { ok: true, override: true, lost: false });
  quizApply(true);
  renderQuiz();
}

function quizKeys(e) {
  if (!quiz || e.key !== 'Enter') return;
  if (quiz.answer) { e.preventDefault(); nextQuiz(); }
}

function renderQuiz() {
  const view = $('#view');
  const cur = quiz.cur;
  const m = quizMastered();
  const sure = quiz.pool.filter(id => m[id]).length;
  $('#header-extra').innerHTML = `<span class="hbadge" title="Wörter, die sitzen">${sure}/${quiz.pool.length}</span>`;
  if (!cur) {
    view.innerHTML = `
      <div class="done">
        <div class="big">🎉</div>
        <h2>Alle ${quiz.pool.length} Wörter sitzen!</h2>
        <p>${quiz.right} von ${quiz.answered} Antworten in dieser Runde richtig.</p>
        <button class="btn" id="quiz-again">Nur wiederholen</button><br>
        <button class="btn secondary" id="quiz-reset">Block von vorn lernen</button><br>
        <button class="btn secondary" id="quiz-end">Zur Übersicht</button>
      </div>`;
    $('#quiz-again').onclick = () => startQuiz(quiz.deckIds, quiz.title);
    $('#quiz-reset').onclick = () => { quiz.pool.forEach(id => delete m[id]); save(); startQuiz(quiz.deckIds, quiz.title); };
    $('#quiz-end').onclick = () => { quiz = null; go('learn'); };
    return;
  }
  // Fortschritt der aktuellen 5er-Gruppe: ein Punkt je richtiger Antwort in Folge
  const dots = id => '●'.repeat(Math.min(quiz.streak[id] || 0, QUIZ_STREAK)) + '○'.repeat(Math.max(0, QUIZ_STREAK - (quiz.streak[id] || 0)));
  const groupHtml = `<div class="quiz-group">${cur.review ? '<span class="quiz-review">🔁 Wiederholung</span>' : `Neue Wörter: ${quiz.active.length} in Arbeit · <span class="quiz-dots">${dots(cur.id)}</span>`}</div>`;
  const card = db.cards[cur.id];
  const askRu = cur.q === 'ru';
  const L = learnLang();
  const prompt = askRu ? card.f[L] : card.f.de;
  const say = t => `<button class="say" data-lang="${L}" data-say="${esc(t)}">🔊</button>`;
  if (!quiz.answer) {
    view.innerHTML = `
      <div class="quiz">
        ${groupHtml}
        <div class="quiz-prompt">
          <div class="lang-tag">${askRu ? LEARN_LANGS[L].name : 'Deutsch'}</div>
          <div class="q-word">${esc(prompt)}</div>${askRu ? say(prompt) : ''}
        </div>
        <label class="quiz-ask" for="quiz-in">${askRu ? 'Was heißt das auf Deutsch?' : `Wie heißt das auf ${LEARN_LANGS[L].name}?`}</label>
        <input id="quiz-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="${askRu ? 'de' : L}" enterkeyhint="done">
        <div class="btn-row">
          <button class="btn" id="quiz-check">Prüfen</button>
          <button class="btn secondary" id="quiz-skip">Weiß ich nicht</button>
        </div>
      </div>`;
    const input = $('#quiz-in');
    setTimeout(() => input.focus(), 50);
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); quizCheck(input.value); } };
    $('#quiz-check').onclick = () => quizCheck(input.value);
    $('#quiz-skip').onclick = () => quizCheck('');
  } else {
    const r = quiz.answer;
    // Nach der Antwort: Ergebnis und die ganze Karte – zuerst die Antwortseite, dann die Frageseite
    view.innerHTML = `
      <div class="quiz">
        <div class="quiz-result ${r.ok ? 'ok' : 'bad'}">
          <b>${r.ok ? (r.override ? '✓ Als richtig gewertet' : r.typo ? '✓ Richtig (kleiner Tippfehler)' : '✓ Richtig!') : r.lost ? '✗ Leider falsch – das Wort kommt zurück in die Übungsgruppe' : '✗ Leider falsch – kommt gleich noch einmal'}</b>
          ${r.mastered ? `<div class="quiz-mastered">⭐ Dieses Wort sitzt jetzt (${QUIZ_STREAK}× richtig in Folge)!${r.nextBatch ? ' Alle 5 sitzen – jetzt kommen die nächsten 5 Wörter.' : ''}</div>` : ''}
          <div>Deine Antwort: ${r.text ? esc(r.text) : '—'}</div>
          <div>Richtig: <b>${esc(r.expected)}</b></div>
        </div>
        <div class="btn-row">
          <button class="btn" id="quiz-next">Weiter</button>
          ${!r.ok ? '<button class="btn secondary" id="quiz-ok">Ich lag doch richtig</button>' : ''}
        </div>
        ${flipCardHtml(card)}
      </div>`;
    $('#quiz-next').onclick = nextQuiz;
    $('#quiz-ok')?.addEventListener('click', quizOverride);
  }
  wireFlipCard(view);
  $$('.say', view).forEach(b => b.onclick = (e) => { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); });
  $$('.info', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const rule = (b.closest('tr') || b.parentElement).nextElementSibling;
    if (rule && rule.classList.contains('vp-rule')) b.classList.toggle('open', rule.classList.toggle('open'));
  });
}

/* ============================================================
   Konjugation üben: Verb + Person + Zeitform → Verbform eintippen (Russisch und Spanisch).
   Zeitformen wählt man vor dem Start. Falsche Aufgaben kommen nach ein paar anderen noch einmal.
   ============================================================ */
let drill = null;
const DRILL_SIZE = 20;
const DRILL_TENSES = {
  es: [['pres', 'Presente'], ['past', 'Pretérito'], ['imperf', 'Imperfecto'], ['perf', 'Perfecto'], ['futs', 'Futuro'], ['cond', 'Condicional'], ['subj', 'Subjuntivo'], ['imp', 'Imperativo']],
  ru: [['pres', 'Präsens (unvollendet)'], ['futpf', 'Zukunft (vollendet)'], ['past', 'Vergangenheit'], ['imp', 'Imperativ']],
};
const DRILL_DEFAULT = { es: ['pres', 'past', 'imperf'], ru: ['pres', 'futpf', 'past'] };
const drillTenses = () => {
  const L = learnLang();
  const sel = (db.settings.drillTenses || {})[L];
  return sel && sel.length ? sel : DRILL_DEFAULT[L];
};

// Alle möglichen Aufgaben zu einer Karte: { verb, person, tense (Name), key (Zeitform), i (Person), answer, … }
function drillTasks(card, tenses) {
  const tasks = [];
  if (learnLang() === 'es') {
    const v = card.x.es_verb || esMainVerb(card.f.es);
    const c = v && esConjugate(v), m = v && esMoreTenses(v);
    if (!c || !m) return tasks;
    const pers = m.dat ? ES_DATIVE.map(p => p + ' …') : ES_PERSONS;
    const forms = { pres: c.pres, past: c.past, imperf: m.imperf, perf: m.perf, futs: m.futs, cond: m.cond, subj: m.subj };
    const name = Object.fromEntries(DRILL_TENSES.es);
    const verb = v.split(':')[0];
    for (const t of tenses) {
      if (t === 'imp') {
        if (m.imp) ['tú', 'tú (verneint)', 'usted', 'ustedes'].forEach((p, i) => tasks.push({ verb, spec: v, person: p, tense: name.imp, key: 'imp', i, answer: m.imp[i] }));
      } else if (forms[t]) forms[t].forEach((f, i) => tasks.push({ verb, spec: v, person: pers[i], tense: name[t], key: t, i, answer: f }));
    }
  } else {
    const x = card.x;
    const PERS = ['я', 'ты', 'он / она', 'мы', 'вы', 'они'];
    const name = Object.fromEntries(DRILL_TENSES.ru);
    const impOf = p => (x[p + '_imp'] !== undefined ? x[p + '_imp'] : ruImperative(x[p], x[p + '_1'], x[p + '_2']));
    const base = p => ({ verb: x[p], inf: x[p], ya: x[p + '_1'], ty: x[p + '_2'], asp: p });
    for (const t of tenses) {
      if (t === 'pres' && x.ipf && x.ipf.replace(STRESS, '') !== 'быть') {
        const f = ruAllPresent(x.ipf, x.ipf_1, x.ipf_2);
        if (f) f.forEach((a, i) => tasks.push({ ...base('ipf'), person: PERS[i], tense: name.pres, key: 'pres', i, answer: a, all: f }));
      }
      if (t === 'futpf' && x.pf && x.pf !== x.ipf) {
        const f = ruAllPresent(x.pf, x.pf_1, x.pf_2);
        if (f) f.forEach((a, i) => tasks.push({ ...base('pf'), person: PERS[i], tense: name.futpf, key: 'futpf', i, answer: a, all: f }));
      }
      if (t === 'past') for (const p of ['ipf', 'pf']) {
        if (!x[p] || (p === 'pf' && x.pf === x.ipf)) continue;
        const f = ruPastForms(x[p]);
        if (f) [['он', 0], ['она', 1], ['они', 3]].forEach(([pr, i]) => tasks.push({ ...base(p), person: pr, tense: name.past, key: 'past', i, answer: f[i], all: f }));
      }
      if (t === 'imp') for (const p of ['ipf', 'pf']) {
        if (!x[p] || (p === 'pf' && x.pf === x.ipf)) continue;
        const imp = impOf(p);
        if (imp && imp !== '—') {
          const own = x[p + '_imp'] !== undefined;
          tasks.push({ ...base(p), person: 'ты', tense: name.imp, key: 'imp', i: 0, answer: imp, own });
          tasks.push({ ...base(p), person: 'вы', tense: name.imp, key: 'imp', i: 1, answer: ruImperativePlural(imp), sg: imp, own });
        }
      }
    }
  }
  return tasks;
}

// Farbe und Schrift der Zeitform (Vergangenheit braun, Zukunft gold)
const DRILL_TENSE_CLS = { past: 't-past', imperf: 't-past', perf: 't-past', futs: 't-fut', futpf: 't-fut' };

/* ---------- Warum heißt die Form so? (Ergebnis im Konjugationstraining) ---------- */
const ES_NAIVE = {
  pres: { ar: ['o', 'as', 'a', 'amos', 'an'], er: ['o', 'es', 'e', 'emos', 'en'], ir: ['o', 'es', 'e', 'imos', 'en'] },
  past: { ar: ['é', 'aste', 'ó', 'amos', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'ieron'], ir: ['í', 'iste', 'ió', 'imos', 'ieron'] },
  imperf: { ar: ['aba', 'abas', 'aba', 'ábamos', 'aban'], er: ['ía', 'ías', 'ía', 'íamos', 'ían'], ir: ['ía', 'ías', 'ía', 'íamos', 'ían'] },
  subj: { ar: ['e', 'es', 'e', 'emos', 'en'], er: ['a', 'as', 'a', 'amos', 'an'], ir: ['a', 'as', 'a', 'amos', 'an'] },
};
const ES_TENSE_RULE = {
  pres: 'Presente: Stamm + -o, -as/-es, -a/-e, -amos/-emos/-imos, -an/-en.',
  past: 'Pretérito: -ar → -é, -aste, -ó, -amos, -aron · -er/-ir → -í, -iste, -ió, -imos, -ieron.',
  imperf: 'Imperfecto: -ar → -aba … · -er/-ir → -ía …',
  futs: 'Futuro: ganzer Infinitiv + -é, -ás, -á, -emos, -án.',
  cond: 'Condicional: ganzer Infinitiv + -ía, -ías, -ía, -íamos, -ían.',
  perf: 'Pretérito perfecto: he, has, ha, hemos, han + Partizip (-ado / -ido).',
  subj: 'Subjuntivo: Stamm der yo-Form + „falscher“ Vokal: -ar → -e, -er/-ir → -a.',
  imp: 'Imperativo: tú = él-Form; verneint, usted, ustedes = Subjuntivo.',
};
// Stammwechsel aus dem Vergleich ablesen (tenes → tienes: e → ie)
function esStemDiff(naive, actual) {
  if (!naive || !actual) return '';
  for (const [from, to] of [['e', 'ie'], ['o', 'ue'], ['u', 'ue'], ['e', 'i'], ['o', 'u']]) {
    for (let p = naive.indexOf(from); p >= 0; p = naive.indexOf(from, p + 1)) {
      if (naive.slice(0, p) + to + naive.slice(p + from.length) === actual) return `<b>Stammwechsel ${from} → ${to}</b> im betonten Stamm (${esc(naive)} → ${esc(actual)}).`;
    }
  }
  return '';
}
const verbOnly = s => (s || '').replace(/^(no )?(me|te|se|nos|le|les) /, '').replace(/^(no )/, '').split(' ')[0];

function esWhy(t) {
  const [spec, forced] = t.spec.trim().split(':');
  let inf = spec.trim().split(/\s+/)[0];
  const refl = /(ar|er|ir|ír)se$/.test(inf);
  if (refl) inf = inf.slice(0, -2);
  const end = inf.slice(-2).replace('í', 'i'), stem = inf.slice(0, -2);
  const cls = forced || ES_STEM[inf] || '';
  const key = ES_IRREG[inf] ? inf : ES_PREFIXABLE.find(k => inf.endsWith(k) && inf.length > k.length);
  const k = t.key, i = t.i;
  const actual = verbOnly(t.answer);
  // Regelmäßig gebildete Form zum Vergleich
  let naive = '';
  if (ES_NAIVE[k] && ES_NAIVE[k][end]) naive = stem + ES_NAIVE[k][end][i];
  if (k === 'futs') naive = inf.replace('ír', 'ir') + ['é', 'ás', 'á', 'emos', 'án'][i];
  if (k === 'cond') naive = inf.replace('ír', 'ir') + ['ía', 'ías', 'ía', 'íamos', 'ían'][i];
  if (k === 'perf') naive = stem + (end === 'ar' ? 'ado' : 'ido');
  if (k === 'imp') naive = i === 0 ? stem + ES_NAIVE.pres[end][2] : stem + ES_NAIVE.subj[end][i === 1 ? 1 : i === 2 ? 2 : 4];
  const compare = k === 'perf' ? t.answer.split(' ').pop() : k === 'imp' && i === 1 ? t.answer.split(' ').pop() : actual;
  const lines = [`<div>${ES_TENSE_RULE[k] || ''}</div>`];
  const plain = s => s.replace(/[áéíóú]/g, v => ES_DEACCENT[v]);
  if (!naive || compare === naive || (refl && plain(compare) === plain(naive) && k === 'imp')) {
    lines.push(`<div>✅ <b>Regelmäßig</b>: ${esc(stem)}- + Endung → ${esc(t.answer)}.</div>`);
    if (refl) lines.push(`<div>Reflexiv: Das Pronomen (${k === 'imp' ? 'angehängt, Akzent hält die Betonung' : 'me, te, se, nos, se'}) gehört dazu.</div>`);
    return lines.join('');
  }
  lines.push(['ser', 'ir'].includes(inf) ? `<div>⚠️ <b>Ganz unregelmäßiges Verb</b> – die Formen muss man lernen.</div>` : `<div>⚠️ <b>Weicht von der Regel ab:</b> regelmäßig wäre <s>${esc(naive)}</s>, richtig ist <b>${esc(compare)}</b>.</div>`);
  const why = [];
  const yoStem = k === 'subj' || (k === 'imp' && i > 0);
  if (ES_IRREG_NOTE[inf] && ['pres', 'past', 'subj', 'imp'].includes(k)) why.push(ES_IRREG_NOTE[inf]);
  if (k === 'imperf' && ES_IMPF_IRREG[inf]) why.push(`Nur drei Verben sind im Imperfecto unregelmäßig: ser (era), ir (iba), ver (veía).`);
  if ((k === 'futs' || k === 'cond') && esFutStem(inf) !== inf.replace('ír', 'ir')) why.push(`Verkürzter Stamm <b>${esc(esFutStem(inf))}-</b> statt ${esc(inf)}- (wie tendr-, pondr-, saldr-, har-, dir-, podr-, sabr-, querr-).`);
  if (k === 'perf' && compare !== naive) why.push(`Unregelmäßiges Partizip <b>${esc(esParticiple(inf, end, stem))}</b> (wie hecho, dicho, visto, puesto, escrito, abierto, vuelto, roto, muerto).${/[aeo]ído$/.test(compare) ? ' Hier: Stamm endet auf Vokal → -ído mit Akzent.' : ''}`);
  if (k === 'imp' && i === 0 && ES_IMP_TU[key || inf]) why.push('Eine der acht kurzen tú-Formen: di, haz, ve, pon, sal, sé, ten, ven.');
  if (yoStem && !ES_SUBJ_IRREG[inf]) {
    const yo = esConjugate(inf + (forced ? ':' + forced : '')).pres[0].replace(/^(me|te|se|nos) /, '');
    if (!yo.startsWith(stem) || yo !== stem + 'o') why.push(`Der Subjuntivo kommt vom Stamm der <b>yo-Form</b>: ${esc(yo)} → ${esc(yo.replace(/o$/, ''))}-.`);
  }
  if (yoStem && ES_SUBJ_IRREG[inf]) why.push('Unregelmäßiger Subjuntivo, auswendig lernen (sea, vaya, esté, dé, sepa, haya).');
  if (key && ['pres', 'past'].includes(k) && !ES_IRREG_NOTE[inf]) {
    const pre = inf.slice(0, inf.length - key.length);
    if (k === 'pres' && i === 0) why.push(/g/.test(actual) && !/g/.test(naive)
      ? `yo-Form mit eingeschobenem <b>-g-</b>${pre ? ` (wie ${key})` : ''}: ${esc(actual)} – genauso tengo, pongo, salgo, hago, digo, traigo.`
      : esStemDiff(naive, compare) || `Unregelmäßige yo-Form: <b>${esc(actual)}</b> – auswendig lernen (wie sé, quepo, veo, doy, estoy, voy, soy, he).`);
    else if (k === 'past') why.push(`Pretérito mit eigenem Stamm und ohne Akzent${pre ? ` (wie ${key})` : ''}: tuve, puse, hice, dije, vine, traje.`);
    else why.push(esStemDiff(naive, compare) || `Unregelmäßiges Verb${pre ? ` (wie ${key})` : ''}.`);
  }
  const stressed = i !== 3 && ['pres', 'subj', 'imp'].includes(k);
  if (['ie', 'ie-i'].includes(cls) && (stressed || (k === 'subj' && i === 3 && end === 'ir'))) why.push(stressed ? '<b>Stammwechsel e → ie</b>: Ist der Stamm betont, wird e zu ie (nicht bei nosotros).' : 'Bei -ir-Verben wird im Subjuntivo auch bei nosotros e → i.');
  if (['ue', 'ue-u'].includes(cls) && (stressed || (k === 'subj' && i === 3 && end === 'ir'))) why.push(stressed ? '<b>Stammwechsel o → ue</b>: Ist der Stamm betont, wird o zu ue (nicht bei nosotros).' : 'Bei -ir-Verben wird im Subjuntivo auch bei nosotros o → u.');
  if (cls === 'i' && (stressed || k === 'subj')) why.push('<b>Stammwechsel e → i</b> (wie pedir: pido, pides).');
  if (['ie-i', 'i'].includes(cls) && k === 'past' && (i === 2 || i === 4)) why.push('-ir-Verb mit Stammwechsel: im Pretérito bei él und ellos <b>e → i</b> (sintió, pidieron).');
  if (cls === 'ue-u' && k === 'past' && (i === 2 || i === 4)) why.push('-ir-Verb mit Stammwechsel: im Pretérito bei él und ellos <b>o → u</b> (durmió, murieron).');
  if (['ie-i', 'i', 'ue-u'].includes(cls) && k === 'ger') why.push('Gerundio mit Stammwechsel (sintiendo, durmiendo).');
  if (cls === 'acc' && stressed) why.push('i bzw. u bekommt einen <b>Akzent</b>, weil es betont ist (envío, continúas).');
  // Rechtschreibung: Laut bleibt gleich
  if (end === 'ar' && (k === 'past' && i === 0 || yoStem)) {
    if (/c$/.test(stem)) why.push('<b>c → qu</b> vor e, damit es wie k klingt (busqué, busque).');
    if (/g$/.test(stem)) why.push('<b>g → gu</b> vor e, damit es wie g klingt (llegué, llegue).');
    if (/z$/.test(stem)) why.push('<b>z → c</b> vor e – im Spanischen schreibt man vor e und i c statt z (empecé, empiece).');
  }
  if (end !== 'ar' && (k === 'pres' && i === 0 || yoStem)) {
    if (/g$/.test(stem) && !key) why.push('<b>g → j</b> vor o und a, damit es wie ch klingt (escojo, escoja).');
    if (/gu$/.test(stem) && !key) why.push('<b>gu → g</b> vor o und a (sigo, siga).');
    if (/[aeiou]c$/.test(stem) && !key) why.push('Vokal + -cer/-cir: <b>c → zc</b> (conozco, conozca).');
    if (/[^aeiou]c$/.test(stem) && !key) why.push('Konsonant + -cer: <b>c → z</b> (venzo, venza).');
  }
  if (end === 'ir' && /[^gq]u$/.test(stem)) why.push('Verben auf -uir schieben ein <b>y</b> ein (construyo, construyó).');
  if (end !== 'ar' && /[aeo]$/.test(stem) && k === 'past' && (i === 2 || i === 4)) why.push('Stamm endet auf Vokal: <b>i → y</b> zwischen Vokalen (leyó, leyeron).');
  if (k === 'imp' && refl) why.push('Pronomen wird angehängt; ein Akzent hält die Betonung an der alten Stelle (levanta + te → levántate).');
  if (!why.length) why.push(esStemDiff(naive, compare) || 'Diese Form muss man sich merken – sie folgt nicht der Grundregel.');
  return lines.concat(why.map(w => `<div>• ${w}</div>`)).join('');
}

// Russisch: Konjugation, Konsonantenwechsel, Betonung, unregelmäßige Formen
const RU_ALT = [['ст', 'щ'], ['ск', 'щ'], ['д', 'ж'], ['з', 'ж'], ['г', 'ж'], ['с', 'ш'], ['х', 'ш'], ['т', 'ч'], ['т', 'щ'], ['к', 'ч'], ['б', 'бл'], ['п', 'пл'], ['в', 'вл'], ['м', 'мл'], ['ф', 'фл']];
function ruStemAlt(a, b) {
  // a: Stamm vorher, b: Stamm nachher → passender Wechsel am Stammende
  for (const [x, y] of RU_ALT) if (a.endsWith(x) && b.endsWith(y) && a.slice(0, -x.length) === b.slice(0, -y.length)) return [x, y];
  return null;
}
function ruWhy(t) {
  const plain = s => (s || '').replace(STRESS, '').replace(/ё/g, 'е');
  const lines = [];
  const inf = t.inf, pinf = plain(inf);
  if (t.key === 'pres' || t.key === 'futpf') {
    const type = ruConjType(inf, t.ya, t.ty);
    lines.push(`<div><b>${esc(type)}</b>${t.key === 'futpf' ? ' – vollendetes Verb: diese Formen sind <span class="t-fut">Zukunft</span>.' : ''}</div>`);
    if (/unregelmäßig|gemischt/.test(type)) lines.push('<div>• Unregelmäßiges Verb – die Formen muss man lernen.</div>');
    const ya = plain(t.ya).replace(/(сь|ся)$/, ''), ty = plain(t.ty).replace(/(сь|ся)$/, '');
    const yaStem = ya.replace(/[уюя]$/, ''), tyStem = ty.replace(/(ешь|ёшь|ишь)$/, '').replace(/[ео]$/, '');
    if (/ишь$/.test(ty)) {
      const alt = ruStemAlt(tyStem, yaStem);
      if (alt) lines.push(`<div>• <b>Konsonantenwechsel nur in der я-Form:</b> ${alt[0]} → ${alt[1]} (${esc(t.ty)} → ${esc(t.ya)}).${t.i === 0 ? ' Genau das ist hier gefragt!' : ' Hier (nicht я) also der normale Stamm.'}</div>`);
    } else {
      const infStem = pinf.replace(/(ся|сь)$/, '').replace(/(ать|ять|еть|ить|оть|уть|ыть|ть|ти|чь)$/, '');
      const alt = ruStemAlt(infStem, yaStem);
      if (alt) lines.push(`<div>• <b>Konsonantenwechsel in allen Formen:</b> ${alt[0]} → ${alt[1]} (${esc(inf)} → ${esc(t.ya)}, ${esc(t.ty)}).</div>`);
      else if (ruStemAlt(yaStem, tyStem)) { const a2 = ruStemAlt(yaStem, tyStem); lines.push(`<div>• <b>Konsonantenwechsel:</b> я- und они́-Form haben ${a2[0]}, alle anderen ${a2[1]} (${esc(t.ya)} – ${esc(t.ty)} – ${esc((t.all || [])[5] || '')}).</div>`); }
      else if (/ова(ть|ться)$/.test(pinf)) lines.push('<div>• -ова- wird im Präsens zu -у-: рисова́ть → рису́ю, рису́ешь.</div>');
      else if (/ава(ть|ться)$/.test(pinf)) lines.push('<div>• -ава- verliert das -ва-: дава́ть → даю́, даёшь.</div>');
    }
    const stressPos = s => { const m = s.match(/[аеиоуыэюяё](?=́)|ё/); return m ? m.index : -1; };
    const yaEnd = /[уюя]́/.test(t.ya) || /[уюя]́(сь)?$/.test(t.ya);
    const tyEnd = /[еёи]́?шь/.test(t.ty) && (/ё/.test(t.ty) || /[еи]́шь/.test(t.ty));
    if (yaEnd && !tyEnd && stressPos(t.ty) >= 0) lines.push(`<div>• <b>Betonung wandert:</b> я-Form auf der Endung (${esc(t.ya)}), alle anderen auf dem Stamm (${esc(t.ty)}).</div>`);
    lines.push(`<div>Merke: Aus der я- und ты-Form ergeben sich alle anderen (они́: ${esc((t.all || [])[5] || '')}).</div>`);
  } else if (t.key === 'past') {
    const irr = RU_PAST_IRREG[pinf] || RU_PAST_IRREG[inf.replace(STRESS, '')];
    if (irr) lines.push(`<div>⚠️ <b>Unregelmäßige <span class="t-past">Vergangenheit</span>:</b> ${esc(irr.join(', '))} – der Stamm ändert sich, das muss man lernen.</div>`);
    else lines.push(`<div><span class="t-past">Vergangenheit</span>: Infinitiv ohne -ть + <b>-л</b> (er), <b>-ла</b> (sie), <b>-ло</b> (es), <b>-ли</b> (Plural)${/(ся|сь)$/.test(pinf) ? ', dahinter -ся/-сь' : ''}.</div>`);
    lines.push('<div>Die Vergangenheit richtet sich nach dem <b>Geschlecht</b>, nicht nach der Person: я был (Mann), я была́ (Frau).</div>');
  } else if (t.key === 'imp') {
    const all = ruAllPresent(inf, t.ya, t.ty);
    const oni = all ? all[5] : '';
    if (t.i === 1) lines.push(`<div>вы-Form = ты-Form + <b>-те</b> (${esc(t.sg)} → ${esc(t.answer)}).</div>`);
    if (t.own) lines.push('<div>⚠️ <b>Unregelmäßiger Imperativ</b> – nicht nach der Grundregel gebildet, auswendig lernen.</div>');
    else lines.push(`<div>Regel: Stamm der они́-Form${oni ? ` (${esc(oni)})` : ''}, dann: nach Vokal <b>-й</b>, bei betonter я-Endung oder zwei Konsonanten <b>-и</b>, sonst <b>-ь</b>.</div>`);
  }
  return lines.join('');
}

// Akzent vergessen oder zu viel? Erklären, was er hier bedeutet
const ES_ACCENT_PAIRS = {
  'sé': 'sé = ich weiß (saber) bzw. sei! (ser) – se = sich',
  'dé': 'dé = (dass) er gebe (dar) – de = von',
  'él': 'él = er – el = der',
  'tú': 'tú = du – tu = dein',
  'mí': 'mí = mich, mir – mi = mein',
  'sí': 'sí = ja – si = wenn, ob',
  'más': 'más = mehr – mas = aber (veraltet)',
  'té': 'té = Tee – te = dich, dir',
};
function esAccentWhy(t, given) {
  const exp = t.answer.toLowerCase().split(/\s+/), giv = drillNorm(given).split(/\s+/);
  const plain = s => s.replace(/[áéíóú]/g, v => ES_DEACCENT[v]);
  const lines = [];
  // Welche andere Form wäre die eingetippte? (hablo statt habló)
  const m = esMoreTenses(t.spec), c = esConjugate(t.spec);
  const names = { pres: 'Presente', past: 'Pretérito', imperf: 'Imperfecto', futs: 'Futuro', cond: 'Condicional', subj: 'Subjuntivo' };
  const lookup = w => {
    for (const [k, list] of Object.entries({ pres: c && c.pres, past: c && c.past, imperf: m && m.imperf, futs: m && m.futs, cond: m && m.cond, subj: m && m.subj })) {
      const j = (list || []).findIndex(f => verbOnly(f) === w);
      if (j >= 0) return `${(m && m.dat ? ES_DATIVE : ES_PERSONS)[j]} · ${names[k]}`;
    }
    return '';
  };
  exp.forEach((e, n) => {
    const g = giv[n] || '';
    if (!g || e === g || plain(e) !== plain(g)) return;
    if (/[áéíóú]/.test(e) && !/[áéíóú]/.test(g)) {
      if (esNuclei(e).length < 2) lines.push(`<b>Akzent vergessen:</b> ${esc(e)}. Einsilbige Wörter bekommen einen Akzent nur, um sie von einem gleich geschriebenen Wort zu unterscheiden: ${esc(ES_ACCENT_PAIRS[e] || e + ' ≠ ' + g)}.`);
      else {
        const other = lookup(g);
        lines.push(`<b>Akzent vergessen:</b> ${esc(e)}. Der Akzent zeigt die betonte Silbe – und ändert hier die Bedeutung: ${esc(g)}${other ? ` wäre <i>${esc(other)}</i>` : ' ist eine andere Form'}.`);
      }
    } else if (!/[áéíóú]/.test(e) && /[áéíóú]/.test(g)) {
      lines.push(`<b>Hier kommt kein Akzent hin:</b> ${esc(e)} – die Betonung folgt der Regel (Vokal, -n, -s → vorletzte Silbe), deshalb kein Akzent.${lookup(g) ? ` ${esc(g)} wäre ${esc(lookup(g))}.` : ''}`);
    } else lines.push(`<b>Akzent an der falschen Stelle:</b> richtig ist ${esc(e)}.`);
  });
  lines.push('<span class="sub">Wofür Akzente gut sind: Sie zeigen die betonte Silbe, wenn sie von der Regel abweicht (habló = er sprach, hablo = ich spreche), und unterscheiden gleich geschriebene Wörter (sé / se, él / el, tú / tu, sí / si). Fragewörter haben immer einen: qué, cómo, dónde.</span>');
  return lines.map(l => `<div>${l}</div>`).join('');
}

function startDrill(deckIds, title) {
  drill = { deckIds, title, setup: true };
  document.body.classList.add('studying');
  setHeader(title, () => { drill = null; go('learn'); });
  stopStudyKeys();
  renderDrill();
}

// Gedächtnis des Konjugationstrainings je Verb: s = so oft hintereinander beim ersten Versuch richtig,
// recent = zuletzt gefragte Formen (damit Person und Zeitform wechseln), t = zuletzt geübt
const DRILL_SURE = 3;
const drillStats = () => {
  const all = db.drillStats || (db.drillStats = {});
  return all[learnLang()] || (all[learnLang()] = {});
};

function beginDrill() {
  const tenses = drillTenses();
  const st = drillStats();
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cards = learnCards(drill.deckIds).filter(c => c.type === 'verbpair');
  // Reihenfolge: Verben in Arbeit (noch nicht sicher), dann neue Verben aus dem Block (häufigste zuerst), dann sichere zur Wiederholung
  const inWork = shuffle(cards.filter(c => st[c.id] && st[c.id].s < DRILL_SURE));
  const fresh = cards.filter(c => !st[c.id]);
  const sure = cards.filter(c => st[c.id] && st[c.id].s >= DRILL_SURE).sort((a, b) => (st[a.id].t || 0) - (st[b.id].t || 0));
  const order = inWork.slice(0, 12).concat(fresh, inWork.slice(12), sure);
  const queue = [];
  for (const c of order) {
    if (queue.length >= DRILL_SIZE) break;
    const tasks = drillTasks(c, tenses);
    if (!tasks.length) continue;
    // Formen, die zuletzt dran waren, auslassen; seltener geübte Zeitformen bevorzugen
    const recent = (st[c.id] && st[c.id].recent) || [];
    const unseen = tasks.filter(t => !recent.includes(`${t.key}:${t.i}`));
    const pool = unseen.length ? unseen : tasks;
    const count = k => recent.filter(r => r.startsWith(k + ':')).length;
    const minCount = Math.min(...pool.map(t => count(t.key)));
    const best = pool.filter(t => count(t.key) === minCount);
    queue.push({ ...best[Math.floor(Math.random() * best.length)], id: c.id, tries: 0 });
  }
  if (!queue.length) { toast('Keine passenden Verben gefunden'); return; }
  shuffle(queue);
  Object.assign(drill, { setup: false, queue, total: queue.length, firstTry: 0, cur: null, answer: null });
  document.addEventListener('keydown', drillKeys);
  nextDrill();
}

function nextDrill() {
  drill.cur = drill.queue.shift() || null;
  drill.answer = null;
  renderDrill();
}

// Vergleich: Russisch ohne Betonungszeichen (ё = е), Spanisch genau – nur ein fehlender Akzent wird gesondert gemeldet
const drillNorm = s => (s || '').toLowerCase().replace(STRESS, '').replace(/ё/g, 'е').replace(/[¡!¿?.,]/g, ' ').replace(/\s+/g, ' ').trim();
function drillCheck(text) {
  const cur = drill.cur;
  const a = drillNorm(text), e = drillNorm(cur.answer);
  const deacc = s => s.replace(/[áéíóú]/g, v => ES_DEACCENT[v]);
  const ok = !!a && a === e;
  const accent = !ok && !!a && deacc(a) === deacc(e);
  cur.tries++;
  if (ok && cur.tries === 1) drill.firstTry++;
  if (!ok) drill.queue.splice(Math.min(QUIZ_GAP, drill.queue.length), 0, cur);
  drill.answer = { text, ok, accent };
  if (cur.tries === 1) drill.answer.before = drillRecord(cur, ok);
  renderDrill();
}

// Nur der erste Versuch zählt fürs Gedächtnis: richtig → Serie +1 (sicher ab DRILL_SURE), falsch → 0
function drillRecord(cur, ok) {
  const st = drillStats();
  const before = st[cur.id] ? { ...st[cur.id], recent: [...(st[cur.id].recent || [])] } : null;
  const s = st[cur.id] || (st[cur.id] = { s: 0, recent: [] });
  s.s = ok ? s.s + 1 : 0;
  s.t = Date.now();
  s.recent = (s.recent || []).filter(r => r !== `${cur.key}:${cur.i}`).concat(`${cur.key}:${cur.i}`).slice(-8);
  if (ok && s.s === DRILL_SURE) drill.answer.sure = true;
  save();
  return before;
}

function drillOverride() {
  const cur = drill.cur;
  const i = drill.queue.indexOf(cur);
  if (i >= 0) drill.queue.splice(i, 1);
  if (cur.tries === 1) {
    drill.firstTry++;
    const st = drillStats();
    if (drill.answer.before) st[cur.id] = drill.answer.before; else delete st[cur.id];
    drillRecord(cur, true);
  }
  drill.answer.ok = true;
  drill.answer.override = true;
  renderDrill();
}

function drillKeys(e) {
  if (!drill || drill.setup || e.key !== 'Enter') return;
  if (drill.answer) { e.preventDefault(); nextDrill(); }
}

function renderDrill() {
  const view = $('#view');
  const L = learnLang();
  if (drill.setup) {
    const sel = new Set(drillTenses());
    $('#header-extra').innerHTML = '';
    view.innerHTML = `
      <div class="quiz">
        <p>Welche Zeitformen möchtest du üben? Es kommen ${DRILL_SIZE} Aufgaben: zuerst Verben, die noch nicht sitzen, dann neue aus dem Block. Person und Zeitform wechseln jedes Mal.</p>
        <p class="sub" style="color:var(--muted);font-size:13px">${(() => { const st = drillStats(); const vs = learnCards(drill.deckIds).filter(c => c.type === 'verbpair'); return `${vs.filter(c => st[c.id] && st[c.id].s >= DRILL_SURE).length} von ${vs.length} Verben sitzen (${DRILL_SURE}× hintereinander richtig).`; })()}</p>
        <div class="chips drill-chips">${DRILL_TENSES[L].map(([k, t]) => `<button class="chip ${sel.has(k) ? 'active' : ''}" data-tense="${k}">${esc(t)}</button>`).join('')}</div>
        <div class="btn-row"><button class="btn" id="drill-go">Los geht's</button></div>
        <p class="sub" style="color:var(--muted);font-size:13px">${L === 'es' ? 'Akzente zählen: habló ist nicht hablo. Reflexive Verben mit Pronomen eintippen (me levanto).' : 'Betonungszeichen musst du nicht eintippen.'}</p>
      </div>`;
    $$('[data-tense]', view).forEach(b => b.onclick = () => {
      const all = db.settings.drillTenses || (db.settings.drillTenses = {});
      const cur = new Set(drillTenses());
      cur.has(b.dataset.tense) ? cur.delete(b.dataset.tense) : cur.add(b.dataset.tense);
      all[L] = DRILL_TENSES[L].map(([k]) => k).filter(k => cur.has(k));
      save();
      renderDrill();
    });
    $('#drill-go').onclick = beginDrill;
    return;
  }
  const cur = drill.cur;
  const left = drill.queue.length + (cur ? 1 : 0);
  $('#header-extra').innerHTML = cur ? `<span class="hbadge" title="noch übrig">${left}</span>` : '';
  if (!cur) {
    view.innerHTML = `
      <div class="done">
        <div class="big">🎉</div>
        <h2>Geschafft!</h2>
        <p>${drill.firstTry} von ${drill.total} Formen beim ersten Versuch richtig.</p>
        <button class="btn" id="drill-again">Neue Runde</button><br>
        <button class="btn secondary" id="drill-end">Zur Übersicht</button>
      </div>`;
    $('#drill-again').onclick = () => startDrill(drill.deckIds, drill.title);
    $('#drill-end').onclick = () => { drill = null; go('learn'); };
    document.removeEventListener('keydown', drillKeys);
    return;
  }
  const card = db.cards[cur.id];
  const say = t => `<button class="say" data-lang="${L}" data-say="${esc(t)}">🔊</button>`;
  if (!drill.answer) {
    view.innerHTML = `
      <div class="quiz">
        <div class="quiz-prompt">
          <div class="lang-tag drill-tense ${DRILL_TENSE_CLS[cur.key] || ''}">${esc(cur.tense)}</div>
          <div class="q-word">${esc(cur.verb)}</div>${say(cur.verb)}
          <div class="drill-person">${esc(cur.person)}</div>
          <div class="sub">${esc(card.f.de || '')}</div>
        </div>
        <label class="quiz-ask" for="drill-in">Wie lautet die Form?</label>
        <input id="drill-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="${L}" enterkeyhint="done">
        <div class="btn-row">
          <button class="btn" id="drill-check">Prüfen</button>
          <button class="btn secondary" id="drill-skip">Weiß ich nicht</button>
        </div>
      </div>`;
    const input = $('#drill-in');
    setTimeout(() => input.focus(), 50);
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); drillCheck(input.value); } };
    $('#drill-check').onclick = () => drillCheck(input.value);
    $('#drill-skip').onclick = () => drillCheck('');
  } else {
    const r = drill.answer;
    view.innerHTML = `
      <div class="quiz">
        <div class="quiz-result ${r.ok ? 'ok' : r.accent ? 'warn' : 'bad'}">
          <b>${r.ok ? (r.override ? '✓ Als richtig gewertet' : '✓ Richtig!') : r.accent ? '⚠️ Akzent vergessen oder falsch – fast richtig! Kommt gleich noch einmal.' : '✗ Leider falsch – kommt gleich noch einmal'}</b>
          ${r.sure ? `<div class="quiz-mastered">⭐ Dieses Verb sitzt jetzt (${DRILL_SURE}× hintereinander richtig) – ab jetzt kommen mehr neue Verben dran.</div>` : ''}
          <div>${esc(cur.verb)} · ${esc(cur.person)} · <span class="${DRILL_TENSE_CLS[cur.key] || ''}">${esc(cur.tense)}</span></div>
          <div>Deine Antwort: ${r.text ? esc(r.text) : '—'}</div>
          <div>Richtig: <b>${esc(cur.answer)}</b> ${say(cur.answer)}</div>
          ${r.accent && L === 'es' ? `<div class="drill-why">${esAccentWhy(cur, r.text)}</div>` : ''}
        </div>
        <div class="drill-why-box">
          <div class="drill-why-title">Warum heißt die Form so?</div>
          ${L === 'es' ? esWhy(cur) : ruWhy(cur)}
        </div>
        <div class="btn-row">
          <button class="btn" id="drill-next">Weiter</button>
          ${!r.ok ? '<button class="btn secondary" id="drill-ok">Ich lag doch richtig</button>' : ''}
        </div>
        ${flipCardHtml(card)}
      </div>`;
    $('#drill-next').onclick = nextDrill;
    $('#drill-ok')?.addEventListener('click', drillOverride);
  }
  wireFlipCard(view);
  $$('.say', view).forEach(b => b.onclick = (e) => { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); });
  $$('.info', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const rule = (b.closest('tr') || b.parentElement).nextElementSibling;
    if (rule && rule.classList.contains('vp-rule')) b.classList.toggle('open', rule.classList.toggle('open'));
  });
}

/* ============================================================
   Ansicht: Kartenliste
   ============================================================ */
let cardFilter = { q: '', deck: '' };
let lastDeck = '';

function renderCards() {
  setHeader('Karten');
  const decks = Object.values(db.decks);
  const view = $('#view');
  view.innerHTML = `
    <div class="section" style="display:grid;gap:8px">
      <input type="search" id="search" placeholder="Suchen …" value="${esc(cardFilter.q)}">
      <select id="deck-filter">
        <option value="">Alle Decks</option>
        ${decks.map(d => `<option value="${esc(d.id)}" ${cardFilter.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
      </select>
    </div>
    <div id="list"></div>
    <button class="fab" id="add" aria-label="Neue Karte">+</button>`;
  const renderList = () => {
    const q = cardFilter.q.trim().toLowerCase().replace(STRESS, '');
    let cards = Object.values(db.cards).sort((a, b) => b.created - a.created);
    if (cardFilter.deck) cards = cards.filter(c => c.deck === cardFilter.deck);
    if (q) cards = cards.filter(c => Object.values(c.f).some(v => v.toLowerCase().replace(STRESS, '').includes(q)));
    const total = cards.length;
    cards = cards.slice(0, 300);
    const l1 = learnLang(), l2 = 'de';   // Wort in der Lernsprache vorne
    $('#list').innerHTML = total ? `
      <p style="color:var(--muted);font-size:13px;margin-bottom:8px">${total} Karten${total > 300 ? ' (erste 300 angezeigt)' : ''}</p>
      <div class="panel">
        ${cards.map(c => `
          <div class="row clickable" data-edit="${esc(c.id)}">
            <div class="grow">
              <div class="ellipsis"><b>${esc(c.f[l1] || c.f.ru || c.f.es || '—')}</b></div>
              <div class="sub ellipsis">${esc(c.f[l2] || '')}</div>
            </div>
            <span class="badge">${esc((CARD_TYPES[c.type] || CARD_TYPES.word).name)}</span>
          </div>`).join('')}
      </div>` : `<div class="empty">Keine Karten gefunden.</div>`;
    $$('[data-edit]').forEach(r => r.onclick = () => showCard(r.dataset.edit));
  };
  $('#search').oninput = (e) => { cardFilter.q = e.target.value; renderList(); };
  $('#deck-filter').onchange = (e) => { cardFilter.deck = e.target.value; renderList(); };
  $('#add').onclick = () => editCard(null);
  renderList();
}

// Karte ansehen (aus der Suche): beide Seiten untereinander, Bearbeiten nur über den Knopf
function showCard(id) {
  const card = db.cards[id];
  if (!card) { go('cards'); return; }
  setHeader(db.decks[card.deck]?.name || 'Karte', () => go('cards'));
  const view = $('#view');
  const learnSide = card.f[learnLang()] ? cardLearnSide(card) : card.f.ru ? cardRuSide(card) : cardEsSide(card);
  view.innerHTML = `
    <div class="card-view">
      <div class="btn-row" style="justify-content:flex-end">
        <button class="btn small" id="edit-shown">✏️ Bearbeiten</button>
      </div>
      <div class="quiz-card">${learnSide}</div>
      <div class="quiz-card">${cardTrSide(card)}${conjugationHtml(card)}${extrasHtml(card)}</div>
    </div>`;
  $('#edit-shown').onclick = () => editCard(id, () => showCard(id));
  $$('.say', view).forEach(b => b.onclick = () => speak(b.dataset.say, b.dataset.lang));
  $$('.info', view).forEach(b => b.onclick = () => {
    const rule = (b.closest('tr') || b.parentElement).nextElementSibling;
    if (rule && rule.classList.contains('vp-rule')) b.classList.toggle('open', rule.classList.toggle('open'));
  });
  view.scrollTop = 0;
}

/* ============================================================
   Ansicht: Karte bearbeiten / anlegen
   ============================================================ */
function editCard(id, onDone) {
  const existing = id ? db.cards[id] : null;
  const card = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: uid(), deck: (db.decks[lastDeck] && lastDeck) || cardFilter.deck || Object.keys(db.decks)[0] || '', type: 'word', f: {}, x: {}, created: Date.now() };
  const back = onDone || (() => go(tab));
  stopStudyKeys();
  setHeader(existing ? 'Karte bearbeiten' : 'Neue Karte', back);
  const view = $('#view');

  const draw = () => {
    const defs = (CARD_TYPES[card.type] || CARD_TYPES.word).extras.concat(COMMON_EXTRAS);
    const decks = Object.values(db.decks);
    view.innerHTML = `
      <label class="field"><span>Deck</span>
        <select id="f-deck">
          ${decks.map(d => `<option value="${esc(d.id)}" ${card.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
          ${decks.length ? '' : '<option value="">Meine Karten (wird angelegt)</option>'}
          <option value="__new">+ Neues Deck …</option>
        </select>
      </label>
      <label class="field"><span>Kartentyp</span>
        <select id="f-type">
          ${Object.entries(CARD_TYPES).map(([k, t]) => `<option value="${k}" ${card.type === k ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
        </select>
      </label>
      ${db.languages.map(l => `
        <label class="field"><span>${esc(l.name)}${l.active ? '' : ' (inaktiv)'}</span>
          <input type="text" data-lang="${esc(l.code)}" value="${esc(card.f[l.code] || '')}" ${l.code === 'ru' ? 'lang="ru"' : ''}>
        </label>`).join('')}
      ${defs.map(d => `
        <label class="field"><span>${esc(d.label)}</span>
          ${d.options
            ? `<select data-x="${d.key}"><option value="">—</option>${Object.entries(d.options).map(([k, v]) => `<option value="${k}" ${card.x[d.key] === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`
            : `<input type="text" data-x="${d.key}" value="${esc(card.x[d.key] || '')}">`}
        </label>`).join('')}
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Tipp: Betonung mit Akzent nach dem Vokal, z. B. „молоко́“.</p>
      <div class="btn-row">
        <button class="btn" id="save">Speichern</button>
        ${existing ? '<button class="btn danger" id="del">Löschen</button>' : ''}
        ${existing ? '<button class="btn secondary" id="reset">Fortschritt zurücksetzen</button>' : ''}
      </div>`;

    const collect = () => {
      $$('[data-lang]', view).forEach(i => { const v = i.value.trim(); if (v) card.f[i.dataset.lang] = v; else delete card.f[i.dataset.lang]; });
      $$('[data-x]', view).forEach(i => { const v = i.value.trim(); if (v) card.x[i.dataset.x] = v; else delete card.x[i.dataset.x]; });
    };
    $('#f-type').onchange = (e) => { collect(); card.type = e.target.value; draw(); };
    $('#f-deck').onchange = (e) => {
      if (e.target.value !== '__new') { card.deck = e.target.value; return; }
      const name = prompt('Name des neuen Decks:');
      if (name && name.trim()) {
        const d = { id: uid(), name: name.trim(), active: true };
        db.decks[d.id] = d; save();
        card.deck = d.id;
      }
      collect(); draw();
    };
    $('#save').onclick = () => {
      collect();
      if (Object.keys(card.f).length < 2) { toast('Bitte mindestens zwei Sprachen ausfüllen.'); return; }
      if (!card.deck || !db.decks[card.deck]) {
        const d = { id: uid(), name: 'Meine Karten', active: true };
        db.decks[d.id] = d; card.deck = d.id;
      }
      db.cards[card.id] = card; markCards();
      lastDeck = card.deck;
      save();
      toast('Gespeichert');
      if (existing) back();
      else editCard(null, onDone);
    };
    $('#del')?.addEventListener('click', () => {
      if (!confirm('Karte wirklich löschen?')) return;
      delete db.cards[card.id]; markCards();
      for (const k of Object.keys(db.progress)) if (k.startsWith(card.id + '|')) delete db.progress[k];
      if (study) study.queue = study.queue.filter(i => i.id !== card.id);
      save(); toast('Gelöscht');
      if (study && study.current?.id === card.id) { setHeader(study.title, () => { study = null; go('learn'); }); startStudyKeys(); nextCard(); }
      else back();
    });
    $('#reset')?.addEventListener('click', () => {
      if (!confirm('Lernfortschritt dieser Karte zurücksetzen?')) return;
      for (const k of Object.keys(db.progress)) if (k.startsWith(card.id + '|')) delete db.progress[k];
      save(); toast('Zurückgesetzt');
    });
  };
  draw();
}

/* ============================================================
   Import / Export
   ============================================================ */
function ensureLanguage(code, active = true) {
  if (langByCode(code)) return false;
  const k = KNOWN_LANGS[code] || { name: code.toUpperCase(), tts: code };
  db.languages.push({ code, name: k.name, tts: k.tts, active });
  return true;
}

// Deck-Format: { id, name, languages: ["ru","de",...], cards: [{ id, type, ru, de, ..., gender, example, ... }] }
function importDeck(deck, fallbackName) {
  if (!deck || !Array.isArray(deck.cards)) throw new Error('Ungültiges Deck-Format (Feld "cards" fehlt).');
  const name = deck.name || fallbackName || 'Import';
  const deckId = deck.id || 'deck-' + name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-');
  if (!db.decks[deckId]) db.decks[deckId] = { id: deckId, name, active: true };
  const langCodes = deck.languages || Object.keys(deck.cards[0] || {}).filter(k => KNOWN_LANGS[k] || langByCode(k));
  const addedLangs = langCodes.filter(c => ensureLanguage(c));
  let added = 0, updated = 0;
  deck.cards.forEach((src, i) => {
    const id = src.id ? String(src.id) : `${deckId}-${i}`;
    const f = {}, x = {};
    for (const [k, v] of Object.entries(src)) {
      if (RESERVED_KEYS.has(k) || v === '' || v == null) continue;
      if (langCodes.includes(k)) f[k] = String(v).trim();
      else x[k] = String(v).trim();
    }
    const old = db.cards[id];
    db.cards[id] = { id, deck: deckId, type: CARD_TYPES[src.type] ? src.type : 'word', f, x, created: old ? old.created : Date.now() + i };
    markCards();
    old ? updated++ : added++;
  });
  save();
  let msg = `${name}: ${added} neu, ${updated} aktualisiert`;
  if (addedLangs.length) msg += ` · Sprache(n) ${addedLangs.map(langName).join(', ')} hinzugefügt und aktiviert`;
  return msg;
}

function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = [';', '\t', ','].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift().map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
}

async function importFile(file) {
  const text = (await file.text()).replace(/^﻿/, '');
  const baseName = file.name.replace(/\.[^.]+$/, '');
  if (/\.csv$|\.tsv$|\.txt$/i.test(file.name)) {
    const cards = parseCsv(text);
    const langs = Object.keys(cards[0] || {}).filter(k => KNOWN_LANGS[k] || langByCode(k));
    return importDeck({ name: baseName, languages: langs, cards }, baseName);
  }
  const data = JSON.parse(text);
  if (data && data.v && data.cards && !Array.isArray(data.cards)) {
    if (!confirm('Das ist eine vollständige Sicherung. Alle aktuellen Daten werden ersetzt. Fortfahren?')) return 'Abgebrochen';
    db = Object.assign(defaultDb(), data); markCards();
    save();
    return 'Sicherung wiederhergestellt';
  }
  return importDeck(data, baseName);
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `russisch-karten-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ============================================================
   Ansicht: Einstellungen
   ============================================================ */
function renderSettings() {
  setHeader('Einstellungen');
  const view = $('#view');
  const decks = Object.values(db.decks);
  const unusedKnown = Object.entries(KNOWN_LANGS).filter(([c]) => !langByCode(c));
  view.innerHTML = `
    <div class="section">
      <h2>Sprachen</h2>
      <div class="panel">
        ${db.languages.map((l, i) => `
          <div class="row">
            <input type="checkbox" data-lang-toggle="${i}" ${l.active ? 'checked' : ''} aria-label="${esc(l.name)} aktiv">
            <div class="grow">${esc(l.name)} <span class="badge">${esc(l.code)}</span></div>
            ${i > 0 ? `<button class="btn secondary small" data-lang-up="${i}" aria-label="Nach oben">↑</button>` : ''}
          </div>`).join('')}
        <div class="row">
          <select id="new-lang" class="grow">
            <option value="">Sprache hinzufügen …</option>
            ${unusedKnown.map(([c, l]) => `<option value="${c}">${esc(l.name)}</option>`).join('')}
            <option value="__custom">Andere (Code eingeben) …</option>
          </select>
        </div>
      </div>
      <p style="color:var(--muted);font-size:13px;margin-top:6px">Aktive Sprachen werden auf der Rückseite angezeigt. Die erste Sprache erscheint in der Kartenliste oben.</p>
    </div>

    <div class="section">
      <h2>Lernen</h2>
      <div class="panel">
        <div class="row">
          <div class="grow">Neue Karten pro Tag<div class="sub">heute schon: ${newSeenToday()}</div></div>
          <input type="number" id="new-per-day" min="0" max="500" value="${db.settings.newPerDay}" style="width:90px">
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Decks</h2>
      <div class="panel">
        ${decks.length ? decks.map(d => `
          <div class="row">
            <div class="grow ellipsis">${esc(d.name)}<div class="sub">${deckCards([d.id]).length} ${deckCards([d.id]).length === 1 ? "Karte" : "Karten"}</div></div>
            <button class="btn secondary small" data-rename="${esc(d.id)}">Umbenennen</button>
            <button class="btn danger small" data-del-deck="${esc(d.id)}">Löschen</button>
          </div>`).join('') : '<div class="row"><div class="grow sub">Noch keine Decks</div></div>'}
      </div>
    </div>

    <div class="section" id="library">
      <h2>Deck-Bibliothek</h2>
      <div class="panel" id="lib-list"><div class="row"><div class="grow sub">Lade …</div></div></div>
    </div>

    <div class="section">
      <h2>Import / Sicherung</h2>
      <div class="panel">
        <div class="row">
          <div class="grow">Datei importieren<div class="sub">Deck (.json), Tabelle (.csv) oder Sicherung</div></div>
          <label class="btn small">Datei wählen<input type="file" id="import-file" accept=".json,.csv,.tsv,.txt" hidden></label>
        </div>
        <div class="row">
          <div class="grow">Sicherung exportieren<div class="sub">Alle Karten + Lernfortschritt</div></div>
          <button class="btn small" id="export">Exportieren</button>
        </div>
      </div>
      <p style="color:var(--muted);font-size:13px;margin-top:6px">CSV-Format: erste Zeile mit Spaltennamen, z. B. <code>type;ru;de;en;gender;example</code></p>
    </div>
    <div class="section">
      <h2>Vorlesen (Russisch)</h2>
      <div class="panel">
        <div class="row">
          <div class="grow" id="voice-status">${voiceStatusHtml()}</div>
          <button class="btn small" id="voice-test">Test</button>
        </div>
      </div>
    </div>
    <div class="section">
      <h2>App</h2>
      <div class="panel">
        <div class="row">
          <div class="grow">Version ${APP_VERSION}<div class="sub">Lädt die neueste Version. Karten und Lernfortschritt bleiben erhalten.</div></div>
          <button class="btn small" id="app-update">App aktualisieren</button>
        </div>
      </div>
    </div>
    <p style="color:var(--muted);font-size:12px;text-align:center">${Object.keys(db.cards).length} Karten gespeichert</p>`;
  $('#app-update').onclick = forceUpdate;
  $('#voice-test').onclick = () => (learnLang() === 'es' ? speak('¡Hola! ¿Cómo estás?', 'es') : speak('Приве́т! Как дела́?'));

  $$('[data-lang-toggle]', view).forEach(cb => cb.onchange = () => {
    const l = db.languages[+cb.dataset.langToggle];
    l.active = cb.checked;
    if (activeLangs().length < 2) { l.active = true; cb.checked = true; toast('Mindestens zwei Sprachen müssen aktiv sein.'); return; }
    if (!l.active && db.settings.qLang === l.code) db.settings.qLang = activeLangs()[0].code;
    save();
  });
  $$('[data-lang-up]', view).forEach(b => b.onclick = () => {
    const i = +b.dataset.langUp;
    [db.languages[i - 1], db.languages[i]] = [db.languages[i], db.languages[i - 1]];
    save(); renderSettings();
  });
  $('#new-lang').onchange = (e) => {
    let code = e.target.value;
    if (!code) return;
    if (code === '__custom') {
      code = (prompt('Sprachcode (z. B. "sr" für Serbisch):') || '').trim().toLowerCase();
      if (!/^[a-z]{2,3}$/.test(code)) { renderSettings(); return; }
      const name = (prompt('Anzeigename:') || code).trim();
      if (!langByCode(code)) db.languages.push({ code, name, tts: code, active: true });
    } else {
      ensureLanguage(code);
      langByCode(code).active = true;
    }
    save(); toast(langName(code) + ' hinzugefügt'); renderSettings();
  };
  $('#new-per-day').onchange = (e) => { db.settings.newPerDay = Math.max(0, +e.target.value || 0); save(); };
  $$('[data-rename]', view).forEach(b => b.onclick = () => {
    const d = db.decks[b.dataset.rename];
    const name = prompt('Neuer Name:', d.name);
    if (name && name.trim()) { d.name = name.trim(); save(); renderSettings(); }
  });
  $$('[data-del-deck]', view).forEach(b => b.onclick = () => {
    const d = db.decks[b.dataset.delDeck];
    const n = deckCards([d.id]).length;
    if (!confirm(`Deck „${d.name}“ mit ${n} Karten und Lernfortschritt löschen?`)) return;
    for (const c of deckCards([d.id])) {
      delete db.cards[c.id]; markCards();
      for (const k of Object.keys(db.progress)) if (k.startsWith(c.id + '|')) delete db.progress[k];
    }
    delete db.decks[d.id];
    save(); renderSettings();
  });
  $('#import-file').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { toast(await importFile(file)); renderSettings(); }
    catch (err) { toast('Import fehlgeschlagen: ' + err.message); }
  };
  $('#export').onclick = exportBackup;
  loadLibrary();
}

function voiceStatusHtml() {
  if (!('speechSynthesis' in window)) return 'Dieser Browser kann nicht vorlesen.';
  const es = learnLang() === 'es';
  const v = es ? spanishVoice() : russianVoice();
  if (v) return `Stimme: ${esc(v.name)}`;
  return `<b>Keine ${es ? 'spanische' : 'russische'} Stimme gefunden.</b>
    <div class="sub">Android: Einstellungen → System → Sprachen → Sprachausgabe → Google-Sprachausgabe → Sprachdaten installieren → ${es ? 'Spanisch' : 'Russisch'}.<br>
    Windows: Einstellungen → Zeit und Sprache → Sprache → ${es ? 'Spanisch' : 'Russisch'} hinzufügen (mit Sprachausgabe), oder die App in Microsoft Edge öffnen.</div>`;
}

async function loadLibrary() {
  const box = $('#lib-list');
  try {
    const res = await fetch('decks/index.json', { cache: 'no-cache' });
    const list = await res.json();
    if (!$('#lib-list')) return;
    box.innerHTML = list.map(d => `
      <div class="row">
        <div class="grow">${esc(d.name)}<div class="sub">${esc(d.description || '')}${d.count ? ` · ${d.count} Karten` : ''}</div></div>
        <button class="btn small" data-lib="${esc(d.id)}">${db.decks[d.id] ? 'Aktualisieren' : 'Laden'}</button>
      </div>`).join('') || '<div class="row"><div class="grow sub">Keine Decks verfügbar</div></div>';
    $$('[data-lib]', box).forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {
        toast((await importLibraryDeck(list.find(d => d.id === b.dataset.lib))).msg);
        renderSettings();
      } catch (err) { toast('Laden fehlgeschlagen: ' + err.message); b.disabled = false; }
    });
  } catch (err) {
    box.innerHTML = `<div class="row"><div class="grow sub">Bibliothek nicht erreichbar (offline?). ${esc(err.message)}</div></div>`;
  }
}

async function importLibraryDeck(entry) {
  const deck = await (await fetch('decks/' + entry.file, { cache: 'no-cache' })).json();
  const msg = importDeck(deck);
  const stored = db.decks[deck.id || entry.id];
  if (stored) stored.version = entry.version || 1;
  save();
  return { msg, deck };
}

// Karten, die in der neuen Version eines Decks nicht mehr vorkommen, entfernen.
// Gibt es eine neue Karte mit demselben russischen Text, wandert der Lernfortschritt dorthin.
function pruneReplacedCards(deckIds, decks) {
  const ids = new Set(), byRu = {};
  for (const d of decks) for (const c of d.cards) { ids.add(String(c.id)); if (c.ru) byRu[c.ru] = String(c.id); }
  const affected = new Set(deckIds);
  for (const c of Object.values(db.cards)) {
    if (!affected.has(c.deck) || ids.has(c.id)) continue;
    const target = byRu[c.f.ru];
    for (const k of Object.keys(db.progress)) {
      if (!k.startsWith(c.id + '|')) continue;
      const nk = target ? target + k.slice(c.id.length) : null;
      if (nk && !db.progress[nk]) db.progress[nk] = db.progress[k];
      delete db.progress[k];
    }
    delete db.cards[c.id]; markCards();
  }
  for (const id of deckIds) if (!deckCards([id]).length) delete db.decks[id];
  save();
}

// „App aktualisieren“: Service Worker und Datei-Cache löschen, dann neu laden.
// Die Karten liegen im localStorage und bleiben dabei erhalten.
async function forceUpdate() {
  toast('Aktualisiere …');
  try {
    if ('serviceWorker' in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
  } catch (err) { console.warn('Update:', err); }
  location.replace(location.pathname + '?u=' + Date.now());
}

// Bereits geladene Bibliotheks-Decks automatisch aktualisieren, wenn es eine neuere Version gibt.
// Der Lernfortschritt bleibt erhalten, weil die Karten-IDs gleich bleiben.
async function autoUpdateLibrary() {
  try {
    const list = await (await fetch('decks/index.json', { cache: 'no-cache' })).json();
    let outdated = list.filter(d => db.decks[d.id] && (db.decks[d.id].version || 0) < (d.version || 1));
    // Verb- und Nomen-Decks werden nach Häufigkeit aufgeteilt; Karten können zwischen ihnen wandern.
    // Deshalb eine Familie immer komplett aktualisieren (auch neu hinzugekommene Decks laden)
    // und alte Decks ohne Gegenstück (z. B. das frühere Probedeck „verben-1“) auflösen.
    const prune = [];
    for (const prefix of ['verben-', 'nomen-', 'adjektive-', 'adverbien-', 'praepositionen-', 'preposiciones-', 'espanol-', 'alltag-']) {
      const inFamily = id => id.startsWith(prefix);
      const stale = Object.keys(db.decks).filter(id => inFamily(id) && !list.some(d => d.id === id));
      const missing = list.filter(d => inFamily(d.id) && !db.decks[d.id]);
      const has = Object.keys(db.decks).some(inFamily);
      if (!has || (!stale.length && !missing.length && !outdated.some(d => inFamily(d.id)))) continue;
      outdated = outdated.filter(d => !inFamily(d.id)).concat(list.filter(d => inFamily(d.id)));
      prune.push({ ids: list.filter(d => inFamily(d.id)).map(d => d.id).concat(stale), inFamily });
    }
    const decks = [];
    for (const entry of outdated) decks.push((await importLibraryDeck(entry)).deck);
    for (const p of prune) pruneReplacedCards(p.ids, decks.filter(d => p.inFamily(d.id)));
    if (outdated.length) {
      toast(outdated.length > 3 ? `${outdated.length} Decks aktualisiert` : 'Aktualisiert: ' + outdated.map(d => d.name).join(', '));
      if (!study && tab === 'learn') renderLearn();
    }
  } catch (err) { console.warn('Bibliothek-Update:', err); }   // offline: einfach weitermachen
}

/* ============================================================
   Start
   ============================================================ */
$$('.tabbar button').forEach(b => b.onclick = () => { study = null; go(b.dataset.tab); });
$('#back').onclick = () => backHandler && backHandler();
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', () => {
    loadVoices();
    const el = $('#voice-status');
    if (el) el.innerHTML = voiceStatusHtml();
  });
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW:', err));
}
go('learn');
autoUpdateLibrary();
