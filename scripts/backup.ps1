param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDirectory = ".\backups"
)
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "DATABASE_URL is required" }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $OutputDirectory "luma-$stamp.dump"
pg_dump --format=custom --no-owner --file $target $DatabaseUrl
Write-Output "Backup written to $target"
