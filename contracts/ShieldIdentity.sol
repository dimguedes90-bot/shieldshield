// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ShieldIdentity is ZamaEthereumConfig {
    struct Identity {
        euint64 encryptedId;
        euint64 encryptedBirthYear;
        bool registered;
    }

    struct Token {
        address owner;
        uint256 expirationBlock;
        bool active;
    }

    mapping(address => Identity) private identities;
    mapping(uint256 => Token) private tokens;
    mapping(address => uint256[]) private userTokens;
    mapping(address => ebool) private over18Proofs;
    uint256 private tokenCounter;

    event IdentityRegistered(address indexed user);
    event TokenGenerated(address indexed user, uint256 tokenId, uint256 expiresAt);
    event TokenRevoked(uint256 tokenId);

    function registerIdentity(
        externalEuint64 encryptedId,
        bytes calldata idProof,
        externalEuint64 encryptedBirthYear,
        bytes calldata birthProof
    ) external {
        require(!identities[msg.sender].registered, "Already registered");

        euint64 eid = FHE.fromExternal(encryptedId, idProof);
        euint64 ebirthYear = FHE.fromExternal(encryptedBirthYear, birthProof);

        FHE.allow(eid, msg.sender);
        FHE.allow(ebirthYear, msg.sender);
        FHE.allowThis(eid);
        FHE.allowThis(ebirthYear);

        identities[msg.sender] = Identity(eid, ebirthYear, true);
        emit IdentityRegistered(msg.sender);
    }

    function generateToken(uint256 durationBlocks) external returns (uint256) {
        require(identities[msg.sender].registered, "Not registered");

        tokenCounter++;
        tokens[tokenCounter] = Token(msg.sender, block.number + durationBlocks, true);
        userTokens[msg.sender].push(tokenCounter);

        emit TokenGenerated(msg.sender, tokenCounter, block.number + durationBlocks);
        return tokenCounter;
    }

    function verifyToken(uint256 tokenId) external view returns (bool valid, address owner) {
        Token memory t = tokens[tokenId];
        valid = t.active && block.number <= t.expirationBlock;
        owner = t.owner;
    }

    function revokeToken(uint256 tokenId) external {
        require(tokens[tokenId].owner == msg.sender, "Not owner");
        tokens[tokenId].active = false;
        emit TokenRevoked(tokenId);
    }

    function proveOver18(uint64 currentYear) external returns (ebool) {
        require(identities[msg.sender].registered, "Not registered");

        ebool result = FHE.le(identities[msg.sender].encryptedBirthYear, FHE.asEuint64(currentYear - 18));
        FHE.allow(result, msg.sender);
        FHE.allowThis(result);
        over18Proofs[msg.sender] = result;

        return result;
    }

    function getLatestOver18Proof(address user) external view returns (ebool) {
        return over18Proofs[user];
    }

    function getActiveTokenCount(address user) external view returns (uint256 count) {
        uint256[] memory tokenIds = userTokens[user];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            Token memory t = tokens[tokenIds[i]];
            if (t.active && block.number <= t.expirationBlock) {
                count++;
            }
        }
    }

    function getUserTokenIds(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }

    function isRegistered(address user) external view returns (bool) {
        return identities[user].registered;
    }
}
