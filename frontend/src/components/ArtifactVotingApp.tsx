'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CreateTransferRequest } from './CreateTransferRequest';
import { TransferRequestList } from './TransferRequestList';
import { VoteOnRequest } from './VoteOnRequest';
import { AdminDecryptResults } from './AdminDecryptResults';
import { NetworkGuard } from './NetworkGuard';

export type ViewMode = 'list' | 'create' | 'vote' | 'decrypt';

export function ArtifactVotingApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isConnected } = useAccount();

  // Prevent hydration mismatch by waiting for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Function to refresh data after creating new requests
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewChange = (mode: ViewMode, requestId?: number) => {
    setViewMode(mode);
    if (requestId !== undefined) {
      setSelectedRequestId(requestId);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRequestId(null);
    // Refresh data when returning to list (e.g., after creating a new request)
    refreshData();
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="panel-card text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p style={{ color: 'rgba(0, 0, 0, 0.7)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Hero section */}
        <section style={{
          padding: '60px 24px 40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'white',
              marginBottom: '16px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              lineHeight: 1.2
            }}>
              Encrypted Artifact Transfer Voting
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '32px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Secure voting system for artifact transfer approvals using Fully Homomorphic Encryption (FHE) technology. Your privacy is protected through advanced cryptographic methods.
            </p>
            <div style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                🔒 FHE Encrypted
              </div>
              <div style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                🗳️ Private Voting
              </div>
              <div style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                🔐 Secure & Transparent
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 60px',
          width: '100%'
        }}>
          <div className="panel-card">
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'rgba(0, 0, 0, 0.8)',
                marginBottom: '16px'
              }}>
                Connect Your Wallet
              </h2>
              <p style={{
                color: 'rgba(0, 0, 0, 0.6)',
                fontSize: '1rem',
                marginBottom: '24px'
              }}>
                Please connect your MetaMask wallet to start participating in secure artifact transfer voting.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div style={{ minHeight: '100vh' }}>
      {/* Hero section */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '16px',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            lineHeight: 1.2
          }}>
            Encrypted Artifact Transfer Voting
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '32px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Secure voting system for artifact transfer approvals using Fully Homomorphic Encryption (FHE) technology.
            Your privacy is protected through advanced cryptographic methods.
          </p>
          

          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              🔒 FHE Encrypted
            </div>
            <div style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              🗳️ Private Voting
            </div>
            <div style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              🔐 Secure & Transparent
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 60px',
        width: '100%'
      }}>
        <div className="animate-fade-in">
          {/* Action Tabs */}
          <div className="panel-card" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleViewChange('list')}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    ...(viewMode === 'list' ? {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    } : {
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'rgba(0, 0, 0, 0.7)'
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  View Requests
                </button>
                <button
                  onClick={() => handleViewChange('create')}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    ...(viewMode === 'create' ? {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                    } : {
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'rgba(0, 0, 0, 0.7)'
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'create') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'create') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  Create Request
                </button>
                <button
                  onClick={() => handleViewChange('decrypt')}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    ...(viewMode === 'decrypt' ? {
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                    } : {
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'rgba(0, 0, 0, 0.7)'
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'decrypt') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'decrypt') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  Decrypt Results
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div>
            {viewMode === 'list' && (
              <TransferRequestList
                refreshTrigger={refreshKey}
                onVoteRequest={(requestId) => handleViewChange('vote', requestId)}
                onDecryptRequest={(requestId) => handleViewChange('decrypt', requestId)}
              />
            )}

            {viewMode === 'create' && (
              <CreateTransferRequest onBack={handleBackToList} onSuccess={refreshData} />
            )}

            {viewMode === 'vote' && selectedRequestId && (
              <VoteOnRequest
                requestId={selectedRequestId}
                onBack={handleBackToList}
              />
            )}

            {viewMode === 'decrypt' && selectedRequestId && (
              <AdminDecryptResults
                requestId={selectedRequestId}
                onBack={handleBackToList}
              />
            )}
          </div>
        </div>
      </main>
      </div>
    </NetworkGuard>
  );
}
