// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


abstract contract Reserve {
    uint256 public reserveMintSupply;
    uint256 public reserveMintQuantity;

    error ReserveMintedOut();
    error ReserveLimitExceeded();
    error ZeroReserveMintAddress();

    modifier checkReserveMintQuantity(uint256 _quantity) {
        if (reserveMintSupply == 0) revert ReserveMintedOut();
 
        // Checking if the required quantity of tokens still remains
        uint256 remainingSupply = reserveMintSupply - reserveMintQuantity;
        if (_quantity > remainingSupply) revert ReserveMintedOut();
        _;
    }

    modifier checkAddressReserveMint(address _to) {
        if (_to == address(0)){
            revert ZeroReserveMintAddress();
        }
        _;
    }

    function _setReserveMintSupply(uint256 _reserveMintSupply) internal {
        reserveMintQuantity = 0;
        reserveMintSupply = _reserveMintSupply;
    }
}
