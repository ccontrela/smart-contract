// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract Payment {
    error EthPaymentRequired(uint256 value);
    error Erc20InsufficientAllowance(IERC20 token, uint256 value);
    error Erc20PaymentRequired(IERC20 token, uint256 value);

    modifier ethPayable(uint256 value) {
        _checkEthPayment(value);
        _;
    }

    modifier ethPayableMultiple(uint256 price, uint256 count) {
        uint256 value = price * count;
        _checkEthPayment(value);
        _;
    }

    modifier erc20Payable(address token, uint256 value) {
        _checkErc20Payment(IERC20(token), value);
        _;
    }

    modifier erc20PayableMultiple(
        address token,
        uint256 price,
        uint256 count
    ) {
        uint256 value = price * count;
        _checkErc20Payment(IERC20(token), value);
        _;
    }

    function _checkEthPayment(uint256 value) internal {
        if (msg.value != value) revert EthPaymentRequired(value);
    }

    function _checkErc20Payment(IERC20 token, uint256 value) internal {
        if (token.allowance(msg.sender, address(this)) < value)
            revert Erc20InsufficientAllowance(token, value);

        if (!token.transferFrom(msg.sender, address(this), value))
            revert Erc20PaymentRequired(token, value);
    }
}
