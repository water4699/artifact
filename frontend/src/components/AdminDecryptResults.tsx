'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { TransferRequest } from '../hooks/useArtifactVoting';
import { useArtifactVoting } from '../hooks/useArtifactVoting';
import { EncryptedArtifactVoting__factory } from '../../../types';
import { getContractAddress } from '../config/contracts';
import { ethers } from 'ethers';

interface AdminDecryptResultsProps {
  requestId: number;
  onBack: () => void;
}

interface RequestDetails extends TransferRequest {
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

export function AdminDecryptResults({ requestId, onBack }: AdminDecryptResultsProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { decryptResults } = useArtifactVoting();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [results, setResults] = useState<{yesVotes: number; noVotes: number; approved: boolean} | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [decrypted, setDecrypted] = useState(false);

  const contractAddress = getContractAddress(31337); // Use localhost for now

  // Get request details directly from contract
  const { data: requestData, refetch: refetchRequestData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedArtifactVoting__factory.abi,
    functionName: 'getTransferRequest',
    args: [BigInt(requestId)],
    query: {
      enabled: !!contractAddress && requestId !== null,
    },
  });

  useEffect(() => {
    if (requestData && Array.isArray(requestData)) {
      try {
        let artifactName = requestData[1] || '';
        let description = requestData[2] || '';

        // Try to decrypt encrypted data
        if (requestData[10] && requestData[10].length > 0) {
          try {
            artifactName = decryptBytes(requestData[10]);
          } catch {
            console.log('Could not decrypt artifact name, using available data');
          }
        }

        if (requestData[11] && requestData[11].length > 0) {
          try {
            description = decryptBytes(requestData[11]);
          } catch {
            console.log('Could not decrypt description, using available data');
          }
        }

        const request: TransferRequest = {
          id: requestData[0],
          artifactName: artifactName,
          description: description,
          requester: requestData[5],        // 索引5: requester
          createdAt: requestData[6],        // 索引6: createdAt
          active: requestData[7],           // 索引7: active
          decrypted: requestData[8],        // 索引8: decrypted
          finalYesCount: BigInt(requestData[9]),  // 索引9: finalYesCount
          finalNoCount: BigInt(requestData[10]), // 索引10: finalNoCount
          approved: requestData[11],        // 索引11: approved
        };
        setRequestDetails(request);

        // If already decrypted, show results immediately
        if (request.decrypted) {
          setResults({
            yesVotes: Number(request.finalYesCount),
            noVotes: Number(request.finalNoCount),
            approved: request.approved
          });
          setDecrypted(true);
        }
      } catch (error) {
        console.error('Error parsing request data:', error);
      }
    }
  }, [requestData, requestId]);

