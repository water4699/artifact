const { ethers } = require('hardhat');

async function main() {
  try {
    // Connect to localhost network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Check contract address
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    console.log('Checking contract at:', contractAddress);

    // Get contract factory
    const EncryptedArtifactVoting = await ethers.getContractFactory('EncryptedArtifactVoting');
    const contract = EncryptedArtifactVoting.attach(contractAddress).connect(provider);

    // Try to call getAllRequestIds
    console.log('Calling getAllRequestIds...');
    const requestIds = await contract.getAllRequestIds();
    console.log('✅ getAllRequestIds returned:', requestIds);
    console.log('Number of requests:', requestIds.length);

    // If there are requests, get details of the first one
    if (requestIds.length > 0) {
      console.log('Getting details for request ID:', requestIds[0]);
      const requestData = await contract.getTransferRequest(requestIds[0]);
      console.log('Request data:', requestData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);
