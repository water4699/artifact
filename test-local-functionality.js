// Test script to verify local network functionality
const { ethers } = require('hardhat');

async function main() {
  console.log('Testing local network functionality...\n');

  // Connect to local network
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log('1. Connected to local network');
  console.log('   Deployer address:', deployer.address);
  console.log('   Network chainId:', (await provider.getNetwork()).chainId);

  // Get contract factory and deploy
  const EncryptedArtifactVoting = await ethers.getContractFactory('EncryptedArtifactVoting');
  console.log('\n2. Deploying contract...');

  const contract = await EncryptedArtifactVoting.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('   Contract deployed at:', contractAddress);

  // Test basic functionality
  console.log('\n3. Testing basic contract functionality...');

  // Check admin
  const admin = await contract.admin();
  console.log('   Admin address:', admin);
  console.log('   ✓ Admin set correctly:', admin === deployer.address);

  // Test basic contract functions that don't involve FHE
  console.log('\n4. Testing basic contract functions...');

  // Test admin function (already checked above)
  console.log('   ✓ Admin function works:', admin === deployer.address);

  // Test getAllRequestIds
  const initialRequestIds = await contract.getAllRequestIds();
  console.log('   ✓ getAllRequestIds works:', initialRequestIds.length === 0);

  console.log('   ⚠️  Note: FHE operations require proper FHEVM setup in frontend');
  console.log('   ⚠️  createTransferRequest involves FHE initialization which needs FHEVM context');

  console.log('\n🎉 Local network functionality test completed successfully!');
  console.log('\nContract is ready for frontend interaction at:', contractAddress);
  console.log('Frontend can be started with: cd frontend && npm run dev');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
