# Kill Locked Processes Script

Write-Host "Checking for running electron/node processes..." -ForegroundColor Cyan

$processes = Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or 
    $_.ProcessName -like "*node*"
}

if ($processes) {
    Write-Host "`nFound $($processes.Count) process(es):" -ForegroundColor Yellow
    $processes | Format-Table ProcessName, Id, StartTime -AutoSize
    
    $confirm = Read-Host "`nDo you want to kill these processes? (Y/N)"
    
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.Id -Force
                Write-Host "✓ Killed $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Green
            } catch {
                Write-Host "✗ Failed to kill $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
            }
        }
        Write-Host "`n✅ Process cleanup complete!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Processes not killed. Build may fail if files are locked." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No electron/node processes found" -ForegroundColor Green
}

Write-Host "`nYou can now run:" -ForegroundColor Cyan
Write-Host "  npm run clean" -ForegroundColor White
Write-Host "  npm run publish:win" -ForegroundColor White
