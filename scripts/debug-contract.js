const { ethers } = require("ethers");

// Contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function debugContract() {
  console.log("Debugging contract data...");

  try {
    // Connect to local network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner();

    // Get contract instance with minimal ABI
    const minimalABI = [
      "function getAllRequestIds() external view returns (uint256[])",
      "function getTransferRequest(uint256) external view returns (bytes)",
    ];

    const contract = new ethers.Contract(contractAddress, minimalABI, signer);

    console.log("Connected to contract at:", contractAddress);

    // Get all request IDs
    const requestIds = await contract.getAllRequestIds();
    console.log("All request IDs:", requestIds.map(id => id.toString()));

    if (requestIds.length > 0) {
      const latestId = requestIds[requestIds.length - 1];
      console.log("Latest request ID:", latestId.toString());

      // Try raw call to see what data we get
      const rawData = await provider.call({
        to: contractAddress,
        data: contract.interface.encodeFunctionData("getTransferRequest", [latestId])
      });

      console.log("Raw response data:", rawData);

      // Try to decode manually
      try {
        const decoded = contract.interface.decodeFunctionResult("getTransferRequest", rawData);
        console.log("Decoded data:", decoded);
      } catch (decodeError) {
        console.log("Decode error:", decodeError.message);
      }
    }

  } catch (error) {
    console.error("Debug failed:", error);
  }
}

debugContract().catch(console.error);
