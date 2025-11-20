// Contract addresses - update these after deployment
export const CONTRACT_ADDRESSES = {
  localhost: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // Deployed on localhost with FHE decryption
  sepolia: '0xd0703851f993c86e5683a6dCFE5fc7ef8E9e4431',  // Deployed on Sepolia
} as const;

export const getContractAddress = (chainId: number): string => {
  switch (chainId) {
    case 31337: // localhost (hardhat)
    case 1337:  // localhost (legacy hardhat)
      return CONTRACT_ADDRESSES.localhost;
    case 11155111: // sepolia
      return CONTRACT_ADDRESSES.sepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};
