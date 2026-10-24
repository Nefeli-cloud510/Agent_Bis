param(
  [int]$Port = 55432
)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
  Write-Output "Port $Port 没有正在监听的 PostgreSQL 进程"
  exit 0
}

foreach ($connection in $connections) {
  Write-Output "Stopping PostgreSQL process $($connection.OwningProcess) on port $Port"
  Stop-Process -Id $connection.OwningProcess -Force
}
