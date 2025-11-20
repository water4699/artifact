#!/bin/bash

# Hardhat Development Environment Setup Script
# This script helps set up the development environment with proper contract deployment

set -e  # Exit on any error

echo "🚀 Artifact Cipher Vault - Development Environment Setup"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Hardhat node is running
check_hardhat_node() {
    print_status "Checking Hardhat node status..."
    if curl -s http://127.0.0.1:8545 > /dev/null 2>&1; then
        print_success "Hardhat node is running"
        return 0
    else
        print_warning "Hardhat node is not running"
        return 1
    fi
}

# Clean build caches
clean_caches() {
    print_status "Cleaning build caches..."

    # Clean Hardhat caches
    if [ -d "artifacts" ]; then
        rm -rf artifacts
        print_status "Cleaned Hardhat artifacts"
    fi

    if [ -d "cache" ]; then
        rm -rf cache
        print_status "Cleaned Hardhat cache"
    fi

    # Clean frontend caches
    if [ -d "frontend/.next" ]; then
        rm -rf frontend/.next
        print_status "Cleaned Next.js cache"
    fi

    if [ -d "frontend/node_modules/.cache" ]; then
        rm -rf frontend/node_modules/.cache
        print_status "Cleaned frontend node cache"
    fi

    print_success "Cache cleaning completed"
}

# Deploy contracts
deploy_contracts() {
    local network=${1:-localhost}

    print_status "Deploying contracts to $network network..."

    # Check if deployment already exists for localhost
    if [ "$network" = "localhost" ] && [ -d "deployments/localhost" ]; then
        print_warning "Local deployment already exists. Cleaning old deployment..."
        rm -rf deployments/localhost
    fi

    if npx hardhat deploy --network $network; then
        print_success "Contracts deployed successfully to $network"

        # Extract contract address from deployment logs
        if [ "$network" = "localhost" ]; then
            local contract_address=$(grep "EncryptedArtifactVoting contract:" deployments/localhost/EncryptedArtifactVoting.json | sed 's/.*"address":"\([^"]*\)".*/\1/')
            if [ ! -z "$contract_address" ]; then
                print_success "Contract deployed at: $contract_address"
            fi
        fi

        return 0
    else
        print_error "Contract deployment failed"
        return 1
    fi
}

# Update frontend configuration
update_frontend_config() {
    print_status "Updating frontend configuration..."

    cd frontend

    # Generate ABI files
    if npm run genabi; then
        print_success "ABI files generated successfully"
    else
        print_error "ABI generation failed"
        cd ..
        return 1
    fi

    cd ..
    return 0
}

# Main setup function
main() {
    local skip_node_check=${SKIP_NODE_CHECK:-false}
    local clean_cache=${CLEAN_CACHE:-false}
    local network=${NETWORK:-localhost}

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-node-check)
                skip_node_check=true
                shift
                ;;
            --clean)
                clean_cache=true
                shift
                ;;
            --network=*)
                network="${1#*=}"
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-node-check    Skip Hardhat node status check"
                echo "  --clean             Clean all build caches before setup"
                echo "  --network=NAME      Deploy to specific network (default: localhost)"
                echo "  --help              Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                          # Basic localhost setup"
                echo "  $0 --clean                  # Clean caches and setup"
                echo "  $0 --network=sepolia       # Deploy to Sepolia testnet"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Clean caches if requested
    if [ "$clean_cache" = true ]; then
        clean_caches
    fi

    # Check Hardhat node (skip if requested)
    if [ "$skip_node_check" = false ]; then
        if ! check_hardhat_node; then
            if [ "$network" = "localhost" ]; then
                print_warning "Please start Hardhat node in another terminal:"
                print_warning "  npx hardhat node"
                print_warning ""
                print_warning "Or run this script with --skip-node-check if node is already starting"
                exit 1
            fi
        fi
    fi

    # Deploy contracts
    if deploy_contracts $network; then
        # Update frontend configuration
        if update_frontend_config; then
            print_success "Development environment setup completed!"
            echo ""
            print_status "Next steps:"
            echo "  1. Start frontend development server:"
            echo "     cd frontend && npm run dev"
            echo ""
            echo "  2. Open http://localhost:3000 in your browser"
            echo ""
            print_success "Happy coding! 🎉"
        else
            print_error "Frontend configuration update failed"
            exit 1
        fi
    else
        print_error "Contract deployment failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
