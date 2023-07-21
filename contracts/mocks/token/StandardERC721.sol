// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StandardERC721 is ERC721 {
    constructor() ERC721("StandardERC721", "ERC721") {}

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
    }
}
