param(
  [Parameter(Mandatory=$true)][string]$DatabaseUrl,
  [Parameter(Mandatory=$true)][string]$BackupFile
)
if (-not (Test-Path $BackupFile)) { throw "Backup file not found: $BackupFile" }
Write-Output "Restore is destructive. Confirm the target database is the intended staging or recovery database."
pg_restore --clean --if-exists --no-owner --dbname $DatabaseUrl $BackupFile
Write-Output "Restore completed. Run health checks and migration verification before traffic is enabled."
