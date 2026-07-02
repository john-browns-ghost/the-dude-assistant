# Registers "The Dude" to auto-start on Windows login.
# Run this once: right-click -> "Run with PowerShell"
# No admin rights needed.

$taskName   = "TheDudeAssistant"
$batPath    = "C:\Users\josep\the-dude-assistant\start-dude.bat"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action   = New-ScheduledTaskAction `
              -Execute "cmd.exe" `
              -Argument "/c `"$batPath`""

$trigger  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
              -AllowStartIfOnBatteries `
              -DontStopIfGoingOnBatteries `
              -StartWhenAvailable

Register-ScheduledTask `
  -TaskName  $taskName `
  -Action    $action `
  -Trigger   $trigger `
  -Settings  $settings `
  -RunLevel  Limited `
  -Force | Out-Null

Write-Host ""
Write-Host "The Dude will now start automatically when you log in, man." -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: Make sure you've run 'npm run build' at least once first." -ForegroundColor Yellow
Write-Host "Re-run 'npm run build' any time you update the app."
Write-Host ""
