# Baut die Adjektiv-Decks aus allen Dateien decks-src\adjektive-*.txt.
# Sortiert nach Häufigkeit im Russischen Nationalkorpus (tools\adj-frequency.tsv),
# Gruppen zu 50 Karten als decks\adjektive-NN.json. Danach wird decks\index.json aktualisiert.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   ru | de | en | es | Kurzform | Komparativ | Gegenteil | example | example_de | example_en | example_es | Fälle | Hinweis
# - ru: männliche Grundform mit Betonung; alle übrigen Formen berechnet die App (adjDecl in app.js)
# - Kurzform: „нов, нова́, но́во, но́вы“ (m, f, n, Pl.)
# - Komparativ mit ! am Ende = unregelmäßig (лу́чше!)
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-adjectives.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$groupSize = 50
$keys = 'ru', 'de', 'en', 'es', 'short', 'comp', 'anto', 'example', 'example_de', 'example_en', 'example_es', 'example_cases', 'hint'
$stress = [string][char]0x0301
$plain = { param($s) ($s -replace $stress, '').Replace('ё', 'е').ToLower() }

$freq = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'adj-frequency.tsv'), $utf8)) {
  if ($line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $v = [double]$p[1]
  if (-not $freq.ContainsKey($p[0]) -or $freq[$p[0]] -lt $v) { $freq[$p[0]] = $v }
}

# Adverb zum Adjektiv (decks-src\adjektiv-adverbien.tsv: Adjektiv | Adverb | Deutsch | Beispiel | Deutsch)
$advs = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $src 'adjektiv-adverbien.tsv'), $utf8)) {
  if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
  $p = $line.Split('|') | ForEach-Object { $_.Trim() }
  $advs[(& $plain $p[0])] = $p
}
$usedAdv = @{}

$cards = New-Object System.Collections.ArrayList
$seen = @{}
$missing = @()
foreach ($file in Get-ChildItem $src -Filter 'adjektive-*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 12 -or $f.Count -gt 13) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 12/13" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    $key = & $plain $v.ru
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    $c = [ordered]@{ id = 'aj-' + $key; type = 'adjfull'; ru = $v.ru; de = $v.de; en = $v.en; es = $v.es }
    if ($v.short) { $c.short = $v.short }
    if ($v.comp) {
      if ($v.comp.EndsWith('!')) { $c.comp = $v.comp.TrimEnd('!'); $c.comp_irr = '1' } else { $c.comp = $v.comp }
    }
    foreach ($k in 'anto', 'hint', 'example', 'example_cases', 'example_de', 'example_en', 'example_es') { if ($v[$k]) { $c[$k] = $v[$k] } }
    if ($advs.ContainsKey($key)) { $a = $advs[$key]; $c.adv = $a[1]; $c.adv_de = $a[2]; $c.adv_ex = $a[3]; $c.adv_ex_de = $a[4]; $usedAdv[$key] = 1 }
    $score = if ($freq.ContainsKey($key)) { $freq[$key] } else { 0 }
    if ($score -eq 0) { $missing += $key }
    [void]$cards.Add([pscustomobject]@{ Card = $c; Score = $score; Order = $cards.Count })
  }
}
$unused = @($advs.Keys | Where-Object { -not $usedAdv[$_] })
if ($unused) { throw "adjektiv-adverbien.tsv: kein Adjektiv für $($unused -join ', ')" }
if ($missing) { Write-Host "Ohne Korpus-Häufigkeit (kommen ans Ende): $($missing -join ', ')" }

$sorted = @($cards | Sort-Object @{ Expression = 'Score'; Descending = $true }, @{ Expression = 'Order'; Descending = $false })
$entries = @()
$deckCount = [math]::Ceiling($sorted.Count / $groupSize)
for ($g = 0; $g -lt $deckCount; $g++) {
  $num = '{0:00}' -f ($g + 1)
  $deckId = "adjektive-$num"
  $chunk = @($sorted[($g * $groupSize)..([math]::Min(($g + 1) * $groupSize, $sorted.Count) - 1)] | ForEach-Object { $_.Card })
  $start = $g * $groupSize + 1
  $end = $start + $chunk.Count - 1
  $deck = [ordered]@{ id = $deckId; name = "Adjektive $num"; languages = @('ru', 'de', 'en', 'es'); cards = $chunk }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{
    id = $deckId
    name = "Adjektive $num"
    description = "Nr. $start–$end nach Häufigkeit · alle Formen, Komparativ und Beispiel"
    file = "$deckId.json"
    count = $chunk.Count
    version = $version
  }
}
Get-ChildItem $out -Filter 'adjektive-*.json' | Where-Object { [int]($_.BaseName -replace '\D', '') -gt $deckCount } | Remove-Item

# Bibliothek: Adjektiv-Decks ersetzen; Reihenfolge: Sonstige, Adjektive, Adverbien, Präpositionen, Nomen, Verben
$indexPath = Join-Path $out 'index.json'
$index = [IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json
$others = @($index | Where-Object { $_.id -notlike 'adjektive-*' -and $_.id -notlike 'adverbien-*' -and $_.id -notlike 'praepositionen-*' -and $_.id -notlike 'nomen-*' -and $_.id -notlike 'verben-*' })
$adverbs = @($index | Where-Object { $_.id -like 'adverbien-*' })
$preps = @($index | Where-Object { $_.id -like 'praepositionen-*' })
$nouns = @($index | Where-Object { $_.id -like 'nomen-*' })
$verbs = @($index | Where-Object { $_.id -like 'verben-*' })
$all = @($others) + $entries + $adverbs + $preps + $nouns + $verbs
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($sorted.Count) Adjektive in $deckCount Decks"

# Spanische Häufigkeit (es_freq) wieder eintragen
& (Join-Path $PSScriptRoot 'apply-es-rank.ps1')
