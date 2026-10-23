# Einfacher lokaler Webserver zum Testen der App (ohne Node/Python).
# Start:  powershell -ExecutionPolicy Bypass -File serve.ps1
# Dann im Browser: http://localhost:8080
# Vom Handy im selben WLAN: http://<PC-IP>:8080  (dafuer als Admin starten oder -Port aendern)
param([int]$Port = 8080)

$root = $PSScriptRoot
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'
  '.csv' = 'text/csv; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) { $listener.Prefixes.Add("http://+:$Port/") } else { $listener.Prefixes.Add("http://localhost:$Port/") }
$listener.Start()
Write-Host "Server laeuft: http://localhost:$Port   (Strg+C zum Beenden)"
if ($isAdmin) {
  $ips = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' }).IPAddress
  $ips | ForEach-Object { Write-Host "Im WLAN:      http://${_}:$Port" }
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path $root $path
    $full = [IO.Path]::GetFullPath($file)
    if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
}
