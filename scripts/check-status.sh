#!/bin/bash

# Hardhat Development Environment Status Check
# Quick health check for the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔍 Artifact Cipher Vault - Environment Status${NC}"
    echo "==============================================="
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_header

# Check Hardhat node
print_status "Checking Hardhat node..."
if curl -s http://127.0.0.1:8545 > /dev/null 2>&1; then
    print_success "Hardhat node: RUNNING (localhost:8545)"
else
    print_error "Hardhat node: NOT RUNNING"
fi

# Check contract deployments
print_status "Checking contract deployments..."

# Localhost deployment
if [ -f "deployments/localhost/EncryptedArtifactVoting.json" ]; then
    local_address=$(grep '"address"' deployments/localhost/EncryptedArtifactVoting.json | head -1 | sed 's/.*"address": *"\([^"]*\)".*/\1/')
    print_success "Localhost contract: DEPLOYED ($local_address)"
else
    print_error "Localhost contract: NOT DEPLOYED"
fi

# Sepolia deployment
if [ -f "deployments/sepolia/EncryptedArtifactVoting.json" ]; then
    sepolia_address=$(grep '"address"' deployments/sepolia/EncryptedArtifactVoting.json | head -1 | sed 's/.*"address": *"\([^"]*\)".*/\1/')
    print_success "Sepolia contract: DEPLOYED ($sepolia_address)"
else
    print_warning "Sepolia contract: NOT DEPLOYED"
fi

# Check frontend configuration
print_status "Checking frontend configuration..."

# Check if contract addresses match deployment
if [ -f "frontend/src/config/contracts.ts" ]; then
    # Extract localhost address from config
    config_localhost=$(grep "localhost:" frontend/src/config/contracts.ts | sed "s/.*localhost: *'\([^']*\)'.*/\1/")

    if [ "$config_localhost" = "$local_address" ]; then
        print_success "Frontend localhost address: SYNCED"
    else
        print_warning "Frontend localhost address: OUT OF SYNC"
        print_status "  Config: $config_localhost"
        print_status "  Deployed: $local_address"
    fi

    # Check Sepolia if deployed
    if [ ! -z "$sepolia_address" ]; then
        config_sepolia=$(grep "sepolia:" frontend/src/config/contracts.ts | sed "s/.*sepolia: *'\([^']*\)'.*/\1/")
        if [ "$config_sepolia" = "$sepolia_address" ]; then
            print_success "Frontend Sepolia address: SYNCED"
        else
            print_warning "Frontend Sepolia address: OUT OF SYNC"
            print_status "  Config: $config_sepolia"
            print_status "  Deployed: $sepolia_address"
        fi
    fi
else
    print_error "Frontend config file not found"
fi

# Check ABI files
print_status "Checking ABI files..."
if [ -f "frontend/src/abi/EncryptedArtifactVoting.ts" ]; then
    print_success "ABI files: GENERATED"
else
    print_error "ABI files: MISSING (run 'cd frontend && npm run genabi')"
fi

# Check build status
print_status "Checking build status..."
cd frontend
if npm run build --silent 2>/dev/null; then
    print_success "Frontend build: SUCCESS"
else
    print_error "Frontend build: FAILED"
fi
cd ..

echo ""
echo "==============================================="
print_status "Quick Actions:"
echo "  • Deploy localhost: ./scripts/dev-setup.sh"
echo "  • Deploy Sepolia:   ./scripts/dev-setup.sh --network=sepolia"
echo "  • Clean caches:     ./scripts/dev-setup.sh --clean"
echo "  • Full guide:       cat HARDHAT_DEV_ENVIRONMENT_GUIDE.md"
