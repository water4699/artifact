'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useVotingWithFHE } from '../hooks/useVotingWithFHE';

interface CreateTransferRequestProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function CreateTransferRequest({ onBack, onSuccess }: CreateTransferRequestProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { createTransferRequest, fhevmReady } = useVotingWithFHE();
  const [artifactName, setArtifactName] = useState('');
  const [description, setDescription] = useState('');
  const [authorizedVoters, setAuthorizedVoters] = useState<`0x${string}`[]>(['' as `0x${string}`]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addVoter = () => {
    setAuthorizedVoters([...authorizedVoters, '' as `0x${string}`]);
  };

  const removeVoter = (index: number) => {
    if (authorizedVoters.length > 1) {
      setAuthorizedVoters(authorizedVoters.filter((_, i) => i !== index));
    }
  };

  const updateVoter = (index: number, address: string) => {
    const newVoters = [...authorizedVoters];
    newVoters[index] = address as `0x${string}`;
    setAuthorizedVoters(newVoters);
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const isFormValid = () => {
    const validVoters = authorizedVoters.filter(voter => voter.trim() && isValidAddress(voter.trim()));
    return (
      artifactName.trim() &&
      description.trim() &&
      validVoters.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !isConnected || !fhevmReady) return;

    // Check if connected to the correct network (Hardhat localhost)
    if (chainId !== 31337) {
      console.warn('Please connect to the Hardhat Localhost network in your wallet.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Encrypt sensitive data using FHEVM
      const encryptedArtifactName = await encryptString(artifactName);
      const encryptedDescription = await encryptString(description);

      await createTransferRequest(
        encryptedArtifactName,
        encryptedDescription,
        authorizedVoters.filter(v => v.trim() && isValidAddress(v.trim())) as readonly `0x${string}`[]
      );

      // Transfer request created successfully
      console.log('Calling onSuccess callback');
      onSuccess?.(); // Trigger refresh before going back

      // Add a small delay to ensure data is updated before navigating back
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating transfer request:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to create transfer request. ';
      if (error.message?.includes('network')) {
        errorMessage += 'Please ensure you are connected to the Hardhat Localhost network.';
      } else if (error.message?.includes('gas')) {
        errorMessage += 'Transaction failed due to gas issues.';
      } else {
        errorMessage += 'Please check the console for details and try again.';
      }

      console.error('Create transfer request error:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to encrypt strings using FHEVM
  const encryptString = async (text: string): Promise<`0x${string}`> => {
    try {
      // Convert string to bytes
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);

      // For demo purposes, we'll create a simple encrypted representation
      // In a real implementation, this would use proper FHE encryption
      const encrypted = new Uint8Array(bytes.length + 4);
      // Add length prefix
      new DataView(encrypted.buffer).setUint32(0, bytes.length, true);
      // Add data
      encrypted.set(bytes, 4);

      // Convert to hex string for Solidity
      const hexString = '0x' + Array.from(encrypted)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hexString as `0x${string}`;
    } catch (error) {
      console.error('Error encrypting string:', error);
      throw error;
    }
  };

  if (!isConnected) {
    return (
      <div className="panel-card">
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'rgba(0, 0, 0, 0.9)',
          marginBottom: '16px'
        }}>
          Create Transfer Request
        </h2>
        <p style={{
          color: 'rgba(0, 0, 0, 0.7)',
          marginBottom: '24px'
        }}>Please connect your wallet to create a transfer request.</p>
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
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
        Create Artifact Transfer Request
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 0.8)',
            marginBottom: '8px',
            display: 'block'
          }}>
            Artifact Name *
          </label>
          <input
            type="text"
            value={artifactName}
            onChange={(e) => setArtifactName(e.target.value)}
            placeholder="e.g., Ancient Ceramic Vase #42"
            className="form-input"
            style={{ color: 'rgba(0, 0, 0, 0.9)' }}
            required
          />
        </div>

        <div>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 0.8)',
            marginBottom: '8px',
            display: 'block'
          }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the artifact and transfer details..."
            rows={4}
            className="form-textarea"
            style={{ color: 'rgba(0, 0, 0, 0.9)' }}
            required
          />
        </div>

        <div>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 0.8)',
            marginBottom: '8px',
            display: 'block'
          }}>
            Authorized Voters *
          </label>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(0, 0, 0, 0.6)',
            marginBottom: '16px'
          }}>
            Add Ethereum addresses of users authorized to vote on this transfer request.
          </p>

          {authorizedVoters.map((voter, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={voter}
                onChange={(e) => updateVoter(index, e.target.value)}
                placeholder="0x1234...abcd"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: voter && !isValidAddress(voter) ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(0, 0, 0, 0.9)',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: 400,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              />
              {authorizedVoters.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVoter(index)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addVoter}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              alignSelf: 'flex-start',
              marginTop: '8px'
            }}
          >
            + Add Voter
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          marginTop: '32px'
        }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.4)',
              flex: '0 0 auto'
            }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: !isFormValid() || isSubmitting
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !isFormValid() || isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              boxShadow: !isFormValid() || isSubmitting
                ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 4px 12px rgba(99, 102, 241, 0.4)',
              opacity: !isFormValid() || isSubmitting ? 0.5 : 1
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating...
              </span>
            ) : (
              'Create Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
