# Baut die spanischen Decks ohne russische Vorlage (nur im Spanisch-Modus sichtbar):
#   decks-src\espanol-*.txt → decks\espanol-NN.json, decks-src\alltag-*.txt → decks\alltag-NN.json
# Eine Datei = ein Deck. In der App ordnet der Spanisch-Modus alle Karten nach Wortart und spanischer Häufigkeit neu.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   typ | es | de | en | example_es | example_de | example_en | Tipp
# - typ: palabra, verbo, sustantivo, adjetivo, adverbio, frase
# - Adjektiv mit * am Ende von es: hat ein Adverb auf -mente
# Warnt, wenn ein Wort schon auf einer anderen Karte steht (im Spanisch-Modus zählt nur die erste Karte).
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-espanol.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$keys = 'typ', 'es', 'de', 'en', 'example_es', 'example_de', 'example_en', 'hint_es'
$types = @{ palabra = 'word'; verbo = 'verbpair'; sustantivo = 'nounfull'; adjetivo = 'adjfull'; adverbio = 'advfull'; frase = 'phrase' }
$names = @{ 'espanol-01' = 'Español: Grundwörter'; 'espanol-02' = 'Español: Verben'; 'espanol-03' = 'Español: Nomen'; 'espanol-04' = 'Español: Adjektive und Adverbien'; 'alltag-01' = 'Alltag in der DR' }
$norm = { param($s) (($s -replace '\(.*?\)', '') -replace '\*', '').Trim().ToLower() }

# Spanisch der vorhandenen Karten (für die Doppelt-Warnung)
$existing = @{}
foreach ($file in Get-ChildItem $out -Filter '*.json' | Where-Object { $_.Name -ne 'index.json' -and $_.Name -notlike 'espanol-*' -and $_.Name -notlike 'alltag-*' -and $_.Name -notlike 'praepositionen-*' }) {
  $deck = [IO.File]::ReadAllText($file.FullName, $utf8) | ConvertFrom-Json
  foreach ($c in $deck.cards) { if ($c.es) { $existing[(& $norm $c.es)] = $c.id } }
}

$entries = @()
$seen = @{}
$dups = @()
foreach ($file in Get-ChildItem $src | Where-Object { $_.Name -like 'espanol-*.txt' -or $_.Name -like 'alltag-*.txt' } | Sort-Object Name) {
  $deckId = $file.BaseName
  $cards = @()
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 7 -or $f.Count -gt 8) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 7/8" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    if (-not $types.ContainsKey($v.typ)) { throw "$($file.Name) Zeile ${lineNo}: unbekannter typ '$($v.typ)'" }
    $mente = $v.es.EndsWith('*')
    $es = $v.es.TrimEnd('*').Trim()
    $key = (& $norm $es) -replace '[¿?¡!,]', '' -replace '\s+', '-'
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    if ($existing.ContainsKey((& $norm $es))) { $dups += "$es ($($existing[(& $norm $es)]))" }
    $c = [ordered]@{ id = 'es-' + $key; type = $types[$v.typ]; es = $es }
    foreach ($k in 'de', 'en', 'example_es', 'example_de', 'example_en', 'hint_es') { if ($v[$k]) { $c[$k] = $v[$k] } }
    if ($v.typ -eq 'verbo') { $c.es_verb = $es }
    if ($mente) { $c.es_mente = '1' }
    $cards += $c
  }
  $name = if ($names[$deckId]) { $names[$deckId] } else { $deckId }
  $deck = [ordered]@{ id = $deckId; name = $name; languages = @('es', 'de', 'en'); cards = $cards }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{ id = $deckId; name = $name; description = "$($cards.Count) Karten (nur Spanisch-Modus)"; file = "$deckId.json"; count = $cards.Count; version = $version }
}
if ($dups) { Write-Host "Schon auf anderen Karten: $($dups -join ', ')" }

# Bibliothek: Einträge ersetzen bzw. am Ende anhängen
$indexPath = Join-Path $out 'index.json'
$index = @(([IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json) | Where-Object { $_.id -notlike 'espanol-*' -and $_.id -notlike 'alltag-*' })
$all = $index + $entries
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $(($entries | ForEach-Object { $_.count } | Measure-Object -Sum).Sum) spanische Karten in $($entries.Count) Decks"

# Spanische Häufigkeit (es_freq) wieder eintragen
& (Join-Path $PSScriptRoot 'apply-es-rank.ps1')
