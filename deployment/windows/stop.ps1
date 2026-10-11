# Stops the backend and frontend processes started by deploy.ps1.
$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$RunDir = Join-Path $RootDir "deployment\.run"

function Stop-PidFile($Name) {
    $PidFile = Join-Path $RunDir "$Name.pid"
    if (Test-Path $PidFile) {
        $ProcId = Get-Content $PidFile
        $Proc = Get-Process -Id $ProcId -ErrorAction SilentlyContinue
        if ($Proc) {
            Stop-Process -Id $ProcId -Force
            Write-Host "Stopped $Name (pid $ProcId)"
        } else {
            Write-Host "$Name was not running"
        }
        Remove-Item $PidFile
    } else {
        Write-Host "No pid file for $Name, nothing to stop"
    }
}

Stop-PidFile "backend"
Stop-PidFile "frontend"
