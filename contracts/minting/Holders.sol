// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

abstract contract Holders {
    address public tokenContract;
    bytes4 private _tokenType;

    uint256 public holdersMintSupply;
    uint256 public holdersMintQuantity;

    uint256 public holdersMintPrice;

    error NotHoldingToken();
    error InvalidHolder(uint256 id, address owner);
    error HoldersMintSoldOut();
    error UnsupportedContractAddress();

    modifier checkHolding(address _address, uint256[] memory _tokenIds) {
        if (_tokenIds.length == 0) revert NotHoldingToken();

        if (_tokenType == type(IERC721).interfaceId) {
            for (uint256 i; i < _tokenIds.length; i++) {
                if (IERC721(tokenContract).ownerOf(_tokenIds[i]) != _address)
                    revert InvalidHolder(_tokenIds[i], _address);
            }
        } else if (_tokenType == type(IERC1155).interfaceId) {
            for (uint256 i; i < _tokenIds.length; i++) {
                if (
                    IERC1155(tokenContract).balanceOf(_address, _tokenIds[i]) >
                    0
                ) revert InvalidHolder(_tokenIds[i], _address);
            }
        } else {
            revert UnsupportedContractAddress();
        }

        _;
    }

    modifier checkHoldersMintQuantity(uint256 _quantity) {
        if (holdersMintSupply != 0) {
            // Checking if the required quantity of tokens still remains
            uint256 remainingSupply = holdersMintSupply - holdersMintQuantity;
            if (_quantity > remainingSupply) revert HoldersMintSoldOut();
        }
        _;
    }

    function _setTokenContract(address _tokenContract) internal {
        if (
            IERC165(_tokenContract).supportsInterface(type(IERC721).interfaceId)
        ) {
            _tokenType = type(IERC721).interfaceId;
        } else if (
            IERC165(_tokenContract).supportsInterface(
                type(IERC1155).interfaceId
            )
        ) {
            _tokenType = type(IERC1155).interfaceId;
        } else {
            revert UnsupportedContractAddress();
        }

        tokenContract = _tokenContract;
    }

    function _setHoldersMintSupply(uint256 _holdersMintSupply) internal {
        holdersMintQuantity = 0;
        holdersMintSupply = _holdersMintSupply;
    }

    function _setHoldersMintPrice(uint256 _holdersMintPrice) internal {
        holdersMintPrice = _holdersMintPrice;
    }
}
