const { ethers } = require("hardhat");

async function main() {
  console.log("🗳️ Simulating voting process...\n");

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  try {
    const [signer1, signer2, signer3] = await ethers.getSigners();
    console.log(`👥 Using signers:`);
    console.log(`   Signer1: ${signer1.address}`);
    console.log(`   Signer2: ${signer2.address}`);
    console.log(`   Signer3: ${signer3.address}\n`);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Create a test request
    console.log("📝 Creating test request...");
    const tx = await contract.connect(signer1).createTransferRequest(
      "Test Voting Request",
      "This request will be used to test voting and decryption",
      [signer2.address, signer3.address] // Authorized voters
    );
    await tx.wait();
    console.log("✅ Test request created\n");

    // Check request details
    const requestIds = await contract.getAllRequestIds();
    const requestId = requestIds[requestIds.length - 1];
    console.log(`📋 Request ID: ${requestId}`);

    let request = await contract.getTransferRequest(requestId);
    console.log(`   Initial state - Yes: ${request[7]}, No: ${request[8]}, Decrypted: ${request[6]}\n`);

    // Simulate encrypted votes (in reality these would be FHE encrypted)
    // For demo purposes, we'll just submit some dummy encrypted data
    console.log("🗳️ Submitting votes...");

    // Vote 1: Yes (simulated encrypted vote)
    const dummyEncryptedVote1 = ethers.hexlify(ethers.randomBytes(32)); // Random 32 bytes
    const dummyProof1 = ethers.hexlify(ethers.randomBytes(64)); // Random 64 bytes

    try {
      await contract.connect(signer2).submitVote(requestId, dummyEncryptedVote1, dummyProof1);
      console.log("✅ Vote 1 submitted (Yes)");
    } catch (error) {
      console.log("❌ Vote 1 failed (this is expected with dummy data)");
    }

    // Vote 2: No (simulated encrypted vote)
    const dummyEncryptedVote2 = ethers.hexlify(ethers.randomBytes(32));
    const dummyProof2 = ethers.hexlify(ethers.randomBytes(64));

    try {
      await contract.connect(signer3).submitVote(requestId, dummyEncryptedVote2, dummyProof2);
      console.log("✅ Vote 2 submitted (No)");
    } catch (error) {
      console.log("❌ Vote 2 failed (this is expected with dummy data)");
    }

    // Check request after votes (encrypted counts would be updated)
    request = await contract.getTransferRequest(requestId);
    console.log(`\n📊 After votes - Yes: ${request[7]}, No: ${request[8]}, Decrypted: ${request[6]}`);

    // Now finalize results (simulate decryption)
    console.log("\n🔓 Finalizing results (simulating decryption)...");
    const finalYesCount = 1; // We "decrypted" 1 yes vote
    const finalNoCount = 1;  // We "decrypted" 1 no vote

    await contract.finalizeResults(requestId, finalYesCount, finalNoCount);

    // Check final state
    request = await contract.getTransferRequest(requestId);
    console.log(`\n🏁 Final results - Yes: ${request[7]}, No: ${request[8]}, Decrypted: ${request[6]}, Approved: ${request[9]}`);

    console.log("\n✅ Voting simulation completed!");
    console.log("💡 In a real FHE system:");
    console.log("   - Votes would be properly encrypted");
    console.log("   - Contract would accumulate encrypted vote counts");
    console.log("   - Admin would decrypt final tally off-chain");
    console.log("   - finalizeResults would be called with real decrypted values");

  } catch (error) {
    console.error("❌ Simulation failed:");
    console.error(error);
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:");
  console.error(error);
  process.exitCode = 1;
});
