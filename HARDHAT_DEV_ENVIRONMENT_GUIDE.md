# Hardhat Development Environment Management Guide

This guide outlines best practices for managing the Hardhat development environment for the Artifact Cipher Vault project.

## 🎯 Management Key Points

### 1. Node Restart & Contract Redeployment
**Important**: Every time the Hardhat node is restarted, contracts must be redeployed.

#### Why This Matters
- Hardhat maintains contract state in memory
- Node restart clears all deployed contracts
- Contract addresses change with each deployment

#### Best Practices
```bash
# 1. Start Hardhat node in background
npx hardhat node

# 2. In new terminal, deploy contracts
npx hardhat deploy --network localhost

# 3. Update frontend addresses (see deployment checklist)
# 4. Regenerate ABI files
cd frontend && npm run genabi

# 5. Start frontend development server
npm run dev
```

### 2. Frontend Address Configuration Sync
**Critical**: Keep frontend contract addresses synchronized with deployment records.

#### Current Address Configuration
```typescript
// frontend/src/config/contracts.ts
export const CONTRACT_ADDRESSES = {
  localhost: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Deployed on localhost
  sepolia: '0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431',  // Deployed on Sepolia
} as const;
```

#### Sync Process
1. Deploy contracts to target network
2. Copy contract address from deployment logs
3. Update `contracts.ts` file
4. Run `npm run genabi` to update ABI files
5. Verify frontend loads without contract errors

### 3. Build Cache Management
**Recommended**: Regularly clean build caches to avoid compilation issues.

#### Cache Locations
- `artifacts/` - Compiled contract artifacts
- `cache/` - Hardhat compilation cache
- `frontend/.next/` - Next.js build cache
- `frontend/node_modules/.cache/` - Various tool caches

#### Cache Cleaning Commands
```bash
# Clean all Hardhat caches
npx hardhat clean

# Clean Next.js cache
cd frontend && rm -rf .next

# Clean all caches (nuclear option)
npx hardhat clean
cd frontend && rm -rf .next node_modules/.cache
```

#### When to Clean Cache
- After major contract changes
- When compilation errors persist
- After dependency updates
- When switching between networks frequently

### 4. Contract Address Verification
**Mandatory**: Always verify contract addresses before frontend integration.

#### Verification Steps
```bash
# 1. Check deployment logs for addresses
npx hardhat deploy --network localhost

# 2. Verify contract is deployed at expected address
npx hardhat run scripts/verify-deployment.ts

# 3. Test contract interaction
npx hardhat test --network localhost

# 4. Only then update frontend config
```

## 🚀 Development Workflow

### Daily Development Setup
```bash
# 1. Start Hardhat node
npx hardhat node

# 2. Deploy contracts (in new terminal)
npx hardhat deploy --network localhost

# 3. Update frontend addresses
# Edit frontend/src/config/contracts.ts

# 4. Generate fresh ABI
cd frontend && npm run genabi

# 5. Start development
npm run dev
```

### Network Switching
```bash
# Switch to localhost development
npx hardhat deploy --network localhost
cd frontend && npm run genabi

# Switch to Sepolia testnet
npx hardhat deploy --network sepolia
cd frontend && npm run genabi
```

### Troubleshooting Common Issues

#### Issue: "Contract not found" errors
```
Solution:
1. Verify Hardhat node is running: npx hardhat node
2. Redeploy contracts: npx hardhat deploy --network localhost
3. Update frontend addresses
4. Regenerate ABI: cd frontend && npm run genabi
```

#### Issue: Compilation errors after contract changes
```
Solution:
1. Clean caches: npx hardhat clean
2. Clean frontend: cd frontend && rm -rf .next
3. Recompile: npx hardhat compile
4. Redeploy: npx hardhat deploy --network localhost
```

#### Issue: Frontend shows wrong contract data
```
Solution:
1. Check contract addresses in frontend/src/config/contracts.ts
2. Compare with deployment logs
3. Verify network connection in wallet
4. Check browser console for contract errors
```

## 📊 Environment Status Monitoring

### Quick Status Check Commands
```bash
# Check if Hardhat node is running
curl http://127.0.0.1:8545

# Verify contract deployment
npx hardhat run scripts/check-deployment.ts

# Check frontend build status
cd frontend && npm run build
```

### Health Check Script
```bash
#!/bin/bash
echo "🔍 Hardhat Development Environment Health Check"
echo "==============================================="

# Check Hardhat node
if curl -s http://127.0.0.1:8545 > /dev/null; then
    echo "✅ Hardhat node: RUNNING"
else
    echo "❌ Hardhat node: NOT RUNNING"
fi

# Check contract deployment
if [ -f "deployments/localhost/EncryptedArtifactVoting.json" ]; then
    echo "✅ Local contracts: DEPLOYED"
else
    echo "❌ Local contracts: NOT DEPLOYED"
fi

# Check frontend
cd frontend
if npm run build --silent 2>/dev/null; then
    echo "✅ Frontend build: SUCCESS"
else
    echo "❌ Frontend build: FAILED"
fi

echo "==============================================="
echo "💡 Run 'npx hardhat deploy --network localhost' if contracts need redeployment"
```

## 🔒 Security Considerations

### Network Isolation
- Never deploy test contracts to mainnet
- Use separate addresses for different networks
- Verify contract ownership before deployment

### Private Key Management
- Use different private keys for different networks
- Never commit private keys to version control
- Use environment variables for sensitive data

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat Deploy Plugin](https://github.com/wighawag/hardhat-deploy)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start node | `npx hardhat node` |
| Deploy localhost | `npx hardhat deploy --network localhost` |
| Deploy Sepolia | `npx hardhat deploy --network sepolia` |
| Generate ABI | `cd frontend && npm run genabi` |
| Clean cache | `npx hardhat clean && cd frontend && rm -rf .next` |
| Start frontend | `cd frontend && npm run dev` |

Remember: **Always redeploy contracts after restarting the Hardhat node!**
