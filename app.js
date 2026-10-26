'use strict';

/* ============================================================
   Konstanten
   ============================================================ */
const APP_VERSION = 48;                    // gleich wie CACHE in sw.js und ?v= in index.html halten
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
      { key: 'es_past', label: 'Spanisch – Pasado/Pretérito (mit Komma)' },
      { key: 'es2_verb', label: 'Spanisch – 2. Verb (optional)' },
      { key: 'es2_pres', label: 'Spanisch – 2. Verb Presente' },
      { key: 'es2_past', label: 'Spanisch – 2. Verb Pasado' },
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

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(defaultDb(), JSON.parse(raw));
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
    if (q === 'ru' || q === 'tr') continue;
    const target = id + '|tr';
    if (!db.progress[target] || (db.progress[key].reps || 0) > (db.progress[target].reps || 0)) db.progress[target] = db.progress[key];
    delete db.progress[key];
    changed = true;
  }
  if (changed) save();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch (e) { toast('Speichern fehlgeschlagen: ' + e.message); }
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function newSeenToday() {
  if (db.daily.date !== today()) db.daily = { date: today(), newSeen: 0 };
  return db.daily.newSeen;
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
esClass('ue', 'esforzar desenvolver volver devolver resolver envolver mover llover doler morder contar encontrar recordar costar mostrar demostrar probar aprobar comprobar sonar soñar volar acostar almorzar colgar rogar forzar soltar acordar renovar rodar apostar promover remover conmover torcer');
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
  ser: 'ser ist ganz unregelmäßig. Pasado: dieselben Formen wie ir (fui, fuiste …) – der Zusammenhang zeigt die Bedeutung.',
  ir: 'ir ist ganz unregelmäßig (voy, vas …). Pasado: dieselben Formen wie ser (fui, fuiste …).',
  estar: 'estar: yo-Form estoy, Betonung auf der Endung (estás, está). Pasado mit Stamm estuv- ohne Akzent.',
  dar: 'dar: yo-Form doy. Pasado mit Endungen wie bei -er/-ir: di, diste, dio.',
  ver: 'ver: yo-Form veo. Pasado ohne Akzent: vi, vio.',
  haber: 'haber ist Hilfsverb (he, has, ha …). hay = es gibt.',
};
const ES_STEM_NOTE = {
  ie: 'Stammwechsel e → ie in allen betonten Formen (yo, tú, él, ellos), nicht bei nosotros.',
  ue: 'Stammwechsel o → ue in allen betonten Formen (yo, tú, él, ellos), nicht bei nosotros.',
  i: 'Stammwechsel e → i im Presente (außer nosotros) und im Pasado bei él und ellos.',
  'ie-i': 'Stammwechsel e → ie im Presente (außer nosotros); im Pasado bei él und ellos e → i.',
  'ue-u': 'Stammwechsel o → ue im Presente (außer nosotros); im Pasado bei él und ellos o → u.',
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
    if (key === 'seguir') lines.push('Stammwechsel e → i wie bei pedir, dazu gu → g in der yo-Form; Pasado: siguió, siguieron.');
    else if (key === 'ducir') lines.push('Alle Verben auf -ducir: yo-Form -duzco, Pasado mit -duj- (traduje, produjo).');
    else if (/go$/.test(yo)) lines.push('Typisch: In der yo-Form kommt ein -g- dazu (tengo, pongo, salgo, hago, digo …).');
    if (!/[éí]$/.test(pret) && key !== 'ducir') lines.push(`Pasado mit eigenem Stamm und ohne Akzent: ${pret} (wie tuve, puse, hice, dije).`);
  } else if (ES_ENDINGS[end]) {
    lines.push(`<b>Verb auf -${end}</b>: Stamm ${inf.slice(0, -2)}- + regelmäßige Endungen.`);
    lines.push(`Presente: ${ES_ENDINGS[end][0]} · Pasado: ${ES_ENDINGS[end][1]}`);
    if (cls && cls !== 'dat' && ES_STEM_NOTE[cls]) lines.push(ES_STEM_NOTE[cls]);
    if (/g(er|ir)$/.test(inf)) lines.push('yo-Form: g → j vor o (escojo), damit der Laut gleich bleibt.');
    else if (/guir$/.test(inf)) lines.push('yo-Form: gu → g vor o (sigo).');
    else if (/[aeiouáéó]c(er|ir)$/.test(inf)) lines.push('yo-Form: Vokal + -cer/-cir → -zco (conozco, parezco).');
    else if (/c(er|ir)$/.test(inf)) lines.push('yo-Form: Konsonant + -cer → -zo (venzo).');
    if (end === 'ar' && /c$/.test(inf.slice(0, -2))) lines.push('Pasado yo: c → qu vor é (busqué), damit es wie k klingt.');
    if (end === 'ar' && /g$/.test(inf.slice(0, -2))) lines.push('Pasado yo: g → gu vor é (llegué), damit es wie g klingt.');
    if (end === 'ar' && /z$/.test(inf.slice(0, -2))) lines.push('Pasado yo: z → c vor é (empecé).');
    if (end === 'ir' && /[^g]u$/.test(inf.slice(0, -2))) lines.push('Verben auf -uir schieben ein y ein: construyo, construyó.');
    if (end !== 'ar' && /[aeo]$/.test(inf.slice(0, -2))) lines.push('Stamm endet auf Vokal: im Pasado y statt i (leyó, leyeron).');
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
let esFirst = null, esFirstCount = -1;
function esDuplicate(card) {
  const n = Object.keys(db.cards).length;
  if (n !== esFirstCount) {
    esFirst = new Map();
    for (const c of Object.values(db.cards).sort((a, b) => a.created - b.created)) if (esKey(c) && !esFirst.has(esKey(c))) esFirst.set(esKey(c), c.id);
    esFirstCount = n;
  }
  return esFirst.get(esKey(card)) !== card.id;
}

function deckCards(deckIds) {
  const set = new Set(deckIds);
  return Object.values(db.cards).filter(c => set.has(c.deck)).sort((a, b) => a.created - b.created);
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
  { v: 'praepositionen', t: 'Präpositionen', test: id => id.startsWith('praepositionen-') },
];
function kindChips() {
  const cur = db.settings.deckKind || 'all';
  return `<div class="chips kind-chips">${DECK_KINDS.map(k =>
    `<button class="chip ${cur === k.v ? 'active' : ''}" data-kind="${k.v}">${k.t}</button>`).join('')}</div>`;
}

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

function renderLearn() {
  setHeader(LEARN_LANGS[learnLang()].title);
  const kind = DECK_KINDS.find(k => k.v === (db.settings.deckKind || 'all')) || DECK_KINDS[0];
  const allDecks = Object.values(db.decks);
  const decks = allDecks.filter(d => kind.test(d.id));
  const allTitle = kind.v === 'all' ? 'Alle Decks' : 'Alle ' + kind.t;
  const view = $('#view');
  if (!allDecks.length) {
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
  const statRow = (s) => `<div class="counts"><span class="c-new">${Math.min(s.fresh, Math.max(0, db.settings.newPerDay - newSeenToday()))}</span><span class="c-learn">${s.learn}</span><span class="c-due">${s.due}</span></div>`;
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
      <div class="panel">
        ${decks.length > 1 ? `
          <div class="row clickable" data-study="*">
            <div class="grow"><b>${allTitle}</b></div>${statRow(deckStats(allIds))}
            <button class="quiz-btn" data-quiz="*" aria-label="Schreiben üben">✍️</button>
          </div>` : ''}
        ${!decks.length ? `<div class="row"><div class="grow sub">Noch keine ${kind.t} geladen</div>${kind.v !== 'all' ? `<button class="btn small" id="load-kind">Laden</button>` : ''}</div>` : ''}
        ${decks.map(d => `
          <div class="row clickable" data-study="${esc(d.id)}">
            <div class="grow ellipsis">${esc(d.name)}<div class="sub">${learnCards([d.id]).length} ${learnCards([d.id]).length === 1 ? "Karte" : "Karten"}</div></div>
            ${statRow(deckStats([d.id]))}
            <button class="quiz-btn" data-quiz="${esc(d.id)}" aria-label="Schreiben üben">✍️</button>
          </div>`).join('')}
      </div>
    </div>
    <p class="sub" style="color:var(--muted);font-size:13px">
      <span class="c-new">Blau</span> = neu (heute noch), <span class="c-learn">Rot</span> = in Lernphase, <span class="c-due">Grün</span> = fällig<br>
      ✍️ = Schreiben üben: ${QUIZ_SIZE} zufällige Wörter, Bedeutung eintippen (Richtung wie oben gewählt)
    </p>`;
  $$('[data-quiz]', view).forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const id = b.dataset.quiz;
    startQuiz(id === '*' ? allIds : [id], '✍️ ' + (id === '*' ? allTitle : db.decks[id].name));
  });
  $$('[data-dir]', view).forEach(b => b.onclick = () => { db.settings.qLang = b.dataset.dir; save(); renderLearn(); });
  $$('[data-kind]', view).forEach(b => b.onclick = () => { db.settings.deckKind = b.dataset.kind; save(); renderLearn(); });
  $$('[data-learn]', view).forEach(b => b.onclick = () => { setLearnLang(b.dataset.learn); renderLearn(); });
  // Noch nichts von dieser Art geladen: alle passenden Decks aus der Bibliothek holen
  const loadBtn = $('#load-kind');
  if (loadBtn) loadBtn.onclick = async () => {
    loadBtn.disabled = true;
    try {
      const list = await (await fetch('decks/index.json', { cache: 'no-cache' })).json();
      for (const entry of list.filter(d => d.id.startsWith(kind.v + '-'))) await importLibraryDeck(entry);
      toast(kind.t + ' geladen');
    } catch (err) { toast('Laden nicht möglich (offline?)'); }
    renderLearn();
  };
  $$('[data-study]', view).forEach(r => r.onclick = () => {
    const id = r.dataset.study;
    startStudy(id === '*' ? allIds : [id], id === '*' ? allTitle : db.decks[id].name);
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
  if (pres) rows.push(`<tr><th colspan="2">${tense} ${say(pres)}</th></tr>` + PERS.map((pr, i) => `<tr><td>${pr}</td><td>${esc(pres[i])}</td></tr>`).join(''));
  if (p === 'ipf' && pres && !isByt) rows.push(`<tr><td colspan="2" class="vf-note">Zukunft: бу́ду / бу́дешь … + ${esc(x[p])}</td></tr>`);
  if (past) rows.push(`<tr><th colspan="2">Vergangenheit ${say(past)}</th></tr>` + ['он', 'она́', 'оно́', 'они́'].map((pr, i) => `<tr><td>${pr}</td><td>${esc(past[i])}</td></tr>`).join(''));
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
    items.push(`<div class="conj-ru-item"><b>${esc(x[p])}</b> – ${kind} · ${tense}<div class="conj-ru-forms">${rows}</div></div>`);
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
    <div class="vp-rule">${MOTION_INFO}</div>` : '';
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
      <thead><tr><th></th><th>Presente</th><th>Pasado</th><th>Futuro</th></tr></thead>
      <tbody>${ES_PERSONS.map((pr, i) => `
        <tr><th>${pr}</th><td>${esc(pres[i] || '')}</td><td>${esc(past[i] || '')}</td><td>${esc(c.fut[i])}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="es-why">Warum so? <button class="info" aria-label="Regeln anzeigen">ⓘ</button></div>
    <div class="vp-rule es-rule">${esExplain(v)}</div>`;
  }).filter(Boolean);
  return tables.length ? `<div class="conj-wrap">${tables.join('')}</div>` : '';
}

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
    if (!known.has(k) && !k.startsWith('example_') && v) items.push(`<div><b>${esc(k)}</b>${esc(v)}</div>`);
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

function cardEsSide(card) {
  const x = card.x, es = card.f.es || '';
  const info = ' <button class="info" aria-label="Erklärung anzeigen">ⓘ</button>';
  const say = t => t ? `<button class="say" data-lang="es" data-say="${esc(t)}">🔊</button>` : '';
  const KIND = { verbpair: ['Verbo', 'es-v'], nounfull: ['Sustantivo', 'es-n'], adjfull: ['Adjetivo', 'es-a'], advfull: ['Adverbio', 'es-d'], prepfull: ['Preposición', 'es-p'] }[card.type] || ['Palabra', 'es-w'];
  let word = esc(es), body = '';
  if (card.type === 'nounfull') {
    const parts = esNounParts(es);
    word = parts.map(p => `<span class="${p.g ? 'es-g-' + p.g : ''}">${esc(p.text)}</span>`).join(', ');
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
  } else if (card.type === 'verbpair') {
    body = esConjHtml(card);
  }
  const mainSay = es.split(/[;,]/)[0].replace(/\(.*?\)/g, '').trim();
  return `<div class="lang-tag">${esc(langName('es'))}</div>
    <div class="nn es-card">
      <div class="nn-tags"><span class="nn-g ${KIND[1]}">${KIND[0]}</span></div>
      <div class="nn-word">${word} ${say(mainSay)}</div>
      ${body}
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
  if (!before) { newSeenToday(); db.daily.newSeen++; }
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
function stopStudyKeys() { document.removeEventListener('keydown', studyKeys); document.removeEventListener('keydown', quizKeys); }

/* ============================================================
   Schreibmodus: 20 zufällige Wörter aus den gewählten Decks, Bedeutung eintippen.
   Richtung wie in der Übersicht gewählt (RU → DE, DE → RU oder gemischt).
   Falsche Wörter kommen nach ein paar anderen Karten noch einmal, bis alle richtig sind.
   ============================================================ */
let quiz = null;
const QUIZ_SIZE = 20;
const QUIZ_GAP = 3;          // falsch beantwortete Karte kommt nach so vielen anderen wieder

function startQuiz(deckIds, title) {
  const pool = learnCards(deckIds).filter(c => c.f.de);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const cards = pool.slice(0, QUIZ_SIZE);
  if (!cards.length) { toast('Keine Karten in diesem Deck'); return; }
  const dir = () => (db.settings.qLang === 'mix' ? (Math.random() < 0.5 ? 'ru' : 'tr') : db.settings.qLang);
  quiz = { title, deckIds, queue: cards.map(c => ({ id: c.id, q: dir(), tries: 0 })), total: cards.length, firstTry: 0, cur: null, answer: null };
  document.body.classList.add('studying');
  setHeader(title, () => { quiz = null; go('learn'); });
  stopStudyKeys();
  document.addEventListener('keydown', quizKeys);
  nextQuiz();
}

function nextQuiz() {
  quiz.cur = quiz.queue.shift() || null;
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
  cur.tries++;
  if (ok && cur.tries === 1) quiz.firstTry++;
  if (!ok) quiz.queue.splice(Math.min(QUIZ_GAP, quiz.queue.length), 0, cur);   // später noch einmal
  quiz.answer = { text, ok, typo, expected: askRu ? card.f.de : card.f[learnLang()] };
  renderQuiz();
}

// „Ich lag doch richtig“: Wiederholung wieder herausnehmen
function quizOverride() {
  const cur = quiz.cur;
  const i = quiz.queue.indexOf(cur);
  if (i >= 0) quiz.queue.splice(i, 1);
  if (cur.tries === 1) quiz.firstTry++;
  quiz.answer.ok = true;
  quiz.answer.override = true;
  renderQuiz();
}

function quizKeys(e) {
  if (!quiz || e.key !== 'Enter') return;
  if (quiz.answer) { e.preventDefault(); nextQuiz(); }
}

function renderQuiz() {
  const view = $('#view');
  const cur = quiz.cur;
  const left = quiz.queue.length + (cur ? 1 : 0);
  $('#header-extra').innerHTML = cur ? `<span class="hbadge" title="noch übrig">${left}</span>` : '';
  if (!cur) {
    view.innerHTML = `
      <div class="done">
        <div class="big">🎉</div>
        <h2>Geschafft!</h2>
        <p>${quiz.firstTry} von ${quiz.total} Wörtern beim ersten Versuch richtig.</p>
        <button class="btn" id="quiz-again">Neue Runde</button><br>
        <button class="btn secondary" id="quiz-end">Zur Übersicht</button>
      </div>`;
    $('#quiz-again').onclick = () => startQuiz(quiz.deckIds, quiz.title);
    $('#quiz-end').onclick = () => { quiz = null; go('learn'); };
    return;
  }
  const card = db.cards[cur.id];
  const askRu = cur.q === 'ru';
  const L = learnLang();
  const prompt = askRu ? card.f[L] : card.f.de;
  const say = t => `<button class="say" data-lang="${L}" data-say="${esc(t)}">🔊</button>`;
  if (!quiz.answer) {
    view.innerHTML = `
      <div class="quiz">
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
          <b>${r.ok ? (r.override ? '✓ Als richtig gewertet' : r.typo ? '✓ Richtig (kleiner Tippfehler)' : '✓ Richtig!') : '✗ Leider falsch – kommt gleich noch einmal'}</b>
          <div>Deine Antwort: ${r.text ? esc(r.text) : '—'}</div>
          <div>Richtig: <b>${esc(r.expected)}</b></div>
        </div>
        <div class="btn-row">
          <button class="btn" id="quiz-next">Weiter</button>
          ${!r.ok ? '<button class="btn secondary" id="quiz-ok">Ich lag doch richtig</button>' : ''}
        </div>
        <div class="quiz-card">${askRu ? cardTrSide(card) : cardLearnSide(card)}</div>
        <div class="quiz-card">${askRu ? cardLearnSide(card) : cardTrSide(card)}</div>
      </div>`;
    $('#quiz-next').onclick = nextQuiz;
    $('#quiz-ok')?.addEventListener('click', quizOverride);
  }
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
    const [l1, l2] = activeLangs().map(l => l.code);
    $('#list').innerHTML = total ? `
      <p style="color:var(--muted);font-size:13px;margin-bottom:8px">${total} Karten${total > 300 ? ' (erste 300 angezeigt)' : ''}</p>
      <div class="panel">
        ${cards.map(c => `
          <div class="row clickable" data-edit="${esc(c.id)}">
            <div class="grow">
              <div class="ellipsis"><b>${esc(c.f[l1] || '—')}</b></div>
              <div class="sub ellipsis">${esc(c.f[l2] || '')}</div>
            </div>
            <span class="badge">${esc((CARD_TYPES[c.type] || CARD_TYPES.word).name)}</span>
          </div>`).join('')}
      </div>` : `<div class="empty">Keine Karten gefunden.</div>`;
    $$('[data-edit]').forEach(r => r.onclick = () => editCard(r.dataset.edit));
  };
  $('#search').oninput = (e) => { cardFilter.q = e.target.value; renderList(); };
  $('#deck-filter').onchange = (e) => { cardFilter.deck = e.target.value; renderList(); };
  $('#add').onclick = () => editCard(null);
  renderList();
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
      db.cards[card.id] = card;
      lastDeck = card.deck;
      save();
      toast('Gespeichert');
      if (existing) back();
      else editCard(null, onDone);
    };
    $('#del')?.addEventListener('click', () => {
      if (!confirm('Karte wirklich löschen?')) return;
      delete db.cards[card.id];
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
    db = Object.assign(defaultDb(), data);
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
      delete db.cards[c.id];
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
    delete db.cards[c.id];
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
    for (const prefix of ['verben-', 'nomen-', 'adjektive-', 'adverbien-', 'praepositionen-']) {
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
