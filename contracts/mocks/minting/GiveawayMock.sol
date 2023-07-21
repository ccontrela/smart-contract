// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../minting/Giveaway.sol";

// Caller contract
contract GiveawayMock is Giveaway {
    event MintToken(bool);

    function giveaway(address[] memory _to, uint32[] memory _quantity)
        public
        payable
        virtual
        checkGiveawayList(_to, _quantity)
    {
        for (uint256 i; i < _to.length; i++) {
            emit MintToken(true);
        }
    }
}
