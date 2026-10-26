# Baut das Präpositionen-Deck aus allen Dateien decks-src\praepositionen-*.txt.
# Sortiert nach Häufigkeit im Russischen Nationalkorpus (tools\prep-frequency.tsv),
# Ergebnis: decks\praepositionen-01.json (zwei Fälle = zwei Karten). Danach wird decks\index.json aktualisiert.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   ru | Fall | de | en | es | example | example_de | example_en | example_es | Fälle | Hinweis
# - ru: Varianten mit / (в / во); die erste bestimmt die Häufigkeit
# - Fall: Genitiv, Dativ, Akkusativ, Instrumental, Präpositiv
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-prepositions.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$groupSize = 60
$keys = 'ru', 'case', 'de', 'en', 'es', 'example', 'example_de', 'example_en', 'example_es', 'example_cases', 'hint'
$cases = 'Genitiv', 'Dativ', 'Akkusativ', 'Instrumental', 'Präpositiv'
$stress = [string][char]0x0301
$plain = { param($s) ($s -replace $stress, '').Replace('ё', 'е').ToLower() }

$freq = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'prep-frequency.tsv'), $utf8)) {
  if ($line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $v = [double]$p[1]
  if (-not $freq.ContainsKey($p[0]) -or $freq[$p[0]] -lt $v) { $freq[$p[0]] = $v }
}

$cards = New-Object System.Collections.ArrayList
$seen = @{}
$missing = @()
foreach ($file in Get-ChildItem $src -Filter 'praepositionen-*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 10 -or $f.Count -gt 11) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 10/11" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    if ($cases -notcontains $v.case) { throw "$($file.Name) Zeile ${lineNo}: unbekannter Fall '$($v.case)'" }
    $word = & $plain (($v.ru -split ' / ')[0])
    $key = ($word -replace ' ', '-') + '-' + @{ Genitiv = 'gen'; Dativ = 'dat'; Akkusativ = 'akk'; Instrumental = 'ins'; 'Präpositiv' = 'prp' }[$v.case]
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    $c = [ordered]@{ id = 'pp-' + $key; type = 'prepfull'; ru = $v.ru; de = $v.de; en = $v.en; es = $v.es; case = $v.case }
    foreach ($k in 'hint', 'example', 'example_cases', 'example_de', 'example_en', 'example_es') { if ($v[$k]) { $c[$k] = $v[$k] } }
    $score = if ($freq.ContainsKey($word)) { $freq[$word] } else { 0 }
    if ($score -eq 0) { $missing += $word }
    [void]$cards.Add([pscustomobject]@{ Card = $c; Score = $score; Order = $cards.Count })
  }
}
if ($missing) { Write-Host "Ohne Korpus-Häufigkeit (kommen ans Ende): $($missing -join ', ')" }

$sorted = @($cards | Sort-Object @{ Expression = 'Score'; Descending = $true }, @{ Expression = 'Order'; Descending = $false })
$entries = @()
$deckCount = [math]::Ceiling($sorted.Count / $groupSize)
for ($g = 0; $g -lt $deckCount; $g++) {
  $num = '{0:00}' -f ($g + 1)
  $deckId = "praepositionen-$num"
  $chunk = @($sorted[($g * $groupSize)..([math]::Min(($g + 1) * $groupSize, $sorted.Count) - 1)] | ForEach-Object { $_.Card })
  $start = $g * $groupSize + 1
  $end = $start + $chunk.Count - 1
  $deck = [ordered]@{ id = $deckId; name = "Präpositionen"; languages = @('ru', 'de', 'en', 'es'); cards = $chunk }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{
    id = $deckId
    name = "Präpositionen"
    description = "$($chunk.Count) Präpositionen mit Fall und Beispiel"
    file = "$deckId.json"
    count = $chunk.Count
    version = $version
  }
}
Get-ChildItem $out -Filter 'praepositionen-*.json' | Where-Object { [int]($_.BaseName -replace '\D', '') -gt $deckCount } | Remove-Item

# Bibliothek: Präpositionen-Deck ersetzen; Reihenfolge: Sonstige, Adjektive, Adverbien, Präpositionen, Nomen, Verben
$indexPath = Join-Path $out 'index.json'
$index = [IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json
$fam = 'adjektive-*', 'adverbien-*', 'praepositionen-*', 'nomen-*', 'verben-*'
$others = @($index | Where-Object { $id = $_.id; -not ($fam | Where-Object { $id -like $_ }) })
$adjs = @($index | Where-Object { $_.id -like 'adjektive-*' })
$advs = @($index | Where-Object { $_.id -like 'adverbien-*' })
$nouns = @($index | Where-Object { $_.id -like 'nomen-*' })
$verbs = @($index | Where-Object { $_.id -like 'verben-*' })
$all = @($others) + $adjs + $advs + $entries + $nouns + $verbs
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($sorted.Count) Präpositionen-Karten in $deckCount Decks"

# Spanische Häufigkeit (es_freq) wieder eintragen
& (Join-Path $PSScriptRoot 'apply-es-rank.ps1')
