# Baut die Verb-Decks aus allen Dateien decks-src\*.txt.
# Alle Karten werden nach Häufigkeit im Russischen Nationalkorpus sortiert
# (tools\verb-frequency.tsv, beide Aspekte zusammengezählt) und in Gruppen zu 50 Karten
# als decks\verben-NN.json geschrieben. Danach wird decks\index.json aktualisiert.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   ipf | ipf_1 | ipf_2 | pf | pf_1 | pf_2 | de | en | es | es_verb | example | example_de | example_en | example_es | note
# - Betonung mit U+0301 nach dem Vokal, ё ohne Akzent
# - es_verb nur nötig, wenn die Konjugation nicht vom ersten Verb in "es" kommen soll (z. B. "doler:dat")
# - Aussprache und spanische Formen berechnet die App selbst
# - Die Datei, in der eine Karte steht, spielt für die Gruppe keine Rolle.
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-verbs.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$groupSize = 50
$keys = 'ipf', 'ipf_1', 'ipf_2', 'pf', 'pf_1', 'pf_2', 'de', 'en', 'es', 'es_verb', 'example', 'example_de', 'example_en', 'example_es', 'note'
$stress = [string][char]0x0301
$plain = { param($s) ($s -replace $stress, '').Replace('ё', 'е') }

# Häufigkeiten laden (Lemma -> ipm); manche Lemmata stehen im Korpus in anderer Form
$freq = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'verb-frequency.tsv'), $utf8)) {
  if ($line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $freq[$p[0]] = [double]$p[1]
}
$alias = @{ 'достичь' = 'достигнуть' }
$ipm = { param($v) if (-not $v) { return 0 }; $k = & $plain $v; if ($alias[$k]) { $k = $alias[$k] }; if ($freq.ContainsKey($k)) { $freq[$k] } else { 0 } }

# Fälle der Beispielsätze (decks-src\faelle.tsv: Infinitiv TAB Erklärung)
$cases = @{}
$casesFile = Join-Path $src 'faelle.tsv'
if (Test-Path $casesFile) {
  foreach ($line in [IO.File]::ReadAllLines($casesFile, $utf8)) {
    if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
    $p = $line.Split("`t")
    $cases[(& $plain $p[0].Trim())] = $p[1].Trim()
  }
}
$usedCases = @{}

# Imperativ-Ausnahmen (decks-src\imperativ.tsv: Infinitiv TAB Imperativ oder —)
$imps = @{}
$impFile = Join-Path $src 'imperativ.tsv'
if (Test-Path $impFile) {
  foreach ($line in [IO.File]::ReadAllLines($impFile, $utf8)) {
    if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
    $p = $line.Split("`t")
    $imps[(& $plain $p[0].Trim())] = $p[1].Trim()
  }
}
$usedImps = @{}

# Rektion (decks-src\rektion.tsv) und Verben der Bewegung (decks-src\bewegung.tsv)
function Read-Tsv($name) {
  $map = @{}
  $file = Join-Path $src $name
  if (-not (Test-Path $file)) { return $map }
  foreach ($line in [IO.File]::ReadAllLines($file, $utf8)) {
    if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
    $p = $line.Split("`t")
    $map[(& $plain $p[0].Trim())] = @($p | Select-Object -Skip 1 | ForEach-Object { $_.Trim() })
  }
  return $map
}
$govs = Read-Tsv 'rektion.tsv'
$motions = Read-Tsv 'bewegung.tsv'

$cards = New-Object System.Collections.ArrayList
$seen = @{}
$missing = @()
foreach ($file in Get-ChildItem $src -Filter '*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 14 -or $f.Count -gt 15) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 14/15" }
    $c = [ordered]@{ id = ''; type = 'verbpair'; ru = '' }
    for ($i = 0; $i -lt $f.Count; $i++) { if ($f[$i] -ne '') { $c[$keys[$i]] = $f[$i] } }
    if (-not $c.ipf -and -not $c.pf) { throw "$($file.Name) Zeile ${lineNo}: kein Verb" }
    # Zwei spanische Verben für die Konjugation, z. B. "ser; estar"
    if ($c.es_verb -and $c.es_verb.Contains(';')) {
      $parts = $c.es_verb.Split(';') | ForEach-Object { $_.Trim() }
      $c.es_verb = $parts[0]
      $c.es2_verb = $parts[1]
    }
    $head = if ($c.ipf) { $c.ipf } else { $c.pf }
    $key = & $plain $head
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    # Feste ID unabhängig von Gruppe und Datei, damit der Lernfortschritt beim Umsortieren bleibt
    $c.id = 'vb-' + $key
    $c.ru = if ($c.ipf -and $c.pf -and $c.ipf -ne $c.pf) { "$($c.ipf) / $($c.pf)" } else { $head }
    if ($cases.ContainsKey($key)) { $c.example_cases = $cases[$key]; $usedCases[$key] = 1 }
    else { Write-Host "Keine Fälle für: $key" }
    if ($govs.ContainsKey($key)) { $c.government = $govs[$key][0] } else { Write-Host "Keine Rektion für: $key" }
    if ($motions.ContainsKey($key)) {
      $c.motion = $motions[$key][0]
      if ($motions[$key].Count -gt 1) { $c.motion_pair = $motions[$key][1] }
    }
    foreach ($asp in 'ipf', 'pf') {
      if (-not $c[$asp]) { continue }
      $k = & $plain $c[$asp]
      if ($imps.ContainsKey($k)) { $c["${asp}_imp"] = $imps[$k]; $usedImps[$k] = 1 }
    }
    $score = (& $ipm $c.ipf) + $(if ($c.pf -ne $c.ipf) { & $ipm $c.pf } else { 0 })
    if ($score -eq 0) { $missing += $key }
    [void]$cards.Add([pscustomobject]@{ Card = $c; Score = $score; Order = $cards.Count })
  }
}
$unusedImps = @($imps.Keys | Where-Object { -not $usedImps[$_] })
if ($unusedImps) { Write-Host "Imperativ-Ausnahmen ohne Karte: $($unusedImps -join ', ')" }
$unused = @($cases.Keys | Where-Object { -not $usedCases[$_] })
if ($unused) { Write-Host "Fälle ohne Karte: $($unused -join ', ')" }
if ($missing) { Write-Host "Ohne Korpus-Häufigkeit (kommen ans Ende): $($missing -join ', ')" }

