// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../ERC20Fund.sol";
import "./IRecoupment.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract Recoupment is ERC20Fund, IRecoupment {
    // merkleRoot => RecoupmentData
    mapping(bytes32 => RecoupmentData) private _recoupmentData;

    modifier hasNotWithdrawn(
        bytes32 merkleRoot_,
        address address_,
        uint256 tokenAmount_
    ) {
        bytes32 merkleLeaf = keccak256(
            abi.encodePacked(address_, tokenAmount_)
        );

        if (_recoupmentData[merkleRoot_].withdrawnHashes[merkleLeaf])
            revert RecoupmentWithdrawn(merkleRoot_, address_, tokenAmount_);

        _recoupmentData[merkleRoot_].withdrawnHashes[merkleLeaf] = true;

        _;
    }

    function recoupmentWithdrawn(bytes32 merkleRoot_, bytes32 merkleLeaf_)
        public
        view
        override
        returns (bool)
    {
        if (!_recoupmentData[merkleRoot_].exists) revert InvalidMerkleRoot();
        return _recoupmentData[merkleRoot_].withdrawnHashes[merkleLeaf_];
    }

    function _deposited(bytes32 merkleRoot_) internal view returns (uint256) {
        return _recoupmentData[merkleRoot_].deposited;
    }

    function _withdraw(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 tokenAmount_,
        uint256 withdrawAmount_
    ) internal hasNotWithdrawn(merkleRoot_, msg.sender, tokenAmount_) {
        if (!_recoupmentData[merkleRoot_].exists) revert InvalidMerkleRoot();

        bool proofVerified = MerkleProof.verify(
            merkleProof_,
            merkleRoot_,
            keccak256(abi.encodePacked(msg.sender, tokenAmount_))
        );

        if (!proofVerified) revert ProofFailed();

        emit RecoupmentWithdraw(merkleRoot_, msg.sender, withdrawAmount_);
    }

    function _deposit(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 erc20Amount_
    ) internal {
        bool proofVerified = MerkleProof.verify(
            merkleProof_,
            merkleRoot_,
            keccak256(abi.encodePacked(address(this), erc20Amount_))
        );

        if (!proofVerified) revert ProofFailed();

        _recoupmentData[merkleRoot_].exists = true;
        _recoupmentData[merkleRoot_].deposited = erc20Amount_;

        emit RecoupmentDeposit(merkleRoot_, erc20Amount_);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        virtual
        view
        override
        returns (bool)
    {
        return
            interfaceId == type(IRecoupment).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
