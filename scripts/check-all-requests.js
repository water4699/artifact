const hre = require('hardhat');

async function main() {
  try {
    console.log('🔍 Checking all transfer requests...');

    const contractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
    console.log('📍 Contract address:', contractAddress);

    const EncryptedArtifactVoting = await hre.ethers.getContractFactory('EncryptedArtifactVoting');
    const contract = EncryptedArtifactVoting.attach(contractAddress);

    // Get all request IDs
    console.log('📋 Getting all request IDs...');
    const requestIds = await contract.getAllRequestIds();
    console.log('✅ All request IDs:', requestIds);
    console.log('📊 Number of requests:', requestIds.length);

    // Check each request
    for (let i = 0; i < requestIds.length; i++) {
      const requestId = requestIds[i];
      console.log(`\n🔍 ===== Request ID: ${requestId} =====`);

      try {
        const requestData = await contract.getTransferRequest(requestId);
        console.log('📄 Full request data:', requestData);

        const isValid = requestData[5] !== '0x0000000000000000000000000000000000000000' &&
                       requestData[6] !== 0n;

        if (isValid) {
          console.log('📝 Request details:');
          console.log('  - ID:', requestData[0]);
          console.log('  - Artifact Name (encrypted):', requestData[1] || 'empty');
          console.log('  - Description (encrypted):', requestData[2] || 'empty');
          console.log('  - Encrypted Artifact Name:', requestData[3]);
          console.log('  - Encrypted Description:', requestData[4]);
          console.log('  - Requester:', requestData[5]);
          console.log('  - Created At:', new Date(Number(requestData[6]) * 1000));
          console.log('  - Active:', requestData[7]);
          console.log('  - Decrypted:', requestData[8]);
          console.log('  - Yes Votes:', requestData[9]);
          console.log('  - No Votes:', requestData[10]);
          console.log('  - Approved:', requestData[11]);

          // Check if there are any votes
          const hasVotes = Number(requestData[9]) > 0 || Number(requestData[10]) > 0;
          console.log('  - Has Votes:', hasVotes);
          console.log('  - Total Votes:', Number(requestData[9]) + Number(requestData[10]));

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

main();
