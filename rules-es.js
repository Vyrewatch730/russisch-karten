'use strict';
/* ============================================================
   Spanisch-Regeln (Bereich „Regeln“, wenn Spanisch die Lernsprache ist)
   Schwerpunkt: Spanisch in der Dominikanischen Republik (ustedes statt vosotros)
   Jede Regel: id, Symbol, Titel, Kurzbeschreibung, HTML-Inhalt
   ============================================================ */
// Spanisches Wort oder Satz mit 🔊
const SW = w => `<span class="rw">${w}</span> <button class="say" data-lang="es" data-say="${w}">🔊</button>`;
// Tabellenzeile: Buchstabe, Laut, Beispiel(e)
const SABC = (letter, sound, ...words) =>
  `<tr><td class="abc"><b>${letter}</b></td><td>${sound}</td><td>${words.map(SW).join('<br>')}</td></tr>`;

const RULES_ES = [
  {
    id: 'es-aussprache',
    icon: '🗣️',
    title: 'Aussprache und Betonung',
    teaser: 'Buchstaben, die anders klingen als im Deutschen, mit Audio · wo die Betonung liegt',
    html: `
<p>Spanisch spricht man fast so, wie man es schreibt. Die Vokale a, e, i, o, u klingen immer kurz und klar, nie wie „ei“ oder „au“. Tippe auf 🔊 zum Anhören.</p>

<h3>Buchstaben, die anders klingen</h3>
<table class="rtable abc-table">
  <tr><th>Buchstabe</th><th>Laut</th><th>Beispiel</th></tr>
  ${SABC('c', 'vor e, i: scharfes s (in Lateinamerika) · sonst k', 'cine', 'casa')}
  ${SABC('z', 'scharfes s wie in „Bus“ (in Spanien wie englisch th)', 'zapato')}
  ${SABC('qu', 'k (das u ist stumm)', 'queso')}
  ${SABC('g', 'vor e, i: ch wie in „Bach“ · sonst g', 'gente', 'gato')}
  ${SABC('gu', 'vor e, i: g (das u ist stumm) · gü: g + u', 'guerra', 'pingüino')}
  ${SABC('j', 'ch wie in „Bach“, in der Karibik oft nur ein Hauch (h)', 'jugo')}
  ${SABC('h', 'stumm', 'hola')}
  ${SABC('ll / y', 'j wie in „ja“', 'calle', 'yo')}
  ${SABC('ñ', 'nj wie in „Champagner“', 'mañana')}
  ${SABC('v / b', 'beide wie b, zwischen Vokalen ganz weich', 'vino', 'beber')}
  ${SABC('r', 'kurz gerollt (einmal mit der Zunge)', 'pero')}
  ${SABC('rr', 'lange gerollt (auch r am Wortanfang)', 'perro', 'rojo')}
  ${SABC('s', 'immer scharf wie in „Bus“, nie wie in „Sonne“', 'casa')}
  ${SABC('ch', 'tsch wie in „Matsch“', 'chico')}
  ${SABC('d', 'zwischen Vokalen und am Ende ganz weich (fast wie englisch th)', 'nada')}
</table>

<h3>Wo liegt die Betonung?</h3>
<ul>
  <li>Wort endet auf <b>Vokal, -n oder -s</b> → vorletzte Silbe: ${SW('casa')} · ${SW('hablan')}</li>
  <li>Wort endet auf <b>anderen Konsonanten</b> → letzte Silbe: ${SW('hablar')} · ${SW('ciudad')}</li>
  <li>Ausnahmen bekommen einen <b>Akzent</b> (á, é, í, ó, ú), der die betonte Silbe zeigt: ${SW('café')} · ${SW('árbol')} · ${SW('canción')}</li>
  <li>Der Akzent unterscheidet auch Wörter: tú (du) – tu (dein), sí (ja) – si (wenn), él (er) – el (der).</li>
</ul>
<p class="tip">Fragen und Ausrufe haben vorne ein umgedrehtes Zeichen: ¿Cómo estás? ¡Qué bien!</p>

<h3>So klingt es in der Dominikanischen Republik</h3>
<ul>
  <li><b>s am Silbenende</b> wird oft verschluckt: ¿Cómo estás? klingt wie „¿Cómo etá?“.</li>
  <li><b>d zwischen Vokalen</b> fällt weg: cansado → „cansao“, nada → „naa“.</li>
  <li><b>para</b> wird zu „pa“: Voy pa' la casa.</li>
  <li>Im Norden (Cibao) wird r/l am Silbenende zu i: „poique“ statt porque.</li>
</ul>`,
  },
  {
    id: 'es-artikel',
    icon: '👫',
    title: 'Artikel, Geschlecht und Plural',
    teaser: 'el/la, un/una · welches Geschlecht? · Plural mit -s oder -es',
    html: `
<p>Jedes Nomen ist <b>männlich</b> oder <b>weiblich</b>. Es gibt kein „das“. Lerne das Wort immer mit Artikel.</p>
<table class="rtable">
  <tr><th></th><th>männlich</th><th>weiblich</th></tr>
  <tr><th>bestimmt (der/die)</th><td>el · los</td><td>la · las</td></tr>
  <tr><th>unbestimmt (ein/eine)</th><td>un · unos</td><td>una · unas</td></tr>
</table>
<p class="tip">a + el = <b>al</b> (Voy al parque), de + el = <b>del</b> (la casa del vecino).</p>

<h3>Welches Geschlecht?</h3>
<ul>
  <li>Meist <b>männlich</b>: -o, -or, -aje, -ma aus dem Griechischen: ${SW('el libro')} · ${SW('el problema')}</li>
  <li>Meist <b>weiblich</b>: -a, -ción, -sión, -dad, -tad, -tud: ${SW('la mesa')} · ${SW('la canción')} · ${SW('la ciudad')}</li>
  <li>Ausnahmen merken: el día, el mapa, el sofá · la mano, la foto, la moto, la radio</li>
  <li>Weibliche Wörter mit betontem a- am Anfang nehmen im Singular <b>el</b>: ${SW('el agua fría')}, aber las aguas.</li>
</ul>

<h3>Plural</h3>
<table class="rtable">
  <tr><th>Wortende</th><th>Plural</th><th>Beispiel</th></tr>
  <tr><td>Vokal</td><td>+ s</td><td>casa → casas</td></tr>
  <tr><td>Konsonant</td><td>+ es</td><td>ciudad → ciudades</td></tr>
  <tr><td>-z</td><td>-ces</td><td>vez → veces, lápiz → lápices</td></tr>
  <tr><td>unbetontes -s</td><td>bleibt</td><td>el lunes → los lunes</td></tr>
</table>
<p>Achtung Akzent: Er fällt weg, wenn die Betonung jetzt ohnehin richtig liegt (canción → canciones), oder kommt dazu, damit sie bleibt (examen → exámenes, joven → jóvenes).</p>
<p class="tip">Gemischte Gruppen sind männlich: los padres = die Eltern, los hermanos = die Geschwister.</p>`,
  },
  {
    id: 'es-presente',
    icon: '🔁',
    title: 'Verben im Präsens',
    teaser: '-ar, -er, -ir · Stammwechsel e→ie, o→ue · unregelmäßige yo-Formen',
    html: `
<p>Am Infinitiv erkennst du die Gruppe: <b>-ar</b>, <b>-er</b> oder <b>-ir</b>. Endung weg, neue Endung dran. Das Pronomen lässt man meist weg, die Endung zeigt die Person.</p>
<table class="rtable">
  <tr><th></th><th>hablar</th><th>comer</th><th>vivir</th></tr>
  <tr><th>yo</th><td>habl<b>o</b></td><td>com<b>o</b></td><td>viv<b>o</b></td></tr>
  <tr><th>tú</th><td>habl<b>as</b></td><td>com<b>es</b></td><td>viv<b>es</b></td></tr>
  <tr><th>él/ella/usted</th><td>habl<b>a</b></td><td>com<b>e</b></td><td>viv<b>e</b></td></tr>
  <tr><th>nosotros</th><td>habl<b>amos</b></td><td>com<b>emos</b></td><td>viv<b>imos</b></td></tr>
  <tr><th>ellos/ustedes</th><td>habl<b>an</b></td><td>com<b>en</b></td><td>viv<b>en</b></td></tr>
</table>
<p class="tip">In der Dominikanischen Republik (und ganz Lateinamerika) sagt man <b>ustedes</b> für „ihr“ – mit der Form von ellos: ¿Ustedes vienen? Die vosotros-Form (habláis) braucht man nicht.</p>

<h3>Stammwechsel (nur wenn der Stamm betont ist)</h3>
<table class="rtable">
  <tr><th>Wechsel</th><th>Beispiel</th><th>Formen</th></tr>
  <tr><td>e → ie</td><td>querer</td><td>quiero, quieres, quiere, queremos, quieren</td></tr>
  <tr><td>o → ue</td><td>poder</td><td>puedo, puedes, puede, podemos, pueden</td></tr>
  <tr><td>e → i</td><td>pedir</td><td>pido, pides, pide, pedimos, piden</td></tr>
</table>
<p>nosotros bleibt immer regelmäßig, weil dort die Endung betont ist.</p>

<h3>Unregelmäßige yo-Form</h3>
<p>${SW('tengo')} (tener) · ${SW('hago')} (hacer) · ${SW('pongo')} (poner) · ${SW('salgo')} (salir) · ${SW('digo')} (decir) · ${SW('vengo')} (venir) · ${SW('conozco')} (conocer) · ${SW('sé')} (saber) · ${SW('veo')} (ver)</p>

<h3>Ganz unregelmäßig</h3>
<table class="rtable">
  <tr><th></th><th>ser</th><th>estar</th><th>ir</th><th>tener</th></tr>
  <tr><th>yo</th><td>soy</td><td>estoy</td><td>voy</td><td>tengo</td></tr>
  <tr><th>tú</th><td>eres</td><td>estás</td><td>vas</td><td>tienes</td></tr>
  <tr><th>él/ella</th><td>es</td><td>está</td><td>va</td><td>tiene</td></tr>
  <tr><th>nosotros</th><td>somos</td><td>estamos</td><td>vamos</td><td>tenemos</td></tr>
  <tr><th>ellos/ustedes</th><td>son</td><td>están</td><td>van</td><td>tienen</td></tr>
</table>
<p class="tip">Auf jeder Verbkarte steht die Konjugation. Unter „Warum so? ⓘ“ steht, welche Regel gilt.</p>`,
  },
  {
    id: 'es-ser-estar',
    icon: '⚖️',
    title: 'ser, estar und hay',
    teaser: 'Zweimal „sein“: was etwas ist – wie oder wo es gerade ist',
    html: `
<p>Deutsch „sein“ hat im Spanischen zwei Verben.</p>
<h3>ser – was oder wer etwas ist (bleibt so)</h3>
<ul>
  <li>Herkunft, Beruf, Nationalität: ${SW('Soy de Alemania.')} · ${SW('Ella es doctora.')}</li>
  <li>Eigenschaften: ${SW('La casa es grande.')}</li>
  <li>Uhrzeit und Datum: ${SW('Son las tres.')} · ${SW('Hoy es lunes.')}</li>
</ul>
<h3>estar – wie oder wo etwas gerade ist</h3>
<ul>
  <li>Ort: ${SW('Estoy en casa.')} · ${SW('¿Dónde está el baño?')}</li>
  <li>Zustand, Gefühl: ${SW('Estoy cansado.')} · ${SW('La sopa está fría.')}</li>
  <li>Gerade dabei (estar + -ando/-iendo): ${SW('Estoy comiendo.')}</li>
</ul>
<p class="tip"><b>Merksatz:</b> Wie man sich fühlt und wo man ist, dafür nimmt man immer estar. Sonst meistens ser.</p>
<h3>Bedeutung ändert sich</h3>
<table class="rtable">
  <tr><th>ser</th><th>estar</th></tr>
  <tr><td>Es aburrido. = Er ist langweilig.</td><td>Está aburrido. = Er langweilt sich.</td></tr>
  <tr><td>Es listo. = Er ist klug.</td><td>Está listo. = Er ist fertig.</td></tr>
  <tr><td>Es rico. = Er ist reich.</td><td>Está rico. = Es schmeckt lecker.</td></tr>
</table>
<h3>hay – es gibt</h3>
<p>${SW('Hay un colmado en la esquina.')} = An der Ecke gibt es einen Laden. hay bleibt immer gleich, auch im Plural: Hay muchas personas.</p>`,
  },
  {
    id: 'es-vergangenheit',
    icon: '⏪',
    title: 'Vergangenheit und Zukunft',
    teaser: 'Pretérito (einmal passiert) und Imperfecto (früher immer) · Zukunft mit ir a',
    html: `
<h3>Pretérito – abgeschlossen, einmal passiert</h3>
<table class="rtable">
  <tr><th></th><th>hablar</th><th>comer / vivir</th></tr>
  <tr><th>yo</th><td>habl<b>é</b></td><td>com<b>í</b></td></tr>
  <tr><th>tú</th><td>habl<b>aste</b></td><td>com<b>iste</b></td></tr>
  <tr><th>él/ella</th><td>habl<b>ó</b></td><td>com<b>ió</b></td></tr>
  <tr><th>nosotros</th><td>habl<b>amos</b></td><td>com<b>imos</b></td></tr>
  <tr><th>ellos/ustedes</th><td>habl<b>aron</b></td><td>com<b>ieron</b></td></tr>
</table>
<p>${SW('Ayer comí arroz con habichuelas.')} = Gestern habe ich Reis mit Bohnen gegessen.</p>
<p>Wichtige unregelmäßige Formen: fui (ich war / ich ging – ser und ir gleich!), tuve, hice, estuve, pude, dije, vine.</p>

<h3>Imperfecto – früher, gewohnheitsmäßig, Hintergrund</h3>
<table class="rtable">
  <tr><th></th><th>hablar</th><th>comer / vivir</th></tr>
  <tr><th>yo</th><td>habl<b>aba</b></td><td>com<b>ía</b></td></tr>
  <tr><th>tú</th><td>habl<b>abas</b></td><td>com<b>ías</b></td></tr>
  <tr><th>él/ella</th><td>habl<b>aba</b></td><td>com<b>ía</b></td></tr>
  <tr><th>nosotros</th><td>habl<b>ábamos</b></td><td>com<b>íamos</b></td></tr>
  <tr><th>ellos/ustedes</th><td>habl<b>aban</b></td><td>com<b>ían</b></td></tr>
</table>
<p>${SW('De niño, jugaba pelota todos los días.')} = Als Kind habe ich jeden Tag Baseball gespielt.</p>
<p class="tip"><b>Faustregel:</b> Kann man „einmal“ oder „gestern“ dazudenken → Pretérito. „Früher immer“ oder „gerade dabei, als …“ → Imperfecto. Wie beim russischen Aspekt: Pretérito ≈ vollendet, Imperfecto ≈ unvollendet.</p>

<h3>Zukunft: ir a + Infinitiv</h3>
<p>${SW('Voy a comer.')} = Ich werde essen. ${SW('¿Qué vas a hacer mañana?')} Das ist im Alltag viel häufiger als die eigene Futurform (comeré).</p>`,
  },
  {
    id: 'es-pronomen',
    icon: '🙋',
    title: 'Pronomen und gustar',
    teaser: 'yo, tú, usted · me, te, lo, la, le · me gusta',
    html: `
<table class="rtable">
  <tr><th>Subjekt</th><th>direktes Objekt (wen?)</th><th>indirektes Objekt (wem?)</th></tr>
  <tr><td>yo</td><td>me</td><td>me</td></tr>
  <tr><td>tú</td><td>te</td><td>te</td></tr>
  <tr><td>él / ella / usted</td><td>lo / la</td><td>le</td></tr>
  <tr><td>nosotros</td><td>nos</td><td>nos</td></tr>
  <tr><td>ellos / ellas / ustedes</td><td>los / las</td><td>les</td></tr>
</table>
<ul>
  <li>Objektpronomen stehen <b>vor</b> dem konjugierten Verb: ${SW('Te quiero.')} · ${SW('Lo veo.')}</li>
  <li>Beim Infinitiv dürfen sie angehängt werden: ${SW('Voy a llamarte.')}</li>
  <li><b>usted</b> (Sie) nimmt die Form von él: ¿Cómo está usted?</li>
</ul>

<h3>gustar – gefallen</h3>
<p>Wie im Russischen (мне нра́вится): Das, was gefällt, ist das Subjekt. Die Person steht davor.</p>
<p>${SW('Me gusta el café.')} · ${SW('Me gustan los perros.')} (Plural → gustan) · ${SW('¿Te gusta bailar?')}</p>
<p class="tip">In der Dominikanischen Republik steht das Pronomen in Fragen oft <b>vor</b> dem Verb: ¿Qué tú quieres? statt ¿Qué quieres tú?</p>`,
  },
  {
    id: 'es-adjektive',
    icon: '🎨',
    title: 'Adjektive und Vergleich',
    teaser: 'Anpassung an das Nomen · más … que · mejor, peor · -ísimo',
    html: `
<p>Adjektive passen sich in Geschlecht und Zahl an und stehen meist <b>nach</b> dem Nomen.</p>
<table class="rtable">
  <tr><th></th><th>männlich</th><th>weiblich</th></tr>
  <tr><th>Singular</th><td>el carro nuevo</td><td>la casa nueva</td></tr>
  <tr><th>Plural</th><td>los carros nuevos</td><td>las casas nuevas</td></tr>
</table>
<p>Adjektive auf -e oder Konsonant haben nur Singular und Plural: verde → verdes, fácil → fáciles. Herkunft hat trotzdem eine weibliche Form: español → española, alemán → alemana.</p>
<p class="tip">Vor dem Nomen werden manche kürzer: un buen día, un mal día, un gran hombre (= ein großartiger Mann).</p>
<h3>Vergleichen</h3>
<ul>
  <li><b>más … que</b> = mehr … als: ${SW('Juan es más alto que Pedro.')}</li>
  <li><b>menos … que</b> = weniger … als · <b>tan … como</b> = so … wie</li>
  <li>Superlativ: ${SW('Es la playa más bonita.')} = Das ist der schönste Strand.</li>
  <li>Unregelmäßig: bueno → <b>mejor</b>, malo → <b>peor</b>, grande → <b>mayor</b> (älter), pequeño → <b>menor</b> (jünger)</li>
  <li>Sehr: <b>-ísimo</b>: ${SW('Está buenísimo.')} = Das ist super lecker.</li>
</ul>
<p class="tip">Anders als im Russischen gibt es keine Fälle: Das Adjektiv ändert sich nur nach Geschlecht und Zahl.</p>`,
  },
  {
    id: 'es-praepositionen',
    icon: '🧭',
    title: 'Präpositionen: a, en, de, por, para',
    teaser: 'Wohin, wo, woher · por oder para?',
    html: `
<table class="rtable">
  <tr><th>Präposition</th><th>Bedeutung</th><th>Beispiel</th></tr>
  <tr><td>a</td><td>wohin, Uhrzeit, persönliches Objekt</td><td>Voy a Santo Domingo. · a las ocho · Veo a María.</td></tr>
  <tr><td>en</td><td>wo, Verkehrsmittel</td><td>Estoy en casa. · en guagua</td></tr>
  <tr><td>de</td><td>woher, von, aus</td><td>Soy de Alemania. · la casa de mi madre</td></tr>
  <tr><td>con</td><td>mit</td><td>café con leche · conmigo, contigo</td></tr>
  <tr><td>sin</td><td>ohne</td><td>sin azúcar</td></tr>
</table>
<p class="tip"><b>Persönliches a:</b> Ist das Objekt eine Person, steht a davor: Busco <b>a</b> mi hermano. Das gibt es im Deutschen nicht.</p>

<h3>por oder para?</h3>
<table class="rtable">
  <tr><th>para – Ziel, Zweck, für wen</th><th>por – Grund, Weg, Tausch</th></tr>
  <tr><td>Es para ti. = Das ist für dich.</td><td>Gracias por todo. = Danke für alles.</td></tr>
  <tr><td>Estudio para aprender. = um zu lernen</td><td>Lo hago por ti. = wegen dir / dir zuliebe</td></tr>
  <tr><td>Salgo para Santiago. = nach (Ziel)</td><td>Paseamos por el parque. = durch</td></tr>
  <tr><td>para mañana = bis morgen (Frist)</td><td>por la mañana = am Morgen · por 100 pesos = für (Preis)</td></tr>
</table>
<p class="tip"><b>Faustregel:</b> para zeigt nach vorne (Ziel, Zweck), por zeigt nach hinten (Grund) oder durch etwas hindurch.</p>`,
  },
  {
    id: 'es-zahlen',
    icon: '🔢',
    title: 'Zahlen, Uhrzeit und Tage',
    teaser: '1–1000 · ¿Qué hora es? · Wochentage und Monate',
    html: `
<table class="rtable">
  <tr><td>1 uno</td><td>2 dos</td><td>3 tres</td><td>4 cuatro</td><td>5 cinco</td></tr>
  <tr><td>6 seis</td><td>7 siete</td><td>8 ocho</td><td>9 nueve</td><td>10 diez</td></tr>
  <tr><td>11 once</td><td>12 doce</td><td>13 trece</td><td>14 catorce</td><td>15 quince</td></tr>
  <tr><td>16 dieciséis</td><td>20 veinte</td><td>21 veintiuno</td><td>30 treinta</td><td>31 treinta y uno</td></tr>
  <tr><td>40 cuarenta</td><td>50 cincuenta</td><td>60 sesenta</td><td>70 setenta</td><td>80 ochenta</td></tr>
  <tr><td>90 noventa</td><td>100 cien</td><td>101 ciento uno</td><td>500 quinientos</td><td>1000 mil</td></tr>
</table>
<p>Ab 31 mit <b>y</b>: treinta y dos. Bis 29 in einem Wort: veintitrés. uno wird vor männlichen Nomen zu un: un peso, veintiún años.</p>
<p>${SW('cien')} · ${SW('quinientos pesos')} · ${SW('dos mil veinticinco')}</p>

<h3>Uhrzeit</h3>
<ul>
  <li>${SW('¿Qué hora es?')} – ${SW('Es la una.')} (nur bei 1 Uhr: es la) · ${SW('Son las tres.')}</li>
  <li>y cuarto = Viertel nach · y media = halb (nach!) · menos cuarto = Viertel vor: ${SW('Son las cinco y media.')} = halb sechs</li>
  <li>Um … Uhr: ${SW('a las ocho')} · de la mañana / de la tarde / de la noche</li>
</ul>
<p class="tip">Achtung: „las cinco y media“ = 5:30, also deutsch „halb sechs“.</p>

<h3>Tage und Monate (klein geschrieben)</h3>
<p>lunes, martes, miércoles, jueves, viernes, sábado, domingo · el lunes = am Montag, los lunes = montags</p>
<p>enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre</p>
<p>Datum: ${SW('Hoy es el 27 de febrero.')} (Unabhängigkeitstag der Dominikanischen Republik)</p>`,
  },
  {
    id: 'es-dominikanisch',
    icon: '🇩🇴',
    title: 'Dominikanisches Spanisch',
    teaser: 'Typische Wörter und Ausdrücke aus der Dominikanischen Republik',
    html: `
<p>In der Dominikanischen Republik spricht man schnell und locker. Diese Wörter hörst du dort ständig:</p>
<table class="rtable">
  <tr><th>Dominikanisch</th><th>Bedeutung</th></tr>
  <tr><td>${SW('¿Qué lo que?')}</td><td>Was geht? (Begrüßung)</td></tr>
  <tr><td>${SW('la guagua')}</td><td>der Bus</td></tr>
  <tr><td>${SW('el colmado')}</td><td>der kleine Laden an der Ecke (auch Treffpunkt)</td></tr>
  <tr><td>${SW('un chin')}</td><td>ein bisschen: un chin de arroz</td></tr>
  <tr><td>${SW('la vaina')}</td><td>das Ding, die Sache (für fast alles)</td></tr>
  <tr><td>${SW('jevi')}</td><td>cool, super</td></tr>
  <tr><td>${SW('chévere')}</td><td>toll, prima</td></tr>
  <tr><td>${SW('el tíguere')}</td><td>cleverer, gerissener Typ</td></tr>
  <tr><td>${SW('el concho')}</td><td>Sammeltaxi</td></tr>
  <tr><td>${SW('el motoconcho')}</td><td>Motorradtaxi</td></tr>
  <tr><td>${SW('la bandera dominicana')}</td><td>Reis, Bohnen und Fleisch – das typische Mittagessen</td></tr>
  <tr><td>${SW('ahorita')}</td><td>gleich, nachher (kann auch länger dauern!)</td></tr>
  <tr><td>${SW('¡Diache!')}</td><td>Mensch! / Mist! (Ausruf)</td></tr>
  <tr><td>${SW('dime a ver')}</td><td>Erzähl mal!</td></tr>
  <tr><td>${SW('¿Tú ta bien?')}</td><td>Geht's dir gut? (está → ta)</td></tr>
</table>
<h3>Grammatik im Alltag</h3>
<ul>
  <li>Pronomen in Fragen vor dem Verb: ${SW('¿Qué tú quieres?')} · ${SW('¿Dónde tú vives?')}</li>
  <li>Man sagt fast immer <b>ustedes</b> für „ihr“, nie vosotros.</li>
  <li>Die Vergangenheit ist meist das Pretérito: ${SW('Hoy comí tarde.')} (nicht „he comido“).</li>
  <li>Verkleinerungen auf -ito/-ita sind überall: ahorita, cafecito, poquito.</li>
</ul>
<p class="tip">Die Aussprache-Besonderheiten (verschlucktes s, „cansao“, „pa'“) stehen unter „Aussprache und Betonung“.</p>`,
  },
];
