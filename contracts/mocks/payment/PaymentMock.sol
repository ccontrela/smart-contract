// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../payment/Payment.sol";

// Caller contract
contract PaymentMock is Payment {
    address private _erc20Contract;

    constructor(address erc20Contract_) {
        _erc20Contract = erc20Contract_;
    }

    function ethPaymentMultiple(uint256 _price, uint256 _quantity)
        public
        payable
        ethPayableMultiple(_price, _quantity)
    {}

    function ethPayment(uint256 _quantity)
        public
        payable
        ethPayable(_quantity)
    {}

    function erc20PaymentMultiple(uint256 _price, uint256 _quantity)
        public
        payable
        erc20PayableMultiple(_erc20Contract, _price, _quantity)
    {}

    function erc20Payment(uint256 _quantity)
        public
        payable
        erc20Payable(_erc20Contract, _quantity)
    {}
}
