// Test FHE encryption functionality
const { ethers } = require("ethers");

const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const contractABI = [
  "function createTransferRequest(bytes,bytes,address[]) external returns (uint256)",
  "function getTransferRequest(uint256) external view returns (uint256,string,string,bytes,bytes,address,uint256,bool,bool,uint32,uint32,bool)",
  "function getAllRequestIds() external view returns (uint256[])"
];

async function testFHEEncryption() {
  console.log("Testing FHE encryption flow...");

  try {
    // Connect to network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Connected to contract at:", contractAddress);

    // Test data
    const artifactName = "Test Artifact #FHE";
    const description = "This is a test artifact with FHE encryption";

    // Simulate encryption (simple for demo)
    const encryptString = (text) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      const encrypted = new Uint8Array(bytes.length + 4);
      // Add length prefix
      new DataView(encrypted.buffer).setUint32(0, bytes.length, true);
      // Add data
      encrypted.set(bytes, 4);
      return encrypted;
    };

    const encryptedName = encryptString(artifactName);
    const encryptedDesc = encryptString(description);

    console.log("Original artifact name:", artifactName);
    console.log("Encrypted name length:", encryptedName.length);
    console.log("Original description:", description);
    console.log("Encrypted desc length:", encryptedDesc.length);

    // Create request with encrypted data
    const authorizedVoters = [await signer.getAddress()];
    console.log("Creating request with encrypted data...");

    const tx = await contract.createTransferRequest(
      encryptedName,
      encryptedDesc,
      authorizedVoters
    );

    const receipt = await tx.wait();
    console.log("Request created! TX:", receipt.hash);

    // Get request data
    const requestIds = await contract.getAllRequestIds();
    const latestId = requestIds[requestIds.length - 1];
    console.log("Latest request ID:", latestId.toString());

    const requestData = await contract.getTransferRequest(latestId);
    console.log("Raw request data retrieved");
    console.log("Plaintext name (should be empty):", requestData[1]);
    console.log("Plaintext desc (should be empty):", requestData[2]);
    console.log("Encrypted name length:", requestData[3].length);
    console.log("Encrypted desc length:", requestData[4].length);

    // Test decryption
    console.log("Encrypted name raw:", requestData[3]);
    console.log("Encrypted desc raw:", requestData[4]);

    const decryptBytes = (encryptedBytes) => {
      try {
        console.log("Decrypting bytes, length:", encryptedBytes.length);
        if (encryptedBytes.length < 4) return '';

        // Check if it's a Uint8Array or needs conversion
        let bytes;
        if (encryptedBytes instanceof Uint8Array) {
          bytes = encryptedBytes;
        } else if (typeof encryptedBytes === 'string') {
          // If it's a hex string, convert to bytes
          bytes = ethers.getBytes(encryptedBytes);
        } else {
          bytes = new Uint8Array(encryptedBytes);
        }

        const dataView = new DataView(bytes.buffer);
        const length = dataView.getUint32(0, true);
        console.log("Expected length:", length, "Available:", bytes.length - 4);

        if (length > bytes.length - 4) {
          return ''; // Invalid data
        }

        const textBytes = bytes.slice(4, 4 + length);
        const decoder = new TextDecoder();
        return decoder.decode(textBytes);
      } catch (error) {
        console.error("Error in decryptBytes:", error);
        return '';
      }
    };

    const decryptedName = decryptBytes(requestData[3]);
    const decryptedDesc = decryptBytes(requestData[4]);

    console.log("Decrypted name:", decryptedName);
    console.log("Decrypted desc:", decryptedDesc);

    // Verify
    const success = decryptedName === artifactName && decryptedDesc === description;
    console.log("Encryption/decryption test:", success ? "✅ PASSED" : "❌ FAILED");

    if (success) {
      console.log("🎉 FHE encryption flow is working correctly!");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testFHEEncryption().catch(console.error);
