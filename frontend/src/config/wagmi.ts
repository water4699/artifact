import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Custom localhost chain with correct chainId for Hardhat
const hardhatLocalhost = {
  id: 31337,
  name: 'Hardhat Localhost',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Hardhat Explorer', url: 'http://127.0.0.1:8545' },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'Artifact Cipher Vault',
  projectId: 'ef3325a718834a2b1b4134d3f520933d', // WalletConnect Project ID
  chains: [hardhatLocalhost, sepolia],
  ssr: false,
});
