# Local deployment: installs, builds, and starts both server and ui on one Windows machine.
$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$RunDir = Join-Path $RootDir "deployment\.run"
$ServerDir = Join-Path $RootDir "server"
$UiDir = Join-Path $RootDir "ui"
$UiPort = if ($env:UI_PORT) { $env:UI_PORT } else { "5173" }

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

Write-Host "==> Installing backend dependencies"
Push-Location $ServerDir
npm install
Pop-Location

$ServerEnvFile = Join-Path $ServerDir ".env"
if (-not (Test-Path $ServerEnvFile)) {
    Write-Host "==> Creating server\.env with generated secrets"
    Copy-Item (Join-Path $ServerDir ".env.example") $ServerEnvFile
    $JwtSecret = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
    $EncryptionKey = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
    (Get-Content $ServerEnvFile) `
        -replace '^JWT_SECRET=.*', "JWT_SECRET=$JwtSecret" `
        -replace '^ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=$EncryptionKey" |
        Set-Content $ServerEnvFile
} else {
    Write-Host "==> server\.env already exists, leaving it as is"
}

Write-Host "==> Installing frontend dependencies"
Push-Location $UiDir
npm install
Pop-Location

$UiEnvFile = Join-Path $UiDir ".env.local"
if (-not (Test-Path $UiEnvFile)) {
    Write-Host "==> Creating ui\.env.local pointing at the local backend"
    Copy-Item (Join-Path $UiDir ".env.example") $UiEnvFile
} else {
    Write-Host "==> ui\.env.local already exists, leaving it as is"
}

Write-Host "==> Building frontend"
Push-Location $UiDir
npm run build
Pop-Location

Write-Host "==> Starting backend (background)"
$BackendProc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $ServerDir `
    -RedirectStandardOutput (Join-Path $RunDir "backend.log") `
    -RedirectStandardError (Join-Path $RunDir "backend.err.log") `
    -WindowStyle Hidden -PassThru
$BackendProc.Id | Out-File (Join-Path $RunDir "backend.pid")

Write-Host "==> Starting frontend preview server on port $UiPort (background)"
$VitePath = Join-Path $UiDir "node_modules\vite\bin\vite.js"
$FrontendProc = Start-Process -FilePath "node" -ArgumentList $VitePath, "preview", "--port", $UiPort, "--host" -WorkingDirectory $UiDir `
    -RedirectStandardOutput (Join-Path $RunDir "frontend.log") `
    -RedirectStandardError (Join-Path $RunDir "frontend.err.log") `
    -WindowStyle Hidden -PassThru
$FrontendProc.Id | Out-File (Join-Path $RunDir "frontend.pid")

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "SecretSync is running."
Write-Host "  Backend:  http://localhost:4000  (logs: $RunDir\backend.log)"
Write-Host "  Frontend: http://localhost:$UiPort  (logs: $RunDir\frontend.log)"
Write-Host ""
Write-Host "Stop with: deployment\windows\stop.ps1"
