# Baut die Nomen-Decks aus allen Dateien decks-src\nomen-*.txt.
# Sortiert nach Häufigkeit im Russischen Nationalkorpus (tools\noun-frequency.tsv),
# Gruppen zu 50 Karten als decks\nomen-NN.json. Danach wird decks\index.json aktualisiert.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   ru | Geschlecht | Gen. Sg. | Nom. Pl. | Gen. Pl. | Dat. Pl. | de | en | es | example | example_de | example_en | example_es | Fälle | Hinweis | Extras
# - Geschlecht: m, f, n oder pl (nur Plural); ein * dahinter = belebt (m*, f*, pl*)
# - Die übrigen Formen berechnet die App (nounDecl in app.js)
# - Extras: key=Wert; mehrere mit ; getrennt
#     akk / dat / ins / prp = abweichende Singularform, ipl = abweichender Ins. Pl.,
#     loc = Ortsangabe (z. B. в лесу́), indecl=1 = unveränderlich,
#     sg / pl = alle sechs Formen mit Komma (für Adjektiv-Nomen wie больно́й)
# - Beispielsätze je Fall (optional): decks-src\nomen-beispiele.tsv: Wort TAB sg|pl TAB „Satz = Deutsch || …“
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-nouns.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$groupSize = 50
$keys = 'ru', 'g', 'gen', 'npl', 'gpl', 'dpl', 'de', 'en', 'es', 'example', 'example_de', 'example_en', 'example_es', 'example_cases', 'hint', 'extra'
$stress = [string][char]0x0301
$plain = { param($s) ($s -replace $stress, '').Replace('ё', 'е').ToLower() }

# Häufigkeiten (Lemma -> ipm, bei doppelten Lemmata der größte Wert)
$freq = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'noun-frequency.tsv'), $utf8)) {
  if ($line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $v = [double]$p[1]
  if (-not $freq.ContainsKey($p[0]) -or $freq[$p[0]] -lt $v) { $freq[$p[0]] = $v }
}

# Beispielsätze je Fall
$examples = @{}
$exFile = Join-Path $src 'nomen-beispiele.tsv'
if (Test-Path $exFile) {
  foreach ($line in [IO.File]::ReadAllLines($exFile, $utf8)) {
    if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
    $p = $line.Split("`t")
    $examples["$(& $plain $p[0].Trim())|$($p[1].Trim())"] = $p[2].Trim()
  }
}

$cards = New-Object System.Collections.ArrayList
$seen = @{}
$missing = @()
foreach ($file in Get-ChildItem $src -Filter 'nomen-*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 14 -or $f.Count -gt 16) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 14–16" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    $key = & $plain $v.ru
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt (schon in $($seen[$key]))" }
    $seen[$key] = $file.Name
    $c = [ordered]@{ id = 'nm-' + $key; type = 'nounfull'; ru = $v.ru }
    foreach ($k in 'de', 'en', 'es') { $c[$k] = $v[$k] }
    $c.gender = $v.g.TrimEnd('*')
    if ($v.g.EndsWith('*')) { $c.anim = '1' }
    foreach ($k in 'gen', 'npl', 'gpl', 'dpl', 'hint', 'example', 'example_cases', 'example_de', 'example_en', 'example_es') {
      if ($v[$k]) { $c[$k] = $v[$k] }
    }
    if ($v.extra) {
      foreach ($pair in $v.extra.Split(';')) {
        if (-not $pair.Trim()) { continue }
        $kv = $pair.Split('=', 2)
        $val = $kv[1].Trim()
        if ($kv[0].Trim() -in 'sg', 'pl') { $val = ($val.Split(',') | ForEach-Object { $_.Trim() }) -join '|' }
        $c[$kv[0].Trim()] = $val
      }
    }
    foreach ($n in 'sg', 'pl') { if ($examples.ContainsKey("$key|$n")) { $c["ex_$n"] = $examples["$key|$n"] } }
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
  $deckId = "nomen-$num"
  $chunk = @($sorted[($g * $groupSize)..([math]::Min(($g + 1) * $groupSize, $sorted.Count) - 1)] | ForEach-Object { $_.Card })
  $start = $g * $groupSize + 1
  $end = $start + $chunk.Count - 1
  $deck = [ordered]@{ id = $deckId; name = "Nomen $num"; languages = @('ru', 'de', 'en', 'es'); cards = $chunk }
  [IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
  $entries += [ordered]@{
    id = $deckId
    name = "Nomen $num"
    description = "Nr. $start–$end nach Häufigkeit · Geschlecht, Deklination und Beispiel"
    file = "$deckId.json"
    count = $chunk.Count
    version = $version
  }
  Write-Host ("{0}: {1} Karten (von {2} bis {3})" -f $deckId, $chunk.Count, $chunk[0].ru, $chunk[-1].ru)
}
Get-ChildItem $out -Filter 'nomen-*.json' | Where-Object { [int]($_.BaseName -replace '\D', '') -gt $deckCount } | Remove-Item

# Bibliothek: Nomen-Decks ersetzen, alle anderen behalten (Nomen nach dem Grundwortschatz, vor den Verben)
$indexPath = Join-Path $out 'index.json'
$index = [IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json
$others = @($index | Where-Object { $_.id -notlike 'nomen-*' -and $_.id -notlike 'verben-*' })
$verbs = @($index | Where-Object { $_.id -like 'verben-*' })
$all = @($others) + $entries + @($verbs)
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($sorted.Count) Nomen in $deckCount Decks"

# Spanische Häufigkeit (es_freq) wieder eintragen
& (Join-Path $PSScriptRoot 'apply-es-rank.ps1')
