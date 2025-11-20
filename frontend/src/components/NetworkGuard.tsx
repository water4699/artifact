"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface NetworkGuardProps {
  children: React.ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by waiting for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getNetworkIssues = () => {
    const issues: string[] = [];

    if (!isConnected) {
      issues.push("Wallet not connected");
    }

    if (chainId && ![11155111, 31337].includes(chainId)) {
      issues.push("Unsupported network - please switch to Sepolia or Hardhat");
    }

    return issues;
  };

  const issues = getNetworkIssues();

  // During hydration, show children to prevent mismatch
  // Only show network guard after hydration is complete
  if (!isHydrated || issues.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
      <div className="panel-card max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
            Network Configuration Issue
          </h2>
        </div>

        <div className="space-y-3 mb-6">
          {issues.map((issue, index) => (
            <div key={index} className="info-box">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-900 text-sm font-medium">{issue}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {chainId && ![11155111, 31337].includes(chainId) && (
            <div className="space-y-3">
              <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>Switch to a supported network:</p>
              <button
                onClick={() => switchChain({ chainId: 11155111 })}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                Switch to Sepolia Testnet
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => switchChain({ chainId: 31337 })}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                Switch to Hardhat (Local)
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {issues.includes("Wallet not connected") && (
            <div className="info-box" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.05))',
              borderColor: 'rgba(245, 158, 11, 0.2)'
            }}>
              <p className="text-gray-700 text-sm">
                <strong className="text-yellow-700">Wallet Connection Required:</strong>
                <br />
                <span style={{ color: 'rgba(0, 0, 0, 0.9)' }}>Please connect your MetaMask wallet to continue using the Artifact Cipher Vault.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
