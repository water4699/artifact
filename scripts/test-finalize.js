const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing finalizeResults function...\n");

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  try {
    const [signer] = await ethers.getSigners();
    console.log(`👤 Using signer: ${signer.address}\n`);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Check current state
    const requestIds = await contract.getAllRequestIds();
    console.log(`📊 Current requests: ${requestIds.length}`);

    if (requestIds.length > 0) {
      // Test finalizeResults on request ID 2
      const requestId = 2;
      const yesVotes = 1;
      const noVotes = 4;

      console.log(`🎯 Testing finalizeResults(${requestId}, ${yesVotes}, ${noVotes})`);

      try {
        const tx = await contract.finalizeResults(requestId, yesVotes, noVotes);
        console.log(`✅ Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Check final state
        const request = await contract.getTransferRequest(requestId);
        console.log(`📋 Final request state:`);
        console.log(`   - Decrypted: ${request[6]}`);
        console.log(`   - Yes votes: ${request[7]}`);
        console.log(`   - No votes: ${request[8]}`);
        console.log(`   - Approved: ${request[9]}`);

      } catch (error) {
        console.error(`❌ finalizeResults failed:`);
        console.error(`   Error: ${error.message}`);

        // Check if it's already decrypted
        if (requestIds.includes(BigInt(requestId))) {
          const request = await contract.getTransferRequest(requestId);
          if (request[6]) { // decrypted
            console.log(`ℹ️  Request ${requestId} is already decrypted`);
          }
        }
      }
    } else {
      console.log("ℹ️  No requests to test with");
    }

  } catch (error) {
    console.error("❌ Script execution failed:");
    console.error(error);
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:");
  console.error(error);
  process.exitCode = 1;
});
