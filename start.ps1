Write-Host "========================================"
Write-Host "  SAHASRA KSP - Crime Intelligence Platform"
Write-Host "========================================"
Write-Host ""

$rootDir = "N:\downlaods\datathon\datathon"

Write-Host "[1/3] Installing backend dependencies..."
Set-Location "$rootDir\backend"
npm install 2>&1 | Out-Null

Write-Host "[2/3] Starting Backend API (port 5000)..."
$env:PORT = "5000"
$bp = Start-Process -FilePath "powershell" -WindowStyle Hidden -ArgumentList "-NoLogo","-NoProfile","-Command","`$env:PORT='5000'; Set-Location '$rootDir\backend'; npx tsx server/index.ts"

Start-Sleep -Seconds 8

Write-Host "[3/3] Starting Frontend (port 3000)..."
$fp = Start-Process -FilePath "powershell" -WindowStyle Hidden -ArgumentList "-NoLogo","-NoProfile","-Command","Set-Location '$rootDir\frontend'; npx vite --port 3000 --host 0.0.0.0"

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "=== Testing Backend ==="
try {
  $r = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
  $c = $r.Content | ConvertFrom-Json
  Write-Host "[OK] Health: status=$($c.status), crimes=$($c.crimeCount)"
} catch { Write-Host "[ERR] Backend not ready yet" }

Write-Host "=== Testing Frontend ==="
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
  Write-Host "[OK] Frontend: Status $($r.StatusCode)"
} catch { Write-Host "[ERR] Frontend not ready yet" }

Write-Host ""
Write-Host "========================================"
Write-Host "  SAHASRA KSP IS RUNNING"
Write-Host "========================================"
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:5000"
Write-Host "  Dashboard: http://localhost:3000/dashboard"
Write-Host "  Live Map:  http://localhost:3000/map"
Write-Host "  Admin:     http://localhost:3000/admin"
Write-Host "========================================"

Set-Location "$rootDir"
