'use strict';

/* ============================================================
   Konstanten
   ============================================================ */
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

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  const voice = russianVoice();
  // Ohne russische Stimme würde der Browser die Standardstimme (meist Englisch) nehmen – dann lieber gar nicht
  if (!voice) { toast('Keine russische Stimme gefunden – Hinweis unter Einstellungen → Vorlesen'); return; }
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
  return out;
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
// Eine Karte hat zwei feste Seiten: Russisch und die Übersetzungen (alle anderen aktiven Sprachen).
// Abfragerichtung: 'ru' = Russisch zuerst, 'tr' = Übersetzungen zuerst, 'mix' = beides.
const RU = 'ru';
const trLangs = () => activeLangs().filter(l => l.code !== RU);

function questionLangs() {
  const q = db.settings.qLang;
  return q === 'mix' ? [RU, 'tr'] : [q === 'tr' ? 'tr' : RU];
}

// Abfragbar, wenn es Russisch und mindestens eine aktive Übersetzung gibt
function canAsk(card) {
  return !!card.f[RU] && trLangs().some(l => card.f[l.code]);
}

function deckCards(deckIds) {
  const set = new Set(deckIds);
  return Object.values(db.cards).filter(c => set.has(c.deck)).sort((a, b) => a.created - b.created);
}

