// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRecoupment {
    struct RecoupmentData {
        bool exists;
        uint256 deposited;
        mapping(bytes32 => bool) withdrawnHashes;
    }

    error InvalidMerkleRoot();

    error RecoupmentWithdrawn(bytes32, address, uint256);

    event RecoupmentWithdraw(bytes32, address, uint256);
    event RecoupmentDeposit(bytes32, uint256);

    function recoupmentWithdrawn(bytes32 merkleRoot_, bytes32 merkleLeaf_)
        external
        returns (bool);
}
