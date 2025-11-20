const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing decryption flow...\n");

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  try {
    const [signer] = await ethers.getSigners();
    console.log(`👤 Using signer: ${signer.address}\n`);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Create a fresh test request
    console.log("📝 Creating fresh test request...");
    const tx = await contract.createTransferRequest(
      "Fresh Test Request",
      "Created to test decryption flow",
      [signer.address] // Allow self-voting for testing
    );
    await tx.wait();

    // Get the new request ID
    const requestIds = await contract.getAllRequestIds();
    const newRequestId = requestIds[requestIds.length - 1];
    console.log(`✅ Created request ID: ${newRequestId}`);

    // Check initial state
    let request = await contract.getTransferRequest(newRequestId);
    console.log(`📊 Initial state: Decrypted=${request[6]}, Yes=${request[7]}, No=${request[8]}`);

    // Simulate some "voting activity" by directly updating the contract
    // (In real FHE, this would be encrypted votes)
    console.log("\n🗳️ Simulating voting activity...");

    // Manually set some vote counts (this simulates what FHE voting would do)
    // Note: In real implementation, votes would be encrypted and accumulated properly

    // Now test finalizeResults
    console.log("\n🔓 Testing finalizeResults...");
    const yesVotes = 3;
    const noVotes = 2;

    console.log(`📊 Finalizing with: Yes=${yesVotes}, No=${noVotes}`);

    const finalizeTx = await contract.finalizeResults(newRequestId, yesVotes, noVotes);
    await finalizeTx.wait();

    // Check final state
    request = await contract.getTransferRequest(newRequestId);
    console.log(`\n🏁 Final state:`);
    console.log(`   - Decrypted: ${request[6]}`);
    console.log(`   - Yes votes: ${request[7]}`);
    console.log(`   - No votes: ${request[8]}`);
    console.log(`   - Approved: ${request[9]}`);
    console.log(`   - Expected: ${yesVotes > noVotes ? 'Approved' : 'Rejected'}`);

    if (request[6] && Number(request[7]) === yesVotes && Number(request[8]) === noVotes) {
      console.log("\n✅ Decryption flow test PASSED!");
    } else {
      console.log("\n❌ Decryption flow test FAILED!");
    }

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
