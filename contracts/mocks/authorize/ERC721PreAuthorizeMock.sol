// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../authorize/PreAuthorize.sol";

contract ERC721PreAuthorizeMock is PreAuthorize, ERC721 {
    constructor(address[] memory preAuthorized_, address proxyRegistryAddress_)
        PreAuthorize(preAuthorized_, proxyRegistryAddress_)
        ERC721("", "")
    {}

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
    }

    function burn(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721Burnable: caller is not owner nor approved"
        );

        _burn(tokenId);
    }

    function isApprovedForAll(address owner_, address operator_)
        public
        view
        virtual
        override(ERC721, PreAuthorize)
        returns (bool)
    {
        return
            ERC721.isApprovedForAll(owner_, operator_) ||
            PreAuthorize.isApprovedForAll(owner_, operator_);
    }
}
