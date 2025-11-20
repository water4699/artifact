import { useCallback } from 'react';
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi';
import { EncryptedArtifactVoting__factory } from '../../../types';
import { getContractAddress } from '../config/contracts';

export interface TransferRequest {
  id: bigint;
  artifactName: string;
  description: string;
  requester: string;
  createdAt: bigint;
  active: boolean;
  decrypted: boolean;
  finalYesCount: bigint;
  finalNoCount: bigint;
  approved: boolean;
}

export function useArtifactVoting() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);

  // Read contract functions
  const { data: allRequestIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedArtifactVoting__factory.abi,
    functionName: 'getAllRequestIds',
  });

  // Write contract functions
  const { writeContractAsync } = useWriteContract();

  const createTransferRequest = useCallback(async (
    artifactName: string,
    description: string,
    authorizedVoters: readonly `0x${string}`[]
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: EncryptedArtifactVoting__factory.abi,
      functionName: 'createTransferRequest',
      args: [artifactName, description, authorizedVoters],
    });
  }, [writeContractAsync, address, contractAddress]);

  const submitVote = useCallback(async (
    requestId: number,
    encryptedVote: `0x${string}`,
    inputProof: `0x${string}`
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: EncryptedArtifactVoting__factory.abi,
      functionName: 'submitVote',
      args: [BigInt(requestId), encryptedVote, inputProof],
    });
  }, [writeContractAsync, address, contractAddress]);

  const simpleVote = useCallback(async (
    requestId: number,
    vote: 0 | 1
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: EncryptedArtifactVoting__factory.abi,
      functionName: 'simpleVote',
      args: [BigInt(requestId), vote],
    });
  }, [writeContractAsync, address, contractAddress]);

  const decryptResults = useCallback(async (requestId: number) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: EncryptedArtifactVoting__factory.abi,
      functionName: 'decryptResults',
      args: [BigInt(requestId)],
    });
  }, [writeContractAsync, address, contractAddress]);

  const finalizeResults = useCallback(async (
    requestId: number,
    finalYesCount: number,
    finalNoCount: number
  ) => {
    if (!address) throw new Error('Wallet not connected');


    return await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: EncryptedArtifactVoting__factory.abi,
      functionName: 'finalizeResults',
      args: [BigInt(requestId), finalYesCount, finalNoCount],
    });
  }, [writeContractAsync, address, contractAddress]);

  // Note: Read operations should be handled by components using useReadContract directly
  // to avoid React Hooks rules violations. This hook focuses on write operations.

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTransferRequest = useCallback(async (requestId: number): Promise<TransferRequest | null> => {
    // This should be implemented by components using useReadContract
    console.warn('getTransferRequest should be called via useReadContract in components');
    return null;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isAuthorizedVoter = useCallback(async (requestId: number, voter: string): Promise<boolean> => {
    console.warn('isAuthorizedVoter should be called via useReadContract in components');
    return false;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasVoted = useCallback(async (requestId: number, voter: string): Promise<boolean> => {
    console.warn('hasVoted should be called via useReadContract in components');
    return false;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getEncryptedVoteCounts = useCallback(async (requestId: number): Promise<{yesVotes: string; noVotes: string; totalVotes: string} | null> => {
    console.warn('getEncryptedVoteCounts should be called via useReadContract in components');
    return null;
  }, []);

  return {
    // Data
    allRequestIds,

    // Actions
    createTransferRequest,
    submitVote,
    simpleVote, // Simple non-encrypted voting for testing
    decryptResults,
    finalizeResults,
    getTransferRequest,
    isAuthorizedVoter,
    hasVoted,
    getEncryptedVoteCounts,
  };
}
