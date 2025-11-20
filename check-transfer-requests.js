const { ethers } = require('hardhat');

async function checkTransferRequests() {
  try {
    console.log('🔍 Checking transfer requests in contract...');

    // Connect to localhost network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Contract address
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    console.log('📍 Contract address:', contractAddress);

    // Get contract factory
    const EncryptedArtifactVoting = await ethers.getContractFactory('EncryptedArtifactVoting');
    const contract = EncryptedArtifactVoting.attach(contractAddress).connect(provider);

    // Check all request IDs
    console.log('📋 Getting all request IDs...');
    const requestIds = await contract.getAllRequestIds();
    console.log('✅ All request IDs:', requestIds);
    console.log('📊 Number of requests:', requestIds.length);

    if (requestIds.length === 0) {
      console.log('❌ No transfer requests found in contract!');
      return;
    }

    // Check each request
    for (let i = 0; i < requestIds.length; i++) {
      const requestId = requestIds[i];
      console.log(`\n🔍 Checking request ID: ${requestId}`);

      try {
        const requestData = await contract.getTransferRequest(requestId);
        console.log('📄 Request data:', requestData);

        // Check if request is valid (not default values)
        const isValid = requestData[5] !== '0x0000000000000000000000000000000000000000' &&
                       requestData[6] !== 0n;

        console.log('✅ Request is valid:', isValid);

        if (isValid) {
          console.log('📝 Valid request details:');
          console.log('  - ID:', requestData[0]);
          console.log('  - Artifact Name:', requestData[1] || '(encrypted)');
          console.log('  - Description:', requestData[2] || '(encrypted)');
          console.log('  - Requester:', requestData[5]);
          console.log('  - Created At:', new Date(Number(requestData[6]) * 1000));
          console.log('  - Active:', requestData[7]);
          console.log('  - Decrypted:', requestData[8]);
          console.log('  - Yes Votes:', requestData[9]);
          console.log('  - No Votes:', requestData[10]);
          console.log('  - Approved:', requestData[11]);
        } else {
          console.log('⚠️  Request appears to be empty/default values');
        }

      } catch (error) {
        console.error(`❌ Error getting request ${requestId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTransferRequests();
