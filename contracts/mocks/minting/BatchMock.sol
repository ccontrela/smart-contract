// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../minting/Batch.sol";

// Caller contract
contract BatchMock is Batch {
    event MintToken(bool);

    function testMint(uint8 _quantity) 
        public virtual payable
        checkMaxBatchMint(_quantity)
    {
        emit MintToken(true);
    }
    
    function setMaxBatchMint(uint256 _maxBatchMint) public {
        _setMaxBatchMint(_maxBatchMint);
    }
}
