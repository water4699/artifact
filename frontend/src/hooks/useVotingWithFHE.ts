import { useState, useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { useFhevm } from '../../fhevm/useFhevm';
import { useArtifactVoting } from './useArtifactVoting';
import { getContractAddress } from '../config/contracts';

// FHEVM type constants (kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FhevmType = {
  euint8: 0,
  euint16: 1,
  euint32: 2,
};

export function useVotingWithFHE() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Fix FHEVM provider initialization based on documentation issues
  const fhevmProvider = useMemo(() => {
    if (publicClient?.chain?.id === 31337) {
      // Localhost: use RPC URL string as expected by useFhevm
      return "http://127.0.0.1:8545";
    } else if (publicClient?.chain?.id === 11155111) {
      // Sepolia: use RPC URL string for better compatibility
      return `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY || 'b18fb7e6ca7045ac83c41157ab93f990'}`;
    } else {
      // For other networks, use raw EIP-1193 provider
      return typeof window !== "undefined" ? window.ethereum : undefined;
    }
  }, [publicClient?.chain?.id]);

  // Initialize FHEVM instance
  const { instance: fhevm, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: fhevmProvider,
    chainId: chainId || 31337,
    enabled: !!fhevmProvider,
  });

  const artifactVoting = useArtifactVoting();
  const [isEncrypting, setIsEncrypting] = useState(false);

  const createEncryptedVote = useCallback(async (vote: 0 | 1): Promise<{ handles: string[], inputProof: string }> => {
    if (!fhevm || !address) {
      throw new Error('FHEVM instance not available or wallet not connected');
    }

    try {
      setIsEncrypting(true);

      // Create encrypted input for the contract and user
      const currentContractAddress = getContractAddress(chainId || 31337);
      const encryptedInput = fhevm.createEncryptedInput(currentContractAddress, address);

      // Add the vote value (0 or 1) as uint8 and encrypt
      const finalInput = await encryptedInput.add8(vote).encrypt();

      return {
        handles: finalInput.handles.map(h => '0x' + Buffer.from(h).toString('hex')),
        inputProof: '0x' + Buffer.from(finalInput.inputProof).toString('hex'),
      };
    } catch (error) {
      console.error('Error encrypting vote:', error);
      throw error;
    } finally {
      setIsEncrypting(false);
    }
  }, [fhevm, address, chainId]);

  const getEncryptedVoteCounts = useCallback(async (requestId: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      return await artifactVoting.getEncryptedVoteCounts(requestId);
    } catch (error) {
      console.error('Error getting encrypted vote counts:', error);
      throw error;
    }
  }, [address, artifactVoting]);

  const decryptVoteCounts = useCallback(async (
    requestId: number
  ): Promise<{ yesVotes: number; noVotes: number }> => {
    try {
      // Use ethers directly to get contract data, similar to TransferRequestList
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const contract = new ethers.Contract(
        getContractAddress(31337),
        artifactVoting.interface || artifactVoting.abi,
        provider
      );

      const requestData = await contract.getTransferRequest(requestId);

      if (!requestData) {
        console.log('No request data found for ID:', requestId);
        return { yesVotes: 0, noVotes: 0 };
      }

      // Extract vote counts - requestData is an array
      const finalYesCount = Number(requestData[9]); // finalYesCount
      const finalNoCount = Number(requestData[10]); // finalNoCount

      console.log('Decrypted vote counts for request', requestId, ':', { finalYesCount, finalNoCount });

      return {
        yesVotes: finalYesCount || 0,
        noVotes: finalNoCount || 0
      };
    } catch (error) {
      console.error('Error decrypting vote counts:', error);
      return { yesVotes: 0, noVotes: 0 };
    }
  }, [artifactVoting]);

  const submitEncryptedVote = useCallback(async (requestId: number, vote: 0 | 1) => {
    if (!fhevm || !address) {
      throw new Error('FHEVM instance not available or wallet not connected');
    }

    try {
      setIsEncrypting(true);

      // Create encrypted vote using FHEVM
      const encryptedVote = await createEncryptedVote(vote);

      // Submit the vote to the contract
      await artifactVoting.submitVote(
        requestId,
        encryptedVote.handles[0] as `0x${string}`, // externalEuint8
        encryptedVote.inputProof as `0x${string}`  // inputProof as bytes
      );

      return true;
    } catch (error) {
      console.error('Error submitting encrypted vote:', error);
      throw error;
    } finally {
      setIsEncrypting(false);
    }
  }, [fhevm, address, createEncryptedVote, artifactVoting]);

  return {
    // FHEVM status
    fhevmReady: fhevmStatus === 'ready',
    fhevmError,
    isEncrypting,

    // Contract operations
    ...artifactVoting,
    simpleVote: artifactVoting.simpleVote, // Include simpleVote for demo

    // FHE-enhanced operations
    createEncryptedVote,
    submitEncryptedVote,
    decryptVoteCounts,
    getEncryptedVoteCounts,
  };
}
