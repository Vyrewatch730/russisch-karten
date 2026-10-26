# Trägt die spanische Häufigkeit (decks-src\es-rang.tsv: Karten-ID TAB Zahl) als „es_freq“ in alle Decks ein.
# Der Spanisch-Modus der App sortiert damit die Karten je Wortart neu (häufigste zuerst).
# Die Zahlen erzeugt tools\es-rank.html aus tools\es-frequency.txt (FrequencyWords von Hermit Dave, CC BY-SA 4.0).
# Wird am Ende jedes Build-Skripts aufgerufen; geänderte Decks bekommen eine neue Version in decks\index.json.
#
# Start: powershell -ExecutionPolicy Bypass -File tools\apply-es-rank.ps1

$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root 'decks'
$utf8 = New-Object System.Text.UTF8Encoding $false
$rankFile = Join-Path $root 'decks-src\es-rang.tsv'
if (-not (Test-Path $rankFile)) { Write-Host 'Keine es-rang.tsv – übersprungen'; return }
$version = [long](Get-Date -Format 'yyyyMMddHHmm')

$rank = @{}
foreach ($line in [IO.File]::ReadAllLines($rankFile, $utf8)) {
  if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
  $p = $line.Split("`t")
  $rank[$p[0]] = [long]$p[1]
}

$changedDecks = @{}
foreach ($file in Get-ChildItem $out -Filter '*.json' | Where-Object { $_.Name -ne 'index.json' }) {
  $text = [IO.File]::ReadAllText($file.FullName, $utf8)
  $deck = $text | ConvertFrom-Json
  $changed = $false
  foreach ($c in $deck.cards) {
    if (-not $rank.ContainsKey($c.id)) { continue }
    if ($c.PSObject.Properties['es_freq'] -and [long]$c.es_freq -eq $rank[$c.id]) { continue }
    $c | Add-Member -NotePropertyName es_freq -NotePropertyValue $rank[$c.id] -Force
    $changed = $true
  }
  if ($changed) {
    [IO.File]::WriteAllText($file.FullName, ($deck | ConvertTo-Json -Depth 5), $utf8)
    $changedDecks[$deck.id] = 1
  }
}

if ($changedDecks.Count) {
  $indexPath = Join-Path $out 'index.json'
  $index = @([IO.File]::ReadAllText($indexPath, $utf8) | ConvertFrom-Json | ForEach-Object { $_ })   # Liste auspacken (PowerShell 5.1)
  foreach ($e in $index) { if ($changedDecks.ContainsKey($e.id)) { $e.version = $version } }
  [IO.File]::WriteAllText($indexPath, (ConvertTo-Json @($index) -Depth 3), $utf8)
}
Write-Host "Spanische Häufigkeit: $($changedDecks.Count) Decks aktualisiert"
