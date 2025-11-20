const { ethers } = require("hardhat");

async function main() {
  console.log("🗳️ Testing simpleVote function...\n");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    const [creator] = await ethers.getSigners();
    console.log(`👤 Using creator: ${creator.address}\n`);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Create a test request (simplified)
    console.log("📝 Creating test request...");
    const tx = await contract.createTransferRequest(
      "Simple Voting Test",
      "Testing simpleVote function",
      [creator.address] // Creator can vote on their own request for testing
    );
    const receipt = await tx.wait();
    console.log(`✅ Request created in block ${receipt.blockNumber}\n`);

    // Get request ID
    const requestIds = await contract.getAllRequestIds();
    const requestId = requestIds[requestIds.length - 1];
    console.log(`📋 Request ID: ${requestId}`);

    // Check initial state
    let request = await contract.getTransferRequest(requestId);
    console.log(`📊 Initial state: Yes=${request[7]}, No=${request[8]}\n`);

    // Test simpleVote - vote YES
    console.log("🗳️ Voting YES...");
    await contract.simpleVote(requestId, 1); // 1 = YES
    console.log("✅ Voted YES\n");

    // Check state after vote
    request = await contract.getTransferRequest(requestId);
    console.log(`📊 After YES vote: Yes=${request[7]}, No=${request[8]}\n`);

    // Vote NO
    console.log("🗳️ Voting NO...");
    await contract.simpleVote(requestId, 0); // 0 = NO
    console.log("✅ Voted NO\n");

    // Check final state
    request = await contract.getTransferRequest(requestId);
    console.log(`🏁 Final voting results:`);
    console.log(`   - Yes votes: ${request[7]}`);
    console.log(`   - No votes: ${request[8]}`);
    console.log(`   - Total votes: ${Number(request[7]) + Number(request[8])}`);

    // Test finalizeResults
    console.log("\n🔓 Finalizing results...");
    await contract.finalizeResults(requestId, Number(request[7]), Number(request[8]));

    request = await contract.getTransferRequest(requestId);
    console.log(`📋 Decryption complete:`);
    console.log(`   - Decrypted: ${request[6]}`);
    console.log(`   - Final Yes: ${request[7]}`);
    console.log(`   - Final No: ${request[8]}`);
    console.log(`   - Approved: ${request[9]}\n`);

    console.log("🎉 SIMPLE VOTING TEST COMPLETED!");
    console.log("✅ Real voting data is now available");

  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error);
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:");
  console.error(error);
  process.exitCode = 1;
});
