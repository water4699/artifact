const { ethers } = require("hardhat");

async function main() {
  console.log("Testing contract connection...");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    const EncryptedArtifactVoting = await ethers.getContractFactory("EncryptedArtifactVoting");
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    console.log("Contract attached successfully");

    // Test getAllRequestIds
    const requestIds = await contract.getAllRequestIds();
    console.log("All request IDs:", requestIds);
    console.log("Number of requests:", requestIds.length);

    // If there are requests, test getTransferRequest
    for (let i = 0; i < requestIds.length; i++) {
      const request = await contract.getTransferRequest(requestIds[i]);
      console.log(`Request ${i + 1} (ID: ${requestIds[i]}):`, {
        id: request[0].toString(),
        artifactName: request[1],
        description: request[2],
        requester: request[3],
        createdAt: new Date(Number(request[4]) * 1000).toLocaleString(),
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
