// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

abstract contract Public {
    uint256 public publicMintSupply;
    uint256 public publicMintQuantity;

    uint256 public publicMintPrice;

    error PublicMintSoldOut();

    modifier checkPublicMintQuantity(uint8 _quantity) {
        if (publicMintSupply != 0){
            // Checking if the required quantity of tokens still remains
            uint256 remainingSupply = publicMintSupply - publicMintQuantity;
            if (_quantity > remainingSupply)
                revert PublicMintSoldOut();
            _;
        }
        _;
    }

    function _setPublicMintSupply(uint256 _publicMintSupply) internal {
        publicMintQuantity = 0;
        publicMintSupply = _publicMintSupply;
    }

    function _setPublicMintPrice(uint256 _publicMintPrice) internal {
        publicMintPrice = _publicMintPrice;
    }
}
