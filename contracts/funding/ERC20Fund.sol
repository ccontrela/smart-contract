// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IERC20Fund.sol";
import "./Fund.sol";

abstract contract ERC20Fund is Fund, IERC20Fund {
    address internal _erc20Token;

    constructor(
        address erc20Token_,
        uint256 tokenPrice_ // fixed point 8
    ) {
        _erc20Token = erc20Token_;
        _tokenPrice = tokenPrice_;
    }

    modifier hasAllowance(uint256 amount_) virtual {
        if (amount_ > ERC20(_erc20Token).allowance(msg.sender, address(this)))
            revert InsufficientAllowance();

        _;
    }

    /**
     * Investor
     */
    function fund(uint256 amount_)
        external
        virtual
        override
        hasAllowance(amount_)
    {
        uint256 tokenAmount = (amount_ * 10**8) / _tokenPrice;
        _fund(tokenAmount);

        bool success = ERC20(_erc20Token).transferFrom(
            msg.sender,
            address(this),
            amount_
        );

        if (!success) revert FundingTransferFailed(amount_);
    }

    function refund() external virtual override {
        uint256 tokenAmount = _refund();
        uint256 amount = (tokenAmount * _tokenPrice) / 10**8;

        bool success = ERC20(_erc20Token).transfer(msg.sender, amount);

        if (!success) revert FundingTransferFailed(amount);
    }

    /**
     * Issuer
     */

    function withdraw() external virtual override onlyAdmin {
        uint256 totalFund = ERC20(_erc20Token).balanceOf(address(this));
        _withdraw(totalFund);

        bool success = ERC20(_erc20Token).transfer(msg.sender, totalFund);

        if (!success) {
            revert WithdrawFailed(totalFund);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC20Fund).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
