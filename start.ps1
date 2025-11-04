# Pool Tournament Manager Startup Script
Write-Host "Pool Tournament Manager" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
$nodePaths = @(
    "node",
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe"
)

$nodeFound = $false
$nodePath = ""

foreach ($path in $nodePaths) {
    try {
        if ($path -eq "node") {
            $null = & $path --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $nodePath = $path
                $nodeFound = $true
                Write-Host "Node.js found in PATH!" -ForegroundColor Green
                break
            }
        } elseif (Test-Path $path) {
            $nodePath = $path
            $nodeFound = $true
            Write-Host "Node.js found at: $path" -ForegroundColor Green
            break
        }
    } catch {
        # Continue checking
    }
}

if (-not $nodeFound) {
    Write-Host "ERROR: Node.js is not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure Node.js is installed and try one of these:" -ForegroundColor Yellow
    Write-Host "1. Restart your computer after installing Node.js" -ForegroundColor Yellow
    Write-Host "2. Close and reopen PowerShell" -ForegroundColor Yellow
    Write-Host "3. Add Node.js to your PATH environment variable" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download Node.js from: https://nodejs.org/" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting Pool Tournament Manager..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the script directory
Set-Location $PSScriptRoot

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
& $nodePath server.js