import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedArtifactVoting, EncryptedArtifactVoting__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  admin: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedArtifactVoting")) as EncryptedArtifactVoting__factory;
  const encryptedArtifactVotingContract = (await factory.deploy()) as EncryptedArtifactVoting;
  const encryptedArtifactVotingContractAddress = await encryptedArtifactVotingContract.getAddress();

  return { encryptedArtifactVotingContract, encryptedArtifactVotingContractAddress };
}

describe("EncryptedArtifactVoting", function () {
  let signers: Signers;
  let encryptedArtifactVotingContract: EncryptedArtifactVoting;
  let encryptedArtifactVotingContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      admin: ethSigners[0], // Deployer is admin
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ encryptedArtifactVotingContract, encryptedArtifactVotingContractAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("should set the deployer as admin", async function () {
      const admin = await encryptedArtifactVotingContract.admin();
      expect(admin).to.equal(signers.admin.address);
    });

    it("should have no requests initially", async function () {
      const requestIds = await encryptedArtifactVotingContract.getAllRequestIds();
      expect(requestIds).to.have.lengthOf(0);
    });
  });

  describe("Creating Transfer Requests", function () {
    it("should allow admin to create transfer request", async function () {
      const artifactName = "Ancient Ceramic Vase #42";
      const description = "Transfer of Ming Dynasty ceramic vase";
      const authorizedVoters = [signers.alice.address, signers.bob.address];

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.admin)
          .createTransferRequest(artifactName, description, authorizedVoters)
      ).to.emit(encryptedArtifactVotingContract, "TransferRequestCreated");

      const requestIds = await encryptedArtifactVotingContract.getAllRequestIds();
      expect(requestIds).to.have.lengthOf(1);
      expect(requestIds[0]).to.equal(1n);

      const request = await encryptedArtifactVotingContract.getTransferRequest(1);
      expect(request.id).to.equal(1n);
      expect(request.artifactName).to.equal(artifactName);
      expect(request.description).to.equal(description);
      expect(request.requester).to.equal(signers.admin.address);
      expect(request.active).to.be.true;
      expect(request.decrypted).to.be.false;
    });

    it("should reject non-admin creating transfer request", async function () {
      const artifactName = "Test Artifact";
      const description = "Test description";
      const authorizedVoters = [signers.alice.address];

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.alice)
          .createTransferRequest(artifactName, description, authorizedVoters)
      ).to.be.revertedWith("Not admin");
    });

    it("should authorize voters correctly", async function () {
      const authorizedVoters = [signers.alice.address, signers.bob.address];

      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .createTransferRequest("Test", "Test", authorizedVoters);

      expect(await encryptedArtifactVotingContract.isAuthorizedVoter(1, signers.alice.address)).to.be.true;
      expect(await encryptedArtifactVotingContract.isAuthorizedVoter(1, signers.bob.address)).to.be.true;
      expect(await encryptedArtifactVotingContract.isAuthorizedVoter(1, signers.charlie.address)).to.be.false;
    });
  });

  describe("Encrypted Voting", function () {
    beforeEach(async function () {
      // Create a transfer request for testing
      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .createTransferRequest(
          "Test Artifact",
          "Test Description",
          [signers.alice.address, signers.bob.address, signers.charlie.address]
        );
    });

    it("should allow authorized voter to submit encrypted vote", async function () {
      // Create encrypted vote (1 for yes)
      const encryptedVote = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(1)
        .encrypt();

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.alice)
          .submitVote(1, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.emit(encryptedArtifactVotingContract, "VoteSubmitted");

      // Check that alice has voted
      expect(await encryptedArtifactVotingContract.hasVoted(1, signers.alice.address)).to.be.true;
    });

    it("should reject vote from unauthorized voter", async function () {
      // Try to vote with an unauthorized address (deployer/admin is not in authorized list)
      const encryptedVote = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.admin.address)
        .add8(1)
        .encrypt();

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.admin)
          .submitVote(1, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.be.revertedWith("Not authorized voter");
    });

    it("should reject double voting", async function () {
      // First vote
      const encryptedVote1 = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(1)
        .encrypt();

      await encryptedArtifactVotingContract
        .connect(signers.alice)
        .submitVote(1, encryptedVote1.handles[0], encryptedVote1.inputProof);

      // Second vote should fail
      const encryptedVote2 = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(0)
        .encrypt();

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.alice)
          .submitVote(1, encryptedVote2.handles[0], encryptedVote2.inputProof)
      ).to.be.revertedWith("Already voted");
    });

    it("should homomorphically tally votes", async function () {
      // Alice votes yes (1)
      const encryptedVoteAlice = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(1)
        .encrypt();

      await encryptedArtifactVotingContract
        .connect(signers.alice)
        .submitVote(1, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);

      // Bob votes no (0)
      const encryptedVoteBob = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.bob.address)
        .add8(0)
        .encrypt();

      await encryptedArtifactVotingContract
        .connect(signers.bob)
        .submitVote(1, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);

      // Charlie votes yes (1)
      const encryptedVoteCharlie = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.charlie.address)
        .add8(1)
        .encrypt();

      await encryptedArtifactVotingContract
        .connect(signers.charlie)
        .submitVote(1, encryptedVoteCharlie.handles[0], encryptedVoteCharlie.inputProof);

      // Check encrypted vote counts can be retrieved by admin
      const encryptedCounts = await encryptedArtifactVotingContract
        .connect(signers.admin)
        .getEncryptedVoteCounts(1);

      expect(encryptedCounts.yesVotes).to.not.equal(ethers.ZeroHash);
      expect(encryptedCounts.noVotes).to.not.equal(ethers.ZeroHash);
      expect(encryptedCounts.totalVotes).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Result Decryption", function () {
    beforeEach(async function () {
      // Create a transfer request and submit votes
      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .createTransferRequest(
          "Test Artifact",
          "Test Description",
          [signers.alice.address, signers.bob.address, signers.charlie.address]
        );

      // Alice votes yes
      const encryptedVoteAlice = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(1)
        .encrypt();
      await encryptedArtifactVotingContract
        .connect(signers.alice)
        .submitVote(1, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);

      // Bob votes no
      const encryptedVoteBob = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.bob.address)
        .add8(0)
        .encrypt();
      await encryptedArtifactVotingContract
        .connect(signers.bob)
        .submitVote(1, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);

      // Charlie votes yes
      const encryptedVoteCharlie = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.charlie.address)
        .add8(1)
        .encrypt();
      await encryptedArtifactVotingContract
        .connect(signers.charlie)
        .submitVote(1, encryptedVoteCharlie.handles[0], encryptedVoteCharlie.inputProof);
    });

    it("should allow admin to finalize results with decrypted counts", async function () {
      // Simulate decryption (in real scenario, this would be done off-chain)
      const expectedYesVotes = 2; // Alice and Charlie
      const expectedNoVotes = 1;  // Bob

      await expect(
        encryptedArtifactVotingContract
          .connect(signers.admin)
          .finalizeResults(1, expectedYesVotes, expectedNoVotes)
      ).to.emit(encryptedArtifactVotingContract, "ResultsDecrypted");

      const request = await encryptedArtifactVotingContract.getTransferRequest(1);
      expect(request.decrypted).to.be.true;
      expect(request.finalYesCount).to.equal(expectedYesVotes);
      expect(request.finalNoCount).to.equal(expectedNoVotes);
      expect(request.approved).to.be.true; // 2 yes > 1 no
    });

    it("should allow anyone to finalize results", async function () {
      // Alice (non-admin) can now finalize results
      await expect(
        encryptedArtifactVotingContract
          .connect(signers.alice)
          .finalizeResults(1, 2, 1)
      ).to.emit(encryptedArtifactVotingContract, "ResultsDecrypted");

      const request = await encryptedArtifactVotingContract.getTransferRequest(1);
      expect(request.decrypted).to.be.true;
      expect(request.finalYesCount).to.equal(2);
      expect(request.finalNoCount).to.equal(1);
      expect(request.approved).to.be.true;
    });

    it("should reject finalizing already decrypted results", async function () {
      // First finalize
      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .finalizeResults(1, 2, 1);

      // Second finalize should fail
      await expect(
        encryptedArtifactVotingContract
          .connect(signers.admin)
          .finalizeResults(1, 2, 1)
      ).to.be.revertedWith("Already finalized");
    });
  });

  describe("Integration Test", function () {
    it("should complete full voting workflow", async function () {
      // 1. Admin creates transfer request
      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .createTransferRequest(
          "Integration Test Artifact",
          "Full workflow test",
          [signers.alice.address, signers.bob.address]
        );

      // 2. Voters submit encrypted votes
      const encryptedVoteAlice = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.alice.address)
        .add8(1) // Yes
        .encrypt();

      const encryptedVoteBob = await fhevm
        .createEncryptedInput(encryptedArtifactVotingContractAddress, signers.bob.address)
        .add8(0) // No
        .encrypt();

      await encryptedArtifactVotingContract
        .connect(signers.alice)
        .submitVote(1, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);

      await encryptedArtifactVotingContract
        .connect(signers.bob)
        .submitVote(1, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);

      // 3. Admin finalizes results
      await encryptedArtifactVotingContract
        .connect(signers.admin)
        .finalizeResults(1, 1, 1); // 1 yes, 1 no

      // 4. Verify final state
      const request = await encryptedArtifactVotingContract.getTransferRequest(1);
      expect(request.decrypted).to.be.true;
      expect(request.finalYesCount).to.equal(1);
      expect(request.finalNoCount).to.equal(1);
      expect(request.approved).to.be.false; // 1 yes == 1 no, not approved
    });
  });
});
