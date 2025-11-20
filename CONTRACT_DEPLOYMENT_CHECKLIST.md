# Contract Deployment Checklist & Environment Management

This checklist outlines the steps to follow after redeploying contracts to ensure the frontend remains in sync, along with critical Hardhat development environment management practices.

## 🚨 Critical Management Rules

### 1. 🔄 Node Restart = Contract Redeployment
**MANDATORY**: Every time the Hardhat node is restarted, contracts MUST be redeployed.

**Why?**
- Hardhat maintains contract state in memory only
- Node restart clears all deployed contracts and their state
- Contract addresses change with each new deployment

**Always do this sequence:**
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts immediately after node starts
npx hardhat deploy --network localhost
```

### 2. 🔗 Address Synchronization
**CRITICAL**: Frontend addresses must always match deployment records.

**Current Addresses:**
- **Sepolia**: `0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431`
- **Localhost**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### 3. 🧹 Cache Management
**RECOMMENDED**: Regularly clean caches to prevent compilation issues.

```bash
# Clean all caches
npx hardhat clean
cd frontend && rm -rf .next node_modules/.cache
```

## 🚀 Deployment Steps

### 1. Deploy Contracts
```bash
cd artifact-cipher

# For localhost development (after starting node)
npx hardhat deploy --network localhost

# For Sepolia testnet
npx hardhat deploy --network sepolia
```

### 2. Check Deployment Logs
- Look for the contract address in the deployment output
- Example output:
  ```
  deploying "EncryptedArtifactVoting" (tx: 0x...): deployed at 0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431 with 1421803 gas
  EncryptedArtifactVoting contract:  0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431
  ```
- **Save this address** - you'll need it for the next steps

### 3. Update Address Configuration
Update `frontend/src/config/contracts.ts` with the new contract address:
```typescript
export const CONTRACT_ADDRESSES = {
  localhost: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Current localhost deployment
  sepolia: '0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431',  // Current Sepolia deployment
} as const;
```

### 4. Regenerate ABI Files
```bash
cd frontend
npm run genabi
```
This will update:
- `abi/EncryptedArtifactVotingABI.ts`
- `abi/EncryptedArtifactVotingAddresses.ts`

### 5. Test Contract Connection
```bash
cd frontend
npm run dev
```
Then verify:
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Contract interactions work properly
- [ ] No console errors related to contract calls
- [ ] Contract address matches deployment logs

## 📋 Quick Reference

**Current Contract Addresses:**
- **Sepolia**: `0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431`
- **Localhost**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

**Essential Commands:**
```bash
# 🚨 ALWAYS: Start node first, then deploy
npx hardhat node                    # Terminal 1
npx hardhat deploy --network localhost  # Terminal 2

# Quick development setup (use our script)
./scripts/dev-setup.sh

# Environment health check
./scripts/check-status.sh

# Clean caches when having issues
npx hardhat clean
cd frontend && rm -rf .next

# Generate ABI after deployment
cd frontend && npm run genabi

# Start development server
cd frontend && npm run dev
```

## 🛠️ Automation Scripts

We've created helper scripts to streamline development:

### Development Setup Script
```bash
# Basic setup for localhost
./scripts/dev-setup.sh

# Clean caches and setup
./scripts/dev-setup.sh --clean

# Deploy to Sepolia
./scripts/dev-setup.sh --network=sepolia
```

### Status Check Script
```bash
# Quick health check of your environment
./scripts/check-status.sh
```

## ⚠️ Troubleshooting

### "Contract not found" or "Invalid address" errors
1. **Check if Hardhat node is running**: `curl http://127.0.0.1:8545`
2. **Redeploy contracts**: Node restart requires redeployment
3. **Verify addresses match**: Compare `contracts.ts` with deployment logs
4. **Check network**: Ensure wallet is connected to correct network

### Compilation or build errors
1. **Clean caches**: `npx hardhat clean && cd frontend && rm -rf .next`
2. **Reinstall dependencies**: `cd frontend && rm -rf node_modules && npm install`
3. **Check TypeScript errors**: `cd frontend && npx tsc --noEmit`

### Contract interaction failures
1. **Verify ABI is current**: Run `npm run genabi`
2. **Check contract addresses**: Ensure they match deployment
3. **Test with Hardhat console**: `npx hardhat console --network localhost`

### Hydration or rendering errors
1. **Clear Next.js cache**: `cd frontend && rm -rf .next`
2. **Check for client/server mismatches**: Ensure all hooks are in client components
3. **Verify wallet connection**: Some features require wallet connection

## 🎯 Development Workflow Summary

1. **Start fresh**: `./scripts/check-status.sh`
2. **Setup environment**: `./scripts/dev-setup.sh`
3. **Develop & test**: `cd frontend && npm run dev`
4. **Deploy changes**: Follow deployment steps above
5. **Clean when stuck**: `./scripts/dev-setup.sh --clean`

**Remember**: 🔄 **Node restart = Contract redeployment** - this is the #1 rule!
