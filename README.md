# Artifact Cipher Vault

A secure encrypted voting system for artifact transfer approvals using Fully Homomorphic Encryption (FHE) via the FHEVM protocol by Zama. This system enables confidential voting on artifact transfer requests while protecting voter privacy and preventing responsibility exposure during approval disputes.

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
artifact-cipher-vault/
├── contracts/                      # Smart contract source files
│   └── EncryptedArtifactVoting.sol # Main voting contract with FHE
├── deploy/                         # Deployment scripts
├── frontend/                       # React frontend application
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── config/               # Wallet and contract configuration
│   │   └── hooks/                # Custom React hooks
├── tasks/                          # Hardhat custom tasks
├── test/                          # Test files
├── hardhat.config.ts              # Hardhat configuration
└── package.json                   # Dependencies and scripts
```

## 🎯 Business Logic

**Encrypted Artifact Transfer Approval Voting Process:**

1. **Admin creates transfer request** with artifact details and authorized voters
2. **Voters submit encrypted votes** (Yes/No) using homomorphic encryption
3. **Chain performs homomorphic tallying** of encrypted votes
4. **Admin decrypts final results** to determine approval status

**Key Features:**
- **Encrypted Voting**: Vote contents remain private during voting
- **Homomorphic Tallying**: Vote counts computed on encrypted data
- **Privacy Protection**: Prevents responsibility exposure in approval disputes
- **Admin Decryption**: Only admin can reveal final voting results

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager
- **FHEVM Local Node**: For local testing

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Start local FHEVM node**
   ```bash
   npx hardhat node
   ```

4. **Deploy contract locally**
   ```bash
   npx hardhat deploy --network localhost
   ```

5. **Update contract address**
   - Copy the deployed contract address from the deployment output
   - Update `frontend/src/config/contracts.ts` with the localhost address

6. **Install frontend dependencies and start**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Run tests**
   ```bash
   npm test
   ```

## 🏗️ Architecture

### Smart Contract (`EncryptedArtifactVoting.sol`)

**Core Features:**
- **Encrypted Voting**: Votes are encrypted using FHE before submission
- **Homomorphic Tallying**: Vote counts computed on encrypted data
- **Admin Decryption**: Only admin can decrypt final results
- **Access Control**: Authorized voters only, one vote per person

**Key Functions:**
- `createTransferRequest()`: Admin creates artifact transfer request
- `submitVote()`: Authorized voters submit encrypted votes
- `finalizeResults()`: Admin decrypts and finalizes voting results
- `getEncryptedVoteCounts()`: Admin retrieves encrypted tallies

### Frontend Components

**Main Components:**
- `ArtifactVotingApp`: Main application orchestrator
- `CreateTransferRequest`: Admin form for creating transfer requests
- `TransferRequestList`: Display all transfer requests with voting status
- `VoteOnRequest`: Encrypted voting interface for authorized users
- `AdminDecryptResults`: Admin interface for decrypting results

**Key Hooks:**
- `useArtifactVoting`: Contract interaction hooks
- `useVotingWithFHE`: FHE encryption/decryption operations
- RainbowKit integration for wallet connectivity

## 🔐 Security Features

- **Vote Privacy**: Individual votes remain encrypted during voting
- **Homomorphic Operations**: Tallying performed on encrypted data
- **Admin-Only Decryption**: Results only revealed by authorized admin
- **Access Control**: Only authorized voters can participate
- **One-Vote-Per-Person**: Prevents double voting

## 🧪 Testing

### Local Testing
```bash
npm run test
```

### Sepolia Testing
```bash
npm run test:sepolia
```

### Test Coverage
- Contract deployment and initialization
- Transfer request creation and authorization
- Encrypted vote submission and validation
- Homomorphic tallying verification
- Admin result decryption and finalization
- Access control and error handling

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [RainbowKit Documentation](https://www.rainbowkit.com/)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ by the Zama team**
