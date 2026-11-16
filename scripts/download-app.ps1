[CmdletBinding()]
param([string]$Destination = (Join-Path (Get-Location) "Infinity-Player"))
$ErrorActionPreference = "Stop"
$repo = "avinashnewdev/Infinity-Player"
$api = "https://api.github.com/repos/$repo/releases/latest"
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("infinity-player-" + [guid]::NewGuid().ToString("N") + ".zip")
try {
  Write-Host "Checking the latest Infinity Player release..."
  $headers = @{ "User-Agent" = "Infinity-Player-Downloader"; "Accept" = "application/vnd.github+json" }
  $assetUrl = $null
  try {
    $release = Invoke-RestMethod -Uri $api -Headers $headers
    $asset = $release.assets | Where-Object { $_.name -match "-web\.zip$" } | Select-Object -First 1
    if ($asset) { $assetUrl = $asset.browser_download_url }
  } catch { Write-Host "No published release found; downloading the latest repository source instead." }
  if (-not $assetUrl) { $assetUrl = "https://github.com/$repo/archive/refs/heads/main.zip" }
  Write-Host "Downloading $assetUrl"
  Invoke-WebRequest -Uri $assetUrl -OutFile $tmp -Headers @{ "User-Agent" = "Infinity-Player-Downloader" }
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Expand-Archive -LiteralPath $tmp -DestinationPath $Destination -Force
  Write-Host "Downloaded and extracted Infinity Player to: $Destination"
  Write-Host "Open index.html through a local HTTP server (recommended: python -m http.server 8000)."
  Write-Host "This is a web/PWA source package, not a native Windows EXE."
}
finally { if (Test-Path $tmp) { Remove-Item $tmp -Force } }
