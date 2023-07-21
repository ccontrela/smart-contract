// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../minting/Holders.sol";

// Caller contract
contract HoldersMock is Holders {
    event MintToken(bool);

    function mint(uint256[] memory _tokenIds)
        public
        payable
        virtual
        checkHolding(msg.sender, _tokenIds)
        checkHoldersMintQuantity(_tokenIds.length)
    {
        for (uint256 i; i < _tokenIds.length; i++) {
            holdersMintQuantity++;
            emit MintToken(true);
        }
    }

    function setTokenContract(address _tokenContract) external {
        _setTokenContract(_tokenContract);
    }

    function setHoldersMintSupply(uint256 _holdersMintSupply) external {
        _setHoldersMintSupply(_holdersMintSupply);
    }

    function setHoldersMintPrice(uint256 _holdersMintPrice) external {
        _setHoldersMintPrice(_holdersMintPrice);
    }
}
