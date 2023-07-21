// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../ERC20Fund.sol";
import "./Recoupment.sol";
import "./IERC20Carry.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract ERC20Carry is IERC20Carry, ERC20Fund, Recoupment {
    modifier notPreferredReturn(bytes32 merkleRoot_) {
        if (_merkleRoot == merkleRoot_) revert CannotBePreferredReturn();

        _;
    }

    function withdrawCarry(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 tokenAmount_
    )
        public
        virtual
        override
        notPreferredReturn(merkleRoot_)
        isFundingStatus(FundingStatus.recoupment)
    {
        uint256 erc20Amount = (tokenAmount_ * _deposited(merkleRoot_)) /
            totalSupply();

        _withdraw(merkleRoot_, merkleProof_, tokenAmount_, erc20Amount);

        if (erc20Amount == 0) revert NotEnoughTokensToWithdraw();

        bool success = ERC20(_erc20Token).transfer(msg.sender, erc20Amount);

        if (!success) {
            revert WithdrawCarryFailed(merkleRoot_, msg.sender, erc20Amount);
        }
    }

    function depositCarry(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 erc20Amount_
    )
        public
        virtual
        override
        onlyAdmin
        isFundingStatus(FundingStatus.withdrawn)
    {
        _deposit(merkleRoot_, merkleProof_, erc20Amount_);

        _status = FundingStatus.recoupment;

        bool success = ERC20(_erc20Token).transferFrom(
            msg.sender,
            address(this),
            erc20Amount_
        );

        if (!success) {
            revert DepositCarryFailed(merkleRoot_, erc20Amount_);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC20Fund, Recoupment)
        returns (bool)
    {
        return
            interfaceId == type(IERC20Carry).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
