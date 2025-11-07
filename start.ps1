# Pool Tournament Manager Startup Script (Client-Side Version)
Write-Host "Pool Tournament Manager (Firebase Version)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check for Python (for simple HTTP server)
$pythonPaths = @(
    "python",
    "py",
    "python3"
)

$pythonFound = $false
$pythonPath = ""

foreach ($path in $pythonPaths) {
    try {
        $null = & $path --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $pythonPath = $path
            $pythonFound = $true
            Write-Host "Python found: $path" -ForegroundColor Green
            break
        }
    } catch {
        # Continue checking
    }
}

if (-not $pythonFound) {
    Write-Host "ERROR: Python is not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "For local testing, you need Python installed." -ForegroundColor Yellow
    Write-Host "Download Python from: https://www.python.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative: Use 'npx http-server' if you have Node.js installed" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting local development server..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the script directory
Set-Location $PSScriptRoot

# Start the server
Write-Host "Starting Python HTTP server..." -ForegroundColor Green
Write-Host "Note: This serves static files only. Firebase will handle data storage." -ForegroundColor Yellow
Write-Host ""
& $pythonPath -m http.server 8000