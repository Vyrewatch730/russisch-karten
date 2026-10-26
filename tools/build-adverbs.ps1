# Baut die Adverb-Decks aus allen Dateien decks-src\adverbien-*.txt.
# Sortiert nach Häufigkeit im Russischen Nationalkorpus (tools\adv-frequency.tsv),
# Gruppen zu 50 Karten als decks\adverbien-NN.json. Danach wird decks\index.json aktualisiert.
# Adverbien, die zu einem Adjektiv gehören (хорошо́ zu хоро́ший), stehen auf der Adjektiv-Karte
# (decks-src\adjektiv-adverbien.tsv) und nicht hier.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   ru | de | en | es | Art | example | example_de | example_en | example_es | Hinweis
# - Art: Zeit, Ort, Richtung, Art und Weise, Menge, Frage, Meinung, Zustand
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-adverbs.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$groupSize = 50
$keys = 'ru', 'de', 'en', 'es', 'cat', 'example', 'example_de', 'example_en', 'example_es', 'hint'
$cats = 'Zeit', 'Ort', 'Richtung', 'Art und Weise', 'Menge', 'Frage', 'Meinung', 'Zustand'
$stress = [string][char]0x0301
$plain = { param($s) ($s -replace $stress, '').Replace('ё', 'е').ToLower() }

$freq = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'adv-frequency.tsv'), $utf8)) {
  if ($line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $v = [double]$p[1]
  if (-not $freq.ContainsKey($p[0]) -or $freq[$p[0]] -lt $v) { $freq[$p[0]] = $v }
}

$cards = New-Object System.Collections.ArrayList
$seen = @{}
$missing = @()
foreach ($file in Get-ChildItem $src -Filter 'adverbien-*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 9 -or $f.Count -gt 10) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 9/10" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    if ($cats -notcontains $v.cat) { throw "$($file.Name) Zeile ${lineNo}: unbekannte Art '$($v.cat)'" }
    $key = & $plain $v.ru
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    $c = [ordered]@{ id = 'av-' + $key; type = 'advfull'; ru = $v.ru; de = $v.de; en = $v.en; es = $v.es; cat = $v.cat }
    foreach ($k in 'hint', 'example', 'example_de', 'example_en', 'example_es') { if ($v[$k]) { $c[$k] = $v[$k] } }
    $score = if ($freq.ContainsKey($key)) { $freq[$key] } else { 0 }
    if ($score -eq 0) { $missing += $key }
    [void]$cards.Add([pscustomobject]@{ Card = $c; Score = $score; Order = $cards.Count })
  }
}
if ($missing) { Write-Host "Ohne Korpus-Häufigkeit (kommen ans Ende): $($missing -join ', ')" }

$sorted = @($cards | Sort-Object @{ Expression = 'Score'; Descending = $true }, @{ Expression = 'Order'; Descending = $false })
$entries = @()
$deckCount = [math]::Ceiling($sorted.Count / $groupSize)
for ($g = 0; $g -lt $deckCount; $g++) {
  $num = '{0:00}' -f ($g + 1)
  $deckId = "adverbien-$num"
  $chunk = @($sorted[($g * $groupSize)..([math]::Min(($g + 1) * $groupSize, $sorted.Count) - 1)] | ForEach-Object { $_.Card })
  $start = $g * $groupSize + 1
  $end = $start + $chunk.Count - 1
  $deck = [ordered]@{ id = $deckId; name = "Adverbien $num"; languages = @('ru', 'de', 'en', 'es'); cards = $chunk }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{
    id = $deckId
    name = "Adverbien $num"
    description = "Nr. $start–$end nach Häufigkeit · mit Beispiel"
    file = "$deckId.json"
    count = $chunk.Count
    version = $version
  }
}
Get-ChildItem $out -Filter 'adverbien-*.json' | Where-Object { [int]($_.BaseName -replace '\D', '') -gt $deckCount } | Remove-Item

# Bibliothek: Adverb-Decks ersetzen; Reihenfolge: Sonstige, Adjektive, Adverbien, Präpositionen, Nomen, Verben
$indexPath = Join-Path $out 'index.json'
$index = [IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json
$fam = 'adjektive-*', 'adverbien-*', 'praepositionen-*', 'nomen-*', 'verben-*'
$others = @($index | Where-Object { $id = $_.id; -not ($fam | Where-Object { $id -like $_ }) })
$adjs = @($index | Where-Object { $_.id -like 'adjektive-*' })
$preps = @($index | Where-Object { $_.id -like 'praepositionen-*' })
$nouns = @($index | Where-Object { $_.id -like 'nomen-*' })
$verbs = @($index | Where-Object { $_.id -like 'verben-*' })
$all = @($others) + $adjs + $entries + $preps + $nouns + $verbs
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($sorted.Count) Adverbien in $deckCount Decks"

# Spanische Häufigkeit (es_freq) wieder eintragen
& (Join-Path $PSScriptRoot 'apply-es-rank.ps1')
