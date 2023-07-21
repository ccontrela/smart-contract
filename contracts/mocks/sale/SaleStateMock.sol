// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../sale/SaleState.sol";

// Caller contract
contract SaleStateMock is SaleState {
    event MintToken(bool);

    function testMint(string memory saleName)
        public
        payable
        whenSaleIsActive(saleName)
    {
        emit MintToken(true);
    }

    function setSaleType(string memory saleType_) public {
        _setSaleType(saleType_);
    }

    function setSaleState(State state_) public {
        _setSaleState(state_);
    }

    function pause() public {
        _pause();
    }

    function unpause() public {
        _unpause();
    }
}
