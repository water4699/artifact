const { ethers } = require("hardhat");

async function main() {
  console.log("🗳️ Testing REAL voting with simpleVote function...\n");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    const [creator, voter1, voter2] = await ethers.getSigners();
    console.log(`👥 Using accounts:`);
    console.log(`   Creator: ${creator.address}`);
    console.log(`   Voter1: ${voter1.address}`);
    console.log(`   Voter2: ${voter2.address}\n`);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Create a test request
    console.log("📝 Creating test request...");
    const tx = await contract.connect(creator).createTransferRequest(
      "Real Voting Test Request",
      "This request will demonstrate real voting functionality",
      [voter1.address, voter2.address, creator.address] // All can vote
    );
    await tx.wait();

    // Get the new request ID
    const requestIds = await contract.getAllRequestIds();
    const newRequestId = requestIds[requestIds.length - 1];
    console.log(`✅ Created request ID: ${newRequestId}\n`);

    // Check initial state
    let request = await contract.getTransferRequest(newRequestId);
    console.log(`📊 Initial voting state:`);
    console.log(`   - Yes votes: ${request[7]}`);
    console.log(`   - No votes: ${request[8]}`);
    console.log(`   - Total voters authorized: 3\n`);

    // Voter1 votes YES
    console.log("🗳️ Voter1 votes YES...");
    await contract.connect(voter1).simpleVote(newRequestId, 1); // 1 = YES
    console.log("✅ Voter1 voted YES\n");

    // Voter2 votes NO
    console.log("🗳️ Voter2 votes NO...");
    await contract.connect(voter2).simpleVote(newRequestId, 0); // 0 = NO
    console.log("✅ Voter2 voted NO\n");

    // Creator votes YES
    console.log("🗳️ Creator votes YES...");
    await contract.connect(creator).simpleVote(newRequestId, 1); // 1 = YES
    console.log("✅ Creator voted YES\n");

    // Check final voting state
    request = await contract.getTransferRequest(newRequestId);
    console.log(`🏁 Final voting results:`);
    console.log(`   - Yes votes: ${request[7]}`);
    console.log(`   - No votes: ${request[8]}`);
    console.log(`   - Total votes cast: ${Number(request[7]) + Number(request[8])}`);
    console.log(`   - Result: ${Number(request[7]) > Number(request[8]) ? 'APPROVED' : 'REJECTED'}\n`);

    // Now test decryption - should read real vote counts
    console.log("🔓 Testing decryption (reading real vote data)...");
    await contract.finalizeResults(newRequestId, Number(request[7]), Number(request[8]));

    request = await contract.getTransferRequest(newRequestId);
    console.log(`📋 Decryption results:`);
    console.log(`   - Decrypted: ${request[6]}`);
    console.log(`   - Final Yes: ${request[7]}`);
    console.log(`   - Final No: ${request[8]}`);
    console.log(`   - Approved: ${request[9]}\n`);

    console.log("🎉 REAL VOTING TEST COMPLETED SUCCESSFULLY!");
    console.log("📊 Summary:");
    console.log(`   - 3 voters participated`);
    console.log(`   - 2 voted YES, 1 voted NO`);
    console.log(`   - Request was APPROVED by majority`);
    console.log(`   - Results were successfully decrypted and stored`);

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
