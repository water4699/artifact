const { ethers } = require("hardhat");

async function main() {
  console.log("Creating test transfer request...");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);

    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Create a test transfer request
    const artifactName = "New Test Artifact";
    const description = "This is a new test artifact created after refresh fix";
    const authorizedVoters = [signer.address]; // Authorize the signer to vote

    console.log("Creating transfer request...");
    const tx = await contract.createTransferRequest(
      artifactName,
      description,
      authorizedVoters
    );

    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Transfer request created successfully!");

    // Check if it was added
    const requestIds = await contract.getAllRequestIds();
    console.log("All request IDs after creation:", requestIds);

    if (requestIds.length > 0) {
      const request = await contract.getTransferRequest(requestIds[0]);
      console.log("Created request details:", {
        id: request[0].toString(),
        artifactName: request[1],
        description: request[2],
        requester: request[3],
        createdAt: request[4].toString(),
        active: request[5],
        decrypted: request[6],
        finalYesCount: request[7].toString(),
        finalNoCount: request[8].toString(),
        approved: request[9]
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
