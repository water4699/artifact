'use client';

import Image from "next/image";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navigation() {
  return (
    <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative">
          <Image
            src="/artifact-cipher-logo.svg"
            alt="Artifact Cipher Vault Logo"
            width={48}
            height={48}
            className="relative z-10"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-lg"></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Artifact Cipher Vault</h1>
          <p className="text-sm text-gray-300">Encrypted Voting System</p>
        </div>
      </div>
      <ConnectButton />
    </nav>
  );
}
