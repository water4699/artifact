# Hardhat Development Environment Status Check (PowerShell)
# Quick health check for the development environment

Write-Host "🔍 Artifact Cipher Vault - Environment Status" -ForegroundColor Blue
Write-Host "==============================================="

# Check Hardhat node
Write-Host "Checking Hardhat node..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" -Method GET -TimeoutSec 5
    Write-Host "✅ Hardhat node: RUNNING (localhost:8545)" -ForegroundColor Green
} catch {
    Write-Host "❌ Hardhat node: NOT RUNNING" -ForegroundColor Red
}

# Check contract deployments
Write-Host "Checking contract deployments..." -ForegroundColor Blue

# Localhost deployment
$localhostPath = "deployments/localhost/EncryptedArtifactVoting.json"
if (Test-Path $localhostPath) {
    try {
        $localhostContent = Get-Content $localhostPath -Raw | ConvertFrom-Json
        $localhostAddress = $localhostContent.address
        Write-Host "✅ Localhost contract: DEPLOYED ($localhostAddress)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Localhost contract: ERROR reading deployment file" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Localhost contract: NOT DEPLOYED" -ForegroundColor Red
}

# Sepolia deployment
$sepoliaPath = "deployments/sepolia/EncryptedArtifactVoting.json"
if (Test-Path $sepoliaPath) {
    try {
        $content = Get-Content $sepoliaPath -Raw | ConvertFrom-Json
        $address = $content.address
        Write-Host "✅ Sepolia contract: DEPLOYED ($address)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Sepolia contract: ERROR reading deployment file" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Sepolia contract: NOT DEPLOYED" -ForegroundColor Yellow
}

# Check frontend configuration
Write-Host "Checking frontend configuration..." -ForegroundColor Blue

$configPath = "frontend/src/config/contracts.ts"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw

    # Extract localhost address from config
    if ($configContent -match "localhost:\s*'([^']+)'") {
        $configLocalhost = $matches[1]
    }

    # Extract sepolia address from config
    if ($configContent -match "sepolia:\s*'([^']+)'") {
        $configSepolia = $matches[1]
    }

    # Compare with deployment addresses
    if ($configLocalhost -and $localhostAddress) {
        if ($configLocalhost -eq $localhostAddress) {
            Write-Host "✅ Frontend localhost address: SYNCED" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Frontend localhost address: OUT OF SYNC" -ForegroundColor Yellow
            Write-Host "  Config: $configLocalhost" -ForegroundColor Gray
            Write-Host "  Deployed: $localhostAddress" -ForegroundColor Gray
        }
    }

    if ($configSepolia -and (Test-Path $sepoliaPath)) {
        try {
            $sepoliaContent = Get-Content $sepoliaPath -Raw | ConvertFrom-Json
            $sepoliaAddress = $sepoliaContent.address
            if ($configSepolia -eq $sepoliaAddress) {
                Write-Host "✅ Frontend Sepolia address: SYNCED" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Frontend Sepolia address: OUT OF SYNC" -ForegroundColor Yellow
                Write-Host "  Config: $configSepolia" -ForegroundColor Gray
                Write-Host "  Deployed: $sepoliaAddress" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ Error reading Sepolia deployment" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Frontend config file not found" -ForegroundColor Red
}

# Check ABI files
Write-Host "Checking ABI files..." -ForegroundColor Blue
$abiPath = "frontend/abi/EncryptedArtifactVotingABI.ts"
if (Test-Path $abiPath) {
    Write-Host "✅ ABI files: GENERATED" -ForegroundColor Green
} else {
    Write-Host "❌ ABI files: MISSING (run 'cd frontend && npm run genabi')" -ForegroundColor Red
}

# Check build status
Write-Host "Checking build status..." -ForegroundColor Blue
Push-Location frontend
try {
    $buildResult = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend build: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend build: ERROR" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Blue
Write-Host "Quick Actions:" -ForegroundColor Blue
Write-Host "  • Deploy localhost: .\scripts\dev-setup.ps1"
Write-Host "  • Deploy Sepolia:   .\scripts\dev-setup.ps1 -Network sepolia"
Write-Host "  • Clean caches:     .\scripts\dev-setup.ps1 -Clean"
Write-Host "  • Full guide:       type HARDHAT_DEV_ENVIRONMENT_GUIDE.md"