  // Helper function to decrypt bytes back to string
  const decryptBytes = (encryptedData: any): string => {
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

  const handleDecrypt = async () => {
    if (!isConnected || !requestDetails) return;

    setIsDecrypting(true);
    try {
      // 如果已经在当前会话中显示过结果，跳过
      if (decrypted) {
        console.log('Results already displayed in current session, skipping');
        return;
      }

      // 如果合约中已经标记为已解密，直接显示结果
      if (requestDetails.decrypted) {
        console.log('Request already decrypted in contract, displaying results');
        const yesVotes = Number(requestDetails.finalYesCount);
        const noVotes = Number(requestDetails.finalNoCount);
        const approved = yesVotes > noVotes;
        setResults({
          yesVotes,
          noVotes,
          approved
        });
        setDecrypted(true);
        console.log('Results were already decrypted:', { yesVotes, noVotes, approved });
        return;
      }

      // 调用真正的FHE解密函数，这会触发MetaMask弹窗
      console.log('Starting FHE decryption for request:', requestId);
      const txHash = await decryptResults(requestId);

      // 等待交易确认
      console.log('Transaction hash:', txHash);
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const receipt = await provider.waitForTransaction(txHash);
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // 解析事件日志获取解密结果
      const events = receipt.logs.map(log => {
        try {
          return EncryptedArtifactVoting__factory.createInterface().parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const decryptEvent = events.find(event => event?.name === 'ResultsDecrypted');
      if (decryptEvent) {
        const { yesVotes, noVotes, approved } = decryptEvent.args;
        console.log('Decryption result from event:', { yesVotes, noVotes, approved });

        // 显示结果
        setResults({
          yesVotes: Number(yesVotes),
          noVotes: Number(noVotes),
          approved
        });
        setDecrypted(true);

        console.log('Results decrypted successfully:', { yesVotes, noVotes, approved });

        // Refetch the request data to update the UI
        await refetchRequestData();
      } else {
        // 如果没有找到事件，从合约重新读取数据
        console.log('No decrypt event found, refetching data...');

        // 重新获取请求详情以显示解密结果
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum!);
        const contract = new ethers.Contract(
          getContractAddress(chainId || 31337),
          EncryptedArtifactVoting__factory.abi,
          provider
        );

        const updatedRequest = await contract.getTransferRequest(requestId);
        const yesVotes = Number(updatedRequest[9]);
        const noVotes = Number(updatedRequest[10]);
        const approved = updatedRequest[11];

        setResults({
          yesVotes,
          noVotes,
          approved
        });
        setDecrypted(true);

        console.log('Results decrypted successfully:', { yesVotes, noVotes, approved });

        // Refetch the request data to update the UI
        await refetchRequestData();
      }

    } catch (error) {
      console.error('Error decrypting results:', error);
      console.error('Error details:', error);
      console.error('Failed to decrypt results:', error);
    } finally {
      setIsDecrypting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="panel-card">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
          Decrypt Voting Results
        </h2>
        <p className="text-gray-700 mb-6">Please connect your wallet to decrypt voting results.</p>
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
      </div>
    );
  }

  if (!requestDetails) {
    return (
      <div className="panel-card">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
          Decrypt Voting Results
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-700">Loading request details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
        Decrypt Voting Results - Request #{requestId}
      </h2>

      <div className="info-box mb-6">
        <h3 className="text-xl font-bold mb-3" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>{requestDetails.artifactName}</h3>
        <p className="mb-4 leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>{requestDetails.description}</p>
        <div className="text-sm space-y-1" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
          <div>Requested by: <span className="font-mono">{requestDetails.requester.slice(0, 6)}...{requestDetails.requester.slice(-4)}</span></div>
          <div>Created: {(() => {
            const timestampNum = Number(requestDetails.createdAt);
            const date = timestampNum > 1e10 ? new Date(timestampNum) : new Date(timestampNum * 1000);
            return date.toLocaleDateString();
          })()}</div>
        </div>
      </div>

      {!decrypted ? (
        <div className="text-center py-8">
          <div className="info-box mb-6" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.05))',
            borderColor: 'rgba(245, 158, 11, 0.2)'
          }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-lg" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
              <span className="text-2xl">🔐</span> Encrypted Results
            </h3>
            <p className="mb-4" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
              The voting results are currently encrypted. Anyone can decrypt and reveal the final outcome.
            </p>
            <div className="text-sm text-left space-y-1" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
              <div>• Votes were computed homomorphically on-chain</div>
              <div>• Individual votes remain private</div>
              <div>• Final tally is encrypted until decryption</div>
            </div>
          </div>

          <button
            onClick={handleDecrypt}
            disabled={isDecrypting}
            className="btn"
            style={{
              background: isDecrypting ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderColor: isDecrypting ? '#6b7280' : '#8b5cf6',
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.125rem'
            }}
          >
            {isDecrypting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Decrypting Results...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-xl">🔓</span> Decrypt Results
              </span>
            )}
          </button>
        </div>
      ) : results ? (
        <div className="text-center py-8">
          <div className={`panel-card mb-6 ${
            results.approved
              ? 'border-green-500'
              : 'border-red-500'
          }`} style={{
            borderWidth: '2px',
            background: results.approved 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
          }}>
            <h3 className={`text-3xl font-bold mb-6`} style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
              {results.approved ? '✅ Transfer Approved' : '❌ Transfer Rejected'}
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="text-4xl font-bold mb-2" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>{results.yesVotes}</div>
                <div className="text-sm font-semibold" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>Yes Votes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="text-4xl font-bold mb-2" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>{results.noVotes}</div>
                <div className="text-sm font-semibold" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>No Votes</div>
              </div>
            </div>

            <div className="text-sm font-medium" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
              Decision: {results.yesVotes > results.noVotes ? 'Approved by majority vote' : 'Rejected by majority vote'}
            </div>
          </div>

          <div className="info-box">
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
              <span className="text-xl">📊</span> Voting Summary
            </h4>
            <div className="text-sm space-y-2 text-left" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
              <div><strong>Total Votes Cast:</strong> {results.yesVotes + results.noVotes}</div>
              <div><strong>Approval Threshold:</strong> Majority (50% + 1)</div>
              <div><strong>Result:</strong> {results.approved ? 'Transfer Approved' : 'Transfer Rejected'}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-center mt-6">
        <button onClick={onBack} className="btn btn-secondary">
          Back to Requests
        </button>
      </div>
    </div>
  );
}
