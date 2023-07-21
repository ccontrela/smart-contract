// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../admin/AdminPermission.sol";
import "./IFund.sol";

abstract contract Fund is AdminPermission, IFund, ERC20 {
    uint256 internal _tokenPrice;
    FundingStatus internal _status;
    bytes32 internal _merkleRoot;

    constructor() AdminPermission(msg.sender) {}

    modifier isFundingStatus(FundingStatus status_) {
        if (
            FundingStatus.cancelled != status_ &&
            _status == FundingStatus.cancelled
        ) revert FundingCancelled();
        if (_status != status_) revert FundingStatusRequired(status_);

        _;
    }

    /**
     * Issuer
     */

    function open() external override onlyAdmin {
        _status = FundingStatus.open;
    }

    function close()
        external
        override
        onlyAdmin
        isFundingStatus(FundingStatus.open)
    {
        _status = FundingStatus.closed;
    }

    function cancel()
        external
        override
        onlyAdmin
        isFundingStatus(FundingStatus.open)
    {
        _status = FundingStatus.cancelled;
    }

    /**
     * Internal Functions
     */

    function _fund(uint256 amount_)
        internal
        virtual
        isFundingStatus(FundingStatus.open)
    {
        _mint(msg.sender, amount_);
    }

    function _refund()
        internal
        virtual
        isFundingStatus(FundingStatus.cancelled)
        returns (uint256)
    {
        uint256 amount = balanceOf(msg.sender);
        _burn(msg.sender, amount);

        return amount;
    }

    function _withdraw(uint256 amount_)
        internal
        virtual
        isFundingStatus(FundingStatus.closed)
    {
        _status = FundingStatus.withdrawn;
        emit Withdraw(amount_);
    }

    function tokenPrice() external view returns (uint256) {
        return _tokenPrice;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IFund).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
