const { ethers } = require("ethers");

// Contract address and ABI
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = [
  "function getAllRequestIds() external view returns (uint256[])",
  "function getTransferRequest(uint256 requestId) external view returns (tuple(uint256,string,string,address,uint256,bool,bool,uint32,uint32,bool))",
  "function simpleVote(uint256 requestId, uint8 vote) external",
  "function finalizeResults(uint256 requestId, uint32 finalYesCount, uint32 finalNoCount) external",
  "function getEncryptedVoteCounts(uint256 requestId) external view returns (uint256, uint256, uint256)"
];

async function testVotingFlow() {
  console.log("Testing voting and decryption flow...");

  try {
    // Connect to local network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Connected to contract at:", contractAddress);

    // Get all request IDs
    const requestIds = await contract.getAllRequestIds();
    console.log("All request IDs:", requestIds.map(id => id.toString()));

    if (requestIds.length === 0) {
      console.log("No requests found. Please create a request first.");
      return;
    }

    // Get the latest request
    const latestRequestId = requestIds[requestIds.length - 1];
    console.log("Testing with latest request ID:", latestRequestId.toString());

    // Get request details before voting
    const requestBefore = await contract.getTransferRequest(latestRequestId);
    console.log("Request details before voting:", {
      id: requestBefore[0].toString(),
      artifactName: requestBefore[1],
      description: requestBefore[2],
      finalYesCount: requestBefore[7].toString(),
      finalNoCount: requestBefore[8].toString(),
      decrypted: requestBefore[6]
    });

    // Cast some votes using simpleVote
    console.log("Casting votes...");

    // Vote Yes
    try {
      const tx1 = await contract.simpleVote(latestRequestId, 1);
      await tx1.wait();
      console.log("✅ Voted YES");
    } catch (error) {
      console.log("❌ Failed to vote YES:", error.message);
    }

    // Vote No
    try {
      // Use a different signer for second vote
      const signers = await ethers.getSigners();
      if (signers.length > 1) {
        const contractWithSigner2 = contract.connect(signers[1]);
        const tx2 = await contractWithSigner2.simpleVote(latestRequestId, 0);
        await tx2.wait();
        console.log("✅ Voted NO with second signer");
      }
    } catch (error) {
      console.log("❌ Failed to vote NO:", error.message);
    }

    // Get request details after voting
    const requestAfter = await contract.getTransferRequest(latestRequestId);
    console.log("Request details after voting:", {
      id: requestAfter[0].toString(),
      artifactName: requestAfter[1],
      description: requestAfter[2],
      finalYesCount: requestAfter[7].toString(),
      finalNoCount: requestAfter[8].toString(),
      decrypted: requestAfter[6]
    });

    // Test decryption (finalize results)
    console.log("Testing decryption...");
    try {
      const yesVotes = parseInt(requestAfter[7].toString());
      const noVotes = parseInt(requestAfter[8].toString());

      if (yesVotes > 0 || noVotes > 0) {
        const tx3 = await contract.finalizeResults(latestRequestId, yesVotes, noVotes);
        await tx3.wait();
        console.log("✅ Results finalized");
      } else {
        console.log("❌ No votes to finalize");
      }
    } catch (error) {
      console.log("❌ Failed to finalize results:", error.message);
    }

    // Get final request details
    const requestFinal = await contract.getTransferRequest(latestRequestId);
    console.log("Final request details:", {
      id: requestFinal[0].toString(),
      artifactName: requestFinal[1],
      description: requestFinal[2],
      finalYesCount: requestFinal[7].toString(),
      finalNoCount: requestFinal[8].toString(),
      decrypted: requestFinal[6],
      approved: requestFinal[9]
    });

    console.log("✅ Voting flow test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testVotingFlow().catch(console.error);
