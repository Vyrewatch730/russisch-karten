'use strict';
/* ============================================================
   Grammatik-Regeln (Bereich „Regeln“ in der unteren Leiste)
   Jede Regel: id, Symbol, Titel, Kurzbeschreibung, HTML-Inhalt
   ============================================================ */
// Russisches Wort mit Aussprache (füllt renderRule über ruPron) und 🔊
const RW = w => `<span class="rw">${w}</span> <span class="pron" data-pr="${w}"></span> <button class="say" data-say="${w}">🔊</button>`;
// Zeile der Alphabet-Tabelle: Buchstabe, Laut, Beispiel(e)
const ABC = (big, small, sound, ...words) =>
  `<tr><td class="abc"><b>${big} ${small}</b> <button class="say" data-say="${small}">🔊</button></td><td>${sound}</td><td>${words.map(RW).join('<br>')}</td></tr>`;

const RULES = [
  {
    id: 'aussprache',
    icon: '🗣️',
    title: 'Aussprache und Alphabet',
    teaser: 'Alle Buchstaben mit Audio, unbetontes о/е, harte und weiche Laute',
    html: `
<p>Die Aussprache in eckigen Klammern ist eine Lautschrift für Deutschsprachige. Der Akzent (á) zeigt die <b>betonte Silbe</b>. Tippe auf 🔊, um den Buchstaben oder das Wort zu hören.</p>
<p class="tip"><b>So liest du die Lautschrift:</b> sh = stimmhaftes sch wie das g in „Garage“ · s = weiches s wie in „Sonne“ · ss = scharfes s wie in „Bus“ · ch = wie in „Bach“ · y = dumpfes i (ы) · ' = weicher Laut</p>

<h3>Das Alphabet</h3>
<table class="rtable abc-table">
  <tr><th>Buchstabe</th><th>Laut</th><th>Beispiel</th></tr>
  ${ABC('А', 'а', 'a wie in „Vater“', 'ма́ма')}
  ${ABC('Б', 'б', 'b', 'брат')}
  ${ABC('В', 'в', 'w wie in „Wasser“', 'вода́')}
  ${ABC('Г', 'г', 'g wie in „gut“ (nie wie „ch“)', 'год')}
  ${ABC('Д', 'д', 'd', 'дом')}
  ${ABC('Е', 'е', 'je wie in „jemand“ · nach Konsonant: e, der Konsonant wird weich', 'е́сли', 'нет')}
  ${ABC('Ё', 'ё', 'jo wie in „Joghurt“ · <b>immer betont</b> (oft ohne Punkte als е geschrieben)', 'ёлка', 'всё')}
  ${ABC('Ж', 'ж', 'stimmhaftes sch wie das g in „Gara<b>g</b>e“ oder das J in „Journal“ · immer hart', 'жена́')}
  ${ABC('З', 'з', 'weiches s wie in „Sonne“', 'зима́')}
  ${ABC('И', 'и', 'i wie in „Igel“ · macht den Konsonanten davor weich', 'и́мя')}
  ${ABC('Й', 'й', 'kurzes j wie in „ja“ (steht nach Vokalen)', 'мой')}
  ${ABC('К', 'к', 'k (ohne Hauch)', 'кот')}
  ${ABC('Л', 'л', 'l · hart: dunkles l wie englisch „ball“ · weich: wie deutsches l', 'ла́мпа', 'люблю́')}
  ${ABC('М', 'м', 'm', 'мир')}
  ${ABC('Н', 'н', 'n', 'нос')}
  ${ABC('О', 'о', 'o wie in „Sonne“ · <b>nur wenn betont</b>, sonst wie a (siehe unten)', 'дом', 'окно́')}
  ${ABC('П', 'п', 'p', 'па́па')}
  ${ABC('Р', 'р', 'gerolltes Zungen-r', 'рука́')}
  ${ABC('С', 'с', 'scharfes s wie in „Bus“ oder „ß“', 'сок')}
  ${ABC('Т', 'т', 't', 'там')}
  ${ABC('У', 'у', 'u wie in „Hut“', 'у́тро')}
  ${ABC('Ф', 'ф', 'f', 'фо́то')}
  ${ABC('Х', 'х', 'ch wie in „Ba<b>ch</b>“ (nie wie in „ich“)', 'хлеб')}
  ${ABC('Ц', 'ц', 'z wie in „Zeit“ · immer hart', 'у́лица')}
  ${ABC('Ч', 'ч', 'tsch wie in „Matsch“ · immer weich', 'чай')}
  ${ABC('Ш', 'ш', 'sch wie in „Schule“ · immer hart', 'шко́ла')}
  ${ABC('Щ', 'щ', 'langes, weiches sch (wie „sch-tsch“ ganz weich gesprochen) · immer weich', 'борщ', 'ещё')}
  ${ABC('Ъ', 'ъ', 'Härtezeichen, stumm · trennt: der Vokal danach wird mit j gesprochen', 'подъе́зд')}
  ${ABC('Ы', 'ы', 'dumpfes i: „i“ sagen und die Zunge nach hinten ziehen (kein deutscher Laut)', 'ты', 'сыр')}
  ${ABC('Ь', 'ь', 'Weichheitszeichen, stumm · macht den Konsonanten davor weich', 'день', 'мать')}
  ${ABC('Э', 'э', 'e wie in „Ende“ (ohne j)', 'э́то')}
  ${ABC('Ю', 'ю', 'ju wie in „Jubel“ · nach Konsonant: u, der Konsonant wird weich', 'юг', 'люблю́')}
  ${ABC('Я', 'я', 'ja wie in „ja“ · nach Konsonant: a, der Konsonant wird weich', 'я', 'мя́со')}
</table>
<p class="tip">Verwechslungsgefahr: <b>Ж ж</b> (mit Strich in der Mitte, wie ein Käfer) = stimmhaftes sch wie in „Garage“. <b>Х х</b> (wie unser x) = ch wie in „Bach“. Und <b>Р р</b> ist ein r, <b>Н н</b> ein n, <b>В в</b> ein w, <b>С с</b> ein s.</p>

<h3>Betonung</h3>
<ul>
  <li>Jedes Wort hat <b>genau eine betonte Silbe</b>. Sie kann überall stehen und beim Deklinieren wandern: ${RW('рука́')} – ${RW('ру́ку')}.</li>
  <li>In normalen Texten steht <b>kein Akzent</b>. Deshalb die Betonung immer mit dem Wort mitlernen.</li>
  <li>Die Betonung entscheidet, wie die Vokale klingen (nächster Abschnitt).</li>
</ul>

<h3>Unbetontes о und а → klingt wie a</h3>
<p>Nur ein <b>betontes о</b> klingt wie o. Ohne Betonung wird es zu einem <b>a</b> (weit weg von der Betonung oft noch kürzer, fast wie das e in „bitt<b>e</b>“).</p>
<table class="rtable">
  <tr><th>Wort</th><th>Was passiert</th></tr>
  <tr><td>${RW('молоко́')}</td><td>nur das letzte о ist betont → ma-la-kó</td></tr>
  <tr><td>${RW('хорошо́')}</td><td>cha-ra-schó</td></tr>
  <tr><td>${RW('окно́')}</td><td>a-knó</td></tr>
  <tr><td>${RW('Москва́')}</td><td>Mas-kwá</td></tr>
  <tr><td>${RW('дом')} – ${RW('дома́')}</td><td>betont o, unbetont a</td></tr>
</table>

<h3>Unbetontes е und я → klingt wie i</h3>
<p>Ein <b>betontes е</b> klingt wie (j)e, ein <b>betontes я</b> wie (j)a. Ohne Betonung werden beide zu einem kurzen <b>i</b> (am Wortanfang <b>ji</b>).</p>
<table class="rtable">
  <tr><th>Wort</th><th>Was passiert</th></tr>
  <tr><td>${RW('сестра́')}</td><td>е unbetont → sis-trá</td></tr>
  <tr><td>${RW('телефо́н')}</td><td>ti-li-fón</td></tr>
  <tr><td>${RW('язы́к')}</td><td>я unbetont am Anfang → ji-sýk</td></tr>
  <tr><td>${RW('часы́')}</td><td>я unbetont nach ч → tschi-sý</td></tr>
  <tr><td>${RW('ле́то')} – ${RW('лета́ть')}</td><td>betont e, unbetont i</td></tr>
</table>
<p class="tip">Nach <b>ж, ш, ц</b> klingt unbetontes е und auch и wie ы: ${RW('жена́')}, ${RW('жить')}. Am Wortende bleibt unbetontes я ein kurzes a: ${RW('и́мя')}.</p>

<h3>Harte und weiche Konsonanten</h3>
<ul>
  <li>Fast jeder Konsonant hat eine <b>harte</b> und eine <b>weiche</b> Form. Weich heißt: Die Zunge drückt dabei an den Gaumen, als würde ein leichtes j mitklingen.</li>
  <li>Weich wird ein Konsonant vor <b>е, ё, и, ю, я</b> und vor <b>ь</b>. Hart bleibt er vor <b>а, о, у, ы, э</b>.</li>
  <li>Der Unterschied kann die Bedeutung ändern: ${RW('брат')} (Bruder) – ${RW('брать')} (nehmen), ${RW('лук')} (Zwiebel) – ${RW('люк')} (Luke).</li>
  <li><b>Immer hart:</b> ж, ш, ц · <b>immer weich:</b> ч, щ, й</li>
</ul>

<h3>Am Wortende: stimmhaft wird stimmlos</h3>
<p>Wie im Deutschen („Hund“ spricht man mit t): б→p, в→f, г→k, д→t, ж→sch, з→s.</p>
<table class="rtable">
  <tr><td>${RW('хлеб')}</td><td>${RW('год')}</td></tr>
  <tr><td>${RW('гара́ж')}</td><td>${RW('раз')}</td></tr>
</table>

<h3>Zwei Konsonanten nebeneinander</h3>
<p>Der erste passt sich dem zweiten an: vor einem stimmlosen Laut wird er stimmlos, vor einem stimmhaften stimmhaft.</p>
<table class="rtable">
  <tr><td>${RW('за́втра')}</td><td>в vor т → f</td></tr>
  <tr><td>${RW('всё')}</td><td>в vor с → f</td></tr>
  <tr><td>${RW('ло́жка')}</td><td>ж vor к → sch</td></tr>
  <tr><td>${RW('вокза́л')}</td><td>к vor з → g</td></tr>
  <tr><td>${RW('сде́лать')}</td><td>с vor д → s (weich)</td></tr>
</table>
<p class="tip">Vor <b>в</b> passiert das nicht: ${RW('свет')} bleibt mit scharfem s.</p>

<h3>Besondere Buchstabengruppen</h3>
<table class="rtable">
  <tr><th>Geschrieben</th><th>Gesprochen</th><th>Beispiel</th></tr>
  <tr><td>-ого / -его</td><td>г wie w</td><td>${RW('его́')}<br>${RW('сего́дня')}<br>${RW('хоро́шего')}</td></tr>
  <tr><td>что, коне́чно</td><td>ч wie sch</td><td>${RW('что')}<br>${RW('коне́чно')}</td></tr>
  <tr><td>-тся / -ться</td><td>wie „za“</td><td>${RW('учи́ться')}<br>${RW('нра́вится')}</td></tr>
  <tr><td>сч, зч</td><td>wie щ</td><td>${RW('сча́стье')}<br>${RW('мужчи́на')}</td></tr>
  <tr><td>вств, лнц, здн, стн, рдц</td><td>ein Buchstabe bleibt stumm</td><td>${RW('здра́вствуйте')}<br>${RW('со́лнце')}<br>${RW('пра́здник')}<br>${RW('изве́стный')}<br>${RW('се́рдце')}</td></tr>
</table>
`,
  },
  {
    id: 'zahlen',
    icon: '🔢',
    title: 'Zahlen',
    teaser: 'Zahlen von 0 bis 1 000 000, Aufbau, Fall des Nomens danach, Alter, Uhrzeit, Preise',
    html: `
<h3>0 bis 10 – die Bausteine</h3>
<table class="rtable">
  <tr><td>0</td><td>${RW('ноль')}</td></tr>
  <tr><td>1</td><td>${RW('оди́н')}<br><small>weiblich ${RW('одна́')}, sächlich ${RW('одно́')}</small></td></tr>
  <tr><td>2</td><td>${RW('два')}<br><small>weiblich ${RW('две')}</small></td></tr>
  <tr><td>3</td><td>${RW('три')}</td></tr>
  <tr><td>4</td><td>${RW('четы́ре')}</td></tr>
  <tr><td>5</td><td>${RW('пять')}</td></tr>
  <tr><td>6</td><td>${RW('шесть')}</td></tr>
  <tr><td>7</td><td>${RW('семь')}</td></tr>
  <tr><td>8</td><td>${RW('во́семь')}</td></tr>
  <tr><td>9</td><td>${RW('де́вять')}</td></tr>
  <tr><td>10</td><td>${RW('де́сять')}</td></tr>
</table>
<p class="tip"><b>1 und 2 richten sich nach dem Geschlecht:</b> оди́н брат, одна́ сестра́, одно́ окно́ · два бра́та, два окна́, aber <b>две</b> сестры́.</p>

<h3>11 bis 19: Zahl + на + дцать</h3>
<p><b>-надцать</b> kommt von „на де́сять“ = „auf zehn“. 13 heißt also wörtlich „drei auf zehn“. Die Betonung liegt immer auf <b>-на́-</b> (außer bei 11 und 14).</p>
<table class="rtable">
  <tr><td>11</td><td>${RW('оди́ннадцать')}</td></tr>
  <tr><td>12</td><td>${RW('двена́дцать')}</td></tr>
  <tr><td>13</td><td>${RW('трина́дцать')}</td></tr>
  <tr><td>14</td><td>${RW('четы́рнадцать')}</td></tr>
  <tr><td>15</td><td>${RW('пятна́дцать')}</td></tr>
  <tr><td>16</td><td>${RW('шестна́дцать')}</td></tr>
  <tr><td>17</td><td>${RW('семна́дцать')}</td></tr>
  <tr><td>18</td><td>${RW('восемна́дцать')}</td></tr>
  <tr><td>19</td><td>${RW('девятна́дцать')}</td></tr>
</table>
<p class="tip">Bei 5–9 fällt das ь weg: пять → пя<b>т</b>на́дцать. Bei 12 heißt es две- (nicht два-).</p>

<h3>Zehner: 20 bis 90</h3>
<table class="rtable">
  <tr><td>20</td><td>${RW('два́дцать')}</td><td rowspan="2">2/3 + дцать („zwei zehn“)</td></tr>
  <tr><td>30</td><td>${RW('три́дцать')}</td></tr>
  <tr><td>40</td><td>${RW('со́рок')}</td><td><b>Ausnahme</b></td></tr>
  <tr><td>50</td><td>${RW('пятьдеся́т')}</td><td rowspan="4">5–8 + десят<br>(50, 60: betont hinten · 70, 80: betont vorne)</td></tr>
  <tr><td>60</td><td>${RW('шестьдеся́т')}</td></tr>
  <tr><td>70</td><td>${RW('се́мьдесят')}</td></tr>
  <tr><td>80</td><td>${RW('во́семьдесят')}</td></tr>
  <tr><td>90</td><td>${RW('девяно́сто')}</td><td><b>Ausnahme</b></td></tr>
</table>

<h3>Hunderter und größere Zahlen</h3>
<table class="rtable">
  <tr><td>100</td><td>${RW('сто')}</td><td><b>Ausnahme</b></td></tr>
  <tr><td>200</td><td>${RW('две́сти')}</td><td rowspan="3">2–4 + сти / ста</td></tr>
  <tr><td>300</td><td>${RW('три́ста')}</td></tr>
  <tr><td>400</td><td>${RW('четы́реста')}</td></tr>
  <tr><td>500</td><td>${RW('пятьсо́т')}</td><td rowspan="5">5–9 + сот, betont hinten</td></tr>
  <tr><td>600</td><td>${RW('шестьсо́т')}</td></tr>
  <tr><td>700</td><td>${RW('семьсо́т')}</td></tr>
  <tr><td>800</td><td>${RW('восемьсо́т')}</td></tr>
  <tr><td>900</td><td>${RW('девятьсо́т')}</td></tr>
  <tr><td>1000</td><td>${RW('ты́сяча')}</td><td>2000 = ${RW('две ты́сячи')}<br>5000 = ${RW('пять ты́сяч')}</td></tr>
  <tr><td>1 000 000</td><td>${RW('миллио́н')}</td><td></td></tr>
</table>
<p class="tip">ты́сяча ist ein weibliches Nomen, deshalb <b>две</b> ты́сячи. Danach gilt dieselbe Regel wie unten (1 / 2–4 / 5+).</p>

<h3>Zusammengesetzte Zahlen</h3>
<p>Einfach von groß nach klein hintereinander – <b>nicht</b> umgedreht wie im Deutschen („einundzwanzig“):</p>
<ul>
  <li>21 = ${RW('два́дцать оди́н')} (wörtlich „zwanzig eins“)</li>
  <li>45 = ${RW('со́рок пять')}</li>
  <li>99 = ${RW('девяно́сто де́вять')}</li>
  <li>365 = ${RW('три́ста шестьдеся́т пять')}</li>
  <li>2026 = ${RW('две ты́сячи два́дцать шесть')}</li>
</ul>

<h3>Das Wichtigste: Welche Form hat das Nomen nach der Zahl?</h3>
<p>Entscheidend ist die <b>letzte Ziffer</b> (beziehungsweise die letzte Zahl, die man spricht):</p>
<table class="rtable">
  <tr><th>Zahl endet auf</th><th>Nomen steht im</th><th>Beispiel</th></tr>
  <tr><td><b>1</b><br><small>1, 21, 31, 101 …</small></td><td>Nominativ Singular</td><td>${RW('оди́н брат')}<br>${RW('два́дцать одна́ кни́га')}</td></tr>
  <tr><td><b>2, 3, 4</b><br><small>2, 23, 104 …</small></td><td>Genitiv Singular</td><td>${RW('два бра́та')}<br>${RW('три кни́ги')}</td></tr>
  <tr><td><b>5–9, 0</b><br><small>und 11–14!</small></td><td>Genitiv Plural</td><td>${RW('пять бра́тьев')}<br>${RW('двена́дцать книг')}</td></tr>
</table>
<p class="tip"><b>Achtung 11–14:</b> Das sind eigene Wörter (оди́ннадцать …), sie enden nicht auf „1“ oder „2“. Deshalb immer Genitiv Plural: оди́ннадцать <b>книг</b>, aber два́дцать одна́ <b>кни́га</b>.</p>

<h3>Die drei häufigsten Wörter nach Zahlen</h3>
<table class="rtable">
  <tr><th></th><th>1 (21 …)</th><th>2–4</th><th>5+ und 11–14</th></tr>
  <tr><td>Jahr</td><td>год</td><td>го́да</td><td><b>лет</b></td></tr>
  <tr><td>Stunde</td><td>час</td><td>часа́</td><td>часо́в</td></tr>
  <tr><td>Rubel</td><td>рубль</td><td>рубля́</td><td>рубле́й</td></tr>
  <tr><td>Mensch</td><td>челове́к</td><td>челове́ка</td><td>челове́к</td></tr>
</table>
<p class="tip">год → <b>лет</b> ist ein ganz anderes Wort (von ле́то = Sommer). челове́к bleibt nach 5+ unverändert.</p>

<h3>Im Alltag</h3>
<table class="rtable">
  <tr><th>Thema</th><th>Beispiel</th></tr>
  <tr><td>Alter<br><small>wer im Dativ + Zahl + год/го́да/лет</small></td><td>${RW('Ско́лько тебе́ лет?')}<br>${RW('Мне два́дцать оди́н год.')}<br>${RW('Ему́ три́дцать три го́да.')}<br>${RW('Ей пятьдеся́т лет.')}</td></tr>
  <tr><td>Uhrzeit</td><td>${RW('Кото́рый час?')}<br>${RW('Сейча́с час.')} (1 Uhr – ohne оди́н)<br>${RW('Сейча́с два часа́.')}<br>${RW('Сейча́с пять часо́в.')}</td></tr>
  <tr><td>Preis</td><td>${RW('Ско́лько сто́ит?')}<br>${RW('Сто рубле́й.')}<br>${RW('Три рубля́.')}</td></tr>
  <tr><td>Telefonnummer<br><small>in Gruppen gesprochen</small></td><td>123-45-67 =<br>${RW('сто два́дцать три, со́рок пять, шестьдеся́т семь')}</td></tr>
</table>

<h3>Ordnungszahlen (der erste, der zweite …)</h3>
<p>Sie verhalten sich wie <b>Adjektive</b> und passen sich an: пе́рвый день, пе́рвая неде́ля, пе́рвое ме́сто.</p>
<table class="rtable">
  <tr><td>1.</td><td>${RW('пе́рвый')}</td><td>6.</td><td>${RW('шесто́й')}</td></tr>
  <tr><td>2.</td><td>${RW('второ́й')}</td><td>7.</td><td>${RW('седьмо́й')}</td></tr>
  <tr><td>3.</td><td>${RW('тре́тий')}</td><td>8.</td><td>${RW('восьмо́й')}</td></tr>
  <tr><td>4.</td><td>${RW('четвёртый')}</td><td>9.</td><td>${RW('девя́тый')}</td></tr>
  <tr><td>5.</td><td>${RW('пя́тый')}</td><td>10.</td><td>${RW('деся́тый')}</td></tr>
</table>
<ul>
  <li>Datum (sächlich, Monat im Genitiv): ${RW('пе́рвое ма́я')} = der 1. Mai</li>
  <li>Stockwerk: ${RW('Я живу́ на второ́м этаже́.')} = Ich wohne im 2. Stock.</li>
  <li>Bei großen Zahlen wird nur die <b>letzte</b> zur Ordnungszahl: 2026 год = ${RW('две ты́сячи два́дцать шесто́й год')}</li>
</ul>
<p class="tip">Für Fortgeschrittene: Auch die Zahlen selbst werden dekliniert (с двумя́ друзья́ми = mit zwei Freunden). Für den Anfang reicht die Grundform.</p>
`,
  },
  {
    id: 'aspekt',
    icon: '⏳',
    title: 'Vollendet und unvollendet',
    teaser: 'Wann welcher Aspekt? Zeiten, Signalwörter, Bildung der Paare',
    html: `
<p>Fast jedes russische Verb gibt es in zwei Formen (Aspekten). Sie beschreiben dieselbe Handlung, aber aus einer anderen <b>Sicht</b>.</p>

<h3>Bedeutung</h3>
<table class="rtable">
  <tr><th></th><th>unvollendet</th><th>vollendet</th></tr>
  <tr><td>Sicht</td><td>Vorgang, Dauer, Wiederholung, Gewohnheit, „überhaupt“</td><td>einmalig, abgeschlossen, mit Ergebnis</td></tr>
  <tr><td>Beispiel</td><td>Я чита́л кни́гу. – Ich habe im Buch gelesen (eine Zeit lang).</td><td>Я прочита́л кни́гу. – Ich habe das Buch ausgelesen.</td></tr>
  <tr><td>Wiederholung</td><td>Я звоню́ ей ка́ждый день.</td><td>Я позвоню́ ей за́втра. (einmal)</td></tr>
</table>

<h3>Zeiten</h3>
<table class="rtable">
  <tr><th></th><th>unvollendet</th><th>vollendet</th></tr>
  <tr><td>Gegenwart</td><td>я чита́ю</td><td>– gibt es nicht –</td></tr>
  <tr><td>Vergangenheit</td><td>я чита́л(а)</td><td>я прочита́л(а)</td></tr>
  <tr><td>Zukunft</td><td>я бу́ду чита́ть (бу́ду + Infinitiv)</td><td>я прочита́ю (Präsensformen = Zukunft)</td></tr>
</table>
<p class="tip">Merke: Die я/ты-Formen eines vollendeten Verbs sind <b>immer Zukunft</b>: сде́лаю = ich werde (es fertig) machen.</p>

<h3>Signalwörter</h3>
<ul>
  <li><b>unvollendet:</b> всегда́ (immer), ча́сто (oft), обы́чно (gewöhnlich), иногда́ (manchmal), ка́ждый день (jeden Tag), до́лго (lange), весь день (den ganzen Tag), ещё (noch)</li>
  <li><b>vollendet:</b> вдруг (plötzlich), сра́зу (sofort), наконе́ц (endlich), уже́ (schon – mit Ergebnis), за час (innerhalb einer Stunde)</li>
</ul>

<h3>Weitere Regeln</h3>
<ul>
  <li>Nach <b>начина́ть, конча́ть, продолжа́ть, перестава́ть, броса́ть</b> (anfangen, aufhören …) steht immer der <b>unvollendete</b> Infinitiv: Я начина́ю <u>чита́ть</u>.</li>
  <li><b>Mehrere Handlungen nacheinander</b> → vollendet: Он встал, умы́лся и ушёл. <b>Gleichzeitig</b> → unvollendet: Он ел и смотре́л телеви́зор.</li>
  <li><b>Verneinung:</b> Я не чита́л э́ту кни́гу. (unvollendet = „gar nicht“) – Я не прочита́л кни́гу. (vollendet = „nicht fertig geworden“).</li>
  <li><b>нельзя́ + unvollendet</b> = nicht erlaubt (Здесь нельзя́ кури́ть.), <b>нельзя́ + vollendet</b> = unmöglich (Дверь нельзя́ откры́ть.).</li>
</ul>

<h3>Wie werden Aspektpaare gebildet?</h3>
<ul>
  <li><b>Vorsilbe</b> macht vollendet: де́лать → <u>с</u>де́лать, писа́ть → <u>на</u>писа́ть, чита́ть → <u>про</u>чита́ть</li>
  <li><b>Suffix</b> wechselt: реш<u>а́</u>ть → реш<u>и́</u>ть, пока́з<u>ыва</u>ть → показа́ть, да<u>ва́</u>ть → дать</li>
  <li><b>Ganz andere Wörter:</b> говори́ть → сказа́ть, брать → взять, лови́ть → пойма́ть, класть → положи́ть</li>
  <li><b>Zweiaspektig</b> (eine Form für beide): испо́льзовать, жени́ться, организова́ть</li>
</ul>`,
  },
  {
    id: 'konjugation',
    icon: '🔤',
    title: 'Konjugation (1. und 2.)',
    teaser: 'Endungen, wie man die Konjugation erkennt, Stammwechsel, Vergangenheit',
    html: `
<h3>Die zwei Konjugationen</h3>
<table class="rtable">
  <tr><th></th><th>1. Konjugation (е)<br>чита́ть</th><th>2. Konjugation (и)<br>говори́ть</th></tr>
  <tr><td>я</td><td>чита́<b>ю</b></td><td>говор<b>ю́</b></td></tr>
  <tr><td>ты</td><td>чита́<b>ешь</b></td><td>говор<b>и́шь</b></td></tr>
  <tr><td>он/она́</td><td>чита́<b>ет</b></td><td>говор<b>и́т</b></td></tr>
  <tr><td>мы</td><td>чита́<b>ем</b></td><td>говор<b>и́м</b></td></tr>
  <tr><td>вы</td><td>чита́<b>ете</b></td><td>говор<b>и́те</b></td></tr>
  <tr><td>они́</td><td>чита́<b>ют</b></td><td>говор<b>я́т</b></td></tr>
</table>
<p>Endungen kurz: <b>1.:</b> -у/-ю, -ешь, -ет, -ем, -ете, -ут/-ют · <b>2.:</b> -у/-ю, -ишь, -ит, -им, -ите, -ат/-ят.<br>
Ist die Endung in der 1. Konjugation betont, schreibt man <b>ё</b>: идёшь, идёт, идём.</p>

<h3>Welche Konjugation? (Regel für unbetonte Endungen)</h3>
<ul>
  <li><b>2. Konjugation:</b> alle Verben auf <b>-ить</b> (außer брить, стели́ть) + 7 auf <b>-еть</b>: смотре́ть, ви́деть, ненави́деть, оби́деть, терпе́ть, верте́ть, зави́сеть + 4 auf <b>-ать</b>: гнать, держа́ть, дыша́ть, слы́шать.</li>
  <li><b>1. Konjugation:</b> alle anderen (чита́ть, уме́ть, рисова́ть, …).</li>
  <li><b>Infinitiv auf -ти, -чь, -сть, -зть:</b> man sieht es nicht am Infinitiv → immer 1. Konjugation, den Stamm aus der я-Form lernen: идти́ → иду́, мочь → могу́, класть → кладу́.</li>
  <li>Sicherster Weg: die <b>я- und ты-Form</b> mitlernen (steht auf jeder Karte).</li>
</ul>

<h3>Typische Stämme der 1. Konjugation</h3>
<ul>
  <li><b>-овать / -евать → -у́ю:</b> рисова́ть → рису́ю, рису́ешь; танцева́ть → танцу́ю</li>
  <li><b>-авать → -аю́:</b> дава́ть → даю́, даёшь; встава́ть → встаю́</li>
  <li><b>Stammwechsel:</b> писа́ть → пишу́, пи́шешь; пла́кать → пла́чу; ре́зать → ре́жу (in allen Formen)</li>
  <li><b>-чь:</b> г/к in я und они́, ж/ч sonst: мочь → могу́, мо́жешь, мо́гут; печь → пеку́, печёшь, пеку́т</li>
</ul>

<h3>Konsonantenwechsel in der 2. Konjugation (nur in der я-Form)</h3>
<table class="rtable">
  <tr><th>Wechsel</th><th>Beispiel</th></tr>
  <tr><td>д → ж</td><td>ви́деть → ви́жу, ви́дишь</td></tr>
  <tr><td>з → ж</td><td>вози́ть → вожу́, во́зишь</td></tr>
  <tr><td>с → ш</td><td>проси́ть → прошу́, про́сишь</td></tr>
  <tr><td>т → ч</td><td>плати́ть → плачу́, пла́тишь</td></tr>
  <tr><td>ст → щ</td><td>чи́стить → чи́щу, чи́стишь</td></tr>
  <tr><td>б, п, в, ф, м → +л</td><td>люби́ть → люблю́; купи́ть → куплю́; гото́вить → гото́влю</td></tr>
</table>

<h3>Unregelmäßige Verben</h3>
<table class="rtable">
  <tr><th></th><th>хоте́ть</th><th>есть</th><th>дать</th><th>бежа́ть</th></tr>
  <tr><td>я</td><td>хочу́</td><td>ем</td><td>дам</td><td>бегу́</td></tr>
  <tr><td>ты</td><td>хо́чешь</td><td>ешь</td><td>дашь</td><td>бежи́шь</td></tr>
  <tr><td>он</td><td>хо́чет</td><td>ест</td><td>даст</td><td>бежи́т</td></tr>
  <tr><td>мы</td><td>хоти́м</td><td>еди́м</td><td>дади́м</td><td>бежи́м</td></tr>
  <tr><td>вы</td><td>хоти́те</td><td>еди́те</td><td>дади́те</td><td>бежи́те</td></tr>
  <tr><td>они́</td><td>хотя́т</td><td>едя́т</td><td>даду́т</td><td>бегу́т</td></tr>
</table>

<h3>Vergangenheit</h3>
<p>Infinitiv ohne <b>-ть</b> + <b>-л</b> (er), <b>-ла</b> (sie), <b>-ло</b> (es), <b>-ли</b> (Plural) – unabhängig von der Person:<br>
чита́ть → чита́л, чита́ла, чита́ло, чита́ли. Я чита́л (Mann), я чита́ла (Frau).</p>
<p>Sonderfälle: мочь → мог, могла́; идти́ → шёл, шла; нести́ → нёс, несла́; есть → ел; расти́ → рос, росла́; умере́ть → у́мер, умерла́.</p>

<h3>Zukunft</h3>
<ul>
  <li><b>unvollendet:</b> бу́ду, бу́дешь, бу́дет, бу́дем, бу́дете, бу́дут + Infinitiv: я бу́ду рабо́тать</li>
  <li><b>vollendet:</b> die Präsensformen: я сде́лаю, ты сде́лаешь</li>
</ul>`,
  },
  {
    id: 'imperativ',
    icon: '❗',
    title: 'Imperativ',
    teaser: 'Bildung (-й, -и, -ь), Höflichkeitsform, Ausnahmen, welcher Aspekt',
    html: `
<h3>Bildung in 3 Schritten</h3>
<ol>
  <li>Nimm den <b>Präsensstamm</b>: die ты-Form ohne Endung (чита́ешь → чита-, пи́шешь → пиш-).<br>Bei -ти/-чь-Verben mit г/к die я-Form: помогу́ → помог-.</li>
  <li>Hänge die Endung an:
    <table class="rtable">
      <tr><th>Stamm endet auf …</th><th>Endung</th><th>Beispiel</th></tr>
      <tr><td>Vokal</td><td><b>-й</b></td><td>чита́ю → чита́й, де́лаю → де́лай, рису́ю → рису́й</td></tr>
      <tr><td>Konsonant, я-Form endbetont</td><td><b>-и́</b></td><td>пишу́ → пиши́, говорю́ → говори́, иду́ → иди́</td></tr>
      <tr><td>Konsonant, Stamm betont</td><td><b>-ь</b></td><td>ста́ну → стань, ре́жу → режь, ве́рю → верь</td></tr>
      <tr><td>zwei Konsonanten am Ende</td><td><b>-и</b></td><td>кри́кну → кри́кни, по́мню → по́мни</td></tr>
    </table>
  </li>
  <li><b>Höflich oder mehrere Personen:</b> + <b>-те</b>: чита́й<u>те</u>, пиши́<u>те</u>, стань<u>те</u>.</li>
</ol>

<h3>Reflexive Verben</h3>
<p>Nach Vokal <b>-сь</b>, nach Konsonant, й oder ь <b>-ся</b>: сади́<u>сь</u> / сади́те<u>сь</u>, мо́й<u>ся</u>, оде́нь<u>ся</u>, бо́й<u>ся</u> / бо́йте<u>сь</u>.</p>

<h3>Besonderheiten</h3>
<ul>
  <li><b>вы-</b> ist im vollendeten Aspekt immer betont, die Endung kommt vom Grundverb: вы́учи (учи́), вы́йди (иди́), вы́брось (брось).</li>
  <li><b>-авать → -ава́й:</b> дава́ть → дава́й, встава́ть → встава́й, узнава́ть → узнава́й.</li>
  <li><b>-ить mit -ью/-ьёшь → -ей:</b> пить → пей, бить → бей, лить → лей, шить → шей.</li>
  <li><b>Unregelmäßig:</b> дать → дай, есть → ешь, лечь → ляг, е́хать/пое́хать → поезжа́й, быть → будь.</li>
  <li>Einige Verben haben (fast) <b>keinen Imperativ</b>: мочь, хоте́ть, ви́деть, слы́шать, сто́ить.</li>
</ul>

<h3>Welcher Aspekt im Imperativ?</h3>
<table class="rtable">
  <tr><th>unvollendet</th><th>vollendet</th></tr>
  <tr><td>allgemeine oder wiederholte Aufforderung: Звони́ мне ча́ще!</td><td>einmalige, konkrete Bitte: Позвони́ мне за́втра!</td></tr>
  <tr><td>Einladung, Erlaubnis (höflich): Сади́тесь! Проходи́те! Бери́те!</td><td>Bitte um ein Ergebnis: Закро́й дверь!</td></tr>
  <tr><td>Antreiben: Говори́ же! Ну, расска́зывай!</td><td></td></tr>
  <tr><td><b>Verbot:</b> не + unvollendet: Не кури́! Не кричи́!</td><td><b>Warnung:</b> не + vollendet: Не упади́! Не забу́дь!</td></tr>
</table>

<h3>„Lass uns …“ und „Er soll …“</h3>
<ul>
  <li><b>дава́й(те)</b> + unvollendeter Infinitiv: Дава́йте чита́ть! – Lasst uns lesen!</li>
  <li><b>дава́й(те)</b> + мы-Form des vollendeten Verbs: Дава́й пойдём в кино́! – Lass uns ins Kino gehen!</li>
  <li><b>пусть</b> + он/она́/они́-Form: Пусть он позвони́т. – Er soll anrufen.</li>
</ul>`,
  },
  {
    id: 'reflexiv',
    icon: '🔁',
    title: 'Reflexive Verben (-ся / -сь)',
    teaser: 'Bildung, Bedeutungen, Unterschiede zum Deutschen',
    html: `
<h3>Bildung</h3>
<p>An das normale Verb wird <b>-ся</b> (nach Konsonant) oder <b>-сь</b> (nach Vokal) gehängt:</p>
<table class="rtable">
  <tr><th></th><th>учи́ться</th><th>Regel</th></tr>
  <tr><td>я</td><td>учу́<b>сь</b></td><td>nach Vokal → -сь</td></tr>
  <tr><td>ты</td><td>у́чишь<b>ся</b></td><td>nach Konsonant → -ся</td></tr>
  <tr><td>он/она́</td><td>у́чит<b>ся</b> [-за]</td><td>-тся wird wie „za“ gesprochen</td></tr>
  <tr><td>мы</td><td>у́чим<b>ся</b></td><td></td></tr>
  <tr><td>вы</td><td>у́чите<b>сь</b></td><td>nach Vokal → -сь</td></tr>
  <tr><td>они́</td><td>у́чат<b>ся</b></td><td></td></tr>
  <tr><td>Vergangenheit</td><td>учи́л<b>ся</b>, учи́ла<b>сь</b>, учи́ли<b>сь</b></td><td></td></tr>
</table>

<h3>Was bedeutet -ся?</h3>
<ul>
  <li><b>sich selbst</b> (rückbezüglich): мыть – мы́ться (waschen – sich waschen), одева́ть – одева́ться</li>
  <li><b>einander</b> (gegenseitig): встреча́ться (sich treffen), целова́ться (sich küssen), ссо́риться</li>
  <li><b>Gefühl oder Zustand:</b> ра́доваться, боя́ться, серди́ться, волнова́ться</li>
  <li><b>Passiv</b> (wird gemacht): Дом стро́ится. – Das Haus wird gebaut. Магази́н открыва́ется в де́вять.</li>
  <li><b>unpersönlich</b> mit Dativ: Мне хо́чется спать. – Ich möchte schlafen. Мне не спи́тся. – Ich kann nicht schlafen.</li>
</ul>

<h3>Wichtig</h3>
<ul>
  <li>Reflexive Verben haben <b>nie ein Akkusativobjekt</b>: Я учу́ слова́ (Akk.), aber Я учу́сь в шко́ле.</li>
  <li>Einige gibt es <b>nur</b> mit -ся: боя́ться, смея́ться, нра́виться, наде́яться, улыба́ться.</li>
  <li>Deutsch und Russisch passen oft <b>nicht</b> zusammen:
    <ul>
      <li>sich erinnern = по́мнить (ohne -ся) · lachen = смея́ться (mit -ся)</li>
      <li>sich setzen = сади́ться ✓ · aber: sich ausruhen = отдыха́ть (ohne -ся)</li>
    </ul>
  </li>
</ul>`,
  },
  {
    id: 'faelle',
    icon: '📐',
    title: 'Die 6 Fälle',
    teaser: 'Wann welcher Fall, Endungen der Substantive, Adjektive und Pronomen',
    html: `
<h3>Überblick: Wann welcher Fall?</h3>
<table class="rtable">
  <tr><th>Fall</th><th>Frage</th><th>Verwendung</th></tr>
  <tr><td><b>Nominativ</b></td><td>кто? что? – wer? was?</td><td>Subjekt, Grundform: Ма́ма до́ма.</td></tr>
  <tr><td><b>Genitiv</b></td><td>кого́? чего́? – wessen? wovon?</td><td>Besitz (кни́га бра́та), Menge (мно́го воды́), Verneinung (нет вре́мени), Zahlen ab 2, nach у, без, для, до, из, от, по́сле, с (von … weg)</td></tr>
  <tr><td><b>Dativ</b></td><td>кому́? чему́? – wem?</td><td>Empfänger (дать бра́ту), Gefühl und Alter (мне хо́лодно, мне 20 лет), nach к und по</td></tr>
  <tr><td><b>Akkusativ</b></td><td>кого́? что? – wen? was?</td><td>direktes Objekt (ви́жу дом), Richtung wohin (в/на + Akk.), Zeitangaben (в пя́тницу), nach за, че́рез, про</td></tr>
  <tr><td><b>Instrumental</b></td><td>кем? чем? – mit wem? womit?</td><td>Werkzeug (писа́ть ру́чкой), mit (с дру́гом), als (стать врачо́м), nach за, под, над, пе́ред, ме́жду (wo?)</td></tr>
  <tr><td><b>Präpositiv</b></td><td>о ком? о чём? – über wen? wo?</td><td>nur mit Präposition: в/на (wo?), о (über), при</td></tr>
</table>

<h3>Substantive – Singular</h3>
<table class="rtable small">
  <tr><th></th><th>männlich<br>стол / музе́й</th><th>sächlich<br>окно́ / мо́ре</th><th>weiblich<br>ма́ма / неде́ля</th><th>weiblich<br>ночь</th></tr>
  <tr><td>Nom.</td><td>стол / музе́й</td><td>окн<b>о́</b> / мо́р<b>е</b></td><td>ма́м<b>а</b> / неде́л<b>я</b></td><td>ноч<b>ь</b></td></tr>
  <tr><td>Gen.</td><td>стол<b>а́</b> / музе́<b>я</b></td><td>окн<b>а́</b> / мо́р<b>я</b></td><td>ма́м<b>ы</b> / неде́л<b>и</b></td><td>но́ч<b>и</b></td></tr>
  <tr><td>Dat.</td><td>стол<b>у́</b> / музе́<b>ю</b></td><td>окн<b>у́</b> / мо́р<b>ю</b></td><td>ма́м<b>е</b> / неде́л<b>е</b></td><td>но́ч<b>и</b></td></tr>
  <tr><td>Akk.</td><td>стол / музе́й*</td><td>окн<b>о́</b> / мо́р<b>е</b></td><td>ма́м<b>у</b> / неде́л<b>ю</b></td><td>ноч<b>ь</b></td></tr>
  <tr><td>Instr.</td><td>стол<b>о́м</b> / музе́<b>ем</b></td><td>окн<b>о́м</b> / мо́р<b>ем</b></td><td>ма́м<b>ой</b> / неде́л<b>ей</b></td><td>но́ч<b>ью</b></td></tr>
  <tr><td>Präp.</td><td>стол<b>е́</b> / музе́<b>е</b></td><td>окн<b>е́</b> / мо́р<b>е</b></td><td>ма́м<b>е</b> / неде́л<b>е</b></td><td>но́ч<b>и</b></td></tr>
</table>
<p class="tip">* <b>Belebt</b> männlich (Menschen, Tiere): Akkusativ = Genitiv: Я ви́жу бра́т<b>а</b>. Unbelebt: Akkusativ = Nominativ: Я ви́жу стол.<br>
Wörter auf <b>-ия / -ие</b>: Dativ und Präpositiv auf <b>-ии</b>: в Росси́и, о зда́нии.</p>

<h3>Substantive – Plural</h3>
<table class="rtable small">
  <tr><th></th><th>Endung</th><th>Beispiel</th></tr>
  <tr><td>Nom.</td><td>-ы / -и, sächlich -а / -я</td><td>столы́, ма́мы, кни́ги, о́кна, моря́</td></tr>
  <tr><td>Gen.</td><td>-ов / -ев / -ей, weiblich und sächlich oft ohne Endung</td><td>столо́в, музе́ев, ноче́й, мам, окон</td></tr>
  <tr><td>Dat.</td><td>-ам / -ям</td><td>стола́м, ма́мам, моря́м</td></tr>
  <tr><td>Akk.</td><td>unbelebt = Nom., belebt = Gen.</td><td>ви́жу столы́ / ви́жу ма́м</td></tr>
  <tr><td>Instr.</td><td>-ами / -ями</td><td>стола́ми, ма́мами, моря́ми</td></tr>
  <tr><td>Präp.</td><td>-ах / -ях</td><td>о стола́х, о ма́мах, о моря́х</td></tr>
</table>

<h3>Rechtschreibregeln</h3>
<ul>
  <li>Nach <b>г, к, х, ж, ш, ч, щ</b> nie ы, sondern <b>и</b>: кни́ги, ноч<b>и</b>.</li>
  <li>Nach <b>ж, ш, ч, щ, ц</b> unbetont <b>е</b> statt о: с му́жем, с Са́шей.</li>
</ul>

<h3>Personalpronomen</h3>
<table class="rtable small">
  <tr><th>Nom.</th><th>Gen./Akk.</th><th>Dat.</th><th>Instr.</th><th>Präp.</th></tr>
  <tr><td>я</td><td>меня́</td><td>мне</td><td>мной</td><td>обо мне</td></tr>
  <tr><td>ты</td><td>тебя́</td><td>тебе́</td><td>тобо́й</td><td>о тебе́</td></tr>
  <tr><td>он / оно́</td><td>его́</td><td>ему́</td><td>им</td><td>о нём</td></tr>
  <tr><td>она́</td><td>её</td><td>ей</td><td>ей</td><td>о ней</td></tr>
  <tr><td>мы</td><td>нас</td><td>нам</td><td>на́ми</td><td>о нас</td></tr>
  <tr><td>вы</td><td>вас</td><td>вам</td><td>ва́ми</td><td>о вас</td></tr>
  <tr><td>они́</td><td>их</td><td>им</td><td>и́ми</td><td>о них</td></tr>
</table>
<p class="tip">Nach einer Präposition bekommen он, она́, они́ ein <b>н-</b>: у <b>н</b>его́, к <b>н</b>ей, с <b>н</b>и́ми.</p>

<h3>Adjektive (но́вый)</h3>
<table class="rtable small">
  <tr><th></th><th>männlich</th><th>sächlich</th><th>weiblich</th><th>Plural</th></tr>
  <tr><td>Nom.</td><td>но́в<b>ый</b></td><td>но́в<b>ое</b></td><td>но́в<b>ая</b></td><td>но́в<b>ые</b></td></tr>
  <tr><td>Gen.</td><td>но́в<b>ого</b> [-wa]</td><td>но́в<b>ого</b></td><td>но́в<b>ой</b></td><td>но́в<b>ых</b></td></tr>
  <tr><td>Dat.</td><td>но́в<b>ому</b></td><td>но́в<b>ому</b></td><td>но́в<b>ой</b></td><td>но́в<b>ым</b></td></tr>
  <tr><td>Akk.</td><td>= Nom. / Gen.</td><td>но́в<b>ое</b></td><td>но́в<b>ую</b></td><td>= Nom. / Gen.</td></tr>
  <tr><td>Instr.</td><td>но́в<b>ым</b></td><td>но́в<b>ым</b></td><td>но́в<b>ой</b></td><td>но́в<b>ыми</b></td></tr>
  <tr><td>Präp.</td><td>но́в<b>ом</b></td><td>но́в<b>ом</b></td><td>но́в<b>ой</b></td><td>но́в<b>ых</b></td></tr>
</table>

<h3>Zahlen</h3>
<ul>
  <li><b>1</b> (21, 31 …) + Nominativ: оди́н стол, одна́ кни́га</li>
  <li><b>2, 3, 4</b> (22, 23 …) + Genitiv Singular: два стола́, три кни́ги</li>
  <li><b>5 bis 20</b> (25, 30 …) und мно́го, ма́ло, ско́лько + Genitiv Plural: пять столо́в, мно́го книг</li>
</ul>`,
  },
  {
    id: 'praepositionen',
    icon: '📍',
    title: 'Präpositionen',
    teaser: 'Welche Präposition mit welchem Fall, в oder на, wo – wohin – woher, Zeit',
    html: `
<h3>Präpositionen nach Fall</h3>
<table class="rtable">
  <tr><th>Fall</th><th>Präpositionen</th></tr>
  <tr><td><b>Genitiv</b></td><td>
    <b>у</b> – bei, neben (у врача́; у меня́ есть = ich habe)<br>
    <b>без</b> – ohne · <b>для</b> – für · <b>до</b> – bis, vor (до обе́да)<br>
    <b>из</b> – aus · <b>от</b> – von (einer Person weg) · <b>с</b> – von … herunter, seit (с утра́)<br>
    <b>по́сле</b> – nach (zeitlich) · <b>о́коло</b> – in der Nähe, etwa · <b>из-за</b> – wegen<br>
    <b>про́тив</b> – gegen · <b>кро́ме</b> – außer · <b>вме́сто</b> – statt · <b>ми́мо</b> – vorbei an</td></tr>
  <tr><td><b>Dativ</b></td><td>
    <b>к</b> – zu, hin zu (к дру́гу, к врачу́, к восьми́ часа́м)<br>
    <b>по</b> – entlang, durch, per (по у́лице, по телефо́ну, по понеде́льникам)<br>
    <b>благодаря́</b> – dank</td></tr>
  <tr><td><b>Akkusativ</b></td><td>
    <b>в / на</b> – wohin? (в шко́лу, на рабо́ту)<br>
    <b>за</b> – für (спаси́бо за по́мощь), hinter (wohin?), innerhalb (за час)<br>
    <b>че́рез</b> – durch, über, in (nach Ablauf: че́рез час)<br>
    <b>про</b> – über (umgangssprachlich: фильм про любо́вь)</td></tr>
  <tr><td><b>Instrumental</b></td><td>
    <b>с</b> – mit (с дру́гом, чай с молоко́м)<br>
    <b>за</b> – hinter (wo?), holen (пойти́ за хле́бом)<br>
    <b>под</b> – unter (wo?) · <b>над</b> – über (wo?)<br>
    <b>пе́ред</b> – vor · <b>ме́жду</b> – zwischen</td></tr>
  <tr><td><b>Präpositiv</b></td><td>
    <b>в / на</b> – wo? (в шко́ле, на рабо́те)<br>
    <b>о / об / обо</b> – über (о ма́ме, об отце́, обо мне)<br>
    <b>при</b> – bei, in Anwesenheit von (при всех)</td></tr>
</table>

<h3>Wo? – Wohin? – Woher?</h3>
<table class="rtable">
  <tr><th></th><th>wo? где?</th><th>wohin? куда́?</th><th>woher? отку́да?</th></tr>
  <tr><td>в</td><td>в + Präp.: в шко́ле</td><td>в + Akk.: в шко́лу</td><td><b>из</b> + Gen.: из шко́лы</td></tr>
  <tr><td>на</td><td>на + Präp.: на рабо́те</td><td>на + Akk.: на рабо́ту</td><td><b>с</b> + Gen.: с рабо́ты</td></tr>
  <tr><td>Person</td><td>у + Gen.: у врача́</td><td>к + Dat.: к врачу́</td><td><b>от</b> + Gen.: от врача́</td></tr>
  <tr><td>за, под</td><td>+ Instr.: под столо́м</td><td>+ Akk.: под стол</td><td>из-за / из-под + Gen.</td></tr>
</table>

<h3>в oder на?</h3>
<ul>
  <li><b>в</b> = in etwas hinein, geschlossene Räume, Gebäude, Städte, Länder: в до́ме, в магази́не, в Москве́, в Герма́нии</li>
  <li><b>на</b> = auf einer Fläche, offene Orte, Veranstaltungen, Himmelsrichtungen, Inseln, Verkehrsmittel: на столе́, на у́лице, на конце́рте, на се́вере, на Ку́бе, на авто́бусе</li>
  <li><b>Feste Wörter mit на</b> (einfach merken): на рабо́те, на по́чте, на вокза́ле, на заво́де, на ры́нке, на ку́хне, на уро́ке, на ле́кции, на пло́щади</li>
</ul>

<h3>Zeitangaben</h3>
<ul>
  <li><b>в + Akk.:</b> Wochentag, Uhrzeit – в понеде́льник, в пять часо́в</li>
  <li><b>в + Präp.:</b> Monat, Jahr – в январе́, в 2026 году́</li>
  <li><b>на + Akk.:</b> für (geplante Dauer) – на неде́лю</li>
  <li><b>за + Akk.:</b> innerhalb – за час · <b>че́рез + Akk.:</b> in (nach Ablauf) – че́рез час</li>
  <li><b>с … до + Gen.:</b> von … bis – с утра́ до ве́чера · <b>по + Dat. Plural:</b> regelmäßig – по суббо́там (samstags)</li>
</ul>

<h3>Lautliche Anpassungen</h3>
<ul>
  <li><b>в → во</b>, <b>с → со</b>, <b>к → ко</b> vor schwierigen Konsonantengruppen: во вто́рник, со мной, ко мне</li>
  <li><b>о → об</b> vor Vokal: об отце́; <b>обо</b> bei мне: обо мне</li>
</ul>`,
  },
  {
    id: 'bewegung',
    icon: '🚶',
    title: 'Verben der Bewegung',
    teaser: 'Eine Richtung oder hin und her, по-, Vorsilben, die 14 Paare',
    html: `
<h3>Zwei unvollendete Verben für jede Bewegung</h3>
<table class="rtable">
  <tr><th>eine Richtung, gerade unterwegs</th><th>mehrere Richtungen, hin und zurück, regelmäßig</th></tr>
  <tr><td>Я <b>иду́</b> домо́й. – Ich bin auf dem Weg nach Hause.</td><td>Я <b>хожу́</b> в шко́лу. – Ich gehe (regelmäßig) zur Schule.</td></tr>
  <tr><td>Мы <b>е́дем</b> на мо́ре. – Wir fahren (gerade) ans Meer.</td><td>Вчера́ я <b>ходи́л</b> в кино́. – Ich war gestern im Kino (hin und zurück).</td></tr>
  <tr><td></td><td>Ребёнок уже́ <b>хо́дит</b>. – Das Kind kann schon laufen (allgemein).</td></tr>
</table>

<h3>Die 14 Paare</h3>
<table class="rtable small">
  <tr><th>eine Richtung</th><th>mehrere Richtungen</th><th>Bedeutung</th></tr>
  <tr><td>идти́</td><td>ходи́ть</td><td>gehen (zu Fuß)</td></tr>
  <tr><td>е́хать</td><td>е́здить</td><td>fahren</td></tr>
  <tr><td>бежа́ть</td><td>бе́гать</td><td>laufen, rennen</td></tr>
  <tr><td>лете́ть</td><td>лета́ть</td><td>fliegen</td></tr>
  <tr><td>плыть</td><td>пла́вать</td><td>schwimmen</td></tr>
  <tr><td>ползти́</td><td>по́лзать</td><td>kriechen</td></tr>
  <tr><td>лезть</td><td>ла́зить</td><td>klettern</td></tr>
  <tr><td>брести́</td><td>броди́ть</td><td>trotten, umherstreifen</td></tr>
  <tr><td>нести́</td><td>носи́ть</td><td>tragen (zu Fuß)</td></tr>
  <tr><td>везти́</td><td>вози́ть</td><td>fahren, bringen (mit Fahrzeug)</td></tr>
  <tr><td>вести́</td><td>води́ть</td><td>führen, bringen (Person)</td></tr>
  <tr><td>тащи́ть</td><td>таска́ть</td><td>schleppen</td></tr>
  <tr><td>гнать</td><td>гоня́ть</td><td>jagen, treiben</td></tr>
  <tr><td>кати́ть</td><td>ката́ть</td><td>rollen</td></tr>
</table>

<h3>Vorsilben</h3>
<ul>
  <li><b>по-</b> + Richtungsverb = vollendet, „losgehen“: пойти́, пое́хать, побежа́ть. Я пойду́ домо́й. – Ich gehe (jetzt los) nach Hause.</li>
  <li>Andere Vorsilben geben eine Richtung und bilden <b>normale Aspektpaare</b> (unvollendet aus dem mehrfachen, vollendet aus dem einfachen Verb):
    <ul>
      <li><b>при-</b> ankommen: приходи́ть / прийти́ · <b>у-</b> weggehen: уходи́ть / уйти́</li>
      <li><b>в-</b> hinein: входи́ть / войти́ · <b>вы-</b> hinaus: выходи́ть / вы́йти</li>
      <li><b>пере-</b> hinüber: переходи́ть / перейти́ · <b>до-</b> bis hin: доходи́ть / дойти́</li>
      <li><b>под-</b> heran: подходи́ть / подойти́ · <b>от-</b> weg (ein Stück): отходи́ть / отойти́</li>
      <li><b>за-</b> kurz vorbei: заходи́ть / зайти́ · <b>про-</b> vorbei, durch: проходи́ть / пройти́</li>
    </ul>
  </li>
  <li>Bei е́здить wird mit Vorsilbe <b>-езжа́ть</b> daraus: приезжа́ть / прие́хать, уезжа́ть / уе́хать.</li>
</ul>`,
  },
];
