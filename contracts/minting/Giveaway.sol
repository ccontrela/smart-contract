// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

abstract contract Giveaway {
    error GiveawayArrayLengthMismatch();
    error ZeroGiveawayArrayLength();
    error ZeroAddressGiveawayMint();
    error ZeroQuantityGiveawayMint();

    modifier checkGiveawayList(
        address[] memory _to,
        uint32[] memory _quantity
    ) {
        if (_to.length != _quantity.length)
            revert GiveawayArrayLengthMismatch();
        if (_to.length == 0) revert ZeroGiveawayArrayLength();
        for (uint256 i; i < _to.length; i++) {
            if (_to[i] == address(0)) revert ZeroAddressGiveawayMint();
            if (_quantity[i] == 0) revert ZeroQuantityGiveawayMint();
        }
        _;
    }
}
