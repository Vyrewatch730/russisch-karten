# Russisch Karten

Karteikarten-App (PWA) zum Russischlernen, ähnlich wie Anki. Läuft im Handy-Browser, lässt sich auf den Homescreen installieren und funktioniert offline. Alle Daten bleiben auf dem Gerät (localStorage).

## Funktionen

- **Wiederholung mit Intervallen** (vereinfachtes SM-2 wie in Anki): Nochmal / Schwer / Gut / Leicht
- **Mehrsprachige Karten**: jede Karte hat ein Feld pro Sprache (RU, DE, EN, …). Weitere Sprachen kommen über *Einstellungen → Sprachen* dazu.
- **Abfragerichtung umschaltbar** (⇄): RU → DE, DE → RU oder gemischt. Jede Richtung hat ihren eigenen Lernfortschritt.
- **Kartentypen**: Vokabel, Substantiv (Geschlecht, Plural, Genitiv), Verb (Aspekt, Aspektpartner, Konjugation), Adjektiv (Formen), Satz/Redewendung
- **Vorlesen** über die Sprachausgabe des Handys (🔊)
- **Import**: Decks als JSON oder CSV, Deck-Bibliothek unter `decks/`
- **Sicherung**: Export und Wiederherstellung aller Daten als JSON-Datei

## Lokal testen

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Danach http://localhost:8080 im Browser öffnen. Am PC mit F12 → Gerätesymbol die Handyansicht einschalten. Tastatur: Leertaste dreht die Karte um, 1–4 bewertet.

## Auf dem Handy installieren

Ein Service Worker (und damit die Installation als App) braucht HTTPS. Am einfachsten geht das mit **GitHub Pages**: Repo hochladen, *Settings → Pages → Branch main* wählen. Dann die URL in Chrome auf dem Android-Handy öffnen und *⋮ → App installieren* tippen.

## Deck-Format (JSON)

```json
{
  "id": "mein-deck",
  "name": "Mein Deck",
  "languages": ["ru", "de", "en"],
  "cards": [
    { "id": "md-001", "type": "noun", "ru": "дом", "de": "das Haus", "en": "house",
      "gender": "m", "plural": "дома́", "example": "Э́то мой дом.", "example_tr": "Das ist mein Haus." }
  ]
}
```

- `type`: `word`, `noun`, `verb`, `adj`, `phrase`, `verbpair` (Aspektpaar auf einer Karte, siehe `decks/verben-1.json`: Felder `ipf`, `ipf_1`, `ipf_2`, `pf`, `pf_1`, `pf_2`, jeweils mit `_pron` für die Aussprache, dazu `example` und `example_pron`)
- Sprachfelder: die Codes aus `languages`
- Zusatzfelder: `gender` (m/f/n), `plural`, `genitive`, `aspect` (ipf/pf), `pair`, `conj`, `forms`, `example`, `example_tr`, `note`. Unbekannte Felder werden ebenfalls auf der Rückseite angezeigt.
- Mit stabilen `id`s wird beim erneuten Import aktualisiert statt dupliziert, der Lernfortschritt bleibt erhalten.
- Betonung: Akzentzeichen U+0301 direkt nach dem Vokal (`молоко́`)

Damit ein Deck in der Bibliothek erscheint, die Datei nach `decks/` legen und in `decks/index.json` eintragen.

## CSV-Format

Erste Zeile enthält die Spaltennamen, Trennzeichen `;`, `,` oder Tab:

```
type;ru;de;en;gender;example
noun;стол;der Tisch;table;m;Кни́га на столе́.
```

## Verb-Decks (Aspektpaare)

Die Verb-Decks `decks/verben-NN.json` werden aus kompakten Textdateien in `decks-src/` gebaut (eine Zeile pro Karte). Das Build-Skript sortiert alle Karten nach ihrer Häufigkeit im Russischen Nationalkorpus (`tools/verb-frequency.tsv`, Ljaschewskaja/Scharow; beide Aspekte zusammengezählt. Die Datei ist nicht im Repository: die Verben (Wortart `v`) aus `freqrnc2011.csv` von http://dict.ruslang.ru/Freq2011.zip als `Lemma TAB ipm` speichern) und teilt sie in Gruppen zu 50 Karten auf. In welcher Datei eine Karte steht, ist dafür egal. Karten-IDs hängen nur vom Infinitiv ab, daher bleibt der Lernfortschritt beim Umsortieren erhalten.

```
ipf | я | ты | pf | я | ты | de | en | es | es_verb | Beispiel | de | en | es | Notiz
```

- Aussprache (deutsche Umschrift) und spanische Konjugation (Presente, Pretérito, Futur mit *ir a*, ohne *vosotros*) berechnet die App selbst aus Betonung und Infinitiv.
- `es_verb` ist nur nötig, wenn nicht das erste Verb aus `es` konjugiert werden soll, z. B. `hablar; decir` für zwei Tabellen oder `asentir:ie-i` für einen Stammwechsel, den der Konjugator nicht kennt.

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-verbs.ps1
```

Danach prüft `http://localhost:8080/tools/check-decks.html` Betonung, Pflichtfelder und Konjugation aller Decks. Mit `?deck=verben-03&verbose` werden für ein Deck zusätzlich alle berechneten Formen angezeigt.

## Spanisch-Modus

Die App kann statt Russisch auch Spanisch (Schwerpunkt Dominikanische Republik) abfragen. Im Spanisch-Modus bildet sie die Decks neu: je Wortart, sortiert nach spanischer Häufigkeit.

- `decks-src/espanol-*.txt` und `decks-src/alltag-*.txt`: spanische Karten ohne russische Vorlage (Grundwörter, Verben, Nomen, Adjektive, Alltag in der DR), gebaut mit `tools\build-espanol.ps1`.
- `decks-src/preposiciones-01.txt`: spanische Präpositionen (`tools\build-preposiciones.ps1`).
- `decks-src/notizen-es.tsv`: Notizen zum spanischen Wort auf Verbkarten.
- Spanische Häufigkeit: `tools/es-rank.html` (im Browser über den lokalen Server öffnen) zählt für jede Karte alle Formen im Untertitel-Korpus und schreibt `decks-src/es-rang.tsv`; `tools\apply-es-rank.ps1` trägt die Zahlen als `es_freq` in die Decks ein (läuft auch am Ende jedes Build-Skripts). Die Liste der fehlenden häufigen Wörter steht ebenfalls in `es-rank.html`.
- Quelle der Häufigkeit: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) von Hermit Dave (OpenSubtitles 2018, Spanisch, Lizenz CC BY-SA 4.0). Die Datei `tools/es-frequency.txt` (`es_50k.txt`) ist nicht im Repository.