$sorted = @($cards | Sort-Object @{ Expression = 'Score'; Descending = $true }, @{ Expression = 'Order'; Descending = $false })
$entries = @()
$deckCount = [math]::Ceiling($sorted.Count / $groupSize)
for ($g = 0; $g -lt $deckCount; $g++) {
  $num = '{0:00}' -f ($g + 1)
  $deckId = "verben-$num"
  $chunk = @($sorted[($g * $groupSize)..([math]::Min(($g + 1) * $groupSize, $sorted.Count) - 1)] | ForEach-Object { $_.Card })
  $start = $g * $groupSize + 1
  $end = $start + $chunk.Count - 1
  $deck = [ordered]@{ id = $deckId; name = "Verben $num"; languages = @('ru', 'de', 'en', 'es'); cards = $chunk }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{
    id = $deckId
    name = "Verben $num"
    description = "Nr. $start–$end nach Häufigkeit · Aspektpaare mit Aussprache, Beispiel und spanischer Konjugation"
    file = "$deckId.json"
    count = $chunk.Count
    version = $version
  }
  Write-Host ("{0}: {1} Karten (von {2} bis {3})" -f $deckId, $chunk.Count, $chunk[0].ru, $chunk[-1].ru)
}
# Übrig gebliebene Deck-Dateien aus früheren Builds entfernen
Get-ChildItem $out -Filter 'verben-*.json' | Where-Object { [int]($_.BaseName -replace '\D', '') -gt $deckCount } | Remove-Item

# Bibliothek: alle Nicht-Verb-Decks behalten, Verb-Decks ersetzen
$indexPath = Join-Path $out 'index.json'
$index = [IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json
$others = @($index | Where-Object { $_.id -notlike 'verben-*' })
$all = @($others) + $entries
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($sorted.Count) Karten in $deckCount Decks"
