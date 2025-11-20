import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedArtifactVoting } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("EncryptedArtifactVotingSepolia", function () {
  let signers: Signers;
  let encryptedArtifactVotingContract: EncryptedArtifactVoting;
  let encryptedArtifactVotingContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EncryptedArtifactVotingDeployment = await deployments.get("EncryptedArtifactVoting");
      encryptedArtifactVotingContractAddress = EncryptedArtifactVotingDeployment.address;
      encryptedArtifactVotingContract = await ethers.getContractAt("EncryptedArtifactVoting", EncryptedArtifactVotingDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0], bob: ethSigners[1] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create transfer request and handle encrypted voting", async function () {
    steps = 12;
    this.timeout(4 * 60000); // 4 minutes timeout

    // Check initial state
    progress("Checking initial contract state...");
    const initialRequestIds = await encryptedArtifactVotingContract.getAllRequestIds();
    progress(`Initial request count: ${initialRequestIds.length}`);

    // Create a transfer request
    progress("Creating transfer request...");
    const createTx = await encryptedArtifactVotingContract.createTransferRequest(
      "Sepolia Test Artifact - Ancient Scroll",
      "Testing encrypted voting on Sepolia testnet for artifact transfer approval",
      [signers.alice.address, signers.bob.address]
    );
    await createTx.wait();

    progress("Transfer request created, getting request details...");
    const requestIds = await encryptedArtifactVotingContract.getAllRequestIds();
    expect(requestIds.length).to.be.greaterThan(0);
    const requestId = requestIds[requestIds.length - 1];

    const request = await encryptedArtifactVotingContract.getTransferRequest(requestId);
    expect(request.active).to.be.true;
    expect(request.decrypted).to.be.false;

    // Alice submits encrypted vote (yes = 1)
    progress("Alice encrypting and submitting vote...");
    const encryptedVoteAlice = await fhevm
      .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
      .add8(1)
      .encrypt();

    progress(`Alice submitting vote with handle: ${ethers.hexlify(encryptedVoteAlice.handles[0])}`);
    let tx = await encryptedArtifactVotingContract
      .connect(signers.alice)
      .submitVote(requestId, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);
    await tx.wait();

    // Bob submits encrypted vote (no = 0)
    progress("Bob encrypting and submitting vote...");
    const encryptedVoteBob = await fhevm
      .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.bob.address)
      .add8(0)
      .encrypt();

    progress(`Bob submitting vote with handle: ${ethers.hexlify(encryptedVoteBob.handles[0])}`);
    tx = await encryptedArtifactVotingContract
      .connect(signers.bob)
      .submitVote(requestId, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);
    await tx.wait();

    // Verify votes were submitted
    progress("Verifying votes were recorded...");
    expect(await encryptedArtifactVotingContract.hasVoted(requestId, signers.alice.address)).to.be.true;
    expect(await encryptedArtifactVotingContract.hasVoted(requestId, signers.bob.address)).to.be.true;

    // Get encrypted vote counts (admin only)
    progress("Retrieving encrypted vote counts...");
    const encryptedCounts = await encryptedArtifactVotingContract.getEncryptedVoteCounts(requestId);
    expect(encryptedCounts.yesVotes).to.not.equal(ethers.ZeroHash);
    expect(encryptedCounts.noVotes).to.not.equal(ethers.ZeroHash);
    expect(encryptedCounts.totalVotes).to.not.equal(ethers.ZeroHash);

    // Decrypt vote counts (in real scenario, this would be done by admin off-chain)
    progress(`Decrypting yes votes: ${encryptedCounts.yesVotes}`);
    const yesVotes = await fhevm.userDecryptEuint8(
      FhevmType.euint8,
      encryptedCounts.yesVotes,
      encryptedArtifactVotingContractAddress,
      signers.alice, // Alice can decrypt since she has permission
    );
    progress(`Decrypted yes votes: ${yesVotes}`);

    progress(`Decrypting no votes: ${encryptedCounts.noVotes}`);
    const noVotes = await fhevm.userDecryptEuint8(
      FhevmType.euint8,
      encryptedCounts.noVotes,
      encryptedArtifactVotingContractAddress,
      signers.alice,
    );
    progress(`Decrypted no votes: ${noVotes}`);

    progress(`Decrypting total votes: ${encryptedCounts.totalVotes}`);
    const totalVotes = await fhevm.userDecryptEuint8(
      FhevmType.euint8,
      encryptedCounts.totalVotes,
      encryptedArtifactVotingContractAddress,
      signers.alice,
    );
    progress(`Decrypted total votes: ${totalVotes}`);

    // Verify decrypted counts
    expect(yesVotes).to.equal(1); // Alice voted yes
    expect(noVotes).to.equal(1);  // Bob voted no
    expect(totalVotes).to.equal(2); // Total votes

    // Finalize results on-chain
    progress("Finalizing results on-chain...");
    tx = await encryptedArtifactVotingContract.finalizeResults(requestId, yesVotes, noVotes);
    await tx.wait();

    // Verify final results
    progress("Verifying final results...");
    const finalRequest = await encryptedArtifactVotingContract.getTransferRequest(requestId);
    expect(finalRequest.decrypted).to.be.true;
    expect(finalRequest.finalYesCount).to.equal(yesVotes);
    expect(finalRequest.finalNoCount).to.equal(noVotes);
    expect(finalRequest.approved).to.equal(yesVotes > noVotes);

    progress(`Voting completed! Result: ${finalRequest.approved ? 'APPROVED' : 'REJECTED'} (${yesVotes} yes, ${noVotes} no)`);
  });

  it("should handle multiple transfer requests", async function () {
    steps = 8;
    this.timeout(4 * 60000);

    // Create first request
    progress("Creating first transfer request...");
    let tx = await encryptedArtifactVotingContract.createTransferRequest(
      "Sepolia Test Artifact 1",
      "First test artifact",
      [signers.alice.address]
    );
    await tx.wait();

    // Create second request
    progress("Creating second transfer request...");
    tx = await encryptedArtifactVotingContract.createTransferRequest(
      "Sepolia Test Artifact 2",
      "Second test artifact",
      [signers.bob.address]
    );
    await tx.wait();

    // Check both requests exist
    progress("Verifying both requests exist...");
    const requestIds = await encryptedArtifactVotingContract.getAllRequestIds();
    expect(requestIds.length).to.be.at.least(2);

    const latestIds = requestIds.slice(-2);

    // Alice votes on first request
    progress("Alice voting on first request...");
    const encryptedVote = await fhevm
      .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
      .add8(1)
      .encrypt();

    tx = await encryptedArtifactVotingContract
      .connect(signers.alice)
      .submitVote(latestIds[0], encryptedVote.handles[0], encryptedVote.inputProof);
    await tx.wait();

    // Bob votes on second request
    progress("Bob voting on second request...");
    const encryptedVoteBob = await fhevm
      .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.bob.address)
      .add8(1)
      .encrypt();

    tx = await encryptedArtifactVotingContract
      .connect(signers.bob)
      .submitVote(latestIds[1], encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);
    await tx.wait();

    // Finalize both requests
    progress("Finalizing first request...");
    tx = await encryptedArtifactVotingContract.finalizeResults(latestIds[0], 1, 0);
    await tx.wait();

    progress("Finalizing second request...");
    tx = await encryptedArtifactVotingContract.finalizeResults(latestIds[1], 1, 0);
    await tx.wait();

    // Verify both are approved
    progress("Verifying both requests are approved...");
    const request1 = await encryptedArtifactVotingContract.getTransferRequest(latestIds[0]);
    const request2 = await encryptedArtifactVotingContract.getTransferRequest(latestIds[1]);

    expect(request1.approved).to.be.true;
    expect(request2.approved).to.be.true;

    progress("Multiple requests test completed successfully!");
  });
});
