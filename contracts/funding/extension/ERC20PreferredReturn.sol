// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../ERC20Fund.sol";
import "./Recoupment.sol";
import "./IERC20PreferredReturn.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract ERC20PreferredReturn is
    IERC20PreferredReturn,
    ERC20Fund,
    Recoupment
{
    uint256 internal _returnBasisPoints;

    constructor(
        uint256 returnBasisPoints_ // Fixed point 2
    ) {
        _returnBasisPoints = returnBasisPoints_;
    }

    /*
     * Investor
     */

    // Withdraw Preferred Return
    function withdrawPref(bytes32[] calldata merkleProof_, uint256 tokenAmount_)
        public
        virtual
        override
        isFundingStatus(FundingStatus.recoupment)
    {
        uint256 erc20Amount = (tokenAmount_ * _tokenPrice) / 10**8;
        uint256 returnAmount = (erc20Amount * _returnBasisPoints) / 10000;
        uint256 totalERC20Amount = erc20Amount + returnAmount;

        _withdraw(_merkleRoot, merkleProof_, tokenAmount_, totalERC20Amount);

        bool success = ERC20(_erc20Token).transfer(
            msg.sender,
            totalERC20Amount
        );

        if (!success) {
            revert WithdrawPrefFailed(msg.sender, totalERC20Amount);
        }
    }

    /*
     * Issuer
     */

    // Deposit Preferred Return
    function depositPref(bytes32 merkleRoot_, bytes32[] calldata merkleProof_)
        public
        virtual
        override
        onlyAdmin
        isFundingStatus(FundingStatus.withdrawn)
    {
        _merkleRoot = merkleRoot_;

        uint256 erc20amount = (totalSupply() * _tokenPrice) / 10**8;
        uint256 returnAmount = (erc20amount * _returnBasisPoints) / 10000;
        uint256 totalERC20Amount = erc20amount + returnAmount;

        _deposit(_merkleRoot, merkleProof_, totalERC20Amount);

        _status = FundingStatus.recoupment;

        bool success = ERC20(_erc20Token).transferFrom(
            msg.sender,
            address(this),
            totalERC20Amount
        );

        if (!success) {
            revert DepositPrefFailed(totalERC20Amount);
        }
    }

    function returnBasisPoints()
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _returnBasisPoints;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        virtual
        view
        override(ERC20Fund, Recoupment)
        returns (bool)
    {
        return
            interfaceId == type(IERC20PreferredReturn).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
