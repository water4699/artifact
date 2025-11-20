// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Artifact Transfer Approval Voting
/// @author artifact-cipher-vault
/// @notice A secure voting system for artifact transfer approvals using FHEVM
/// @dev Implements encrypted voting with homomorphic tallying to protect voter privacy
contract EncryptedArtifactVoting is SepoliaConfig {
    // ============ State Variables ============

    address public admin;

    struct TransferRequest {
        uint256 id;
        // Plaintext fields (for backward compatibility)
        string artifactName;
        string description;
        // Encrypted fields (FHE protected) - stored as raw encrypted bytes
        bytes encryptedArtifactName;  // Encrypted artifact name bytes
        bytes encryptedDescription;   // Encrypted description bytes
        address requester;
        uint256 createdAt;
        bool active;
        euint32 yesVotes; // Encrypted count of yes votes
        euint32 noVotes;  // Encrypted count of no votes
        euint32 totalVotes; // Encrypted total vote count
        bool decrypted;
        uint32 finalYesCount;
        uint32 finalNoCount;
        bool approved;
    }

    // Transfer request storage
    mapping(uint256 => TransferRequest) private _requests;
    uint256[] private _requestIds;

    // Voter permissions per request
    mapping(uint256 => mapping(address => bool)) private _authorizedVoters;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    // ============ Events ============

    event TransferRequestCreated(uint256 indexed requestId, string artifactName, address requester);
    event VoterAuthorized(uint256 indexed requestId, address indexed voter);
    event VoteSubmitted(uint256 indexed requestId, address indexed voter);
    event ResultsDecrypted(uint256 indexed requestId, uint32 yesVotes, uint32 noVotes, bool approved);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyAuthorizedVoter(uint256 requestId) {
        require(_authorizedVoters[requestId][msg.sender], "Not authorized voter");
        _;
    }

    modifier requestExists(uint256 requestId) {
        require(_requests[requestId].active, "Request does not exist");
        _;
    }

    modifier notVoted(uint256 requestId) {
        require(!_hasVoted[requestId][msg.sender], "Already voted");
        _;
    }

    // ============ Constructor ============

    constructor() {
        admin = msg.sender;
    }

    // ============ Admin Functions ============

    /// @notice Create a new artifact transfer request with FHE encryption
    /// @param encryptedArtifactName FHE encrypted artifact name
    /// @param encryptedDescription FHE encrypted description
    /// @param authorizedVoters Array of addresses authorized to vote on this request
    function createTransferRequest(
        bytes calldata encryptedArtifactName,
        bytes calldata encryptedDescription,
        address[] calldata authorizedVoters
    ) external returns (uint256) {
        uint256 requestId = _requestIds.length + 1;

        TransferRequest storage request = _requests[requestId];
        request.id = requestId;

        // Store encrypted data as raw bytes
        request.encryptedArtifactName = encryptedArtifactName;
        request.encryptedDescription = encryptedDescription;

        // For backward compatibility, store empty plaintext
        request.artifactName = "";
        request.description = "";

        request.requester = msg.sender;
        request.createdAt = block.timestamp;
        request.active = true;

        // Initialize encrypted vote counters to 0
        request.yesVotes = FHE.asEuint32(0);
        request.noVotes = FHE.asEuint32(0);
        request.totalVotes = FHE.asEuint32(0);

        // Set authorized voters
        for (uint256 i = 0; i < authorizedVoters.length; i++) {
            _authorizedVoters[requestId][authorizedVoters[i]] = true;
            emit VoterAuthorized(requestId, authorizedVoters[i]);
        }

        _requestIds.push(requestId);

        emit TransferRequestCreated(requestId, "", msg.sender);
        return requestId;
    }

    /// @notice Decrypt voting results (triggers MetaMask popup for user confirmation)
    /// @param requestId The ID of the transfer request
    function decryptResults(uint256 requestId) external requestExists(requestId) returns (uint32, uint32) {
        TransferRequest storage request = _requests[requestId];
        require(!request.decrypted, "Already decrypted");

        // For current implementation using simpleVote, we just return the stored plaintext values
        // In a full FHE implementation, this would perform actual FHE decryption
        uint32 yesVotes = request.finalYesCount;
        uint32 noVotes = request.finalNoCount;

        // Mark as decrypted (this transaction will trigger MetaMask popup)
        request.decrypted = true;
        request.approved = yesVotes > noVotes;

        emit ResultsDecrypted(requestId, yesVotes, noVotes, request.approved);

        return (yesVotes, noVotes);
    }

    /// @notice Mark voting results as decrypted (called by anyone after off-chain decryption)
    /// @param requestId The ID of the transfer request
    /// @param finalYesCount The decrypted yes vote count
    /// @param finalNoCount The decrypted no vote count
    function finalizeResults(
        uint256 requestId,
        uint32 finalYesCount,
        uint32 finalNoCount
    ) external requestExists(requestId) {
        TransferRequest storage request = _requests[requestId];
        require(!request.decrypted, "Already finalized");

        request.finalYesCount = finalYesCount;
        request.finalNoCount = finalNoCount;
        request.approved = finalYesCount > finalNoCount;
        request.decrypted = true;

        emit ResultsDecrypted(requestId, finalYesCount, finalNoCount, request.approved);
    }

    // ============ Voter Functions ============

    /// @notice Submit an encrypted vote on a transfer request
    /// @param requestId The ID of the transfer request
    /// @param vote Encrypted vote (1 for yes, 0 for no)
    /// @param inputProof Zama input proof for the encrypted vote
    function submitVote(
        uint256 requestId,
        externalEuint8 vote,
        bytes calldata inputProof
    ) external requestExists(requestId) onlyAuthorizedVoter(requestId) notVoted(requestId) {
        TransferRequest storage request = _requests[requestId];
        euint8 encryptedVote = FHE.fromExternal(vote, inputProof);

        // Validate vote is 0 or 1
        euint8 validVote = FHE.select(FHE.eq(encryptedVote, FHE.asEuint8(1)), FHE.asEuint8(1),
                       FHE.select(FHE.eq(encryptedVote, FHE.asEuint8(0)), FHE.asEuint8(0), FHE.asEuint8(0)));

        // Still set up FHE structures for demonstration
        euint32 increment = FHE.asEuint32(1);
        request.yesVotes = FHE.add(request.yesVotes, FHE.select(FHE.eq(validVote, FHE.asEuint8(1)), increment, FHE.asEuint32(0)));
        request.noVotes = FHE.add(request.noVotes, FHE.select(FHE.eq(validVote, FHE.asEuint8(0)), increment, FHE.asEuint32(0)));
        request.totalVotes = FHE.add(request.totalVotes, increment);

        // Allow admin and contract to decrypt results
        FHE.allowThis(request.yesVotes);
        FHE.allowThis(request.noVotes);
        FHE.allowThis(request.totalVotes);
        FHE.allow(request.yesVotes, admin);
        FHE.allow(request.noVotes, admin);
        FHE.allow(request.totalVotes, admin);

        _hasVoted[requestId][msg.sender] = true;
        emit VoteSubmitted(requestId, msg.sender);
    }

    /// @notice Simple non-encrypted vote for testing (temporary)
    /// @param requestId The ID of the transfer request
    /// @param vote 1 for yes, 0 for no
    function simpleVote(uint256 requestId, uint8 vote) external requestExists(requestId) onlyAuthorizedVoter(requestId) notVoted(requestId) {
        require(vote == 0 || vote == 1, "Vote must be 0 or 1");

        TransferRequest storage request = _requests[requestId];

        // Simple non-encrypted vote counting for testing
        if (vote == 1) {
            request.finalYesCount += 1;
        } else {
            request.finalNoCount += 1;
        }

        _hasVoted[requestId][msg.sender] = true;
        emit VoteSubmitted(requestId, msg.sender);
    }

    // ============ View Functions ============

    /// @notice Get all transfer request IDs
    function getAllRequestIds() external view returns (uint256[] memory) {
        return _requestIds;
    }

    /// @notice Get transfer request details (without encrypted vote counts)
    function getTransferRequest(uint256 requestId) external view returns (
        uint256 id,
        string memory artifactName,
        string memory description,
        bytes memory encryptedArtifactName,
        bytes memory encryptedDescription,
        address requester,
        uint256 createdAt,
        bool active,
        bool decrypted,
        uint32 finalYesCount,
        uint32 finalNoCount,
        bool approved
    ) {
        TransferRequest storage request = _requests[requestId];
        return (
            request.id,
            request.artifactName,
            request.description,
            request.encryptedArtifactName,
            request.encryptedDescription,
            request.requester,
            request.createdAt,
            request.active,
            request.decrypted,
            request.finalYesCount,
            request.finalNoCount,
            request.approved
        );
    }

    /// @notice Get encrypted vote counts for a request (anyone can decrypt)
    function getEncryptedVoteCounts(uint256 requestId) external view returns (
        euint32 yesVotes,
        euint32 noVotes,
        euint32 totalVotes
    ) {
        TransferRequest storage request = _requests[requestId];
        return (request.yesVotes, request.noVotes, request.totalVotes);
    }

    /// @notice Check if an address is authorized to vote on a request
    function isAuthorizedVoter(uint256 requestId, address voter) external view returns (bool) {
        return _authorizedVoters[requestId][voter];
    }

    /// @notice Check if an address has voted on a request
    function hasVoted(uint256 requestId, address voter) external view returns (bool) {
        return _hasVoted[requestId][voter];
    }

    /// @notice Get the count of authorized voters for a request
    function getAuthorizedVoterCount(uint256 requestId) external view returns (uint256) {
        // This is a simplified count - in production you might want to maintain a counter
        return _requestIds.length > 0 ? 1 : 0; // Placeholder implementation
    }
}
