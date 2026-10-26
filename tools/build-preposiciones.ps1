# Baut das spanische Präpositionen-Deck (nur im Spanisch-Modus sichtbar) aus decks-src\preposiciones-*.txt.
# Ergebnis: decks\preposiciones-01.json. Danach wird decks\index.json aktualisiert.
#
# Zeilenformat (Felder mit | getrennt, leere Felder erlaubt):
#   es | de | en | example_es | example_de | example_en | Tipp
#
# Start: powershell -ExecutionPolicy Bypass -File tools\build-preposiciones.ps1

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'decks-src'
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$version = [long](Get-Date -Format 'yyyyMMddHHmm')
$keys = 'es', 'de', 'en', 'example_es', 'example_de', 'example_en', 'hint_es'

$cards = @()
$seen = @{}
foreach ($file in Get-ChildItem $src -Filter 'preposiciones-*.txt' | Sort-Object Name) {
  $lineNo = 0
  foreach ($line in [IO.File]::ReadAllLines($file.FullName, $utf8)) {
    $lineNo++
    if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { continue }
    $f = $line.Split('|') | ForEach-Object { $_.Trim() }
    if ($f.Count -lt 6 -or $f.Count -gt 7) { throw "$($file.Name) Zeile ${lineNo}: $($f.Count) Felder statt 6/7" }
    $v = @{}
    for ($i = 0; $i -lt $f.Count; $i++) { $v[$keys[$i]] = $f[$i] }
    $key = $v.es.ToLower() -replace ' ', '-'
    if ($seen[$key]) { throw "$($file.Name) Zeile ${lineNo}: $key doppelt" }
    $seen[$key] = 1
    $c = [ordered]@{ id = 'pe-' + $key; type = 'prepfull' }
    foreach ($k in $keys) { if ($v[$k]) { $c[$k] = $v[$k] } }
    $cards += $c
  }
}

$deckId = 'preposiciones-01'
$deck = [ordered]@{ id = $deckId; name = 'Preposiciones'; languages = @('es', 'de', 'en'); cards = $cards }
[IO.File]::WriteAllText((Join-Path $out "$deckId.json"), ($deck | ConvertTo-Json -Depth 5), $utf8)
$entry = [ordered]@{
  id = $deckId
  name = 'Preposiciones'
  description = "$($cards.Count) spanische Präpositionen mit Beispiel (Spanisch-Modus)"
  file = "$deckId.json"
  count = $cards.Count
  version = $version
}

# Bibliothek: Eintrag ersetzen bzw. am Ende anhängen
$indexPath = Join-Path $out 'index.json'
$index = @(([IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json) | Where-Object { $_.id -ne $deckId })
$all = $index + @($entry)
[IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($all) -Depth 3), $utf8)
Write-Host "Gesamt: $($cards.Count) spanische Präpositionen"
