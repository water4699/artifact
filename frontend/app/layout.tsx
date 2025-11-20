import type { Metadata } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import { NetworkGuard } from "../src/components/NetworkGuard";

export const metadata: Metadata = {
  title: "Artifact Cipher Vault",
  description: "Decentralized voting platform for artifact transfer approvals using Fully Homomorphic Encryption (FHE) technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-white" style={{ position: 'relative', zIndex: 1 }}>
        <Providers>
          <div className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
            <header className="glass" style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px'
              }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}>
                      🔒
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      Artifact Cipher
                    </div>
                  </div>
                </div>
                <div style={{
                  borderRadius: '12px',
                  padding: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <ConnectButton
                    showBalance={false}
                    accountStatus="address"
                    chainStatus="icon"
                  />
                </div>
              </div>
            </header>
            <NetworkGuard>
              <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
              </div>
            </NetworkGuard>
          </div>
        </Providers>
      </body>
    </html>
  );
}
