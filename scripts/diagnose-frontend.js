const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Diagnosing frontend-contract synchronization...\n");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    console.log("✅ Contract connection successful");
    console.log(`📄 Contract address: ${contractAddress}\n`);

    // Check contract state
    const requestIds = await contract.getAllRequestIds();
    console.log("📊 Contract state:");
    console.log(`   - Total requests: ${requestIds.length}`);

    if (requestIds.length > 0) {
      console.log(`   - Request IDs: [${requestIds.join(', ')}]`);

      for (let i = 0; i < requestIds.length; i++) {
        const requestId = requestIds[i];
        try {
          const request = await contract.getTransferRequest(requestId);
          console.log(`\n   📋 Request ${requestId}:`);
          console.log(`      - Artifact: ${request[1]}`);
          console.log(`      - Active: ${request[5]}`);
          console.log(`      - Decrypted: ${request[6]}`);
          console.log(`      - Yes votes: ${request[7]}`);
          console.log(`      - No votes: ${request[8]}`);
          console.log(`      - Approved: ${request[9]}`);
        } catch (error) {
          console.log(`   ❌ Error reading request ${requestId}: ${error.message}`);
        }
      }
    } else {
      console.log("   ℹ️  No requests found in contract");
      console.log("\n💡 Suggestions:");
      console.log("   1. Make sure you're connected to the correct network in MetaMask");
      console.log("   2. Verify the contract address in frontend config matches");
      console.log("   3. Try creating a new transfer request first");
      console.log("   4. Hard refresh the browser (Ctrl+F5) to clear cache");
    }

  } catch (error) {
    console.error("❌ Contract connection failed:");
    console.error(`   Error: ${error.message}`);

    if (error.message.includes("call revert exception")) {
      console.log("\n💡 This might be a network connectivity issue");
    }
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:");
  console.error(error);
  process.exitCode = 1;
});
