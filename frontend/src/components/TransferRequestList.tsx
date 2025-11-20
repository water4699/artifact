'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TransferRequest } from '../hooks/useArtifactVoting';
import { EncryptedArtifactVoting__factory } from '../../../types';
import { getContractAddress } from '../config/contracts';
import { ethers } from 'ethers';

interface TransferRequestListProps {
  onVoteRequest: (requestId: number) => void;
  onDecryptRequest: (requestId: number) => void;
  refreshTrigger?: number;
}

export function TransferRequestList({ onVoteRequest, onDecryptRequest, refreshTrigger }: TransferRequestListProps) {
  const { address, chainId } = useAccount();
  const [requests, setRequests] = useState<(TransferRequest & { canVote: boolean; canDecrypt: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(chainId || 31337);

  // Use useReadContract directly to get all request IDs
  const { data: allRequestIds, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedArtifactVoting__factory.abi,
    functionName: 'getAllRequestIds',
    query: {
      enabled: !!contractAddress, // Remove chainId dependency for now
    },
  });

  console.log('TransferRequestList useEffect triggered, refreshTrigger:', refreshTrigger);

  useEffect(() => {
    const loadRequests = async () => {
      console.log('loadRequests called with:', { allRequestIds, address, refreshTrigger });

      // Refetch data when refreshTrigger changes
      if (refreshTrigger && refreshTrigger > 0) {
        console.log('Refetching data due to refresh trigger');
        await refetch();
      }

      // Handle allRequestIds - it might be a Result object from ethers
      let requestIds: any = allRequestIds;

      if (!allRequestIds) {
        console.log('allRequestIds is null/undefined');
        setRequests([]);
        setLoading(false);
        return;
      }

      // Convert ethers Result object to array if needed
      if (!Array.isArray(allRequestIds) && typeof allRequestIds === 'object' && allRequestIds !== null) {
        try {
          // It's likely a Result object, convert to array
          requestIds = Array.from(allRequestIds as any);
        } catch {
          console.error('Failed to convert allRequestIds to array:', allRequestIds);
          setRequests([]);
          setLoading(false);
          return;
        }
      }
      }

      // If still no requestIds, try manual call
      if (!requestIds || requestIds.length === 0) {
        console.log('No requestIds from hook, trying manual call...');
        try {
          const provider = new ethers.BrowserProvider(window.ethereum!);
          const contract = new ethers.Contract(
            contractAddress,
            EncryptedArtifactVoting__factory.abi,
            provider
          );

          // First check if contract exists
          const code = await provider.getCode(contractAddress);
          if (code === '0x') {
            const errorMsg = `Contract not deployed at address: ${contractAddress}. Please redeploy the contract.`;
            console.error('❌', errorMsg);
            setError(errorMsg);
            setRequests([]);
            setLoading(false);
            return;
          }

          const manualResult = await contract.getAllRequestIds();
          console.log('✅ Manual call result:', manualResult);

          // Handle manual result - might also be a Result object
          if (Array.isArray(manualResult)) {
            requestIds = manualResult;
          } else if (manualResult && manualResult.length !== undefined) {
            requestIds = Array.from(manualResult);
          } else {
            requestIds = [];
          }

        } catch (manualError: any) {
          const errorMsg = `Failed to load transfer requests: ${manualError.message}. This usually means the contract needs to be redeployed.`;
          console.error('❌', errorMsg);
          setError(errorMsg);
          setRequests([]);
          setLoading(false);
          return;
        }
      }


      // Ensure requestIds is actually iterable
      if (!requestIds) {
        console.log('requestIds is null/undefined');
        setRequests([]);
        setLoading(false);
        return;
      }

      // Convert to proper array if needed
      let iterableIds: any[] = [];
      try {
        if (Array.isArray(requestIds)) {
          iterableIds = requestIds;
        } else if (typeof requestIds === 'object' && requestIds !== null &&
                   'length' in requestIds && requestIds.length !== undefined &&
                   typeof requestIds[Symbol.iterator] === 'function') {
          // It's iterable, convert to array
          iterableIds = Array.from(requestIds);
        } else {
          console.error('requestIds is not iterable:', requestIds);
          setRequests([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error processing requestIds:', error);
        setRequests([]);
        setLoading(false);
        return;
      }

      console.log('Using iterableIds:', iterableIds);

      if (iterableIds.length === 0) {
        console.log('No requests found');
        setRequests([]);
        setLoading(false);
        return;
      }

      if (!address) {
        console.log('Skipping loadRequests - wallet not connected');
        return;
      }

      try {
        // Import ethers here to avoid SSR issues
        const { ethers } = await import('ethers');

        // Create a read-only provider
        const provider = new ethers.BrowserProvider(window.ethereum!);
        const contract = new ethers.Contract(
          contractAddress,
          EncryptedArtifactVoting__factory.abi,
          provider
        );

        // Load requests sequentially to avoid overwhelming the development server
        const loadedRequests: (TransferRequest & { canVote: boolean; canDecrypt: boolean })[] = [];
        for (const id of iterableIds) {
          try {
            console.log('Fetching request for id:', id);
            const request = await contract.getTransferRequest(id);
            if (!request) continue;

            // Check voter authorization and voting status sequentially
            const isAuthorized = await contract.isAuthorizedVoter(id, address);
            const hasAlreadyVoted = await contract.hasVoted(id, address);

            const transferRequest: TransferRequest = {
              id: BigInt(request[0]),
              artifactName: request[1] || '',
              description: request[2] || '',
              requester: request[3],
              createdAt: BigInt(request[6]), // createdAt is at index 6
              active: request[7], // active is at index 7
              decrypted: request[8], // decrypted is at index 8
              finalYesCount: BigInt(request[9]), // finalYesCount is at index 9
              finalNoCount: BigInt(request[10]), // finalNoCount is at index 10
              approved: request[11], // approved is at index 11
            };

            // Decrypt encrypted data for display
            let displayName = transferRequest.artifactName;
            let displayDescription = transferRequest.description;

            if (request[3] && request[3].length > 0) {
              // Has encrypted artifact name (index 3), try to decrypt
              try {
                displayName = await decryptBytes(request[3]);
                console.log('Decrypted artifact name:', `"${displayName}"`, 'from:', request[3]);
              } catch (error) {
                console.log('Could not decrypt artifact name:', error, 'using plaintext');
              }
            }

            if (request[4] && request[4].length > 0) {
              // Has encrypted description (index 4), try to decrypt
              try {
                displayDescription = await decryptBytes(request[4]);
                console.log('Decrypted description:', `"${displayDescription}"`, 'from:', request[4]);
              } catch (error) {
                console.log('Could not decrypt description:', error, 'using plaintext');
              }
            }

            transferRequest.artifactName = displayName;
            transferRequest.description = displayDescription;

            loadedRequests.push({
              ...transferRequest,
              canVote: isAuthorized && !hasAlreadyVoted && transferRequest.active && !transferRequest.decrypted,
              canDecrypt: true, // Anyone can always decrypt/view results
            });
          } catch (error) {
            console.error(`Error loading request ${id}:`, error);
            // Continue with other requests even if one fails
          }
        }

        const filteredRequests = loadedRequests.filter(req => req !== null) as (TransferRequest & { canVote: boolean; canDecrypt: boolean })[];
        setRequests(filteredRequests);
      } catch (error: any) {
        console.error('Error loading requests:', error);
        setError(`Failed to load transfer requests: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [allRequestIds, address, contractAddress, refreshTrigger]);

  // Additional effect to force re-render when request data changes
  useEffect(() => {
    if (allRequestIds && allRequestIds.length > 0) {
      // Force a re-render by updating a dummy state
      setRequests(prev => [...prev]);
    }
  }, [allRequestIds]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    // Convert seconds to milliseconds if timestamp is small (likely seconds from blockchain)
    const timestampNum = Number(timestamp);
    const date = timestampNum > 1e10 ? new Date(timestampNum) : new Date(timestampNum * 1000);
    return date.toLocaleDateString();
  };

  // Helper function to decrypt bytes back to string
  const decryptBytes = async (encryptedData: any): Promise<string> => {
    try {
      // Handle different data formats
      let bytes: Uint8Array;

      if (encryptedData instanceof Uint8Array) {
        bytes = encryptedData;
      } else if (typeof encryptedData === 'string' && encryptedData.startsWith('0x')) {
        // Convert hex string to bytes
        const hex = encryptedData.slice(2);
        bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
      } else if (Array.isArray(encryptedData)) {
        bytes = new Uint8Array(encryptedData);
      } else {
        return '';
      }

      // For demo purposes, reverse the simple encryption
      // In a real FHE implementation, this would use FHEVM decryption
      if (bytes.length < 4) {
        return '';
      }

      const dataView = new DataView(bytes.buffer);
      const length = dataView.getUint32(0, true);
      const textBytes = bytes.slice(4, 4 + length);

      const decoder = new TextDecoder();
      return decoder.decode(textBytes);
    } catch (error) {
      console.error('Error decrypting bytes:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="panel-card">
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'rgba(0, 0, 0, 0.9)',
          marginBottom: '16px'
        }}>
          Transfer Requests
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span style={{
            marginLeft: '12px',
            color: 'rgba(0, 0, 0, 0.6)',
            fontSize: '0.875rem'
          }}>Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'rgba(0, 0, 0, 0.9)',
        marginBottom: '24px'
      }}>
        Artifact Transfer Requests
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              color: '#dc2626',
              fontSize: '1.25rem',
              marginRight: '8px'
            }}>⚠️</span>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#dc2626',
              margin: 0
            }}>
              Contract Error
            </h3>
          </div>
          <p style={{
            color: '#991b1b',
            fontSize: '0.875rem',
            margin: 0,
            marginBottom: '12px'
          }}>
            {error}
          </p>
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#374151'
          }}>
            To fix this, run:<br />
            cd artifact-cipher<br />
            node fix-contract.js
          </div>
        </div>
      )}

      {requests.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 0.8)',
            marginBottom: '8px'
          }}>
            No transfer requests found.
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(0, 0, 0, 0.6)',
            margin: 0
          }}>
            Create a new request to get started with artifact transfers.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((request) => (
            <div
              key={request.id}
              className="panel-card"
              style={{ marginBottom: 0 }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'rgba(0, 0, 0, 0.9)',
                    marginBottom: '8px',
                    wordBreak: 'break-word'
                  }}>{request.artifactName}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0, 0, 0, 0.7)',
                    wordBreak: 'break-all'
                  }}>
                    Requested by <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatAddress(request.requester)}</span>
                    <span style={{ marginLeft: '8px' }}>on {formatDate(request.createdAt)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {request.decrypted && (
                    <span className={`badge ${
                      request.approved ? 'badge-success' : 'badge-danger'
                    }`}>
                      {request.approved ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approved
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejected
                        </>
                      )}
                    </span>
                  )}
                  {request.active && !request.decrypted && (
                    <span className="badge badge-warning">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Voting Active
                    </span>
                  )}
                </div>
              </div>

              <p style={{
                color: 'rgba(0, 0, 0, 0.8)',
                marginBottom: '12px',
                lineHeight: 1.6,
                fontSize: '0.875rem'
              }}>{request.description}</p>

              {request.decrypted && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  borderLeft: '3px solid rgba(102, 126, 234, 0.3)'
                }}>
                  <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'rgba(0, 0, 0, 0.8)',
                    marginBottom: '8px'
                  }}>Final Results</h4>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>{request.finalYesCount}</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '0.75rem' }}>Yes Votes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>{request.finalNoCount}</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '0.75rem' }}>No Votes</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                {request.canVote && (
                  <button
                    onClick={() => onVoteRequest(Number(request.id))}
                    className="btn btn-primary flex-1"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="font-medium">Vote</span>
                  </button>
                )}

                {request.canDecrypt && (
                  <button
                    onClick={() => onDecryptRequest(Number(request.id))}
                    className="btn flex-1"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      borderColor: '#8b5cf6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="font-medium">Decrypt Results</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