function deckStats(deckIds) {
  const now = Date.now();
  let fresh = 0, learn = 0, due = 0;
  for (const c of deckCards(deckIds)) {
    for (const q of questionLangs()) {
      if (!canAsk(c, q)) continue;
      const p = db.progress[c.id + '|' + q];
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
      const key = c.id + '|' + q;
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
function renderRules() {
  setHeader('Regeln');
  $('#view').innerHTML = `
    <div class="panel">
      ${RULES.map(r => `
        <div class="row clickable" data-rule="${r.id}">
          <span class="rule-icon">${r.icon}</span>
          <div class="grow"><b>${esc(r.title)}</b><div class="sub">${esc(r.teaser)}</div></div>
          <span class="chev">›</span>
        </div>`).join('')}
    </div>`;
  $$('[data-rule]').forEach(r => r.onclick = () => renderRule(r.dataset.rule));
}

function renderRule(id) {
  const rule = RULES.find(r => r.id === id);
  if (!rule) return renderRules();
  setHeader(rule.title, () => go('rules'));
  $('#view').innerHTML = `<article class="rule">${rule.html}</article>`;
  // Aussprache der Beispielwörter berechnen und 🔊 aktivieren
  $$('[data-pr]', $('#view')).forEach(el => { const p = ruPron(el.dataset.pr); el.textContent = p ? `[${p}]` : ''; });
  $$('.say', $('#view')).forEach(b => b.onclick = () => speak(b.dataset.say));
  $('#view').scrollTop = 0;
}

/* ============================================================
   Ansicht: Lernen (Deckübersicht)
   ============================================================ */
const DIRECTIONS = ['ru', 'tr', 'mix'];
function dirText(q) {
  const tr = trLangs().map(l => l.code.toUpperCase()).join('/') || '?';
  return q === 'mix' ? 'Gemischt' : q === 'tr' ? `${tr} → RU` : `RU → ${tr}`;
}
function dirLabel() { return dirText(db.settings.qLang); }

function dirChips() {
  const opts = DIRECTIONS.map(v => ({ v, t: dirText(v) }));
  return `<div class="chips">${opts.map(o =>
    `<button class="chip ${db.settings.qLang === o.v ? 'active' : ''}" data-dir="${o.v}">${esc(o.t)}</button>`).join('')}</div>`;
}

function renderLearn() {
  setHeader('Карточки');
  const decks = Object.values(db.decks);
  const view = $('#view');
  if (!decks.length) {
    view.innerHTML = `
      <div class="empty">
        <div style="font-size:48px">🇷🇺</div>
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
      <h2>Abfragerichtung</h2>
      ${dirChips()}
    </div>
    <div class="section">
      <h2>Decks</h2>
      <div class="panel">
        ${decks.length > 1 ? `
          <div class="row clickable" data-study="*">
            <div class="grow"><b>Alle Decks</b></div>${statRow(deckStats(allIds))}
          </div>` : ''}
        ${decks.map(d => `
          <div class="row clickable" data-study="${esc(d.id)}">
            <div class="grow ellipsis">${esc(d.name)}<div class="sub">${deckCards([d.id]).length} ${deckCards([d.id]).length === 1 ? "Karte" : "Karten"}</div></div>
            ${statRow(deckStats([d.id]))}
          </div>`).join('')}
      </div>
    </div>
    <p class="sub" style="color:var(--muted);font-size:13px">
      <span class="c-new">Blau</span> = neu (heute noch), <span class="c-learn">Rot</span> = in Lernphase, <span class="c-due">Grün</span> = fällig
    </p>`;
  $$('[data-dir]', view).forEach(b => b.onclick = () => { db.settings.qLang = b.dataset.dir; save(); renderLearn(); });
  $$('[data-study]', view).forEach(r => r.onclick = () => {
    const id = r.dataset.study;
    startStudy(id === '*' ? allIds : [id], id === '*' ? 'Alle Decks' : db.decks[id].name);
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
  const sg = nounForms(x.sg), pl = nounForms(x.pl);
  const key = [];
  if (x.indecl) key.push('<span>unveränderlich</span>');
  else {
    if (x.gender !== 'pl' && sg[1]) key.push(`<span><i>Gen. Sg.</i> ${esc(sg[1])}</span>`);
    if (x.gender !== 'pl' && pl[0]) key.push(`<span><i>Pl.</i> ${esc(pl[0])}</span>`);
    if (x.gender === 'pl' && pl[1]) key.push(`<span><i>Gen.</i> ${esc(pl[1])}</span>`);
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
  const sg = x.gender === 'pl' ? [] : nounForms(x.indecl ? Array(6).fill(card.f.ru).join('|') : x.sg);
  const pl = x.indecl ? [] : nounForms(x.pl);
  const exSg = nounExamples(x.ex_sg), exPl = nounExamples(x.ex_pl);
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
    </table>`;
  }).filter(Boolean);
  return tables.length ? `<div class="conj-wrap">${tables.join('')}</div>` : '';
}

function extrasHtml(card) {
  const type = CARD_TYPES[card.type] || CARD_TYPES.word;
  if (type.ownLayout) {
    // Nur eine evtl. Notiz zeigen, alles andere steckt im Verbblock
    return card.x.note ? `<div class="extras"><div><b>Notiz</b>${esc(card.x.note)}</div></div>` : '';
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
  const typeName = (CARD_TYPES[card.type] || CARD_TYPES.word).name;
  const remaining = study.queue.length + 1;
  const prev = g => fmtInterval(schedule(p, g).due - Date.now());
  const isVp = card.type === 'verbpair';
  const isNoun = card.type === 'nounfull';
  const sayRu = (code, text) => code === 'ru' ? `<button class="say" data-say="${esc(text)}">🔊</button>` : '';
  // Seite „Russisch“: Verbblock bzw. das russische Wort
  const ruSide = () => `<div class="lang-tag">${esc(langName(RU))}</div>` + (isVp
    ? verbPairHtml(card)
    : isNoun ? nounHtml(card)
    : `<div class="q-word">${esc(card.f[RU])}</div>${sayRu(RU, card.f[RU])}`);
  // Seite „Übersetzungen“: alle anderen aktiven Sprachen mit Beispiel-Übersetzung (und spanischer Tabelle)
  const trSide = () => trLangs().filter(l => card.f[l.code]).map(l => `
    <div class="answer">
      <div class="lang-tag">${esc(l.name)}</div>
      <div class="a-word">${esc(card.f[l.code])}</div>
      ${card.x['example_' + l.code] ? `<div class="a-ex">${esc(card.x['example_' + l.code])}</div>` : ''}
      ${isVp && l.code === 'es' ? esConjHtml(card) : ''}
    </div>`).join('');
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
  $$('.say', view).forEach(b => b.onclick = (e) => { e.stopPropagation(); speak(b.dataset.say); });
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
function stopStudyKeys() { document.removeEventListener('keydown', studyKeys); }

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
    <p style="color:var(--muted);font-size:12px;text-align:center">${Object.keys(db.cards).length} Karten gespeichert</p>`;
  $('#voice-test').onclick = () => speak('Приве́т! Как дела́?');

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
  const v = russianVoice();
  if (v) return `Stimme: ${esc(v.name)}`;
  return `<b>Keine russische Stimme gefunden.</b>
    <div class="sub">Android: Einstellungen → System → Sprachen → Sprachausgabe → Google-Sprachausgabe → Sprachdaten installieren → Russisch.<br>
    Windows: Einstellungen → Zeit und Sprache → Sprache → Russisch hinzufügen (mit Sprachausgabe), oder die App in Microsoft Edge öffnen.</div>`;
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

// Bereits geladene Bibliotheks-Decks automatisch aktualisieren, wenn es eine neuere Version gibt.
// Der Lernfortschritt bleibt erhalten, weil die Karten-IDs gleich bleiben.
async function autoUpdateLibrary() {
  try {
    const list = await (await fetch('decks/index.json', { cache: 'no-cache' })).json();
    const isVerbDeck = id => id.startsWith('verben-');
    let outdated = list.filter(d => db.decks[d.id] && (db.decks[d.id].version || 0) < (d.version || 1));
    // Die Verb-Decks werden nach Häufigkeit aufgeteilt; Karten können zwischen ihnen wandern.
    // Deshalb immer alle zusammen aktualisieren und alte Verb-Decks ohne Gegenstück auflösen.
    // Auch alte Verb-Decks ohne Gegenstück (z. B. das frühere Probedeck „verben-1“) lösen das aus.
    const stale = Object.keys(db.decks).filter(id => isVerbDeck(id) && !list.some(d => d.id === id));
    const verbAffected = stale.length > 0 || outdated.some(d => isVerbDeck(d.id));
    if (verbAffected) outdated = list.filter(d => isVerbDeck(d.id) || outdated.includes(d));
    const decks = [];
    for (const entry of outdated) decks.push((await importLibraryDeck(entry)).deck);
    if (verbAffected) {
      pruneReplacedCards(outdated.filter(d => isVerbDeck(d.id)).map(d => d.id).concat(stale), decks);
    }
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
